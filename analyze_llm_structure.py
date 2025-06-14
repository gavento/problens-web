#!/usr/bin/env python3
"""
Analyze LLM compression experiment JSON structure
"""
import json
import os

def analyze_json_structure(filepath, model_name):
    print(f"\n=== Analysis of {model_name} ===")
    
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    print(f"Top-level experiments: {len(data)}")
    
    for exp_name, exp_data in data.items():
        print(f"\nExperiment: {exp_name}")
        print(f"  Name: {exp_data.get('name', 'N/A')}")
        print(f"  Filename: {exp_data.get('filename', 'N/A')}")
        print(f"  Description: {exp_data.get('description', 'N/A')}")
        print(f"  Total bits: {exp_data.get('bits', 'N/A')}")
        print(f"  Total tokens: {exp_data.get('tokens', 'N/A')}")
        print(f"  Bits per token: {exp_data.get('bits_per_token', 'N/A')}")
        
        # Analyze token structure
        detailed_tokens = exp_data.get('detailed_tokens', [])
        print(f"  Detailed tokens count: {len(detailed_tokens)}")
        
        if detailed_tokens:
            # Show first few tokens
            print("  First 5 tokens:")
            for i, token_data in enumerate(detailed_tokens[:5]):
                token = token_data.get('token', '')
                log2_prob = token_data.get('log2_prob', 0)
                print(f"    {i}: '{token}' (log2_prob: {log2_prob})")
            
            # Calculate character information
            total_chars = sum(len(token_data.get('token', '')) for token_data in detailed_tokens)
            total_bits = sum(token_data.get('log2_prob', 0) for token_data in detailed_tokens)
            
            print(f"  Total characters from tokens: {total_chars}")
            print(f"  Total bits from detailed tokens: {total_bits:.2f}")
            print(f"  Bits per character: {total_bits/total_chars:.4f}")
            
            # Check if we have character positions
            if 'char_start' in detailed_tokens[0] or 'char_pos' in detailed_tokens[0]:
                print("  ✓ Character position information available")
            else:
                print("  ✗ No explicit character position information")
                print("    Character positions must be calculated by cumulative token lengths")

def main():
    base_dir = "/home/vasek/problens-web/code/compression_experiments/llm_compression_data"
    
    files = [
        ("results_20250614_074947_llama-4-scout-17b.json", "Llama-4-Scout-17B"),
        ("results_20250614_074618_gpt-2.json", "GPT-2")
    ]
    
    for filename, model_name in files:
        filepath = os.path.join(base_dir, filename)
        if os.path.exists(filepath):
            analyze_json_structure(filepath, model_name)
        else:
            print(f"File not found: {filepath}")

if __name__ == "__main__":
    main()