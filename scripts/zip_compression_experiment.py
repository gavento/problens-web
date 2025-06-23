#!/usr/bin/env python3
"""
ZIP/zlib-based compression analysis for programming languages.
This uses concatenation-based similarity without requiring dictionary training.
"""

import os
import json
import numpy as np
import zlib
import gzip
from collections import defaultdict
import math
import argparse
from pathlib import Path

class ZipCompressionAnalyzer:
    def __init__(self, data_dir="data/programming_languages"):
        self.data_dir = Path(data_dir)
        self.languages = []
        self.language_data = {}
        self.load_languages()
    
    def load_languages(self):
        """Load available programming languages"""
        # Languages to exclude
        excluded_languages = {'apl', 'erlang', 'elixir', 'fsharp', 'kotlin', 'swift'}
        
        self.languages = []
        for file_path in self.data_dir.glob("*_consolidated.txt"):
            lang = file_path.stem.replace("_consolidated", "")
            if lang not in excluded_languages:
                self.languages.append(lang)
        
        print(f"Found {len(self.languages)} languages: {', '.join(self.languages)}")
        if excluded_languages:
            found_excluded = excluded_languages.intersection(set(file_path.stem.replace("_consolidated", "") for file_path in self.data_dir.glob("*_consolidated.txt")))
            if found_excluded:
                print(f"Excluded languages: {', '.join(found_excluded)}")
    
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
    
    def compress_zlib(self, data, level=6):
        """Compress data using zlib"""
        data_bytes = data.encode('utf-8') if isinstance(data, str) else data
        return zlib.compress(data_bytes, level=level)
    
    def compress_gzip(self, data, level=6):
        """Compress data using gzip"""
        data_bytes = data.encode('utf-8') if isinstance(data, str) else data
        return gzip.compress(data_bytes, compresslevel=level)
    
    def analyze_concatenation_compression(self, compression_func, method_name):
        """
        Analyze compression similarity using concatenation approach.
        The idea: if lang A and lang B are similar, concatenating A+B should
        compress better than compressing A and B separately.
        """
        print(f"\nAnalyzing {method_name} concatenation compression...")
        
        results = {
            'languages': self.languages,
            'method': method_name,
            'compression_sizes': {},
            'concatenation_sizes': {},
            'compression_ratios': {},
            'distance_matrix': {}
        }
        
        # First, compress each language individually
        print("  Compressing individual languages...")
        for lang in self.languages:
            try:
                original_size = len(self.language_data[lang].encode('utf-8'))
                compressed = compression_func(self.language_data[lang])
                compressed_size = len(compressed)
                
                results['compression_sizes'][lang] = {
                    'original': original_size,
                    'compressed': compressed_size,
                    'ratio': compressed_size / original_size
                }
                
                print(f"    {lang}: {original_size} → {compressed_size} bytes ({compressed_size/original_size:.3f})")
                
            except Exception as e:
                print(f"    Error compressing {lang}: {e}")
        
        # Now test concatenation compression for all pairs
        print("  Testing concatenation compression...")
        for lang1 in self.languages:
            results['concatenation_sizes'][lang1] = {}
            results['compression_ratios'][lang1] = {}
            
            for lang2 in self.languages:
                try:
                    # Truncate to shorter length for fair comparison
                    data1 = self.language_data[lang1]
                    data2 = self.language_data[lang2]
                    
                    # Find the shorter length and truncate both to that size
                    min_length = min(len(data1), len(data2))
                    data1_truncated = data1[:min_length]
                    data2_truncated = data2[:min_length]
                    
                    # Concatenate truncated data
                    concatenated = data1_truncated + "\n\n" + data2_truncated
                    concat_original_size = len(concatenated.encode('utf-8'))
                    concat_compressed = compression_func(concatenated)
                    concat_compressed_size = len(concat_compressed)
                    
                    # Expected size if compressed separately (using truncated data)
                    compressed1_truncated = compression_func(data1_truncated)
                    compressed2_truncated = compression_func(data2_truncated)
                    separate_size = len(compressed1_truncated) + len(compressed2_truncated)
                    
                    # Compression benefit ratio: lower is better (more similar)
                    if separate_size > 0:
                        benefit_ratio = concat_compressed_size / separate_size
                    else:
                        benefit_ratio = 1.0
                    
                    results['concatenation_sizes'][lang1][lang2] = {
                        'concat_original': concat_original_size,
                        'concat_compressed': concat_compressed_size,
                        'separate_compressed': separate_size,
                        'benefit_ratio': benefit_ratio,
                        'bytes_saved': separate_size - concat_compressed_size
                    }
                    
                    results['compression_ratios'][lang1][lang2] = benefit_ratio
                    
                except Exception as e:
                    print(f"    Error with {lang1}+{lang2}: {e}")
                    results['compression_ratios'][lang1][lang2] = 1.0
        
        # Calculate distance matrix using compression ratios
        print("  Calculating distance matrix...")
        for lang1 in self.languages:
            results['distance_matrix'][lang1] = {}
            for lang2 in self.languages:
                if lang1 == lang2:
                    results['distance_matrix'][lang1][lang2] = 0.0
                else:
                    # Symmetric distance based on compression benefit
                    ratio_12 = results['compression_ratios'][lang1].get(lang2, 1.0)
                    ratio_21 = results['compression_ratios'][lang2].get(lang1, 1.0)
                    
                    # Normalize around expected self-compression ratio (~0.5)
                    # Distance = how far the ratio is from the ideal 0.5, normalized
                    dist_12 = abs(ratio_12 - 0.5) / 0.5
                    dist_21 = abs(ratio_21 - 0.5) / 0.5
                    
                    # Symmetric distance
                    symmetric_distance = (dist_12 + dist_21) / 2
                    results['distance_matrix'][lang1][lang2] = symmetric_distance
        
        return results
    
    def analyze_cross_compression(self, compression_func, method_name):
        """
        Alternative approach: use each language as a 'prefix' to compress others.
        Similar to dictionary-based compression but simpler.
        """
        print(f"\nAnalyzing {method_name} cross-compression...")
        
        results = {
            'languages': self.languages,
            'method': method_name + '_cross',
            'compression_matrix': {},
            'distance_matrix': {}
        }
        
        # For each language pair, measure compression when using lang1 as prefix for lang2
        for lang1 in self.languages:
            results['compression_matrix'][lang1] = {}
            
            print(f"  Using {lang1} as compression context...")
            
            for lang2 in self.languages:
                try:
                    # Baseline: compress lang2 alone
                    baseline_compressed = compression_func(self.language_data[lang2])
                    baseline_size = len(baseline_compressed)
                    
                    # With context: compress lang1+lang2 together, measure total size
                    with_context = self.language_data[lang1] + "\n" + self.language_data[lang2]
                    context_compressed = compression_func(with_context)
                    context_size = len(context_compressed)
                    
                    # Estimate compression ratio for lang2 with lang1 context
                    # (This is approximate since we don't subtract lang1's contribution exactly)
                    lang1_size = len(compression_func(self.language_data[lang1]))
                    estimated_lang2_with_context = context_size - lang1_size
                    
                    # Avoid negative sizes
                    estimated_lang2_with_context = max(estimated_lang2_with_context, baseline_size * 0.1)
                    
                    if baseline_size > 0:
                        improvement_ratio = estimated_lang2_with_context / baseline_size
                    else:
                        improvement_ratio = 1.0
                    
                    results['compression_matrix'][lang1][lang2] = {
                        'baseline_size': baseline_size,
                        'with_context_size': estimated_lang2_with_context,
                        'improvement_ratio': improvement_ratio,
                        'bytes_saved': baseline_size - estimated_lang2_with_context
                    }
                    
                except Exception as e:
                    print(f"    Error with {lang1}→{lang2}: {e}")
                    results['compression_matrix'][lang1][lang2] = {
                        'improvement_ratio': 1.0
                    }
        
        # Calculate symmetric distance matrix
        for lang1 in self.languages:
            results['distance_matrix'][lang1] = {}
            for lang2 in self.languages:
                if lang1 == lang2:
                    results['distance_matrix'][lang1][lang2] = 0.0
                else:
                    ratio_12 = results['compression_matrix'][lang1][lang2]['improvement_ratio']
                    ratio_21 = results['compression_matrix'][lang2][lang1]['improvement_ratio']
                    
                    # Convert improvement ratios to distances
                    dist_12 = max(0.0, ratio_12 - 0.5)  # Adjusted baseline
                    dist_21 = max(0.0, ratio_21 - 0.5)
                    
                    symmetric_distance = (dist_12 + dist_21) / 2
                    results['distance_matrix'][lang1][lang2] = symmetric_distance
        
        return results
    
    def run_full_analysis(self):
        """Run complete ZIP/zlib compression analysis"""
        print("Starting comprehensive ZIP/zlib compression analysis...")
        
        # Load all data
        self.load_all_language_data()
        
        if not self.language_data:
            print("No language data loaded, aborting analysis")
            return None
        
        results = {
            'metadata': {
                'languages': self.languages,
                'num_languages': len(self.languages),
                'analysis_type': 'zip_compression'
            }
        }
        
        # Zlib concatenation analysis
        try:
            results['zlib_concat'] = self.analyze_concatenation_compression(
                self.compress_zlib, 'zlib'
            )
        except Exception as e:
            print(f"Zlib concatenation analysis failed: {e}")
            results['zlib_concat'] = None
        
        # Gzip concatenation analysis
        try:
            results['gzip_concat'] = self.analyze_concatenation_compression(
                self.compress_gzip, 'gzip'
            )
        except Exception as e:
            print(f"Gzip concatenation analysis failed: {e}")
            results['gzip_concat'] = None
        
        # Zlib cross-compression analysis
        try:
            results['zlib_cross'] = self.analyze_cross_compression(
                self.compress_zlib, 'zlib'
            )
        except Exception as e:
            print(f"Zlib cross-compression analysis failed: {e}")
            results['zlib_cross'] = None
        
        # Save results only to public directory
        public_dir = Path("public/data/programming_languages")
        public_dir.mkdir(parents=True, exist_ok=True)
        output_path = public_dir / "zip_compression_analysis.json"
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\nResults saved to {output_path}")
        
        return results
    
    def print_summary(self, results):
        """Print summary of results"""
        if not results:
            return
        
        print("\n" + "="*60)
        print("ZIP/ZLIB COMPRESSION ANALYSIS SUMMARY")
        print("="*60)
        
        # Show results from zlib concatenation analysis
        if results.get('zlib_concat'):
            concat_results = results['zlib_concat']
            print(f"\nZlib Concatenation Analysis:")
            print(f"Languages analyzed: {len(concat_results['languages'])}")
            
            # Show compression ratios for individual languages
            print("\nIndividual compression ratios:")
            ratios = [(lang, data['ratio']) for lang, data in concat_results['compression_sizes'].items()]
            ratios.sort(key=lambda x: x[1])
            
            for lang, ratio in ratios[:10]:
                print(f"  {lang}: {ratio:.3f}")
            
            # Show most similar language pairs
            if 'distance_matrix' in concat_results:
                distances = []
                for lang1 in concat_results['languages']:
                    for lang2 in concat_results['languages']:
                        if lang1 < lang2:  # Avoid duplicates
                            dist = concat_results['distance_matrix'][lang1][lang2]
                            distances.append((lang1, lang2, dist))
                
                distances.sort(key=lambda x: x[2])
                print("\nMost similar language pairs (by compression):")
                for lang1, lang2, dist in distances[:10]:
                    print(f"  {lang1} ↔ {lang2}: {dist:.4f}")
                
                print("\nMost distant language pairs:")
                for lang1, lang2, dist in distances[-10:]:
                    print(f"  {lang1} ↔ {lang2}: {dist:.4f}")

def main():
    parser = argparse.ArgumentParser(description='Run ZIP/zlib compression-based language similarity analysis')
    parser.add_argument('--data-dir', default='data/programming_languages', help='Directory containing language data')
    
    args = parser.parse_args()
    
    analyzer = ZipCompressionAnalyzer(args.data_dir)
    results = analyzer.run_full_analysis()
    
    if results:
        analyzer.print_summary(results)

if __name__ == "__main__":
    main()