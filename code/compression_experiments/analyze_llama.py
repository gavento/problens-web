#!/usr/bin/env python3
"""
Llama compression analysis using Hugging Face transformers.

This uses Meta's Llama models to get actual token probabilities
for compression measurement.

Usage:
    python analyze_llama.py file.txt

Requirements:
    pip install transformers torch accelerate
"""

import sys
import os
import csv
import json
import math
import time
from datetime import datetime
from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

def load_llama_model(model_name="meta-llama/Llama-2-7b-hf"):
    """
    Load Llama model and tokenizer.
    
    Note: You may need to request access to Llama models on Hugging Face
    and set HF_TOKEN environment variable.
    """
    print(f"Loading {model_name}...")
    
    try:
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # Load model with appropriate settings
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto" if torch.cuda.is_available() else None,
            trust_remote_code=True
        )
        
        print(f"✅ Loaded {model_name}")
        print(f"Device: {next(model.parameters()).device}")
        
        return model, tokenizer
        
    except Exception as e:
        print(f"❌ Failed to load {model_name}: {e}")
        print("\nTroubleshooting:")
        print("1. Request access to Llama models at: https://huggingface.co/meta-llama/Llama-2-7b-hf")
        print("2. Set HF_TOKEN: export HF_TOKEN='your-hugging-face-token'")
        print("3. Install required packages: pip install transformers torch accelerate")
        return None, None

def analyze_text_llama(text_path, model, tokenizer, model_name="llama"):
    """Analyze text using Llama model."""
    
    # Read text
    with open(text_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    text_name = Path(text_path).stem
    print(f"\nAnalyzing with {model_name}: {text_name}")
    print(f"Text length: {len(text)} characters")
    
    # Tokenize
    print("Tokenizing text...")
    tokens = tokenizer.encode(text, return_tensors='pt')
    num_tokens = tokens.shape[1]
    print(f"Number of tokens: {num_tokens}")
    
    if num_tokens > 2048:
        print(f"⚠️  Warning: Text has {num_tokens} tokens, truncating to 2048 for memory")
        tokens = tokens[:, :2048]
        num_tokens = 2048
    
    # Move to same device as model
    device = next(model.parameters()).device
    tokens = tokens.to(device)
    
    # Prepare output files
    results_dir = Path("results")
    results_dir.mkdir(exist_ok=True)
    
    model_safe_name = model_name.replace("/", "_").replace("-", "_")
    csv_file = results_dir / f"{text_name}_{model_safe_name}_analysis.csv"
    
    # Process token by token
    total_bits = 0
    detailed_data = []
    
    print("Calculating token probabilities...")
    
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Header
        writer.writerow([
            'Position', 'Token', 'Logprob', 'Probability', 'Surprisal_Bits',
            'Top1_Token', 'Top1_Logprob', 'Top2_Token', 'Top2_Logprob',
            'Top3_Token', 'Top3_Logprob', 'Top4_Token', 'Top4_Logprob',
            'Top5_Token', 'Top5_Logprob', 'Top6_Token', 'Top6_Logprob',
            'Top7_Token', 'Top7_Logprob', 'Top8_Token', 'Top8_Logprob',
            'Top9_Token', 'Top9_Logprob', 'Top10_Token', 'Top10_Logprob'
        ])
        
        # Process in batches to manage memory
        batch_size = 100
        
        for start_idx in range(0, num_tokens - 1, batch_size):
            end_idx = min(start_idx + batch_size, num_tokens - 1)
            
            print(f"Processing tokens {start_idx}-{end_idx}/{num_tokens-1}...", end='\r')
            
            for i in range(start_idx, end_idx):
                # Get context up to current position
                context = tokens[:, :i+1]
                
                with torch.no_grad():
                    outputs = model(context)
                    logits = outputs.logits
                    
                    # Get probabilities for next token position
                    next_token_logits = logits[0, -1, :]  # Last position, all vocab
                    probs = torch.softmax(next_token_logits, dim=0)
                    log_probs = torch.log_softmax(next_token_logits, dim=0)
                    
                    # Get actual next token
                    actual_token_id = tokens[0, i+1].item()
                    actual_token = tokenizer.decode([actual_token_id])
                    
                    # Get probability and surprisal for actual token
                    p_actual = probs[actual_token_id].item()
                    logprob_actual = log_probs[actual_token_id].item()
                    surprisal_bits = -logprob_actual / math.log(2)  # Convert to bits
                    
                    total_bits += surprisal_bits
                    
                    # Get top 10 predictions
                    top_probs, top_indices = torch.topk(probs, 10)
                    top_logprobs = log_probs[top_indices]
                    
                    # Build row
                    row = [
                        i + 1,  # Position (1-indexed)
                        repr(actual_token),
                        f"{logprob_actual:.6f}",
                        f"{p_actual:.6f}",
                        f"{surprisal_bits:.3f}"
                    ]
                    
                    # Add top 10 predictions
                    for j in range(10):
                        if j < len(top_indices):
                            pred_token = tokenizer.decode([top_indices[j].item()])
                            pred_logprob = top_logprobs[j].item()
                            row.extend([repr(pred_token), f"{pred_logprob:.6f}"])
                        else:
                            row.extend(["", ""])
                    
                    writer.writerow(row)
                    
                    # Store for analysis
                    detailed_data.append({
                        'position': i + 1,
                        'token': actual_token,
                        'surprisal': surprisal_bits,
                        'probability': p_actual,
                        'logprob': logprob_actual
                    })
    
    print(f"Processed all {num_tokens-1} token predictions!           ")
    
    # Calculate summary
    num_predictions = len(detailed_data)
    avg_bits_per_token = total_bits / num_predictions if num_predictions > 0 else 0
    bits_per_char = total_bits / len(text)
    compression_ratio = 8.0 / bits_per_char if bits_per_char > 0 else 0
    
    summary = {
        'text_name': text_name,
        'text_path': str(text_path),
        'text_length': len(text),
        'num_tokens': num_tokens,
        'num_predictions': num_predictions,
        'total_bits': total_bits,
        'bits_per_token': avg_bits_per_token,
        'bits_per_char': bits_per_char,
        'compression_ratio': compression_ratio,
        'model': model_name,
        'timestamp': datetime.now().isoformat()
    }
    
    # Save summary
    json_file = results_dir / f"{text_name}_{model_safe_name}_summary.json"
    with open(json_file, 'w') as f:
        json.dump(summary, f, indent=2)
    
    # Print results
    print(f"\n{model_name} Analysis Results for {text_name}:")
    print(f"  Total bits: {total_bits:.0f}")
    print(f"  Bits per token: {avg_bits_per_token:.2f}")
    print(f"  Bits per character: {bits_per_char:.2f}")
    print(f"  Compression ratio: {compression_ratio:.1f}x")
    
    # Show most/least surprising tokens
    if detailed_data:
        sorted_data = sorted(detailed_data, key=lambda x: x['surprisal'])
        
        print(f"\nMost predictable tokens:")
        for i, token_data in enumerate(sorted_data[:3]):
            print(f"  {i+1}. {repr(token_data['token'])} "
                  f"({token_data['surprisal']:.2f} bits, P={token_data['probability']:.4f})")
        
        print(f"\nMost surprising tokens:")
        for i, token_data in enumerate(sorted_data[-3:]):
            print(f"  {i+1}. {repr(token_data['token'])} "
                  f"({token_data['surprisal']:.2f} bits, P={token_data['probability']:.4f})")
    
    print(f"\nFiles saved:")
    print(f"  CSV: {csv_file}")
    print(f"  JSON: {json_file}")
    
    return summary

def main():
    """Main function."""
    
    if len(sys.argv) != 2:
        print("Usage: python analyze_llama.py <text_file.txt>")
        print("\nExample:")
        print("  python analyze_llama.py texts/lorem_ipsum.txt")
        print("\nNote: You may need Hugging Face token for Llama access:")
        print("  export HF_TOKEN='your-hugging-face-token'")
        sys.exit(1)
    
    text_file = Path(sys.argv[1])
    if not text_file.exists():
        print(f"Error: File not found: {text_file}")
        sys.exit(1)
    
    # Try different Llama models (from smallest to largest)
    llama_models = [
        "meta-llama/Llama-2-7b-hf",        # 7B parameters
        "meta-llama/Llama-2-13b-hf",       # 13B parameters  
        "huggingface/CodeBERTa-small-v1",  # Fallback if no Llama access
    ]
    
    model, tokenizer = None, None
    model_name = None
    
    for model_name in llama_models:
        print(f"\nTrying {model_name}...")
        model, tokenizer = load_llama_model(model_name)
        if model is not None:
            break
    
    if model is None:
        print("\n❌ Could not load any Llama model.")
        print("\nOptions:")
        print("1. Request access to Llama models on Hugging Face")
        print("2. Set HF_TOKEN environment variable")
        print("3. Try a different model")
        sys.exit(1)
    
    # Analyze text
    try:
        summary = analyze_text_llama(text_file, model, tokenizer, model_name)
        print("\n" + "="*60)
        print("Analysis complete!")
    except Exception as e:
        print(f"Error during analysis: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()