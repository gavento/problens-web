#!/usr/bin/env python3
"""
Quick test of the compression experiment on a small sample.
"""

import torch
import math
from transformers import GPT2LMHeadModel, GPT2Tokenizer

def quick_compression_test():
    """Test compression on a small text sample."""
    
    text = "The quick brown fox jumps over the lazy dog."
    print(f"Testing compression on: '{text}'")
    print(f"Text length: {len(text)} characters")
    
    # Load model
    print("Loading GPT-2...")
    device = torch.device('cpu')  # Use CPU only
    tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
    model = GPT2LMHeadModel.from_pretrained('gpt2').to(device)
    model.eval()
    print("Model loaded!")
    
    # Tokenize
    tokens = tokenizer.encode(text, return_tensors='pt')
    print(f"Tokens: {tokens}")
    print(f"Decoded tokens: {[tokenizer.decode([t]) for t in tokens[0]]}")
    
    # Run compression experiment
    total_bits = 0
    
    with torch.no_grad():
        for i in range(tokens.shape[1] - 1):
            # Context
            context = tokens[:, :i+1]
            
            # Get predictions
            outputs = model(context)
            logits = outputs.logits
            
            # Probability distribution
            probs = torch.softmax(logits[0, -1, :], dim=0)
            
            # Actual next token
            actual_token = tokens[0, i+1].item()
            
            # Probability of actual token
            p_actual = probs[actual_token].item()
            
            # Calculate bits
            bits = -math.log2(p_actual)
            total_bits += bits
            
            print(f"Position {i}: Context='{tokenizer.decode(context[0])}' "
                  f"Next='{tokenizer.decode([actual_token])}' "
                  f"P={p_actual:.4f} Bits={bits:.2f}")
    
    print(f"\nTotal bits: {total_bits:.2f}")
    print(f"Bits per character: {total_bits/len(text):.2f}")
    print(f"Compression ratio: {8*len(text)/total_bits:.1f}x")

if __name__ == "__main__":
    quick_compression_test()