#!/usr/bin/env python3
"""
GPT-4 compression analysis using OpenAI API.

Usage:
    python analyze_gpt4.py file.txt

Note: Requires OPENAI_API_KEY environment variable
"""

import sys
import os
import csv
import json
import math
import time
from datetime import datetime
from pathlib import Path
from openai import OpenAI

def load_client():
    """Load OpenAI client."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable not set")
        print("Run: export OPENAI_API_KEY='your-key-here'")
        sys.exit(1)
    
    client = OpenAI(api_key=api_key)
    print("OpenAI client loaded!")
    return client

def get_token_logprobs(client, text, model="gpt-4", max_tokens=1):
    """
    Get token log probabilities from GPT-4.
    
    This uses the chat completions API with logprobs enabled.
    """
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": text}],
            max_tokens=max_tokens,
            temperature=0,
            logprobs=True,
            top_logprobs=10
        )
        
        return response.choices[0].logprobs
        
    except Exception as e:
        print(f"API Error: {e}")
        return None

def chunk_text(text, chunk_size=100):
    """Split text into chunks for processing."""
    chunks = []
    for i in range(0, len(text), chunk_size):
        chunks.append(text[i:i + chunk_size])
    return chunks

def analyze_text_gpt4(text_path, client):
    """Analyze text using GPT-4 API."""
    
    # Read text
    with open(text_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    text_name = Path(text_path).stem
    print(f"\nAnalyzing with GPT-4: {text_name}")
    print(f"Text length: {len(text)} characters")
    
    # For this experiment, we'll estimate compression by asking GPT-4
    # to evaluate the predictability of text segments
    print("Note: GPT-4 doesn't provide direct token probabilities via API")
    print("We'll estimate compression by asking GPT-4 to evaluate predictability")
    
    # Split into chunks
    chunks = chunk_text(text, chunk_size=50)
    print(f"Processing {len(chunks)} chunks...")
    
    results_dir = Path("results")
    results_dir.mkdir(exist_ok=True)
    
    csv_file = results_dir / f"{text_name}_gpt4_analysis.csv"
    
    # Process chunks
    chunk_results = []
    total_estimated_bits = 0
    
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Chunk_ID', 'Text_Chunk', 'Estimated_Bits_Per_Char', 'GPT4_Assessment'])
        
        for i, chunk in enumerate(chunks):
            print(f"Processing chunk {i+1}/{len(chunks)}...", end='\r')
            
            # Ask GPT-4 to assess predictability
            prompt = f"""Rate the predictability of this text on a scale of 1-10, where:
1 = Completely random/unpredictable (like random numbers)
10 = Completely predictable (like repeating patterns)

Text: "{chunk}"

Respond with just a number from 1-10."""
            
            try:
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=5,
                    temperature=0
                )
                
                predictability_str = response.choices[0].message.content.strip()
                predictability = float(predictability_str)
                
                # Convert predictability to estimated bits per character
                # 1 (random) -> 3.3 bits, 10 (predictable) -> 0.5 bits
                estimated_bits_per_char = 3.3 - (predictability - 1) * (3.3 - 0.5) / 9
                
                chunk_bits = estimated_bits_per_char * len(chunk)
                total_estimated_bits += chunk_bits
                
                chunk_results.append({
                    'chunk_id': i,
                    'text': chunk,
                    'predictability': predictability,
                    'bits_per_char': estimated_bits_per_char,
                    'total_bits': chunk_bits
                })
                
                writer.writerow([
                    i, 
                    repr(chunk), 
                    f"{estimated_bits_per_char:.2f}",
                    f"Predictability: {predictability}/10"
                ])
                
                # Rate limiting
                time.sleep(0.1)
                
            except Exception as e:
                print(f"\nError processing chunk {i}: {e}")
                chunk_results.append({
                    'chunk_id': i,
                    'text': chunk,
                    'predictability': 5.0,  # Default
                    'bits_per_char': 2.0,   # Default
                    'total_bits': 2.0 * len(chunk)
                })
                total_estimated_bits += 2.0 * len(chunk)
    
    print(f"Processed {len(chunks)}/{len(chunks)} chunks...Done!")
    
    # Calculate summary
    avg_bits_per_char = total_estimated_bits / len(text)
    compression_ratio = 8.0 / avg_bits_per_char
    
    summary = {
        'text_name': text_name,
        'text_path': str(text_path),
        'text_length': len(text),
        'num_chunks': len(chunks),
        'total_estimated_bits': total_estimated_bits,
        'bits_per_char': avg_bits_per_char,
        'compression_ratio': compression_ratio,
        'model': 'gpt-4',
        'method': 'predictability_assessment',
        'timestamp': datetime.now().isoformat()
    }
    
    # Save summary
    json_file = results_dir / f"{text_name}_gpt4_summary.json"
    with open(json_file, 'w') as f:
        json.dump(summary, f, indent=2)
    
    # Print results
    print(f"\nGPT-4 Analysis Results for {text_name}:")
    print(f"  Estimated total bits: {total_estimated_bits:.0f}")
    print(f"  Estimated bits per character: {avg_bits_per_char:.2f}")
    print(f"  Estimated compression ratio: {compression_ratio:.1f}x")
    print(f"  Method: Predictability assessment by GPT-4")
    
    # Show most/least predictable chunks
    sorted_chunks = sorted(chunk_results, key=lambda x: x['predictability'])
    
    print(f"\nMost predictable chunks:")
    for chunk in sorted_chunks[-3:]:
        print(f"  Predictability {chunk['predictability']}/10: {repr(chunk['text'][:30])}...")
    
    print(f"\nLeast predictable chunks:")
    for chunk in sorted_chunks[:3]:
        print(f"  Predictability {chunk['predictability']}/10: {repr(chunk['text'][:30])}...")
    
    print(f"\nFiles saved:")
    print(f"  CSV: {csv_file}")
    print(f"  JSON: {json_file}")
    
    return summary

def main():
    """Main function."""
    
    if len(sys.argv) != 2:
        print("Usage: python analyze_gpt4.py <text_file.txt>")
        sys.exit(1)
    
    text_file = Path(sys.argv[1])
    if not text_file.exists():
        print(f"Error: File not found: {text_file}")
        sys.exit(1)
    
    # Load OpenAI client
    client = load_client()
    
    # Analyze text
    try:
        summary = analyze_text_gpt4(text_file, client)
        print("\n" + "="*60)
        print("Analysis complete!")
    except Exception as e:
        print(f"Error during analysis: {e}")

if __name__ == "__main__":
    main()