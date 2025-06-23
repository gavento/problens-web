#!/usr/bin/env python3
"""
Advanced Zstd dictionary-based compression analysis for programming languages.
This implements proper dictionary training and cross-compression analysis.
"""

import os
import json
import numpy as np
import zstandard as zstd
from collections import defaultdict
import math
import argparse
from pathlib import Path
import tempfile

class ZstdDictionaryAnalyzer:
    def __init__(self, data_dir="data/programming_languages"):
        self.data_dir = Path(data_dir)
        self.languages = []
        self.language_data = {}
        self.load_languages()
    
    def load_languages(self):
        """Load available programming languages"""
        self.languages = []
        for file_path in self.data_dir.glob("*_consolidated.txt"):
            lang = file_path.stem.replace("_consolidated", "")
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
    
    def train_dictionary(self, samples_data, dict_size=64*1024):
        """Train a Zstd dictionary from sample data"""
        # Convert text data to bytes
        samples_bytes = [data.encode('utf-8') for data in samples_data]
        
        # Train dictionary using the correct API
        dict_bytes = zstd.train_dictionary(dict_size, samples_bytes)
        
        return dict_bytes
    
    def compress_with_dictionary(self, data, dict_bytes=None):
        """Compress data with optional dictionary"""
        data_bytes = data.encode('utf-8') if isinstance(data, str) else data
        
        if dict_bytes:
            zstd_dict = zstd.ZstdCompressionDict(dict_bytes)
            compressor = zstd.ZstdCompressor(dict_data=zstd_dict, level=3)
        else:
            compressor = zstd.ZstdCompressor(level=3)
        
        return compressor.compress(data_bytes)
    
    def analyze_single_language_dictionaries(self, dict_size=64*1024):
        """
        Train a dictionary for each language and measure how well
        it compresses other languages.
        """
        print(f"\nAnalyzing single-language dictionaries (dict size: {dict_size//1024}KB)...")
        
        results = {
            'languages': self.languages,
            'dictionary_sizes': {},
            'compression_matrix': {},
            'compression_ratios': {},
            'distance_matrix': {}
        }
        
        # Train dictionary for each language
        language_dictionaries = {}
        
        for lang in self.languages:
            print(f"  Training dictionary for {lang}...")
            try:
                # Use the language's own data as training sample
                samples = [self.language_data[lang]]
                dict_bytes = self.train_dictionary(samples, dict_size)
                language_dictionaries[lang] = dict_bytes
                results['dictionary_sizes'][lang] = len(dict_bytes)
                
                print(f"    Dictionary size: {len(dict_bytes)} bytes")
            except Exception as e:
                print(f"    Error training dictionary for {lang}: {e}")
                continue
        
        # Test compression of each language with each dictionary
        for dict_lang in language_dictionaries:
            results['compression_matrix'][dict_lang] = {}
            results['compression_ratios'][dict_lang] = {}
            
            print(f"  Testing {dict_lang} dictionary on all languages...")
            
            for target_lang in self.languages:
                try:
                    # Compress target language with dictionary
                    original_size = len(self.language_data[target_lang].encode('utf-8'))
                    compressed = self.compress_with_dictionary(
                        self.language_data[target_lang], 
                        language_dictionaries[dict_lang]
                    )
                    compressed_size = len(compressed)
                    
                    # Also compress without dictionary for baseline
                    baseline_compressed = self.compress_with_dictionary(
                        self.language_data[target_lang], 
                        None
                    )
                    baseline_size = len(baseline_compressed)
                    
                    # Store results
                    results['compression_matrix'][dict_lang][target_lang] = compressed_size
                    
                    # Compression ratio: smaller is better
                    ratio = compressed_size / original_size
                    baseline_ratio = baseline_size / original_size
                    
                    results['compression_ratios'][dict_lang][target_lang] = {
                        'with_dict': ratio,
                        'without_dict': baseline_ratio,
                        'improvement': baseline_ratio - ratio,  # Positive means dictionary helped
                        'original_size': original_size,
                        'compressed_size': compressed_size,
                        'baseline_size': baseline_size
                    }
                    
                    print(f"    {target_lang}: {ratio:.3f} (vs {baseline_ratio:.3f} baseline)")
                    
                except Exception as e:
                    print(f"    Error compressing {target_lang} with {dict_lang} dict: {e}")
        
        # Calculate distance matrix using Normalized Compression Distance (NCD)
        print("  Calculating NCD distance matrix...")
        for lang1 in self.languages:
            results['distance_matrix'][lang1] = {}
            for lang2 in self.languages:
                if lang1 == lang2:
                    results['distance_matrix'][lang1][lang2] = 0.0
                else:
                    # NCD formula: (C(x|y) + C(y|x) - C(x) - C(y)) / (2 * max(C(x), C(y)))
                    # where C(x|y) is size when compressing x with dictionary trained on y
                    
                    try:
                        # Get compression sizes
                        c_x = results['compression_ratios'][lang1][lang1]['compressed_size']  # lang1 with its own dict
                        c_y = results['compression_ratios'][lang2][lang2]['compressed_size']  # lang2 with its own dict
                        c_x_given_y = results['compression_ratios'][lang2][lang1]['compressed_size']  # lang1 with lang2's dict
                        c_y_given_x = results['compression_ratios'][lang1][lang2]['compressed_size']  # lang2 with lang1's dict
                        
                        # Normalized Compression Distance
                        numerator = c_x_given_y + c_y_given_x - c_x - c_y
                        denominator = 2 * max(c_x, c_y)
                        
                        if denominator > 0:
                            ncd = numerator / denominator
                            # Clamp to [0, 1] range
                            ncd = max(0.0, min(1.0, ncd))
                        else:
                            ncd = 1.0
                        
                        results['distance_matrix'][lang1][lang2] = ncd
                    except Exception as e:
                        print(f"    Error calculating NCD for {lang1}-{lang2}: {e}")
                        results['distance_matrix'][lang1][lang2] = 1.0
        
        return results
    
    def analyze_universal_dictionary(self, dict_size=128*1024):
        """
        Train a single universal dictionary on all languages and measure
        individual compression performance.
        """
        print(f"\nAnalyzing universal dictionary (dict size: {dict_size//1024}KB)...")
        
        # Combine all language data for training
        all_samples = list(self.language_data.values())
        print(f"  Training on {len(all_samples)} language samples...")
        
        universal_dict = self.train_dictionary(all_samples, dict_size)
        print(f"  Universal dictionary size: {len(universal_dict)} bytes")
        
        results = {
            'languages': self.languages,
            'dictionary_size': len(universal_dict),
            'compression_ratios': {},
        }
        
        # Test compression of each language with universal dictionary
        for lang in self.languages:
            try:
                original_size = len(self.language_data[lang].encode('utf-8'))
                
                # Compress with universal dictionary
                compressed = self.compress_with_dictionary(self.language_data[lang], universal_dict)
                compressed_size = len(compressed)
                
                # Compress without dictionary
                baseline_compressed = self.compress_with_dictionary(self.language_data[lang], None)
                baseline_size = len(baseline_compressed)
                
                ratio = compressed_size / original_size
                baseline_ratio = baseline_size / original_size
                improvement = baseline_ratio - ratio
                
                results['compression_ratios'][lang] = {
                    'with_dict': ratio,
                    'without_dict': baseline_ratio,
                    'improvement': improvement,
                    'original_size': original_size,
                    'compressed_size': compressed_size,
                    'baseline_size': baseline_size
                }
                
                print(f"  {lang}: {ratio:.3f} (vs {baseline_ratio:.3f} baseline, improvement: {improvement:.3f})")
                
            except Exception as e:
                print(f"  Error compressing {lang}: {e}")
        
        return results
    
    def run_full_analysis(self, single_dict_size=64*1024, universal_dict_size=128*1024):
        """Run complete Zstd dictionary analysis"""
        print("Starting comprehensive Zstd dictionary analysis...")
        
        # Load all data
        self.load_all_language_data()
        
        if not self.language_data:
            print("No language data loaded, aborting analysis")
            return None
        
        results = {
            'metadata': {
                'languages': self.languages,
                'num_languages': len(self.languages),
                'single_dict_size': single_dict_size,
                'universal_dict_size': universal_dict_size
            }
        }
        
        # Single-language dictionary analysis
        try:
            results['single_language_dicts'] = self.analyze_single_language_dictionaries(single_dict_size)
        except Exception as e:
            print(f"Single-language dictionary analysis failed: {e}")
            results['single_language_dicts'] = None
        
        # Universal dictionary analysis
        try:
            results['universal_dict'] = self.analyze_universal_dictionary(universal_dict_size)
        except Exception as e:
            print(f"Universal dictionary analysis failed: {e}")
            results['universal_dict'] = None
        
        # Save results
        output_path = self.data_dir / "zstd_dictionary_analysis.json"
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        # Also save to public directory for web widget
        public_dir = Path("public/data/programming_languages")
        public_dir.mkdir(parents=True, exist_ok=True)
        public_output_path = public_dir / "zstd_dictionary_analysis.json"
        with open(public_output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\nResults saved to {output_path}")
        print(f"Web-accessible copy saved to {public_output_path}")
        
        return results
    
    def print_summary(self, results):
        """Print summary of results"""
        if not results:
            return
        
        print("\n" + "="*60)
        print("ZSTD DICTIONARY ANALYSIS SUMMARY")
        print("="*60)
        
        # Single dictionary results
        if results.get('single_language_dicts'):
            single_results = results['single_language_dicts']
            print(f"\nSingle-Language Dictionaries:")
            print(f"Languages analyzed: {len(single_results['languages'])}")
            
            # Show most similar language pairs by NCD
            if 'distance_matrix' in single_results:
                distances = []
                for lang1 in single_results['languages']:
                    for lang2 in single_results['languages']:
                        if lang1 < lang2:  # Avoid duplicates
                            dist = single_results['distance_matrix'][lang1][lang2]
                            distances.append((lang1, lang2, dist))
                
                distances.sort(key=lambda x: x[2])
                print("\nMost similar language pairs (by NCD):")
                for lang1, lang2, dist in distances[:10]:
                    print(f"  {lang1} ↔ {lang2}: {dist:.3f}")
                
                print("\nMost distant language pairs (by NCD):")
                for lang1, lang2, dist in distances[-10:]:
                    print(f"  {lang1} ↔ {lang2}: {dist:.3f}")
        
        # Universal dictionary results
        if results.get('universal_dict'):
            universal_results = results['universal_dict']
            print(f"\nUniversal Dictionary:")
            print(f"Dictionary size: {universal_results['dictionary_size']} bytes")
            
            # Show compression improvements
            improvements = []
            for lang, data in universal_results['compression_ratios'].items():
                improvements.append((lang, data['improvement']))
            
            improvements.sort(key=lambda x: x[1], reverse=True)
            print("\nLanguages benefiting most from universal dictionary:")
            for lang, improvement in improvements[:10]:
                print(f"  {lang}: {improvement:.3f} improvement")

def main():
    parser = argparse.ArgumentParser(description='Run Zstd dictionary-based language similarity analysis')
    parser.add_argument('--data-dir', default='data/programming_languages', help='Directory containing language data')
    parser.add_argument('--single-dict-size', type=int, default=64*1024, help='Size of single-language dictionaries')
    parser.add_argument('--universal-dict-size', type=int, default=128*1024, help='Size of universal dictionary')
    
    args = parser.parse_args()
    
    analyzer = ZstdDictionaryAnalyzer(args.data_dir)
    results = analyzer.run_full_analysis(args.single_dict_size, args.universal_dict_size)
    
    if results:
        analyzer.print_summary(results)

if __name__ == "__main__":
    main()