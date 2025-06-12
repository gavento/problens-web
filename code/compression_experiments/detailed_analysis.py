#!/usr/bin/env python3
"""
Detailed LLM compression analysis with token-by-token breakdown.

Outputs:
1. For each token: actual token, top 10 predictions, surprisal
2. Summary compression statistics
3. Detailed CSV file for further analysis
"""

import os
import csv
import json
import math
import torch
from datetime import datetime
from pathlib import Path
from transformers import GPT2LMHeadModel, GPT2Tokenizer

TEXTS_DIR = Path("texts")
RESULTS_DIR = Path("results")
RESULTS_DIR.mkdir(exist_ok=True)

def analyze_text_detailed(text, text_name, model, tokenizer, device):
    """
    Detailed analysis of text compression with token-by-token breakdown.
    """
    
    print(f"\nDetailed analysis: {text_name}")
    print(f"Text length: {len(text)} characters")
    
    # Tokenize
    tokens = tokenizer.encode(text, return_tensors='pt').to(device)
    num_tokens = tokens.shape[1]
    print(f"Number of tokens: {num_tokens}")
    
    # Prepare detailed output
    detailed_data = []
    total_bits = 0
    
    with torch.no_grad():
        for i in range(num_tokens - 1):
            # Context: all tokens up to position i
            context = tokens[:, :i+1]
            
            # Get model predictions
            outputs = model(context)
            logits = outputs.logits
            
            # Probability distribution for next token
            probs = torch.softmax(logits[0, -1, :], dim=0)
            
            # Get top 10 most probable tokens
            top_probs, top_indices = torch.topk(probs, 10)
            
            # Actual next token
            actual_token_id = tokens[0, i+1].item()
            actual_token_text = tokenizer.decode([actual_token_id])
            
            # Probability of actual token
            p_actual = probs[actual_token_id].item()
            
            # Calculate surprisal (bits)
            surprisal = -math.log2(p_actual) if p_actual > 0 else 50
            total_bits += surprisal
            
            # Context text
            context_text = tokenizer.decode(context[0])
            
            # Top 10 predictions with probabilities
            top_predictions = []
            for j in range(10):
                pred_token_id = top_indices[j].item()
                pred_token_text = tokenizer.decode([pred_token_id])
                pred_prob = top_probs[j].item()
                top_predictions.append({
                    'token': pred_token_text,
                    'probability': pred_prob,
                    'rank': j + 1
                })
            
            # Find rank of actual token in predictions
            actual_rank = None
            for j, pred in enumerate(top_predictions):
                if pred['token'] == actual_token_text:
                    actual_rank = j + 1
                    break
            
            # Store detailed information
            token_data = {
                'position': i,
                'context': context_text,
                'actual_token': actual_token_text,
                'actual_token_id': actual_token_id,
                'actual_probability': p_actual,
                'surprisal_bits': surprisal,
                'rank_in_top10': actual_rank,
                'top_predictions': top_predictions
            }
            
            detailed_data.append(token_data)
            
            # Progress indicator
            if (i + 1) % 50 == 0:
                print(f"  Processed {i+1}/{num_tokens-1} tokens...", end='\r')
    
    print(f"  Processed {num_tokens-1}/{num_tokens-1} tokens...Done!")
    
    # Calculate summary statistics
    bits_per_token = total_bits / len(detailed_data) if detailed_data else 0
    bits_per_char = total_bits / len(text)
    compression_ratio = (8 * len(text)) / total_bits if total_bits > 0 else 0
    
    summary = {
        'text_name': text_name,
        'text_length': len(text),
        'num_tokens': num_tokens,
        'total_bits': total_bits,
        'bits_per_token': bits_per_token,
        'bits_per_char': bits_per_char,
        'compression_ratio': compression_ratio,
        'timestamp': datetime.now().isoformat()
    }
    
    return summary, detailed_data

def save_detailed_results(text_name, summary, detailed_data):
    """Save detailed results to both JSON and CSV formats."""
    
    # Save JSON with full data
    json_file = RESULTS_DIR / f"{text_name}_detailed.json"
    output_data = {
        'summary': summary,
        'detailed_analysis': detailed_data
    }
    
    with open(json_file, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    # Save CSV for easy analysis
    csv_file = RESULTS_DIR / f"{text_name}_analysis.csv"
    
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
        
        # Data rows
        for token_data in detailed_data:
            row = [
                token_data['position'],
                token_data['context'][-50:],  # Last 50 chars of context
                repr(token_data['actual_token']),  # Use repr to handle special chars
                f"{token_data['actual_probability']:.6f}",
                f"{token_data['surprisal_bits']:.3f}",
                token_data['rank_in_top10'] or 'not_in_top10'
            ]
            
            # Add top 10 predictions
            for pred in token_data['top_predictions']:
                row.extend([repr(pred['token']), f"{pred['probability']:.6f}"])
            
            writer.writerow(row)
    
    print(f"Detailed results saved:")
    print(f"  JSON: {json_file}")
    print(f"  CSV:  {csv_file}")

def print_interesting_examples(detailed_data, text_name, n=5):
    """Print most and least surprising tokens."""
    
    # Sort by surprisal
    sorted_data = sorted(detailed_data, key=lambda x: x['surprisal_bits'])
    
    print(f"\n{'='*60}")
    print(f"MOST PREDICTABLE tokens in {text_name}:")
    print(f"{'='*60}")
    
    for i, token_data in enumerate(sorted_data[:n]):
        print(f"\n{i+1}. Context: ...{token_data['context'][-30:]}")
        print(f"   Actual: {repr(token_data['actual_token'])} (P={token_data['actual_probability']:.4f}, {token_data['surprisal_bits']:.2f} bits)")
        print(f"   Top predictions:")
        for j, pred in enumerate(token_data['top_predictions'][:3]):
            marker = "★" if pred['token'] == token_data['actual_token'] else " "
            print(f"     {j+1}. {marker} {repr(pred['token'])} ({pred['probability']:.4f})")
    
    print(f"\n{'='*60}")
    print(f"MOST SURPRISING tokens in {text_name}:")
    print(f"{'='*60}")
    
    for i, token_data in enumerate(sorted_data[-n:]):
        print(f"\n{i+1}. Context: ...{token_data['context'][-30:]}")
        print(f"   Actual: {repr(token_data['actual_token'])} (P={token_data['actual_probability']:.4f}, {token_data['surprisal_bits']:.2f} bits)")
        print(f"   Top predictions:")
        for j, pred in enumerate(token_data['top_predictions'][:3]):
            print(f"     {j+1}.   {repr(pred['token'])} ({pred['probability']:.4f})")

def main():
    """Run detailed analysis on all texts."""
    print("Detailed LLM Compression Analysis")
    print("="*60)
    
    # Load model
    device = torch.device('cpu')
    print("Loading GPT-2...")
    tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
    model = GPT2LMHeadModel.from_pretrained('gpt2').to(device)
    model.eval()
    print("Model loaded!")
    
    # Process each text file
    for text_file in TEXTS_DIR.glob("*.txt"):
        with open(text_file, 'r', encoding='utf-8') as f:
            text = f.read()
        
        text_name = text_file.stem
        
        # Run detailed analysis
        summary, detailed_data = analyze_text_detailed(text, text_name, model, tokenizer, device)
        
        # Save results
        save_detailed_results(text_name, summary, detailed_data)
        
        # Print summary
        print(f"\nSummary for {text_name}:")
        print(f"  Compression ratio: {summary['compression_ratio']:.1f}x")
        print(f"  Bits per character: {summary['bits_per_char']:.2f}")
        
        # Show interesting examples
        print_interesting_examples(detailed_data, text_name)
        
        print(f"\n{'-'*60}")

if __name__ == "__main__":
    main()