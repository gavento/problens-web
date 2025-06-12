#!/usr/bin/env python3
"""
Visualize compression experiment results.

Creates bar charts and comparison tables from results JSON files.
"""

import json
import os
from pathlib import Path

RESULTS_DIR = Path("results")

def load_results(filename="llm_compression_results.json"):
    """Load results from JSON file."""
    filepath = RESULTS_DIR / filename
    if not filepath.exists():
        print(f"No results file found at {filepath}")
        return None
        
    with open(filepath, 'r') as f:
        return json.load(f)

def print_comparison_table(results_data):
    """Print a formatted comparison table."""
    if not results_data or 'results' not in results_data:
        return
        
    results = results_data['results']
    
    print(f"\nCompression Results ({results_data['model']})")
    print(f"Generated: {results_data['timestamp']}")
    print("="*80)
    print(f"{'Text':<15} {'Length':<10} {'Tokens':<10} {'Bits/Char':<12} {'Compression':<12}")
    print("-"*80)
    
    for r in sorted(results, key=lambda x: x['compression_ratio'], reverse=True):
        print(f"{r['text_name']:<15} "
              f"{r['text_length']:<10} "
              f"{r['num_tokens']:<10} "
              f"{r['bits_per_char']:<12.2f} "
              f"{r['compression_ratio']:<12.1f}x")
    
    print("="*80)

def generate_widget_format(results_data):
    """Generate code for updating CompressionWidget."""
    if not results_data or 'results' not in results_data:
        return
        
    print("\n\nFor CompressionWidget update:")
    print("-"*60)
    
    for r in results_data['results']:
        print(f"\n// {r['text_name'].replace('_', ' ').title()}")
        print(f"{{ ")
        print(f'  algorithm: "LLM ({results_data["model"].upper()})", ')
        print(f'  bits: {int(r["total_bits"])}, ')
        print(f'  ratio: "{r["compression_ratio"]:.1f}x", ')
        print(f'  generalDescription: "Use language model probabilities for next token prediction", ')
        print(f'  specificDescription: "Actual {results_data["model"].upper()} measurement on this text"')
        print(f"}},")

def main():
    """Load and visualize results."""
    # Load LLM results
    llm_results = load_results("llm_compression_results.json")
    
    if llm_results:
        print_comparison_table(llm_results)
        generate_widget_format(llm_results)
    else:
        print("No LLM compression results found.")
        print("Run 'python run_llm_compression.py' first.")

if __name__ == "__main__":
    main()