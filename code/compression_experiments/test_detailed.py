#!/usr/bin/env python3
"""
Test the detailed analysis on just the test sample.
"""

import torch
import math
import csv
from transformers import GPT2LMHeadModel, GPT2Tokenizer

def test_detailed_analysis():
    """Test detailed analysis on small sample."""
    
    # Load text
    with open("texts/test_sample.txt", "r") as f:
        text = f.read()
    
    print(f"Text: {text}")
    print(f"Length: {len(text)} characters\n")
    
    # Load model
    device = torch.device('cpu')
    print("Loading GPT-2...")
    tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
    model = GPT2LMHeadModel.from_pretrained('gpt2').to(device)
    model.eval()
    
    # Tokenize
    tokens = tokenizer.encode(text, return_tensors='pt')
    print(f"Tokens: {[tokenizer.decode([t]) for t in tokens[0]]}\n")
    
    # Analyze each token
    print("TOKEN-BY-TOKEN ANALYSIS:")
    print("="*80)
    
    total_bits = 0
    
    with torch.no_grad():
        for i in range(tokens.shape[1] - 1):
            context = tokens[:, :i+1]
            outputs = model(context)
            logits = outputs.logits
            probs = torch.softmax(logits[0, -1, :], dim=0)
            
            # Get top 10
            top_probs, top_indices = torch.topk(probs, 10)
            
            # Actual token
            actual_token_id = tokens[0, i+1].item()
            actual_token = tokenizer.decode([actual_token_id])
            p_actual = probs[actual_token_id].item()
            surprisal = -math.log2(p_actual)
            total_bits += surprisal
            
            # Context
            context_text = tokenizer.decode(context[0])
            
            print(f"\nPosition {i}:")
            print(f"Context: '{context_text}'")
            print(f"Actual next token: {repr(actual_token)} (P={p_actual:.4f}, {surprisal:.2f} bits)")
            print("Top 10 predictions:")
            
            for j in range(10):
                pred_token = tokenizer.decode([top_indices[j].item()])
                pred_prob = top_probs[j].item()
                marker = "★" if pred_token == actual_token else " "
                print(f"  {j+1:2d}. {marker} {repr(pred_token):>15} ({pred_prob:.4f})")
    
    print(f"\n{'='*80}")
    print(f"SUMMARY:")
    print(f"Total bits: {total_bits:.2f}")
    print(f"Bits per character: {total_bits/len(text):.2f}")
    print(f"Compression ratio: {8*len(text)/total_bits:.1f}x")

if __name__ == "__main__":
    test_detailed_analysis()