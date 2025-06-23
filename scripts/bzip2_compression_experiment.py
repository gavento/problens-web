#!/usr/bin/env python3
"""
BZip2-based compression analysis.
Uses bzip2's incremental compression to measure language similarity.
"""

import os
import json
import bz2
import numpy as np
from collections import defaultdict
import argparse
from pathlib import Path

class BZip2CompressionAnalyzer:
    def __init__(self, data_dir="data/programming_languages"):
        self.data_dir = Path(data_dir)
        self.languages = []
        self.language_data = {}
        self.load_languages()
    
    def load_languages(self):
        """Load available programming languages"""
        excluded_languages = {'apl', 'erlang', 'elixir', 'fsharp', 'kotlin', 'swift'}
        
        self.languages = []
        for file_path in self.data_dir.glob("*_consolidated.txt"):
            lang = file_path.stem.replace("_consolidated", "")
            if lang not in excluded_languages:
                self.languages.append(lang)
        
        print(f"Found {len(self.languages)} languages: {', '.join(self.languages)}")
    
    def load_language_data(self, language):
        """Load code data for a specific language"""
        file_path = self.data_dir / f"{language}_consolidated.txt"
        if not file_path.exists():
            raise FileNotFoundError(f"No data found for language: {language}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    def load_all_language_data(self):
        """Load all language data into memory"""
        print("Loading all language data...")
        for lang in self.languages:
            try:
                self.language_data[lang] = self.load_language_data(lang)
                size_kb = len(self.language_data[lang]) / 1024
                print(f"  {lang}: {size_kb:.1f} KB")
            except Exception as e:
                print(f"  Error loading {lang}: {e}")
                if lang in self.languages:
                    self.languages.remove(lang)
    
    def compress_bz2(self, data, level=9):
        """Compress data using bzip2"""
        data_bytes = data.encode('utf-8') if isinstance(data, str) else data
        return bz2.compress(data_bytes, compresslevel=level)
    
    def analyze_incremental_compression(self):
        """
        Analyze compression using incremental approach:
        - Compress A
        - Compress B
        - Compress A+B
        - Measure how much additional space B needs when A is already known
        """
        print(f"\nAnalyzing BZip2 incremental compression...")
        
        results = {
            'languages': self.languages,
            'method': 'bzip2_incremental',
            'baseline_sizes': {},
            'incremental_compression': {},
            'compression_benefits': {},
            'distance_matrix': {}
        }
        
        # Get baseline compression sizes
        print("  Computing baseline compression...")
        for lang in self.languages:
            try:
                data = self.language_data[lang]
                original_size = len(data.encode('utf-8'))
                compressed = self.compress_bz2(data)
                compressed_size = len(compressed)
                
                results['baseline_sizes'][lang] = {
                    'original': original_size,
                    'compressed': compressed_size,
                    'ratio': compressed_size / original_size
                }
                
                print(f"    {lang}: {original_size} → {compressed_size} bytes ({compressed_size/original_size:.3f})")
                
            except Exception as e:
                print(f"    Error with {lang}: {e}")
        
        # Test incremental compression
        print("  Testing incremental compression...")
        for lang1 in self.languages:
            results['incremental_compression'][lang1] = {}
            results['compression_benefits'][lang1] = {}
            
            for lang2 in self.languages:
                try:
                    if lang1 == lang2:
                        # Self-compression: use first half to compress second half
                        data = self.language_data[lang1]
                        mid = len(data) // 2
                        first_half = data[:mid]
                        second_half = data[mid:]
                        
                        # Baseline: compress second half alone
                        baseline = self.compress_bz2(second_half)
                        baseline_size = len(baseline)
                        
                        # Incremental: compress both halves together
                        combined = self.compress_bz2(first_half + "\n\n" + second_half)
                        combined_size = len(combined)
                        first_compressed = self.compress_bz2(first_half)
                        first_size = len(first_compressed)
                        
                        # Incremental cost of second half
                        incremental_size = combined_size - first_size
                        
                    else:
                        # Cross-compression
                        data1 = self.language_data[lang1]
                        data2 = self.language_data[lang2]
                        
                        # Truncate to same size
                        min_len = min(len(data1), len(data2))
                        data1 = data1[:min_len]
                        data2 = data2[:min_len]
                        
                        # Baseline: compress lang2 alone
                        baseline = self.compress_bz2(data2)
                        baseline_size = len(baseline)
                        
                        # Incremental: compress lang1+lang2
                        combined = self.compress_bz2(data1 + "\n\n" + data2)
                        combined_size = len(combined)
                        lang1_compressed = self.compress_bz2(data1)
                        lang1_size = len(lang1_compressed)
                        
                        # Incremental cost of lang2 given lang1
                        incremental_size = combined_size - lang1_size
                    
                    # Calculate benefit ratio
                    if baseline_size > 0:
                        benefit_ratio = incremental_size / baseline_size
                    else:
                        benefit_ratio = 1.0
                    
                    results['incremental_compression'][lang1][lang2] = {
                        'baseline': baseline_size,
                        'incremental': incremental_size,
                        'benefit_ratio': benefit_ratio,
                        'bytes_saved': baseline_size - incremental_size,
                        'improvement': max(0, 1.0 - benefit_ratio)
                    }
                    
                    results['compression_benefits'][lang1][lang2] = benefit_ratio
                    
                except Exception as e:
                    print(f"    Error {lang1}→{lang2}: {e}")
                    results['compression_benefits'][lang1][lang2] = 1.0
        
        # Calculate distance matrix
        print("  Calculating distance matrix...")
        for lang1 in self.languages:
            results['distance_matrix'][lang1] = {}
            for lang2 in self.languages:
                if lang1 == lang2:
                    results['distance_matrix'][lang1][lang2] = 0.0
                else:
                    # Get benefit ratios both ways
                    ratio_12 = results['compression_benefits'][lang1].get(lang2, 1.0)
                    ratio_21 = results['compression_benefits'][lang2].get(lang1, 1.0)
                    
                    # Convert to distance
                    # Ideal ratio for similar languages: ~0.5-0.7
                    # Normalize around 0.6 as the ideal
                    dist_12 = abs(ratio_12 - 0.6) / 0.4
                    dist_21 = abs(ratio_21 - 0.6) / 0.4
                    
                    # Symmetric distance
                    distance = (dist_12 + dist_21) / 2
                    results['distance_matrix'][lang1][lang2] = min(1.0, distance)
        
        return results
    
    def run_analysis(self):
        """Run complete BZip2 compression analysis"""
        print("Starting BZip2 compression analysis...")
        
        # Load all data
        self.load_all_language_data()
        
        if not self.language_data:
            print("No language data loaded, aborting analysis")
            return None
        
        # Run analysis
        results = self.analyze_incremental_compression()
        
        # Add metadata
        final_results = {
            'metadata': {
                'languages': self.languages,
                'num_languages': len(self.languages),
                'analysis_type': 'bzip2_compression'
            },
            'bzip2_compression': results
        }
        
        # Save results
        public_dir = Path("public/data/programming_languages")
        public_dir.mkdir(parents=True, exist_ok=True)
        output_path = public_dir / "bzip2_compression_analysis.json"
        with open(output_path, 'w') as f:
            json.dump(final_results, f, indent=2)
        
        print(f"\nResults saved to {output_path}")
        
        return final_results
    
    def print_summary(self, results):
        """Print summary of results"""
        if not results or 'bzip2_compression' not in results:
            return
        
        bz2_results = results['bzip2_compression']
        
        print("\n" + "="*60)
        print("BZIP2 COMPRESSION ANALYSIS SUMMARY")
        print("="*60)
        
        print(f"\nLanguages analyzed: {len(bz2_results['languages'])}")
        
        # Show most similar pairs
        if 'distance_matrix' in bz2_results:
            distances = []
            for lang1 in bz2_results['languages']:
                for lang2 in bz2_results['languages']:
                    if lang1 < lang2:
                        dist = bz2_results['distance_matrix'][lang1][lang2]
                        distances.append((lang1, lang2, dist))
            
            distances.sort(key=lambda x: x[2])
            print("\nMost similar language pairs (by BZip2 incremental compression):")
            for lang1, lang2, dist in distances[:15]:
                # Get compression benefits
                data_12 = bz2_results['incremental_compression'][lang1][lang2]
                data_21 = bz2_results['incremental_compression'][lang2][lang1]
                print(f"  {lang1} ↔ {lang2}: {dist:.4f} (benefits: {data_12['improvement']:.1%}, {data_21['improvement']:.1%})")
            
            print("\nMost distant language pairs:")
            for lang1, lang2, dist in distances[-10:]:
                data_12 = bz2_results['incremental_compression'][lang1][lang2]
                data_21 = bz2_results['incremental_compression'][lang2][lang1]
                print(f"  {lang1} ↔ {lang2}: {dist:.4f} (benefits: {data_12['improvement']:.1%}, {data_21['improvement']:.1%})")

def main():
    parser = argparse.ArgumentParser(description='Run BZip2 compression analysis')
    parser.add_argument('--data-dir', default='data/programming_languages')
    
    args = parser.parse_args()
    
    analyzer = BZip2CompressionAnalyzer(args.data_dir)
    results = analyzer.run_analysis()
    
    if results:
        analyzer.print_summary(results)

if __name__ == "__main__":
    main()