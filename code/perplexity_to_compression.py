#!/usr/bin/env python3
"""
Convert published perplexity scores to compression ratios.

Perplexity benchmarks for various models on standard datasets:
- WikiText-103
- OpenWebText  
- Common Crawl
- Various domain-specific corpora
"""

import math

# Published perplexity scores from papers and benchmarks
PERPLEXITY_BENCHMARKS = {
    "GPT-2": {
        "WikiText-103": 29.41,
        "OpenWebText": 18.34,
        "description": "Original GPT-2 1.5B model"
    },
    "GPT-3": {
        "WikiText-103": 20.5,
        "LAMBADA": 3.00,
        "HellaSwag": 1.82,
        "description": "GPT-3 175B (from paper)"
    },
    "GPT-4": {
        "estimated_english": 8.0,  # Estimated from various sources
        "code": 5.0,  # Very good at code
        "description": "Estimated from community benchmarks"
    },
    "Llama-2-7B": {
        "WikiText-2": 5.47,
        "C4": 6.97,
        "description": "Meta's Llama 2 7B model"
    },
    "Llama-2-70B": {
        "WikiText-2": 3.31,
        "C4": 5.04,
        "description": "Meta's Llama 2 70B model"
    },
    "Claude-2": {
        "estimated_english": 9.0,  # Estimated
        "description": "Estimated from similar benchmarks"
    }
}

def perplexity_to_bits_per_token(perplexity: float) -> float:
    """Convert perplexity to bits per token."""
    return math.log2(perplexity)

def estimate_compression_from_perplexity(
    text_type: str,
    perplexity: float,
    avg_chars_per_token: float = 4.0
) -> dict:
    """
    Estimate compression metrics from perplexity.
    
    Args:
        text_type: Type of text
        perplexity: Model perplexity on this text type
        avg_chars_per_token: Average characters per token (varies by tokenizer)
    """
    
    bits_per_token = math.log2(perplexity)
    bits_per_char = bits_per_token / avg_chars_per_token
    compression_ratio = 8.0 / bits_per_char
    
    return {
        "perplexity": perplexity,
        "bits_per_token": bits_per_token,
        "bits_per_char": bits_per_char,
        "compression_ratio": compression_ratio,
        "avg_chars_per_token": avg_chars_per_token
    }

def estimate_for_text_types():
    """
    Estimate compression for our specific text types based on known benchmarks.
    
    We'll use GPT-4 level performance as our target.
    """
    
    # Estimated perplexities for different text types
    # Based on how they compare to standard benchmarks
    text_type_perplexities = {
        "lorem_ipsum": {
            "perplexity": 12.0,  # Latin, less common than English
            "chars_per_token": 4.5,
            "note": "Latin text, somewhat out-of-distribution"
        },
        "pi_digits": {
            "perplexity": 10.0,  # Near maximum for digits
            "chars_per_token": 3.0,  # Digits tokenize differently
            "note": "Mathematical constants appear random"
        },
        "declaration": {
            "perplexity": 7.0,  # Very well-represented English
            "chars_per_token": 4.2,
            "note": "Historical English, very predictable"
        },
        "dna": {
            "perplexity": 8.0,  # Some patterns but specialized
            "chars_per_token": 3.5,
            "note": "Biological sequences, some patterns"
        },
        "code": {
            "perplexity": 5.0,  # Highly structured
            "chars_per_token": 3.8,
            "note": "Programming languages are very predictable"
        },
        "repeated": {
            "perplexity": 1.5,  # Nearly deterministic
            "chars_per_token": 4.0,
            "note": "Trivial repeating pattern"
        }
    }
    
    print("Compression estimates from perplexity benchmarks")
    print("=" * 60)
    print("\nBased on GPT-4 level performance:\n")
    
    results = {}
    
    for text_type, params in text_type_perplexities.items():
        result = estimate_compression_from_perplexity(
            text_type,
            params["perplexity"],
            params["chars_per_token"]
        )
        
        results[text_type] = result
        
        print(f"{text_type.replace('_', ' ').title()}:")
        print(f"  Estimated perplexity: {params['perplexity']:.1f}")
        print(f"  Bits per token: {result['bits_per_token']:.2f}")
        print(f"  Bits per character: {result['bits_per_char']:.2f}")
        print(f"  Compression ratio: {result['compression_ratio']:.1f}x")
        print(f"  Note: {params['note']}")
        print()
    
    # Calculate full text compression
    full_sizes = {
        "lorem_ipsum": 835,
        "pi_digits": 1001,
        "declaration": 1240,
        "dna": 1000,
        "code": 1123,
        "repeated": 1000
    }
    
    print("\nFor CompressionWidget:")
    print("-" * 40)
    
    for text_type, result in results.items():
        full_bits = result['bits_per_char'] * full_sizes[text_type]
        print(f"\n// {text_type.replace('_', ' ').title()}")
        print(f"bits: {int(full_bits)}, ratio: \"{result['compression_ratio']:.1f}x\"")

def show_model_comparison():
    """Show how different models would compress English text."""
    
    print("\n\nModel Comparison for English Text")
    print("=" * 60)
    print("Model               Perplexity    Bits/Token    Compression")
    print("-" * 60)
    
    # Compare different models on English text
    english_perplexities = [
        ("GPT-2 (124M)", 35.0),
        ("GPT-2 (1.5B)", 18.34),
        ("GPT-3 (175B)", 10.0),
        ("GPT-4", 8.0),
        ("Llama-2-7B", 12.0),
        ("Llama-2-70B", 8.5),
        ("Claude-2", 9.0),
    ]
    
    for model, perp in english_perplexities:
        result = estimate_compression_from_perplexity("english", perp, 4.0)
        print(f"{model:20s} {perp:6.1f}       {result['bits_per_token']:6.2f}        {result['compression_ratio']:4.1f}x")

if __name__ == "__main__":
    estimate_for_text_types()
    show_model_comparison()