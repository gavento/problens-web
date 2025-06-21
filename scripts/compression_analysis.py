#!/usr/bin/env python3
"""
Compression-based similarity analysis for programming languages.
"""

import os
import json
import numpy as np
import zstandard as zstd
import gzip
from collections import Counter, defaultdict
import math
import argparse
from pathlib import Path

class CompressionAnalyzer:
    def __init__(self, data_dir="data/programming_languages"):
        self.data_dir = Path(data_dir)
        self.languages = []
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
    
    def calculate_character_frequencies(self, text):
        """Calculate character frequency distribution"""
        counter = Counter(text)
        total = sum(counter.values())
        return {char: count / total for char, count in counter.items()}
    
    def kl_divergence(self, p_freq, q_freq):
        """Calculate KL divergence between two character frequency distributions"""
        # Get all characters that appear in either distribution
        all_chars = set(p_freq.keys()) | set(q_freq.keys())
        
        kl_div = 0.0
        for char in all_chars:
            p = p_freq.get(char, 1e-10)  # Small smoothing to avoid log(0)
            q = q_freq.get(char, 1e-10)
            
            if p > 0:
                kl_div += p * math.log2(p / q)
        
        return kl_div
    
    def cross_entropy(self, p_freq, q_freq):
        """Calculate cross-entropy between two distributions"""
        all_chars = set(p_freq.keys()) | set(q_freq.keys())
        
        cross_ent = 0.0
        for char in all_chars:
            p = p_freq.get(char, 1e-10)
            q = q_freq.get(char, 1e-10)
            
            if p > 0:
                cross_ent += p * (-math.log2(q))
        
        return cross_ent
    
    def entropy(self, freq):
        """Calculate entropy of a frequency distribution"""
        return sum(-p * math.log2(p) for p in freq.values() if p > 0)
    
    def baseline_compression_analysis(self):
        """Baseline analysis using character frequencies and KL divergence"""
        print("Running baseline compression analysis...")
        
        # Load all language data and calculate frequencies
        language_data = {}
        language_freqs = {}
        
        for lang in self.languages:
            try:
                data = self.load_language_data(lang)
                language_data[lang] = data
                language_freqs[lang] = self.calculate_character_frequencies(data)
                print(f"  Loaded {lang}: {len(data)} characters, entropy = {self.entropy(language_freqs[lang]):.3f}")
            except Exception as e:
                print(f"  Error loading {lang}: {e}")
        
        # Calculate distance matrix
        results = {
            'languages': list(language_freqs.keys()),
            'distance_matrix': {},
            'kl_matrix': {},
            'cross_entropy_matrix': {},
            'entropy_values': {}
        }
        
        for lang in language_freqs:
            results['entropy_values'][lang] = self.entropy(language_freqs[lang])
        
        for lang1 in language_freqs:
            results['distance_matrix'][lang1] = {}
            results['kl_matrix'][lang1] = {}
            results['cross_entropy_matrix'][lang1] = {}
            
            for lang2 in language_freqs:
                kl_12 = self.kl_divergence(language_freqs[lang1], language_freqs[lang2])
                kl_21 = self.kl_divergence(language_freqs[lang2], language_freqs[lang1])
                
                cross_ent_12 = self.cross_entropy(language_freqs[lang1], language_freqs[lang2])
                
                # Symmetrized distance
                symmetric_distance = (kl_12 + kl_21) / 2
                
                results['kl_matrix'][lang1][lang2] = kl_12
                results['cross_entropy_matrix'][lang1][lang2] = cross_ent_12
                results['distance_matrix'][lang1][lang2] = symmetric_distance
        
        return results
    
    def zstd_compression_analysis(self, dict_size=1024*16):
        """Zstandard dictionary-based compression analysis"""
        print("Running Zstd compression analysis...")
        
        # Load all language data
        language_data = {}
        for lang in self.languages:
            try:
                language_data[lang] = self.load_language_data(lang)
            except Exception as e:
                print(f"  Error loading {lang}: {e}")
        
        results = {
            'languages': list(language_data.keys()),
            'compression_ratios': {},
            'distance_matrix': {}
        }
        
        # Calculate compression ratios for each pair
        for lang1 in language_data:
            results['compression_ratios'][lang1] = {}
            
            # Train dictionary on lang1
            try:
                dict_data = zstd.train_dictionary(dict_size, [language_data[lang1].encode('utf-8')])
                compressor = zstd.ZstdCompressor(dict_data=dict_data)
                
                for lang2 in language_data:
                    # Compress lang2 using lang1's dictionary
                    original_size = len(language_data[lang2].encode('utf-8'))
                    compressed = compressor.compress(language_data[lang2].encode('utf-8'))
                    compressed_size = len(compressed)
                    
                    ratio = compressed_size / original_size
                    results['compression_ratios'][lang1][lang2] = ratio
                    
                print(f"  Trained dictionary for {lang1}")
                
            except Exception as e:
                print(f"  Error with {lang1}: {e}")
                results['compression_ratios'][lang1] = {lang2: 1.0 for lang2 in language_data}
        
        # Calculate symmetric distance matrix
        for lang1 in language_data:
            results['distance_matrix'][lang1] = {}
            for lang2 in language_data:
                ratio_12 = results['compression_ratios'][lang1].get(lang2, 1.0)
                ratio_21 = results['compression_ratios'][lang2].get(lang1, 1.0)
                
                # Symmetric distance (lower ratio = more similar)
                symmetric_distance = (ratio_12 + ratio_21) / 2
                results['distance_matrix'][lang1][lang2] = symmetric_distance
        
        return results
    
    def gzip_compression_analysis(self):
        """Gzip-based compression analysis (simpler baseline)"""
        print("Running Gzip compression analysis...")
        
        language_data = {}
        for lang in self.languages:
            try:
                language_data[lang] = self.load_language_data(lang)
            except Exception as e:
                print(f"  Error loading {lang}: {e}")
        
        results = {
            'languages': list(language_data.keys()),
            'compression_ratios': {},
            'distance_matrix': {}
        }
        
        # Calculate compression ratios
        for lang1 in language_data:
            results['compression_ratios'][lang1] = {}
            
            # Create a "dictionary" by concatenating lang1 data
            dict_text = language_data[lang1]
            
            for lang2 in language_data:
                # Compress lang2 with lang1 as prefix (pseudo-dictionary)
                combined_text = dict_text + "\n" + language_data[lang2]
                
                original_size = len(language_data[lang2].encode('utf-8'))
                compressed = gzip.compress(combined_text.encode('utf-8'))
                dict_compressed = gzip.compress(dict_text.encode('utf-8'))
                
                # Effective compression of lang2
                effective_compressed_size = len(compressed) - len(dict_compressed)
                ratio = max(0.1, effective_compressed_size / original_size)  # Avoid negative ratios
                
                results['compression_ratios'][lang1][lang2] = ratio
        
        # Calculate symmetric distance matrix
        for lang1 in language_data:
            results['distance_matrix'][lang1] = {}
            for lang2 in language_data:
                ratio_12 = results['compression_ratios'][lang1].get(lang2, 1.0)
                ratio_21 = results['compression_ratios'][lang2].get(lang1, 1.0)
                
                symmetric_distance = (ratio_12 + ratio_21) / 2
                results['distance_matrix'][lang1][lang2] = symmetric_distance
        
        return results
    
    def run_all_analyses(self, output_file="compression_analysis_results.json"):
        """Run all compression analyses and save results"""
        print("Running comprehensive compression analysis...")
        
        all_results = {
            'metadata': {
                'languages': self.languages,
                'num_languages': len(self.languages)
            }
        }
        
        # Run baseline analysis
        try:
            all_results['baseline'] = self.baseline_compression_analysis()
        except Exception as e:
            print(f"Baseline analysis failed: {e}")
            all_results['baseline'] = None
        
        # Run Zstd analysis
        try:
            all_results['zstd'] = self.zstd_compression_analysis()
        except Exception as e:
            print(f"Zstd analysis failed: {e}")
            all_results['zstd'] = None
        
        # Run Gzip analysis
        try:
            all_results['gzip'] = self.gzip_compression_analysis()
        except Exception as e:
            print(f"Gzip analysis failed: {e}")
            all_results['gzip'] = None
        
        # Save results
        output_path = self.data_dir / output_file
        with open(output_path, 'w') as f:
            json.dump(all_results, f, indent=2)
        
        print(f"Results saved to {output_path}")
        return all_results

def main():
    parser = argparse.ArgumentParser(description='Run compression-based language similarity analysis')
    parser.add_argument('--data-dir', default='data/programming_languages', help='Directory containing language data')
    parser.add_argument('--output', default='compression_analysis_results.json', help='Output file for results')
    parser.add_argument('--method', choices=['baseline', 'zstd', 'gzip', 'all'], default='all', 
                       help='Compression method to run')
    
    args = parser.parse_args()
    
    analyzer = CompressionAnalyzer(args.data_dir)
    
    if args.method == 'all':
        analyzer.run_all_analyses(args.output)
    elif args.method == 'baseline':
        results = analyzer.baseline_compression_analysis()
        with open(args.output, 'w') as f:
            json.dump({'baseline': results}, f, indent=2)
    elif args.method == 'zstd':
        results = analyzer.zstd_compression_analysis()
        with open(args.output, 'w') as f:
            json.dump({'zstd': results}, f, indent=2)
    elif args.method == 'gzip':
        results = analyzer.gzip_compression_analysis()
        with open(args.output, 'w') as f:
            json.dump({'gzip': results}, f, indent=2)

if __name__ == "__main__":
    main()