#!/usr/bin/env python3
"""
Real LLM compression measurement using Hugging Face models.

This uses open models like Llama, GPT-2, etc. that provide token probabilities.

Requirements:
pip install transformers torch

This runs locally - no API key needed!
"""

import torch
import math
from transformers import AutoTokenizer, AutoModelForCausalLM
import numpy as np

# Text samples (shorter versions for local computation)
SAMPLES = {
    "lorem_ipsum": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    
    "pi_digits": "3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111",
    
    "declaration": "When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another",
    
    "dna": "ATGCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCG",
    
    "code": "function calculateFibonacci(n) { if (n <= 1) { return n; } let a = 0; let b = 1; let temp;",
    
    "repeated": "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ"
}

def measure_compression_huggingface(
    text: str, 
    model_name: str = "gpt2",  # Can use "meta-llama/Llama-2-7b-hf" with access
    device: str = "cpu"
) -> dict:
    """
    Measure compression using Hugging Face models.
    
    This calculates the exact cross-entropy/perplexity of the text.
    """
    
    print(f"Loading {model_name}...")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name).to(device)
    model.eval()
    
    # Tokenize
    inputs = tokenizer(text, return_tensors="pt").to(device)
    input_ids = inputs["input_ids"]
    
    # Get model outputs with logits
    with torch.no_grad():
        outputs = model(input_ids, labels=input_ids)
        logits = outputs.logits
    
    # Calculate token-level probabilities
    # Shift logits and labels for next-token prediction
    shift_logits = logits[..., :-1, :].contiguous()
    shift_labels = input_ids[..., 1:].contiguous()
    
    # Calculate cross-entropy for each token
    token_bits = []
    for i in range(shift_labels.shape[1]):
        # Get probability distribution for this position
        probs = torch.softmax(shift_logits[0, i], dim=-1)
        
        # Get probability of actual token
        actual_token = shift_labels[0, i]
        token_prob = probs[actual_token].item()
        
        # Calculate bits
        if token_prob > 0:
            bits = -math.log2(token_prob)
        else:
            bits = 20  # Cap at 20 bits for numerical stability
        
        token_bits.append(bits)
    
    # Calculate metrics
    total_bits = sum(token_bits)
    total_tokens = len(token_bits)
    total_chars = len(text)
    
    # Convert to character-level metrics
    chars_per_token = total_chars / (total_tokens + 1)  # +1 for first token
    bits_per_char = total_bits / total_chars
    compression_ratio = 8.0 / bits_per_char
    
    # Also calculate model's built-in loss (cross-entropy in nats)
    loss_nats = outputs.loss.item()
    loss_bits = loss_nats / math.log(2)  # Convert to bits
    
    return {
        'model': model_name,
        'total_tokens': total_tokens,
        'total_bits': total_bits,
        'total_chars': total_chars,
        'bits_per_char': bits_per_char,
        'bits_per_token': total_bits / total_tokens,
        'compression_ratio': compression_ratio,
        'model_loss_bits': loss_bits,
        'chars_per_token': chars_per_token
    }

def measure_with_multiple_models(text: str, models: list) -> dict:
    """Compare compression across multiple models."""
    results = {}
    
    for model_name in models:
        try:
            print(f"\nMeasuring with {model_name}...")
            result = measure_compression_huggingface(text, model_name)
            results[model_name] = result
        except Exception as e:
            print(f"Error with {model_name}: {e}")
            results[model_name] = {"error": str(e)}
    
    return results

def main():
    print("Hugging Face LLM Compression Measurement")
    print("=" * 60)
    print("\nThis measures actual compression using open models.")
    print("Running on CPU - may take a minute per model.\n")
    
    # Models to test (in order of size/quality)
    models = [
        "gpt2",  # 124M parameters, fast
        # "gpt2-medium",  # 355M parameters
        # "gpt2-large",   # 774M parameters  
        # "EleutherAI/gpt-neo-125M",  # Open alternative
        # "microsoft/DialoGPT-small",  # Conversational
    ]
    
    # For Llama models (require access request):
    # "meta-llama/Llama-2-7b-hf"
    # "meta-llama/Llama-2-13b-hf"
    
    all_results = {}
    
    for sample_name, text in SAMPLES.items():
        print(f"\n{'='*60}")
        print(f"Testing: {sample_name}")
        print(f"Text: {text[:50]}...")
        
        # Test with first model
        result = measure_compression_huggingface(text, models[0])
        
        # Extrapolate to full text size
        full_sizes = {
            "lorem_ipsum": 835,
            "pi_digits": 1001,
            "declaration": 1240,
            "dna": 1000,
            "code": 1123,
            "repeated": 1000
        }
        
        full_bits = result['bits_per_char'] * full_sizes.get(sample_name, len(text))
        
        all_results[sample_name] = {
            'bits_per_char': result['bits_per_char'],
            'compression_ratio': result['compression_ratio'],
            'full_text_bits': int(full_bits),
            'bits_per_token': result['bits_per_token'],
            'model_loss': result['model_loss_bits']
        }
        
        print(f"\nResults:")
        print(f"  Bits per character: {result['bits_per_char']:.2f}")
        print(f"  Bits per token: {result['bits_per_token']:.2f}")
        print(f"  Compression ratio: {result['compression_ratio']:.1f}x")
        print(f"  Full text bits: {int(full_bits)}")
        print(f"  Model loss (bits/token): {result['model_loss_bits']:.2f}")
    
    print("\n" + "=" * 60)
    print("\nFor CompressionWidget:")
    
    for name, result in all_results.items():
        print(f"\n// {name.replace('_', ' ').title()} (GPT-2)")
        print(f"bits: {result['full_text_bits']}, ratio: \"{result['compression_ratio']:.1f}x\"")

if __name__ == "__main__":
    main()