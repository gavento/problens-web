#!/usr/bin/env python3
"""
Master script to run all compression experiments and update the widget.
Computes ZIP, letter-wise optimal, and GPT-2 compression on all text samples.
"""

import json
import math
import gzip
import zipfile
import os
import tempfile
from pathlib import Path
from datetime import datetime
from collections import Counter

import torch
from transformers import GPT2LMHeadModel, GPT2Tokenizer
from tqdm import tqdm


def load_text_samples():
    """Load text samples from list.json configuration."""
    texts_dir = Path("texts")
    list_file = texts_dir / "list.json"
    
    if not list_file.exists():
        raise FileNotFoundError(f"Text list file not found: {list_file}")
    
    with open(list_file, 'r') as f:
        sample_configs = json.load(f)
    
    samples = {}
    for config in sample_configs:
        filename = config["filename"]
        filepath = texts_dir / filename
        
        if not filepath.exists():
            print(f"⚠️  Warning: {filepath} not found, skipping")
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read().strip()
        
        # Use filename without extension as key
        key = filepath.stem
        samples[key] = {
            "text": text,
            "name": config["name"],
            "description": config["description"],
            "filename": filename
        }
        print(f"✅ Loaded {key}: {len(text)} characters")
    
    return samples


def compute_letter_wise_optimal(text):
    """Compute theoretical optimal compression using character entropy."""
    if not text:
        return 0
    
    # Count character frequencies
    char_counts = Counter(text)
    total_chars = len(text)
    
    # Compute entropy: -sum(p_i * log2(p_i))
    entropy = 0.0
    for count in char_counts.values():
        p_i = count / total_chars
        entropy -= p_i * math.log2(p_i)
    
    # Total bits needed = entropy * number of characters
    total_bits = entropy * total_chars
    return total_bits


def compute_zip_compression(text):
    """Compute ZIP compression size."""
    if not text:
        return 0
    
    text_bytes = text.encode('utf-8')
    
    # Create temporary zip file
    with tempfile.NamedTemporaryFile(suffix='.zip') as tmp_file:
        with zipfile.ZipFile(tmp_file.name, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr('data.txt', text_bytes)
        
        # Get compressed size (subtract ZIP overhead for more accurate comparison)
        compressed_size = os.path.getsize(tmp_file.name)
        # Approximate ZIP overhead: ~30 bytes for headers
        return max(compressed_size - 30, 1) * 8  # Convert to bits


def compute_gpt2_compression(text, model, tokenizer, device):
    """Compute GPT-2 compression using token probabilities with sliding window."""
    if not text:
        return 0
    
    # Tokenize the ENTIRE text (no truncation)
    inputs = tokenizer(text, return_tensors="pt", truncation=False)
    input_ids = inputs["input_ids"].squeeze(0)  # Remove batch dimension
    
    if len(input_ids) <= 1:
        return len(text) * 8  # Fallback to naive compression
    
    total_log_prob = 0.0
    max_context = 1023  # Use 1023 tokens of context to predict the next token
    
    # Process each token with sliding window context
    for i in tqdm(range(1, len(input_ids)), 
                  desc="   🔄 GPT-2 compression", 
                  unit="tokens",
                  disable=False):
        # Get context window: up to 1023 previous tokens
        start_idx = max(0, i - max_context)
        context_ids = input_ids[start_idx:i].unsqueeze(0).to(device)  # Add batch dimension
        
        # Get model predictions for this context
        with torch.no_grad():
            outputs = model(context_ids)
            logits = outputs.logits[0, -1, :]  # Get logits for the last position
        
        # Get probabilities
        token_probs = torch.softmax(logits, dim=-1)
        
        # Get actual next token
        actual_token = input_ids[i].item()
        
        # Get probability of actual token
        token_prob = token_probs[actual_token].item()
        
        # Add log probability (convert to bits: log2)
        if token_prob > 0:
            total_log_prob += math.log2(token_prob)
    
    # Total bits needed = -log probability
    total_bits = -total_log_prob
    return total_bits


def run_all_experiments():
    """Run all compression experiments and save results."""
    print("🚀 Running All Compression Experiments")
    print("=" * 60)
    
    # Load text samples
    print("\n📄 Loading text samples...")
    samples = load_text_samples()
    
    if not samples:
        print("❌ No text samples found!")
        return
    
    # Initialize GPT-2 model
    print("\n🤖 Loading GPT-2 model...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
    model = GPT2LMHeadModel.from_pretrained("gpt2")
    model.to(device)
    model.eval()
    tokenizer.pad_token = tokenizer.eos_token
    
    # Run experiments on each sample
    results = {}
    
    print(f"\n🧮 Processing {len(samples)} text samples...")
    print("=" * 60)
    
    for key, sample in samples.items():
        text = sample["text"]
        print(f"\n📊 Processing: {sample['name']}")
        print(f"   File: {sample['filename']}")
        print(f"   Length: {len(text)} characters")
        
        try:
            # Compute all compression methods
            naive_bits = len(text) * 8
            letterwise_bits = compute_letter_wise_optimal(text)
            zip_bits = compute_zip_compression(text)
            gpt2_bits = compute_gpt2_compression(text, model, tokenizer, device)
            
            # Calculate ratios
            letterwise_ratio = naive_bits / letterwise_bits if letterwise_bits > 0 else 1.0
            zip_ratio = naive_bits / zip_bits if zip_bits > 0 else 1.0
            gpt2_ratio = naive_bits / gpt2_bits if gpt2_bits > 0 else 1.0
            
            print(f"   📈 Naive: {naive_bits} bits (1.00x)")
            print(f"   📈 Letter-wise: {letterwise_bits:.0f} bits ({letterwise_ratio:.2f}x)")
            print(f"   📈 ZIP: {zip_bits} bits ({zip_ratio:.2f}x)")
            print(f"   📈 GPT-2: {gpt2_bits:.0f} bits ({gpt2_ratio:.2f}x)")
            
            results[key] = {
                "name": sample["name"],
                "description": sample["description"],
                "filename": sample["filename"],
                "text_length": len(text),
                "naive_bits": naive_bits,
                "letterwise_bits": round(letterwise_bits),
                "zip_bits": zip_bits,
                "gpt2_bits": round(gpt2_bits),
                "letterwise_ratio": round(letterwise_ratio, 2),
                "zip_ratio": round(zip_ratio, 2), 
                "gpt2_ratio": round(gpt2_ratio, 2),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"   ❌ Error processing {key}: {e}")
            results[key] = {
                "name": sample["name"],
                "description": sample["description"],
                "filename": sample["filename"],
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    # Save results
    output_file = "compression_results.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to: {output_file}")
    
    # Print summary
    print("\n📋 COMPRESSION SUMMARY")
    print("=" * 60)
    
    successful = [k for k, v in results.items() if "error" not in v]
    if successful:
        print("Algorithm performance across all samples:")
        
        # Calculate averages (excluding errors)
        avg_letterwise = sum(results[k]["letterwise_ratio"] for k in successful) / len(successful)
        avg_zip = sum(results[k]["zip_ratio"] for k in successful) / len(successful)
        avg_gpt2 = sum(results[k]["gpt2_ratio"] for k in successful) / len(successful)
        
        print(f"Letter-wise optimal: {avg_letterwise:.2f}x average")
        print(f"ZIP compression: {avg_zip:.2f}x average") 
        print(f"GPT-2 compression: {avg_gpt2:.2f}x average")
    
    print(f"\n✅ Compression experiments complete!")
    print(f"Successfully processed: {len(successful)}/{len(samples)} samples")
    
    return results


if __name__ == "__main__":
    run_all_experiments()