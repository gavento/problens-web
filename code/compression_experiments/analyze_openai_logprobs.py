#!/usr/bin/env python3
"""
OpenAI compression analysis using actual token probabilities.

Uses GPT-3.5-turbo-instruct which still provides logprobs.
This gives us REAL token-by-token compression measurements.
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
        sys.exit(1)
    
    client = OpenAI(api_key=api_key)
    print("OpenAI client loaded!")
    return client

def get_token_logprobs(client, text, model="gpt-3.5-turbo-instruct"):
    """
    Get actual token log probabilities using the completions API.
    
    This gives us the EXACT same measurement as our GPT-2 experiment
    but with a much more powerful model.
    """
    try:
        response = client.completions.create(
            model=model,
            prompt=text,
            max_tokens=0,  # Don't generate, just get logprobs of input
            echo=True,     # Return the prompt with logprobs
            logprobs=10,   # Get top 10 logprobs
            temperature=0
        )
        
        return response.choices[0].logprobs
        
    except Exception as e:
        print(f"API Error: {e}")
        return None

def analyze_text_openai(text_path, client, model="gpt-3.5-turbo-instruct"):
    """Analyze text using OpenAI with actual token probabilities."""
    
    # Read text
    with open(text_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    text_name = Path(text_path).stem
    print(f"\nAnalyzing with {model}: {text_name}")
    print(f"Text length: {len(text)} characters")
    
    # Get logprobs for the entire text
    print("Getting token probabilities from OpenAI...")
    logprobs_data = get_token_logprobs(client, text, model)
    
    if not logprobs_data:
        print("Failed to get logprobs")
        return None
    
    tokens = logprobs_data.tokens
    token_logprobs = logprobs_data.token_logprobs
    top_logprobs = logprobs_data.top_logprobs
    
    print(f"Number of tokens: {len(tokens)}")
    
    # Prepare output files
    results_dir = Path("results")
    results_dir.mkdir(exist_ok=True)
    
    csv_file = results_dir / f"{text_name}_{model.replace('.', '_')}_analysis.csv"
    
    # Process token by token
    total_bits = 0
    detailed_data = []
    
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Header
        writer.writerow([
            'Position', 'Token', 'Logprob', 'Probability', 'Surprisal_Bits',
            'Top1_Token', 'Top1_Logprob', 'Top2_Token', 'Top2_Logprob',
            'Top3_Token', 'Top3_Logprob', 'Top4_Token', 'Top4_Logprob',
            'Top5_Token', 'Top5_Logprob', 'Top6_Token', 'Top6_Logprob',
            'Top7_Token', 'Top7_Logprob', 'Top8_Token', 'Top8_Logprob',
            'Top9_Token', 'Top9_Logprob', 'Top10_Token', 'Top10_Logprob'
        ])
        
        for i, (token, logprob) in enumerate(zip(tokens, token_logprobs)):
            if logprob is None:  # First token has None logprob
                continue
                
            # Convert log probability to bits
            probability = math.exp(logprob)
            surprisal_bits = -logprob / math.log(2)  # Convert from ln to log2
            total_bits += surprisal_bits
            
            # Get top predictions for this position
            top_preds = top_logprobs[i] if i < len(top_logprobs) else {}
            
            # Build row
            row = [
                i,
                repr(token),
                f"{logprob:.6f}",
                f"{probability:.6f}",
                f"{surprisal_bits:.3f}"
            ]
            
            # Add top 10 predictions (pad with empty if less than 10)
            pred_items = list(top_preds.items())[:10]
            while len(pred_items) < 10:
                pred_items.append(("", None))
            
            for pred_token, pred_logprob in pred_items:
                row.extend([
                    repr(pred_token) if pred_token else "",
                    f"{pred_logprob:.6f}" if pred_logprob is not None else ""
                ])
            
            writer.writerow(row)
            
            # Store for analysis
            detailed_data.append({
                'position': i,
                'token': token,
                'surprisal': surprisal_bits,
                'probability': probability,
                'logprob': logprob
            })
    
    # Calculate summary
    num_tokens_with_logprobs = len(detailed_data)
    avg_bits_per_token = total_bits / num_tokens_with_logprobs if num_tokens_with_logprobs > 0 else 0
    bits_per_char = total_bits / len(text)
    compression_ratio = 8.0 / bits_per_char if bits_per_char > 0 else 0
    
    summary = {
        'text_name': text_name,
        'text_path': str(text_path),
        'text_length': len(text),
        'num_tokens': len(tokens),
        'num_tokens_with_logprobs': num_tokens_with_logprobs,
        'total_bits': total_bits,
        'bits_per_token': avg_bits_per_token,
        'bits_per_char': bits_per_char,
        'compression_ratio': compression_ratio,
        'model': model,
        'timestamp': datetime.now().isoformat()
    }
    
    # Save summary
    json_file = results_dir / f"{text_name}_{model.replace('.', '_')}_summary.json"
    with open(json_file, 'w') as f:
        json.dump(summary, f, indent=2)
    
    # Print results
    print(f"\n{model} Analysis Results for {text_name}:")
    print(f"  Total bits: {total_bits:.0f}")
    print(f"  Bits per token: {avg_bits_per_token:.2f}")
    print(f"  Bits per character: {bits_per_char:.2f}")
    print(f"  Compression ratio: {compression_ratio:.1f}x")
    
    # Show most/least surprising tokens
    if detailed_data:
        sorted_data = sorted(detailed_data, key=lambda x: x['surprisal'])
        
        print(f"\nMost predictable tokens:")
        for i, token_data in enumerate(sorted_data[:3]):
            print(f"  {i+1}. {repr(token_data['token'])} "
                  f"({token_data['surprisal']:.2f} bits, P={token_data['probability']:.4f})")
        
        print(f"\nMost surprising tokens:")
        for i, token_data in enumerate(sorted_data[-3:]):
            print(f"  {i+1}. {repr(token_data['token'])} "
                  f"({token_data['surprisal']:.2f} bits, P={token_data['probability']:.4f})")
    
    print(f"\nFiles saved:")
    print(f"  CSV: {csv_file}")
    print(f"  JSON: {json_file}")
    
    return summary

def main():
    """Main function."""
    
    if len(sys.argv) != 2:
        print("Usage: python analyze_openai_logprobs.py <text_file.txt>")
        sys.exit(1)
    
    text_file = Path(sys.argv[1])
    if not text_file.exists():
        print(f"Error: File not found: {text_file}")
        sys.exit(1)
    
    # Load OpenAI client
    client = load_client()
    
    # Analyze text
    try:
        summary = analyze_text_openai(text_file, client)
        if summary:
            print("\n" + "="*60)
            print("Analysis complete!")
    except Exception as e:
        print(f"Error during analysis: {e}")

if __name__ == "__main__":
    main()