#!/usr/bin/env python3
"""
Demonstration of the exact compression experiment workflow.

This shows EXACTLY what the experiment does, step by step.
When you run this with an actual LLM, you'll get real measurements.
"""

import math

def compression_experiment_demo():
    """
    This demonstrates the EXACT steps of the compression experiment:
    1. Tokenize text
    2. For each token, get probability distribution from LLM
    3. Add log(1/p(actual_token)) to sum
    """
    
    # Example text
    text = "The quick brown fox"
    
    print("Compression Experiment Steps:")
    print("="*60)
    print(f"Text: '{text}'")
    print()
    
    # Step 1: Tokenize (example tokenization)
    # In reality, GPT-2 tokenizer would do this
    tokens = ["The", " quick", " brown", " fox"]
    print(f"1. Tokenized into {len(tokens)} tokens: {tokens}")
    print()
    
    # Step 2 & 3: For each position, predict next token
    print("2. For each token position, get probability of next token:")
    print()
    
    total_bits = 0
    
    # Position 0: Predict token 1 given token 0
    print("Position 0: Given 'The', predict next token")
    print("   Context: ['The']")
    print("   Actual next token: ' quick'")
    print("   LLM probability distribution:")
    print("      ' quick': 0.05  (5%)")
    print("      ' dog': 0.10    (10%)")  
    print("      ' cat': 0.08    (8%)")
    print("      ... (other tokens)")
    p = 0.05
    bits = -math.log2(p)
    total_bits += bits
    print(f"   Bits = -log2(0.05) = {bits:.2f}")
    print()
    
    # Position 1: Predict token 2 given tokens 0,1
    print("Position 1: Given 'The quick', predict next token")
    print("   Context: ['The', ' quick']")
    print("   Actual next token: ' brown'")
    print("   LLM probability distribution:")
    print("      ' brown': 0.30  (30%)")
    print("      ' red': 0.15    (15%)")
    print("      ' black': 0.10  (10%)")
    print("      ... (other tokens)")
    p = 0.30
    bits = -math.log2(p)
    total_bits += bits
    print(f"   Bits = -log2(0.30) = {bits:.2f}")
    print()
    
    # Position 2: Predict token 3 given tokens 0,1,2
    print("Position 2: Given 'The quick brown', predict next token")
    print("   Context: ['The', ' quick', ' brown']")
    print("   Actual next token: ' fox'")
    print("   LLM probability distribution:")
    print("      ' fox': 0.60   (60%)")
    print("      ' dog': 0.20   (20%)")
    print("      ' bear': 0.05  (5%)")
    print("      ... (other tokens)")
    p = 0.60
    bits = -math.log2(p)
    total_bits += bits
    print(f"   Bits = -log2(0.60) = {bits:.2f}")
    print()
    
    print("="*60)
    print(f"3. Total bits needed: {total_bits:.2f}")
    print(f"   Text length: {len(text)} characters")
    print(f"   Bits per character: {total_bits/len(text):.2f}")
    print(f"   Compression ratio: {8*len(text)/total_bits:.1f}x")
    print()
    print("This is the EXACT calculation we perform with real LLMs!")

if __name__ == "__main__":
    compression_experiment_demo()