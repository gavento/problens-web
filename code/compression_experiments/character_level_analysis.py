#!/usr/bin/env python3
"""
Character-level compression analysis that properly handles tokenization.

For each character position, we:
1. Get all possible next tokens from the model
2. Find which tokens start with the target character
3. Sum their probabilities to get P(next char = target)
"""

import torch
import math
from transformers import GPT2LMHeadModel, GPT2Tokenizer

def get_character_probability(model, tokenizer, context_tokens, target_char, device):
    """
    Get the probability that the next character is target_char,
    by summing probabilities of all tokens that start with target_char.
    """
    
    # Get model predictions for next token
    with torch.no_grad():
        outputs = model(context_tokens)
        logits = outputs.logits
        probs = torch.softmax(logits[0, -1, :], dim=0)
    
    # Find all tokens that start with target_char
    total_prob = 0.0
    matching_tokens = []
    
    vocab_size = len(tokenizer.vocab)
    
    for token_id in range(vocab_size):
        token_text = tokenizer.decode([token_id])
        
        # Check if this token starts with our target character
        if token_text.startswith(target_char):
            token_prob = probs[token_id].item()
            total_prob += token_prob
            if token_prob > 0.001:  # Only show significant probabilities
                matching_tokens.append((token_text, token_prob))
    
    # Sort by probability
    matching_tokens.sort(key=lambda x: x[1], reverse=True)
    
    return total_prob, matching_tokens

def analyze_character_level(text, model, tokenizer, device, max_chars=100):
    """
    Analyze compression at character level by aggregating token probabilities.
    """
    
    print(f"Character-level analysis of: '{text[:50]}...'")
    print(f"Analyzing first {min(max_chars, len(text))} characters\n")
    
    total_bits = 0
    char_analysis = []
    
    # Process character by character
    for i in range(min(max_chars, len(text) - 1)):
        # Context: all text up to position i
        context_text = text[:i+1]
        context_tokens = tokenizer.encode(context_text, return_tensors='pt').to(device)
        
        # Target character at position i+1
        target_char = text[i+1]
        
        # Get probability of target character
        char_prob, matching_tokens = get_character_probability(
            model, tokenizer, context_tokens, target_char, device
        )
        
        # Calculate bits
        if char_prob > 0:
            bits = -math.log2(char_prob)
        else:
            bits = 20  # Cap for unseen characters
        
        total_bits += bits
        
        char_data = {
            'position': i + 1,
            'context': context_text[-20:],  # Last 20 chars
            'target_char': target_char,
            'char_probability': char_prob,
            'bits': bits,
            'matching_tokens': matching_tokens[:5]  # Top 5 matching tokens
        }
        
        char_analysis.append(char_data)
        
        # Print progress
        print(f"Pos {i+1:3d}: '{target_char}' | P={char_prob:.4f} | {bits:.2f} bits | "
              f"Context: '...{context_text[-15:]}'")
        
        if matching_tokens:
            print(f"         Top tokens: {[f'{t}({p:.3f})' for t, p in matching_tokens[:3]]}")
        print()
    
    # Summary
    avg_bits = total_bits / len(char_analysis) if char_analysis else 0
    compression_ratio = 8.0 / avg_bits if avg_bits > 0 else 0
    
    print(f"\nCHARACTER-LEVEL SUMMARY:")
    print(f"Total bits: {total_bits:.2f}")
    print(f"Average bits per character: {avg_bits:.2f}")
    print(f"Compression ratio: {compression_ratio:.1f}x")
    
    return char_analysis

def test_dna_tokenization():
    """Test how GPT-2 tokenizes DNA sequences."""
    
    dna_sample = "ATGCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCG"
    
    print("DNA TOKENIZATION TEST:")
    print("="*60)
    print(f"DNA sequence: {dna_sample}")
    
    tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
    tokens = tokenizer.encode(dna_sample)
    decoded_tokens = [tokenizer.decode([t]) for t in tokens]
    
    print(f"Tokens: {decoded_tokens}")
    print(f"Number of tokens: {len(tokens)}")
    print(f"Characters per token: {len(dna_sample)/len(tokens):.2f}")
    
    print("\nTOKEN BREAKDOWN:")
    for i, (token_id, token_text) in enumerate(zip(tokens, decoded_tokens)):
        print(f"  {i+1:2d}. Token ID {token_id:5d}: {repr(token_text)}")

def main():
    """Test character-level analysis."""
    
    # Test DNA tokenization first
    test_dna_tokenization()
    
    print("\n" + "="*80 + "\n")
    
    # Load model
    device = torch.device('cpu')
    print("Loading GPT-2...")
    tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
    model = GPT2LMHeadModel.from_pretrained('gpt2').to(device)
    model.eval()
    print("Model loaded!\n")
    
    # Test on DNA sequence
    dna_text = "ATGCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCG"
    analyze_character_level(dna_text, model, tokenizer, device, max_chars=20)
    
    print("\n" + "="*80 + "\n")
    
    # Test on English text for comparison
    english_text = "The quick brown fox jumps over the lazy dog."
    analyze_character_level(english_text, model, tokenizer, device, max_chars=20)

if __name__ == "__main__":
    main()