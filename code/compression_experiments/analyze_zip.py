#!/usr/bin/env python3
"""
ZIP/gzip compression analysis for text files.

This measures actual compression ratios using standard compression algorithms.
"""

import sys
import os
import json
import gzip
import zlib
import bz2
import lzma
from pathlib import Path
from datetime import datetime

def measure_compression(text, algorithm='gzip'):
    """
    Measure compression ratio for given text using specified algorithm.
    
    Returns: (compressed_bits, compression_ratio)
    """
    original_bytes = text.encode('utf-8')
    original_bits = len(original_bytes) * 8
    
    if algorithm == 'gzip':
        compressed = gzip.compress(original_bytes, compresslevel=9)
    elif algorithm == 'zlib':
        compressed = zlib.compress(original_bytes, level=9)
    elif algorithm == 'bz2':
        compressed = bz2.compress(original_bytes, compresslevel=9)
    elif algorithm == 'lzma':
        compressed = lzma.compress(original_bytes, preset=9)
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")
    
    compressed_bits = len(compressed) * 8
    compression_ratio = original_bits / compressed_bits
    
    return compressed_bits, compression_ratio

def analyze_text_file(text_path):
    """Analyze a text file with multiple compression algorithms."""
    
    # Read text
    with open(text_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    text_name = Path(text_path).stem
    print(f"\nAnalyzing: {text_name}")
    print(f"Text length: {len(text)} characters")
    print(f"Original size: {len(text) * 8} bits")
    
    # Test multiple algorithms
    algorithms = ['gzip', 'zlib', 'bz2', 'lzma']
    results = {}
    
    for algo in algorithms:
        compressed_bits, ratio = measure_compression(text, algo)
        results[algo] = {
            'compressed_bits': compressed_bits,
            'compression_ratio': ratio,
            'bits_per_char': compressed_bits / len(text)
        }
        
        print(f"\n{algo.upper()}:")
        print(f"  Compressed size: {compressed_bits} bits")
        print(f"  Compression ratio: {ratio:.2f}x")
        print(f"  Bits per character: {compressed_bits / len(text):.2f}")
    
    # Save results
    results_dir = Path("results")
    results_dir.mkdir(exist_ok=True)
    
    summary = {
        'text_name': text_name,
        'text_path': str(text_path),
        'text_length': len(text),
        'original_bits': len(text) * 8,
        'algorithms': results,
        'timestamp': datetime.now().isoformat()
    }
    
    json_file = results_dir / f"{text_name}_compression_summary.json"
    with open(json_file, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\nResults saved to: {json_file}")
    
    return summary

def main():
    """Main function."""
    
    if len(sys.argv) > 1:
        # Analyze specific files
        text_files = [Path(f) for f in sys.argv[1:]]
    else:
        # Analyze all text files
        texts_dir = Path("texts")
        if not texts_dir.exists():
            print("Error: texts/ directory not found")
            sys.exit(1)
        
        text_files = list(texts_dir.glob("*.txt"))
    
    if not text_files:
        print("No text files found to analyze")
        sys.exit(1)
    
    print(f"Analyzing {len(text_files)} text files with compression algorithms...")
    
    all_results = []
    
    for text_file in text_files:
        if not text_file.exists():
            print(f"Warning: File not found: {text_file}")
            continue
            
        try:
            result = analyze_text_file(text_file)
            all_results.append(result)
        except Exception as e:
            print(f"Error analyzing {text_file}: {e}")
    
    # Print summary comparison
    print("\n" + "="*80)
    print("COMPRESSION SUMMARY (gzip)")
    print("="*80)
    print(f"{'Text':<20} {'Original':<12} {'Compressed':<12} {'Ratio':<10} {'Bits/char':<10}")
    print("-"*80)
    
    for result in sorted(all_results, key=lambda x: x['algorithms']['gzip']['compression_ratio'], reverse=True):
        name = result['text_name']
        orig = result['original_bits']
        comp = result['algorithms']['gzip']['compressed_bits']
        ratio = result['algorithms']['gzip']['compression_ratio']
        bpc = result['algorithms']['gzip']['bits_per_char']
        
        print(f"{name:<20} {orig:<12} {comp:<12} {ratio:<10.2f}x {bpc:<10.2f}")
    
    # Save combined results
    results_dir = Path("results")
    combined_file = results_dir / "all_compression_results.json"
    with open(combined_file, 'w') as f:
        json.dump({
            'results': all_results,
            'timestamp': datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\nCombined results saved to: {combined_file}")

if __name__ == "__main__":
    main()