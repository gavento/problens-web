#!/usr/bin/env python3
"""
Command-line script for LLM compression analysis.

Usage:
    python analyze_compression.py                    # Analyze all .txt files in texts/
    python analyze_compression.py file1.txt         # Analyze specific file
    python analyze_compression.py file1.txt file2.txt  # Analyze multiple files
"""

import sys
import os
import csv
import json
import math
import torch
from datetime import datetime
from pathlib import Path
from transformers import GPT2LMHeadModel, GPT2Tokenizer

def load_model():
    """Load GPT-2 model and tokenizer."""
    device = torch.device('cpu')
    print("Loading GPT-2...")
    tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
    model = GPT2LMHeadModel.from_pretrained('gpt2').to(device)
    model.eval()
    print("Model loaded!\n")
    return model, tokenizer, device

def analyze_text(text_path, model, tokenizer, device):
    """Analyze a single text file."""
    
    # Read text
    with open(text_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    text_name = Path(text_path).stem
    print(f"Analyzing: {text_name}")
    print(f"Text length: {len(text)} characters")
    
    # Tokenize
    tokens = tokenizer.encode(text, return_tensors='pt').to(device)
    num_tokens = tokens.shape[1]
    print(f"Number of tokens: {num_tokens}")
    
    # Prepare output
    results_dir = Path("results")
    results_dir.mkdir(exist_ok=True)
    
    csv_file = results_dir / f"{text_name}_analysis.csv"
    
    # CSV output
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Header
        writer.writerow([
            'Position', 'Context', 'Actual_Token', 'Actual_Probability', 
            'Surprisal_Bits', 'Rank_in_Top10',
            'Top1_Token', 'Top1_Prob', 'Top2_Token', 'Top2_Prob',
            'Top3_Token', 'Top3_Prob', 'Top4_Token', 'Top4_Prob',
            'Top5_Token', 'Top5_Prob', 'Top6_Token', 'Top6_Prob',
            'Top7_Token', 'Top7_Prob', 'Top8_Token', 'Top8_Prob',
            'Top9_Token', 'Top9_Prob', 'Top10_Token', 'Top10_Prob'
        ])
        
        total_bits = 0
        detailed_data = []
        
        with torch.no_grad():
            for i in range(num_tokens - 1):
                # Context
                context = tokens[:, :i+1]
                context_text = tokenizer.decode(context[0])
                
                # Get predictions
                outputs = model(context)
                logits = outputs.logits
                probs = torch.softmax(logits[0, -1, :], dim=0)
                
                # Top 10 predictions
                top_probs, top_indices = torch.topk(probs, 10)
                
                # Actual next token
                actual_token_id = tokens[0, i+1].item()
                actual_token = tokenizer.decode([actual_token_id])
                actual_prob = probs[actual_token_id].item()
                
                # Surprisal
                surprisal = -math.log2(actual_prob) if actual_prob > 0 else 50
                total_bits += surprisal
                
                # Find rank of actual token
                actual_rank = None
                for j in range(10):
                    if top_indices[j].item() == actual_token_id:
                        actual_rank = j + 1
                        break
                
                # Build CSV row
                row = [
                    i,
                    context_text[-50:],  # Last 50 chars of context
                    repr(actual_token),
                    f"{actual_prob:.6f}",
                    f"{surprisal:.3f}",
                    actual_rank or 'not_in_top10'
                ]
                
                # Add top 10 predictions
                for j in range(10):
                    pred_token = tokenizer.decode([top_indices[j].item()])
                    pred_prob = top_probs[j].item()
                    row.extend([repr(pred_token), f"{pred_prob:.6f}"])
                
                writer.writerow(row)
                
                # Store for summary
                detailed_data.append({
                    'position': i,
                    'actual_token': actual_token,
                    'surprisal': surprisal,
                    'probability': actual_prob,
                    'context': context_text
                })
                
                # Progress
                if (i + 1) % 100 == 0:
                    print(f"  Processed {i+1}/{num_tokens-1} tokens...", end='\r')
        
        print(f"  Processed {num_tokens-1}/{num_tokens-1} tokens...Done!")
    
    # Calculate summary
    avg_bits_per_token = total_bits / len(detailed_data) if detailed_data else 0
    bits_per_char = total_bits / len(text)
    compression_ratio = (8 * len(text)) / total_bits if total_bits > 0 else 0
    
    # Save summary
    summary = {
        'text_name': text_name,
        'text_path': str(text_path),
        'text_length': len(text),
        'num_tokens': num_tokens,
        'total_bits': total_bits,
        'bits_per_token': avg_bits_per_token,
        'bits_per_char': bits_per_char,
        'compression_ratio': compression_ratio,
        'timestamp': datetime.now().isoformat()
    }
    
    json_file = results_dir / f"{text_name}_summary.json"
    with open(json_file, 'w') as f:
        json.dump(summary, f, indent=2)
    
    # Print summary
    print(f"\nResults for {text_name}:")
    print(f"  Total bits: {total_bits:.0f}")
    print(f"  Bits per token: {avg_bits_per_token:.2f}")
    print(f"  Bits per character: {bits_per_char:.2f}")
    print(f"  Compression ratio: {compression_ratio:.1f}x")
    
    # Show most/least surprising tokens
    sorted_data = sorted(detailed_data, key=lambda x: x['surprisal'])
    
    print(f"\nMost predictable tokens:")
    for i, token_data in enumerate(sorted_data[:3]):
        print(f"  {i+1}. {repr(token_data['actual_token'])} "
              f"({token_data['surprisal']:.2f} bits, P={token_data['probability']:.4f})")
        print(f"     Context: ...{token_data['context'][-30:]}")
    
    print(f"\nMost surprising tokens:")
    for i, token_data in enumerate(sorted_data[-3:]):
        print(f"  {i+1}. {repr(token_data['actual_token'])} "
              f"({token_data['surprisal']:.2f} bits, P={token_data['probability']:.4f})")
        print(f"     Context: ...{token_data['context'][-30:]}")
    
    print(f"\nFiles saved:")
    print(f"  CSV: {csv_file}")
    print(f"  JSON: {json_file}")
    print("-" * 60)
    
    return summary

def main():
    """Main function."""
    
    # Parse command line arguments
    if len(sys.argv) == 1:
        # No arguments - process all .txt files in texts/
        texts_dir = Path("texts")
        if not texts_dir.exists():
            print(f"Error: {texts_dir} directory not found")
            sys.exit(1)
        
        text_files = list(texts_dir.glob("*.txt"))
        if not text_files:
            print(f"Error: No .txt files found in {texts_dir}")
            sys.exit(1)
        
        print(f"Found {len(text_files)} text files:")
        for f in text_files:
            print(f"  {f}")
        print()
    
    else:
        # Arguments provided - use those files
        text_files = []
        for arg in sys.argv[1:]:
            path = Path(arg)
            if not path.exists():
                print(f"Error: File not found: {arg}")
                sys.exit(1)
            if not path.suffix == '.txt':
                print(f"Warning: {arg} is not a .txt file, processing anyway")
            text_files.append(path)
    
    # Load model once
    model, tokenizer, device = load_model()
    
    # Process each file
    all_summaries = []
    for text_file in text_files:
        try:
            summary = analyze_text(text_file, model, tokenizer, device)
            all_summaries.append(summary)
        except Exception as e:
            print(f"Error processing {text_file}: {e}")
    
    # Overall summary
    if len(all_summaries) > 1:
        print(f"\n{'='*60}")
        print("OVERALL SUMMARY")
        print(f"{'='*60}")
        print(f"{'Text':<20} {'Bits/Char':<12} {'Compression':<12}")
        print("-" * 60)
        for summary in sorted(all_summaries, key=lambda x: x['compression_ratio'], reverse=True):
            print(f"{summary['text_name']:<20} "
                  f"{summary['bits_per_char']:<12.2f} "
                  f"{summary['compression_ratio']:<12.1f}x")

if __name__ == "__main__":
    main()