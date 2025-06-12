#!/usr/bin/env python3
"""
Real LLM compression measurement using OpenAI API with logprobs.

Requirements:
1. pip install openai tiktoken
2. Set OPENAI_API_KEY environment variable
3. Run: python real_llm_compression.py

This will measure actual compression by getting token-level probabilities.
"""

import os
import math
import json
from openai import OpenAI
import tiktoken

# Initialize client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Text samples
SAMPLES = {
    "lorem_ipsum": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    
    "pi_digits": "3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481117450284102701938521105559644622948954930381964428810975665933446128475648233",
    
    "declaration": "When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another, and to assume among the powers of the earth, the separate and equal station to which the Laws of Nature and of Nature's God entitle them",
    
    "dna": "ATGCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAGCTAGCTAGCTAGCTACGATCGATCGATCGTAG",
    
    "code": """function calculateFibonacci(n) {
  if (n <= 1) {
    return n;
  }
  let a = 0;
  let b = 1;
  let temp;
  for (let i = 2; i <= n; i++) {
    temp = a + b;
    a = b;
    b = temp;
  }
  return b;
}""",
    
    "repeated": "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ"
}

def measure_compression_gpt(text: str, model: str = "gpt-3.5-turbo-instruct") -> dict:
    """
    Measure compression using GPT's logprobs feature.
    
    This gives us the exact probability the model assigns to each token.
    """
    
    # Tokenize the text
    encoding = tiktoken.encoding_for_model(model)
    tokens = encoding.encode(text)
    
    total_bits = 0
    token_data = []
    
    # Process in chunks to respect API limits
    chunk_size = 500  # tokens per request
    
    for i in range(0, len(tokens), chunk_size):
        chunk_tokens = tokens[i:i+chunk_size]
        chunk_text = encoding.decode(chunk_tokens)
        
        # Get completion with logprobs
        response = client.completions.create(
            model=model,
            prompt="",  # Empty prompt
            max_tokens=0,
            echo=True,  # Include the prompt in the response
            logprobs=0,  # Get logprobs for all tokens
            temperature=0,
            prompt=chunk_text
        )
        
        # Extract logprobs
        for j, logprob in enumerate(response.choices[0].logprobs.token_logprobs):
            if logprob is not None:  # First token has None logprob
                # Convert natural log to bits
                bits = -logprob / math.log(2)
                total_bits += bits
                token_data.append({
                    'token': response.choices[0].logprobs.tokens[j],
                    'logprob': logprob,
                    'bits': bits
                })
    
    # Calculate character-level metrics
    total_chars = len(text)
    bits_per_char = total_bits / total_chars
    compression_ratio = 8.0 / bits_per_char
    
    return {
        'total_tokens': len(tokens),
        'total_bits': total_bits,
        'total_chars': total_chars,
        'bits_per_char': bits_per_char,
        'compression_ratio': compression_ratio,
        'sample_tokens': token_data[:10]  # First 10 for inspection
    }

def measure_compression_chat_approximation(text: str, model: str = "gpt-4") -> dict:
    """
    Approximate compression for chat models by measuring perplexity.
    
    This is less accurate but works with chat models.
    """
    
    # We'll ask the model to evaluate its own perplexity
    prompt = f"""Evaluate the predictability of the following text on a character-by-character basis.
For each segment, estimate how many bits would be needed to encode it based on predictability.

Text: "{text[:200]}..."

Provide a detailed analysis of:
1. Average bits per character
2. Which parts are most/least predictable
3. Overall compression potential

Be specific and technical in your analysis."""
    
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )
    
    return {
        'method': 'chat_approximation',
        'analysis': response.choices[0].message.content
    }

def main():
    print("Real LLM Compression Measurement")
    print("=" * 60)
    
    # Check for API key
    if not os.getenv("OPENAI_API_KEY"):
        print("\nERROR: Please set OPENAI_API_KEY environment variable")
        print("export OPENAI_API_KEY='your-key-here'")
        return
    
    print("\nThis will measure actual LLM compression using OpenAI's API.")
    print("Estimated cost: ~$0.02-0.05")
    print("\nPress Enter to continue or Ctrl+C to cancel...")
    input()
    
    results = {}
    
    for name, text in SAMPLES.items():
        print(f"\nProcessing {name}...")
        
        try:
            # Use smaller sample to reduce costs
            sample = text[:min(500, len(text))]
            result = measure_compression_gpt(sample)
            
            # Extrapolate to full text
            full_text_sizes = {
                "lorem_ipsum": 835,
                "pi_digits": 1001,
                "declaration": 1240,
                "dna": 1000,
                "code": 1123,
                "repeated": 1000
            }
            
            full_bits = result['bits_per_char'] * full_text_sizes.get(name, len(text))
            
            results[name] = {
                'bits_per_char': result['bits_per_char'],
                'compression_ratio': result['compression_ratio'],
                'full_text_bits': int(full_bits),
                'sample_size': len(sample),
                'token_count': result['total_tokens']
            }
            
            print(f"  Bits per char: {result['bits_per_char']:.2f}")
            print(f"  Compression ratio: {result['compression_ratio']:.1f}x")
            print(f"  Full text bits: {int(full_bits)}")
            
        except Exception as e:
            print(f"  Error: {e}")
    
    # Save results
    with open("llm_compression_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("\n" + "=" * 60)
    print("Results saved to llm_compression_results.json")
    print("\nFor CompressionWidget:")
    
    for name, result in results.items():
        print(f"\n// {name.replace('_', ' ').title()}")
        print(f"bits: {result['full_text_bits']}, ratio: \"{result['compression_ratio']:.1f}x\"")

if __name__ == "__main__":
    main()