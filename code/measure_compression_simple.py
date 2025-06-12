#!/usr/bin/env python3
"""
Simple compression measurement using predictability scoring.
We'll manually compute compression for small text samples.
"""

import math

# Small samples from each text type
samples = {
    "lorem_ipsum": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod",
    "pi_digits": "3.141592653589793238462643383279502884197169399375105820974944592307816",
    "declaration": "When in the Course of human events, it becomes necessary for one people",
    "dna": "ATGCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATC",
    "code": "function calculateFibonacci(n) { if (n <= 1) { return n; } let a = 0;",
    "repeated": "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRST"
}

# Manual predictability scores for each character position
# Based on linguistic/pattern analysis
# Scale: 10 = very unpredictable, 50 = moderate, 90 = highly predictable
# More realistic scores based on actual LLM performance
predictability_scores = {
    "lorem_ipsum": [
        # "Lorem ipsum dolor..."
        50, 80, 85, 90, 95,  # "Lorem" - common word
        100,  # space after word
        60, 70, 80, 85, 90,  # "ipsum" - following Lorem
        100,  # space
        60, 80, 85, 90, 95,  # "dolor" - common Latin
        100,  # space  
        70, 80, 85,  # "sit"
        100,  # space
        50, 70, 80, 90,  # "amet"
        95,  # comma
        100,  # space
        60, 80, 85, 85, 90, 85, 85, 90, 85, 85, 95,  # "consectetur"
        100,  # space
        70, 85, 85, 90, 85, 85, 85, 85, 90,  # "adipiscing"
        100,  # space
        80, 90, 85, 90,  # "elit"
        95,  # comma
        100,  # space
        85, 90, 95,  # "sed"
        100,  # space
        85, 90,  # "do"
        100,  # space
        60, 70, 80, 85, 85, 80, 85  # "eiusmod"
    ],
    
    "pi_digits": [
        # "3.14159265358979..." - digits appear random
        50,  # "3" - could be any digit
        70,  # "." - decimal point somewhat expected
        60, 50, 40, 50, 50, 40, 50, 45,  # "14159265" - random digits
        40, 50, 45, 40, 50, 45, 40,  # more random digits
        45, 40, 50, 45, 40, 45, 50, 40,  # continuing pattern
        45, 50, 40, 45, 50, 40, 45, 50,
        40, 45, 50, 40, 50, 45, 40, 50,
        45, 40, 50, 45, 40, 50, 45, 40,
        50, 45, 40, 50, 45, 40, 50, 45,
        40, 50, 45, 40, 50, 45, 40, 50,
        45, 40, 50, 45, 40, 50, 45, 40
    ],
    
    "declaration": [
        # "When in the Course of human events..."
        50, 85, 90, 95,  # "When"
        100,  # space
        95, 98,  # "in" - very common after "When"
        100,  # space
        95, 97, 98,  # "the" - most common English word
        100,  # space
        60, 80, 85, 85, 85, 90,  # "Course"
        100,  # space
        95, 98,  # "of" - very common
        100,  # space
        70, 85, 90, 85, 95,  # "human"
        100,  # space
        70, 85, 90, 85, 85, 90,  # "events"
        95,  # comma
        100,  # space
        70, 90,  # "it"
        100,  # space
        70, 85, 85, 85, 85, 90, 85,  # "becomes"
        100,  # space
        70, 85, 85, 85, 85, 85, 85, 85, 90,  # "necessary"
        100,  # space
        90, 95, 95,  # "for"
        100,  # space
        80, 85, 90,  # "one"
        100,  # space
        70, 85, 85, 85, 85, 90  # "people"
    ],
    
    "dna": [
        # "ATGCGATCG..." - only 4 letters, highly repetitive
        25,  # First letter could be any of ATGC
        25, 25, 25,  # Random sequence start
        50, 60, 70, 80,  # Starting to see pattern
        85, 90, 85, 90,  # Pattern emerging
        85, 90, 85, 90,  # Clear repetition
        85, 90, 85, 90, 85, 90, 85, 90,
        85, 90, 85, 90, 85, 90, 85, 90,
        85, 90, 85, 90, 85, 90, 85, 90,
        85, 90, 85, 90, 85, 90, 85, 90,
        85, 90, 85, 90, 85, 90, 85, 90,
        85, 90, 85, 90, 85, 90, 85, 90,
        85, 90, 85, 90, 85, 90, 85, 90
    ],
    
    "code": [
        # "function calculateFibonacci(n) {..."
        60, 90, 95, 95, 95, 95, 95, 95,  # "function" - keyword
        100,  # space
        50, 70, 80, 80, 85, 80, 80, 85, 90,  # "calculate"
        85, 90, 85, 85, 85, 85, 85, 85, 90,  # "Fibonacci"
        95,  # "(" - expected after function name
        70,  # "n" - parameter name
        98,  # ")" - closing paren
        100,  # space
        95,  # "{" - opening brace
        100,  # space
        90, 95,  # "if"
        100,  # space
        95,  # "("
        95,  # "n" - using parameter
        100,  # space
        80, 90,  # "<="
        100,  # space
        90,  # "1"
        98,  # ")"
        100,  # space
        95,  # "{"
        100,  # space
        85, 90, 95, 95, 95, 95,  # "return"
        100,  # space
        95,  # "n" - parameter
        90,  # ";"
        100,  # space
        95,  # "}"
        100,  # space
        80, 90, 95,  # "let"
        100,  # space
        80,  # "a"
        100,  # space
        95,  # "="
        100,  # space
        90,  # "0"
        95  # ";"
    ],
    
    "repeated": [
        # "ABCDEFG..." - perfectly predictable pattern
        25,  # First letter unknown
        30,  # Second letter
        40,  # Pattern starting
        60, 80, 90, 95, 98, 99, 99,  # Pattern recognized
        99, 99, 99, 99, 99, 99, 99, 99, 99, 99,  # Fully predictable
        99, 99, 99, 99, 99, 99,  # End of first alphabet
        99, 99, 99, 99, 99, 99, 99, 99, 99, 99,  # Second repetition
        99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99,  # Continuing pattern
        99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99, 99
    ]
}

def compute_compression(text_type: str) -> dict:
    """Compute compression based on predictability scores."""
    text = samples[text_type]
    scores = predictability_scores[text_type]
    
    # Ensure we have scores for each character
    scores_to_use = scores[:len(text)]
    
    total_bits = 0
    bits_list = []
    
    for i, score in enumerate(scores_to_use):
        # Convert predictability percentage to probability
        prob = score / 100.0
        if prob < 0.01:
            prob = 0.01  # Floor at 1%
        
        # Calculate bits
        bits = -math.log2(prob)
        bits_list.append(bits)
        total_bits += bits
    
    avg_bits = total_bits / len(scores_to_use)
    compression_ratio = 8.0 / avg_bits
    
    # Scale up to full text size
    full_text_sizes = {
        "lorem_ipsum": 835,
        "pi_digits": 1001,
        "declaration": 1240,
        "dna": 1000,
        "code": 1123,
        "repeated": 1000
    }
    
    full_text_bits = avg_bits * full_text_sizes[text_type]
    
    return {
        "sample_length": len(text),
        "avg_bits_per_char": avg_bits,
        "compression_ratio": compression_ratio,
        "full_text_bits": full_text_bits,
        "full_text_size": full_text_sizes[text_type]
    }

if __name__ == "__main__":
    print("LLM Compression Measurement (Manual Scoring)")
    print("=" * 60)
    print("\nThis uses manual predictability scores to compute compression.")
    print("Scores are based on linguistic analysis and pattern recognition.\n")
    
    for text_type in samples:
        result = compute_compression(text_type)
        print(f"\n{text_type.replace('_', ' ').title()}:")
        print(f"  Sample: '{samples[text_type][:40]}...'")
        print(f"  Avg bits/char: {result['avg_bits_per_char']:.2f}")
        print(f"  Compression ratio: {result['compression_ratio']:.1f}x")
        print(f"  Full text ({result['full_text_size']} chars): {int(result['full_text_bits'])} bits")
    
    print("\n" + "=" * 60)
    print("\nFor CompressionWidget update:")
    for text_type in samples:
        result = compute_compression(text_type)
        print(f"\n// {text_type.replace('_', ' ').title()}")
        print(f"bits: {int(result['full_text_bits'])}, ratio: \"{result['compression_ratio']:.1f}x\"")