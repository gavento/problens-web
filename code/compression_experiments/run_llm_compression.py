#!/usr/bin/env python3
"""
Clean pipeline for LLM compression experiments.

Usage:
1. Place text files in ./texts/ directory
2. Run: python run_llm_compression.py
3. Results saved to ./results/llm_compression_results.json

This script:
- Loads all .txt files from texts/ directory
- Runs compression experiment on each
- Saves results in structured format
"""

import os
import json
import math
from datetime import datetime
from pathlib import Path

# Create directories
TEXTS_DIR = Path("texts")
RESULTS_DIR = Path("results")
RESULTS_DIR.mkdir(exist_ok=True)

def load_texts():
    """Load all text files from texts directory."""
    texts = {}
    
    for file_path in TEXTS_DIR.glob("*.txt"):
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
            texts[file_path.stem] = text
            
    return texts

def run_gpt2_compression(text, text_name):
    """
    Run actual GPT-2 compression experiment.
    
    Steps:
    1. Tokenize text
    2. For each token position, get probability of next token
    3. Sum log(1/p(actual_token))
    """
    try:
        import torch
        from transformers import GPT2LMHeadModel, GPT2Tokenizer
    except ImportError:
        print("ERROR: Please install required packages:")
        print("pip install torch transformers")
        return None
    
    print(f"\nProcessing: {text_name}")
    print(f"Text length: {len(text)} characters")
    
    # Load model and tokenizer
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
    model = GPT2LMHeadModel.from_pretrained('gpt2').to(device)
    model.eval()
    
    # Tokenize
    tokens = tokenizer.encode(text, return_tensors='pt').to(device)
    num_tokens = tokens.shape[1]
    print(f"Number of tokens: {num_tokens}")
    
    # Calculate compression
    total_bits = 0
    token_bits = []
    
    with torch.no_grad():
        for i in range(num_tokens - 1):
            # Context: all tokens up to position i
            context = tokens[:, :i+1]
            
            # Get model predictions
            outputs = model(context)
            logits = outputs.logits
            
            # Probability distribution for next token
            probs = torch.softmax(logits[0, -1, :], dim=0)
            
            # Actual next token
            actual_token = tokens[0, i+1].item()
            
            # Probability of actual token
            p_actual = probs[actual_token].item()
            
            # Calculate bits: -log2(p)
            if p_actual > 0:
                bits = -math.log2(p_actual)
            else:
                bits = 50  # Cap for numerical stability
                
            total_bits += bits
            token_bits.append(bits)
            
            # Progress
            if (i + 1) % 100 == 0:
                print(f"  Processed {i+1}/{num_tokens-1} tokens...", end='\r')
    
    print(f"  Processed {num_tokens-1}/{num_tokens-1} tokens...Done!")
    
    # Calculate metrics
    bits_per_token = total_bits / len(token_bits) if token_bits else 0
    bits_per_char = total_bits / len(text)
    compression_ratio = (8 * len(text)) / total_bits if total_bits > 0 else 0
    
    return {
        'text_name': text_name,
        'text_length': len(text),
        'num_tokens': num_tokens,
        'total_bits': total_bits,
        'bits_per_token': bits_per_token,
        'bits_per_char': bits_per_char,
        'compression_ratio': compression_ratio,
        'model': 'gpt2'
    }

def save_results(results, filename="llm_compression_results.json"):
    """Save results to JSON file with timestamp."""
    output = {
        'timestamp': datetime.now().isoformat(),
        'model': 'gpt2',
        'results': results
    }
    
    output_path = RESULTS_DIR / filename
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\nResults saved to: {output_path}")

def print_summary(results):
    """Print summary of results."""
    print("\n" + "="*60)
    print("COMPRESSION EXPERIMENT RESULTS")
    print("="*60)
    
    for result in results:
        if result is None:
            continue
            
        print(f"\n{result['text_name']}:")
        print(f"  Total bits: {result['total_bits']:.0f}")
        print(f"  Bits/token: {result['bits_per_token']:.2f}")
        print(f"  Bits/char: {result['bits_per_char']:.2f}")
        print(f"  Compression ratio: {result['compression_ratio']:.1f}x")

def main():
    """Run compression experiments on all texts."""
    print("LLM Compression Experiment Pipeline")
    print("="*60)
    
    # Load texts
    texts = load_texts()
    print(f"Found {len(texts)} text files")
    
    # Run experiments
    results = []
    for text_name, text in texts.items():
        result = run_gpt2_compression(text, text_name)
        if result:
            results.append(result)
    
    # Save and display results
    if results:
        save_results(results)
        print_summary(results)
    else:
        print("\nNo results to save. Please install required packages.")

if __name__ == "__main__":
    main()