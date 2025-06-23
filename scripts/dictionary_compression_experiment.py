#!/usr/bin/env python3
"""
Dictionary-based compression analysis using zlib with custom dictionaries.
Train a dictionary on language A, then compress language B with that dictionary.
"""

import os
import json
import numpy as np
import zlib
from collections import defaultdict
import math
import argparse
from pathlib import Path

class DictionaryCompressionAnalyzer:
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
    
    def compress_with_dictionary(self, data, dictionary_data=None):
        """
        Compress data using zlib with optional dictionary.
        If dictionary_data is provided, use it as compression context.
        """
        data_bytes = data.encode('utf-8') if isinstance(data, str) else data
        
        if dictionary_data is None:
            # Regular compression without dictionary
            return zlib.compress(data_bytes)
        else:
            # Compress with dictionary
            dict_bytes = dictionary_data.encode('utf-8') if isinstance(dictionary_data, str) else dictionary_data
            
            # Create compressor with dictionary
            compressor = zlib.compressobj(level=6, wbits=15)
            
            # "Prime" the compressor with dictionary data
            # We do this by compressing the dictionary first, then the actual data
            compressor.compress(dict_bytes)
            compressed_data = compressor.compress(data_bytes)
            compressed_data += compressor.flush()
            
            return compressed_data
    
    def analyze_dictionary_compression(self):
        """
        Analyze compression using each language as a dictionary for others.
        The idea: if language A is similar to B, then using A as a dictionary
        should compress B better than compressing B without context.
        """
        print(f"\nAnalyzing dictionary-based compression...")
        
        results = {
            'languages': self.languages,
            'method': 'dictionary_compression',
            'baseline_sizes': {},
            'dictionary_sizes': {},
            'compression_ratios': {},
            'distance_matrix': {}
        }
        
        # First, get baseline compression sizes (no dictionary)
        print("  Computing baseline compression sizes...")
        for lang in self.languages:
            try:
                data = self.language_data[lang]
                original_size = len(data.encode('utf-8'))
                compressed = self.compress_with_dictionary(data, dictionary_data=None)
                compressed_size = len(compressed)
                
                results['baseline_sizes'][lang] = {
                    'original': original_size,
                    'compressed': compressed_size,
                    'ratio': compressed_size / original_size
                }
                
                print(f"    {lang}: {original_size} → {compressed_size} bytes ({compressed_size/original_size:.3f})")
                
            except Exception as e:
                print(f"    Error with {lang}: {e}")
        
        # Now test dictionary-based compression for all pairs
        print("  Testing dictionary-based compression...")
        for dict_lang in self.languages:
            results['dictionary_sizes'][dict_lang] = {}
            results['compression_ratios'][dict_lang] = {}
            
            print(f"    Using {dict_lang} as dictionary...")
            
            for target_lang in self.languages:
                try:
                    if dict_lang == target_lang:
                        # Self-compression: use half the data as dictionary, compress the other half
                        data = self.language_data[target_lang]
                        mid_point = len(data) // 2
                        dict_data = data[:mid_point]
                        target_data = data[mid_point:]
                        
                        # Baseline: compress second half without dictionary
                        baseline_compressed = self.compress_with_dictionary(target_data, dictionary_data=None)
                        baseline_size = len(baseline_compressed)
                        
                        # With dictionary: compress second half using first half as dictionary
                        dict_compressed = self.compress_with_dictionary(target_data, dictionary_data=dict_data)
                        dict_size = len(dict_compressed)
                        
                    else:
                        # Cross-compression: use dict_lang as dictionary for target_lang
                        dict_data = self.language_data[dict_lang]
                        target_data = self.language_data[target_lang]
                        
                        # Truncate to same size for fair comparison
                        min_length = min(len(dict_data), len(target_data))
                        dict_data_truncated = dict_data[:min_length]
                        target_data_truncated = target_data[:min_length]
                        
                        # Baseline: compress target without dictionary
                        baseline_compressed = self.compress_with_dictionary(target_data_truncated, dictionary_data=None)
                        baseline_size = len(baseline_compressed)
                        
                        # With dictionary: compress target using dict as context
                        dict_compressed = self.compress_with_dictionary(target_data_truncated, dictionary_data=dict_data_truncated)
                        dict_size = len(dict_compressed)
                    
                    # Calculate compression ratio (with dict / without dict)
                    if baseline_size > 0:
                        compression_ratio = dict_size / baseline_size
                    else:
                        compression_ratio = 1.0
                    
                    results['dictionary_sizes'][dict_lang][target_lang] = {
                        'baseline_size': baseline_size,
                        'dictionary_size': dict_size,
                        'compression_ratio': compression_ratio,
                        'bytes_saved': baseline_size - dict_size
                    }
                    
                    results['compression_ratios'][dict_lang][target_lang] = compression_ratio
                    
                except Exception as e:
                    print(f"      Error with {dict_lang}→{target_lang}: {e}")
                    results['compression_ratios'][dict_lang][target_lang] = 1.0
        
        # Calculate distance matrix
        print("  Calculating distance matrix...")
        for lang1 in self.languages:
            results['distance_matrix'][lang1] = {}
            for lang2 in self.languages:
                if lang1 == lang2:
                    results['distance_matrix'][lang1][lang2] = 0.0
                else:
                    # Get compression ratios in both directions
                    ratio_12 = results['compression_ratios'][lang1].get(lang2, 1.0)  # lang1 as dict for lang2
                    ratio_21 = results['compression_ratios'][lang2].get(lang1, 1.0)  # lang2 as dict for lang1
                    
                    # Convert to distances: lower ratio = better compression = more similar
                    # Use (1 - ratio) so that ratio=0.5 gives distance=0.5, ratio=1.0 gives distance=0.0
                    dist_12 = max(0.0, 1.0 - ratio_12)
                    dist_21 = max(0.0, 1.0 - ratio_21)
                    
                    # Symmetric distance (average of both directions)
                    symmetric_distance = (dist_12 + dist_21) / 2
                    results['distance_matrix'][lang1][lang2] = symmetric_distance
        
        return results
    
    def run_analysis(self):
        """Run complete dictionary-based compression analysis"""
        print("Starting dictionary-based compression analysis...")
        
        # Load all data
        self.load_all_language_data()
        
        if not self.language_data:
            print("No language data loaded, aborting analysis")
            return None
        
        # Run dictionary compression analysis
        results = self.analyze_dictionary_compression()
        
        # Add metadata
        final_results = {
            'metadata': {
                'languages': self.languages,
                'num_languages': len(self.languages),
                'analysis_type': 'dictionary_compression'
            },
            'dictionary_compression': results
        }
        
        # Save results only to public directory
        public_dir = Path("public/data/programming_languages")
        public_dir.mkdir(parents=True, exist_ok=True)
        output_path = public_dir / "dictionary_compression_analysis.json"
        with open(output_path, 'w') as f:
            json.dump(final_results, f, indent=2)
        
        print(f"\nResults saved to {output_path}")
        
        return final_results
    
    def print_summary(self, results):
        """Print summary of results"""
        if not results or 'dictionary_compression' not in results:
            return
        
        dict_results = results['dictionary_compression']
        
        print("\n" + "="*60)
        print("DICTIONARY COMPRESSION ANALYSIS SUMMARY")
        print("="*60)
        
        print(f"\nLanguages analyzed: {len(dict_results['languages'])}")
        
        # Show baseline compression ratios
        print("\nBaseline compression ratios (no dictionary):")
        if 'baseline_sizes' in dict_results:
            ratios = [(lang, data['ratio']) for lang, data in dict_results['baseline_sizes'].items()]
            ratios.sort(key=lambda x: x[1])
            
            for lang, ratio in ratios[:10]:
                print(f"  {lang}: {ratio:.3f}")
        
        # Show most similar language pairs
        if 'distance_matrix' in dict_results:
            distances = []
            for lang1 in dict_results['languages']:
                for lang2 in dict_results['languages']:
                    if lang1 < lang2:  # Avoid duplicates
                        dist = dict_results['distance_matrix'][lang1][lang2]
                        distances.append((lang1, lang2, dist))
            
            distances.sort(key=lambda x: x[2], reverse=True)  # Sort by distance (highest = most similar)
            print("\nMost similar language pairs (by dictionary compression):")
            for lang1, lang2, dist in distances[:10]:
                print(f"  {lang1} ↔ {lang2}: {dist:.4f}")
            
            print("\nMost distant language pairs:")
            for lang1, lang2, dist in distances[-10:]:
                print(f"  {lang1} ↔ {lang2}: {dist:.4f}")

def main():
    parser = argparse.ArgumentParser(description='Run dictionary-based compression language similarity analysis')
    parser.add_argument('--data-dir', default='data/programming_languages', help='Directory containing language data')
    
    args = parser.parse_args()
    
    analyzer = DictionaryCompressionAnalyzer(args.data_dir)
    results = analyzer.run_analysis()
    
    if results:
        analyzer.print_summary(results)

if __name__ == "__main__":
    main()