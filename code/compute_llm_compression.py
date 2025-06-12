#!/usr/bin/env python3
"""
Compute actual LLM compression by sampling character probabilities.

Since we can't get direct probabilities from Claude, we'll use a sampling approach:
1. For each position in the text, ask the model to predict the next character
2. Sample multiple times to estimate probability distribution
3. Calculate compression based on the actual character's probability
"""

import math
from collections import Counter
import anthropic

# Initialize Claude client (you'll need to set ANTHROPIC_API_KEY environment variable)
client = anthropic.Anthropic()

def get_next_char_distribution(context: str, num_samples: int = 20) -> dict:
    """
    Estimate probability distribution for next character by sampling.
    """
    if not context:
        # For first character, assume uniform distribution over printable ASCII
        return {chr(i): 1/95 for i in range(32, 127)}
    
    # Prompt to get next character predictions
    prompt = f"""Continue this text with EXACTLY one more character (letter, digit, space, or punctuation):

{context}

Respond with only the single next character, nothing else."""
    
    samples = []
    for _ in range(num_samples):
        try:
            response = client.messages.create(
                model="claude-3-haiku-20240307",  # Use fast, cheap model
                max_tokens=1,
                temperature=1.0,  # High temperature for diverse sampling
                messages=[{"role": "user", "content": prompt}]
            )
            next_char = response.content[0].text
            if len(next_char) == 1:
                samples.append(next_char)
        except:
            pass
    
    # Count frequencies to estimate probabilities
    counts = Counter(samples)
    total = len(samples)
    
    if total == 0:
        # Fallback to uniform distribution
        return {chr(i): 1/95 for i in range(32, 127)}
    
    # Convert counts to probabilities
    probs = {char: count/total for char, count in counts.items()}
    
    return probs


def compute_compression_sampling(text: str, window_size: int = 50) -> dict:
    """
    Compute compression by sampling method.
    Uses a sliding window for context to keep API costs down.
    """
    total_bits = 0
    bits_per_position = []
    
    print(f"Computing compression for {len(text)} characters...")
    
    # Sample every 10th position to reduce API calls
    sample_positions = range(0, len(text), 10)
    
    for i in sample_positions:
        # Get context window
        start = max(0, i - window_size)
        context = text[start:i]
        actual_char = text[i] if i < len(text) else ''
        
        if not actual_char:
            continue
            
        # Get probability distribution
        print(f"Position {i}/{len(text)}...", end='\r')
        probs = get_next_char_distribution(context)
        
        # Get probability of actual character
        p = probs.get(actual_char, 1/95)  # Default to uniform if not in samples
        
        # Calculate bits
        bits = -math.log2(p) if p > 0 else 10  # Cap at 10 bits for unseen chars
        bits_per_position.append(bits)
        total_bits += bits
    
    # Extrapolate to full text
    avg_bits = sum(bits_per_position) / len(bits_per_position) if bits_per_position else 5
    estimated_total_bits = avg_bits * len(text)
    
    return {
        "text_length": len(text),
        "sampled_positions": len(bits_per_position),
        "avg_bits_per_char": avg_bits,
        "total_bits": estimated_total_bits,
        "compression_ratio": 8.0 / avg_bits
    }


def compute_compression_direct(text: str, context_size: int = 100) -> dict:
    """
    Alternative: Ask model directly for probability estimates.
    """
    total_bits = 0
    measurements = []
    
    # Sample positions throughout the text
    positions = [int(i) for i in range(10, len(text), max(1, len(text)//20))]
    
    for pos in positions:
        context = text[max(0, pos-context_size):pos]
        actual_char = text[pos]
        
        prompt = f"""Given this text:
"{context}"

The next character is '{actual_char}'.

On a scale of 0-100, how predictable was this character given the context?
- 100 = completely predictable (like 'u' after 'q')
- 50 = moderately predictable (common letter in normal position)
- 10 = surprising (unexpected character)
- 0 = completely random

Respond with just the number."""
        
        try:
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=10,
                temperature=0,
                messages=[{"role": "user", "content": prompt}]
            )
            
            predictability = int(response.content[0].text.strip())
            # Convert predictability to probability estimate
            prob = predictability / 100
            if prob < 0.01:
                prob = 0.01  # Floor at 1%
            
            bits = -math.log2(prob)
            measurements.append(bits)
            print(f"Position {pos}: '{actual_char}' - {predictability}% predictable - {bits:.2f} bits")
            
        except:
            measurements.append(5)  # Default
    
    avg_bits = sum(measurements) / len(measurements)
    
    return {
        "text_length": len(text),
        "sampled_positions": len(measurements),
        "avg_bits_per_char": avg_bits,
        "total_bits": avg_bits * len(text),
        "compression_ratio": 8.0 / avg_bits
    }


# Test with small examples
test_texts = {
    "repeated": "ABCDEFGHIJKLMNOPQRSTUVWXYZ" * 5,  # Should compress very well
    "random": "q7#mK2$vL9@nP4&xR6!wT8%zY3",  # Should compress poorly
    "english": "The quick brown fox jumps over the lazy dog. This is a simple English sentence with common words.",
    "code": "function add(a, b) { return a + b; } console.log(add(5, 3));",
}

if __name__ == "__main__":
    print("LLM Compression Computation")
    print("=" * 60)
    print("WARNING: This will make API calls. Estimated cost: ~$0.01-0.02")
    print("=" * 60)
    
    # Test on small examples first
    for name, text in test_texts.items():
        print(f"\n\nTesting: {name}")
        print(f"Text: {text[:50]}...")
        
        result = compute_compression_direct(text[:100])  # Limit length for testing
        
        print(f"\nResults:")
        print(f"  Average bits/char: {result['avg_bits_per_char']:.2f}")
        print(f"  Compression ratio: {result['compression_ratio']:.1f}x")
        print(f"  Total bits: {result['total_bits']:.0f}")