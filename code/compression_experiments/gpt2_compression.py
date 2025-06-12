#!/usr/bin/env python3
"""
GPT-2 Compression Experiments
Computes compression ratios using GPT-2 token probabilities on text samples.
"""

import json
import math
import os
from datetime import datetime
from pathlib import Path

import torch
from transformers import GPT2LMHeadModel, GPT2Tokenizer


def load_text_files():
    """Load all text files used in the compression widget."""
    texts_dir = Path("texts")
    
    # Text samples with their descriptions
    samples = {
        "kl_intro_10kb": {
            "file": "kl_intro_10kb.txt",
            "description": "Academic text about information theory and KL divergence"
        },
        "pi_digits_10kb": {
            "file": "pi_digits_10kb.txt", 
            "description": "First 10,000 digits of π (mathematically random)"
        },
        "declaration": {
            "file": "declaration_independence.txt",
            "description": "Natural English prose with historical vocabulary"
        },
        "human_mitochondrial_dna": {
            "file": "human_mitochondrial_dna.txt",
            "description": "Complete human mitochondrial genome (16,569 bases)"
        },
        "huffman_code_10kb": {
            "file": "huffman_code_10kb.txt",
            "description": "JavaScript function with typical programming patterns"
        },
        "repeated_phrase": {
            "file": "repeated_phrase.txt",
            "description": "Highly structured repetitive text"
        }
    }
    
    loaded_texts = {}
    
    for key, info in samples.items():
        file_path = texts_dir / info["file"]
        if file_path.exists():
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read().strip()
                loaded_texts[key] = {
                    "text": text,
                    "description": info["description"],
                    "file": info["file"]
                }
                print(f"✅ Loaded {key}: {len(text)} characters")
        else:
            print(f"❌ Missing: {file_path}")
    
    return loaded_texts


def calculate_gpt2_compression(text, model, tokenizer, device):
    """Calculate compression ratio using GPT-2 token probabilities."""
    
    # Tokenize the text
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=1024)
    input_ids = inputs["input_ids"].to(device)
    
    # Get model predictions
    with torch.no_grad():
        outputs = model(input_ids)
        logits = outputs.logits
    
    # Calculate log probabilities for each token
    total_log_prob = 0.0
    
    # For each position (except the first), predict the token from previous context
    for i in range(1, input_ids.size(1)):
        # Get predicted probabilities for position i
        token_logits = logits[0, i-1, :]  # Predictions for position i from context up to i-1
        token_probs = torch.softmax(token_logits, dim=-1)
        
        # Get actual token at position i
        actual_token = input_ids[0, i].item()
        
        # Get probability of actual token
        token_prob = token_probs[actual_token].item()
        
        # Add log probability (convert to bits: log2)
        if token_prob > 0:
            total_log_prob += math.log2(token_prob)
    
    # Calculate compression metrics
    total_bits = -total_log_prob  # Negative log probability = bits needed
    
    # Convert tokens back to text to get actual processed length
    processed_tokens = input_ids[0, :input_ids.size(1)]
    processed_text = tokenizer.decode(processed_tokens, skip_special_tokens=True)
    original_bits = len(processed_text) * 8  # 8 bits per character of PROCESSED text
    
    compression_ratio = original_bits / total_bits if total_bits > 0 else 1.0
    
    return {
        "total_bits": total_bits,
        "original_bits": original_bits,
        "compression_ratio": compression_ratio,
        "num_tokens": input_ids.size(1) - 1,  # Exclude first token (no prediction)
        "processed_length": len(processed_text),
        "original_length": len(text)
    }


def main():
    print("🚀 Starting GPT-2 Compression Experiments")
    print("=" * 50)
    
    # Check GPU availability
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Load GPT-2 model and tokenizer
    print("\n📦 Loading GPT-2 model...")
    model_name = "gpt2"  # You can also try "gpt2-medium", "gpt2-large", "gpt2-xl"
    tokenizer = GPT2Tokenizer.from_pretrained(model_name)
    model = GPT2LMHeadModel.from_pretrained(model_name)
    model.to(device)
    model.eval()
    
    # Set pad token (GPT-2 doesn't have one by default)
    tokenizer.pad_token = tokenizer.eos_token
    
    print(f"✅ Loaded {model_name}")
    
    # Load text files
    print("\n📄 Loading text samples...")
    texts = load_text_files()
    
    if not texts:
        print("❌ No text files found. Make sure the texts/ directory exists with the required files.")
        return
    
    # Run compression experiments
    results = {}
    
    print(f"\n🧮 Running GPT-2 compression on {len(texts)} samples...")
    print("=" * 50)
    
    for key, text_info in texts.items():
        text = text_info["text"]
        print(f"\n📊 Processing: {key}")
        print(f"   Description: {text_info['description']}")
        print(f"   Length: {len(text)} characters")
        
        try:
            # Calculate compression
            compression_result = calculate_gpt2_compression(text, model, tokenizer, device)
            
            # Store results
            results[key] = {
                "original_size": len(text),
                "gpt2_bits": compression_result["total_bits"],
                "gpt2_ratio": compression_result["compression_ratio"],
                "num_tokens": compression_result["num_tokens"],
                "description": text_info["description"],
                "timestamp": datetime.now().isoformat()
            }
            
            print(f"   ✅ GPT-2 compression: {compression_result['total_bits']:.0f} bits")
            print(f"   📈 Compression ratio: {compression_result['compression_ratio']:.2f}x")
            print(f"   🔢 Tokens processed: {compression_result['num_tokens']}")
            print(f"   📏 Processed: {compression_result['processed_length']}/{compression_result['original_length']} chars")
            
        except Exception as e:
            print(f"   ❌ Error processing {key}: {e}")
            results[key] = {
                "original_size": len(text),
                "gpt2_bits": None,
                "gpt2_ratio": None,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    # Save results
    output_file = "gpt2_compression_results.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to: {output_file}")
    
    # Print summary
    print("\n📋 SUMMARY")
    print("=" * 50)
    successful = [k for k, v in results.items() if v.get("gpt2_ratio") is not None]
    
    if successful:
        # Sort by compression ratio (best first)
        sorted_results = sorted(
            [(k, results[k]) for k in successful], 
            key=lambda x: x[1]["gpt2_ratio"], 
            reverse=True
        )
        
        print("Best to worst compression ratios:")
        for i, (key, result) in enumerate(sorted_results, 1):
            ratio = result["gpt2_ratio"]
            bits = result["gpt2_bits"]
            print(f"{i}. {key}: {ratio:.2f}x ({bits:.0f} bits)")
    
    print(f"\n✅ GPT-2 compression experiments complete!")
    print(f"Successfully processed: {len(successful)}/{len(texts)} samples")


if __name__ == "__main__":
    main()