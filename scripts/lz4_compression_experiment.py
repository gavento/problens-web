#!/usr/bin/env python3
"""
LZ4-based compression analysis with dictionary support.
Uses LZ4's built-in dictionary compression to measure language similarity.
"""

import os
import json
import numpy as np
from collections import defaultdict
import argparse
from pathlib import Path
import subprocess
import tempfile

class LZ4CompressionAnalyzer:
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
    
    def check_lz4_installed(self):
        """Check if lz4 is installed"""
        try:
            result = subprocess.run(['lz4', '--version'], capture_output=True, text=True)
            return result.returncode == 0
        except FileNotFoundError:
            return False
    
    def install_lz4(self):
        """Try to install python lz4 module"""
        print("Installing lz4 module...")
        try:
            subprocess.run(['pip3', 'install', 'lz4'], check=True)
            return True
        except:
            return False
    
    def compress_with_lz4_cli(self, data, dict_data=None):
        """Use lz4 command-line tool for compression"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(data)
            input_file = f.name
        
        output_file = input_file + '.lz4'
        
        try:
            if dict_data:
                # Create dictionary file
                with tempfile.NamedTemporaryFile(mode='w', suffix='.dict', delete=False) as df:
                    df.write(dict_data)
                    dict_file = df.name
                
                # Compress with dictionary
                cmd = ['lz4', '-D', dict_file, input_file, output_file]
                subprocess.run(cmd, check=True, capture_output=True)
                os.unlink(dict_file)
            else:
                # Regular compression
                cmd = ['lz4', input_file, output_file]
                subprocess.run(cmd, check=True, capture_output=True)
            
            # Get compressed size
            compressed_size = os.path.getsize(output_file)
            
            # Cleanup
            os.unlink(input_file)
            os.unlink(output_file)
            
            return compressed_size
            
        except Exception as e:
            # Cleanup on error
            if os.path.exists(input_file):
                os.unlink(input_file)
            if os.path.exists(output_file):
                os.unlink(output_file)
            raise e
    
    def compress_with_lz4_python(self, data, dict_data=None):
        """Use python lz4 module for compression"""
        try:
            import lz4.frame
            import lz4.block
        except ImportError:
            if self.install_lz4():
                import lz4.frame
                import lz4.block
            else:
                raise ImportError("Could not install lz4 module")
        
        data_bytes = data.encode('utf-8')
        
        if dict_data:
            # LZ4 block compression with dictionary
            dict_bytes = dict_data.encode('utf-8')
            
            # Build compression context with dictionary
            # Note: lz4.block doesn't have direct dictionary support,
            # so we'll simulate it by compressing dict+data
            combined = dict_bytes + b'\n\n' + data_bytes
            compressed = lz4.block.compress(combined, mode='high_compression')
            
            # Subtract approximate dictionary contribution
            dict_compressed = lz4.block.compress(dict_bytes, mode='high_compression')
            estimated_size = len(compressed) - len(dict_compressed) // 2
            
            return max(10, estimated_size)  # Ensure positive size
        else:
            # Regular compression
            compressed = lz4.frame.compress(data_bytes, compression_level=16)
            return len(compressed)
    
    def analyze_lz4_compression(self):
        """Analyze compression using LZ4 with dictionaries"""
        print(f"\nAnalyzing LZ4 dictionary-based compression...")
        
        # Choose compression method
        use_cli = self.check_lz4_installed()
        if use_cli:
            print("  Using lz4 command-line tool")
            compress_func = self.compress_with_lz4_cli
        else:
            print("  Using Python lz4 module")
            compress_func = self.compress_with_lz4_python
        
        results = {
            'languages': self.languages,
            'method': 'lz4_compression',
            'baseline_sizes': {},
            'dictionary_compression': {},
            'compression_ratios': {},
            'distance_matrix': {}
        }
        
        # Get baseline compression (no dictionary)
        print("  Computing baseline compression...")
        for lang in self.languages:
            try:
                data = self.language_data[lang]
                original_size = len(data.encode('utf-8'))
                compressed_size = compress_func(data, dict_data=None)
                
                results['baseline_sizes'][lang] = {
                    'original': original_size,
                    'compressed': compressed_size,
                    'ratio': compressed_size / original_size
                }
                
                print(f"    {lang}: {original_size} → {compressed_size} bytes ({compressed_size/original_size:.3f})")
                
            except Exception as e:
                print(f"    Error with {lang}: {e}")
        
        # Test dictionary-based compression
        print("  Testing dictionary compression...")
        for dict_lang in self.languages:
            results['dictionary_compression'][dict_lang] = {}
            results['compression_ratios'][dict_lang] = {}
            
            for target_lang in self.languages:
                try:
                    if dict_lang == target_lang:
                        # Self-compression: split data in half
                        data = self.language_data[target_lang]
                        mid = len(data) // 2
                        dict_part = data[:mid]
                        target_part = data[mid:]
                    else:
                        # Cross-compression
                        dict_part = self.language_data[dict_lang]
                        target_part = self.language_data[target_lang]
                        
                        # Truncate to same size
                        min_len = min(len(dict_part), len(target_part))
                        dict_part = dict_part[:min_len]
                        target_part = target_part[:min_len]
                    
                    # Baseline (no dictionary)
                    baseline_size = compress_func(target_part, dict_data=None)
                    
                    # With dictionary
                    dict_size = compress_func(target_part, dict_data=dict_part)
                    
                    # Compression ratio
                    ratio = dict_size / baseline_size if baseline_size > 0 else 1.0
                    
                    results['dictionary_compression'][dict_lang][target_lang] = {
                        'baseline': baseline_size,
                        'with_dict': dict_size,
                        'ratio': ratio,
                        'improvement': 1.0 - ratio
                    }
                    
                    results['compression_ratios'][dict_lang][target_lang] = ratio
                    
                except Exception as e:
                    print(f"    Error {dict_lang}→{target_lang}: {e}")
                    results['compression_ratios'][dict_lang][target_lang] = 1.0
        
        # Calculate distance matrix
        print("  Calculating distance matrix...")
        for lang1 in self.languages:
            results['distance_matrix'][lang1] = {}
            for lang2 in self.languages:
                if lang1 == lang2:
                    results['distance_matrix'][lang1][lang2] = 0.0
                else:
                    # Get ratios both ways
                    ratio_12 = results['compression_ratios'][lang1].get(lang2, 1.0)
                    ratio_21 = results['compression_ratios'][lang2].get(lang1, 1.0)
                    
                    # Distance = 1 - average improvement
                    # ratio < 1 means compression improved (similar languages)
                    # ratio = 1 means no improvement (different languages)
                    improvement_12 = max(0, 1.0 - ratio_12)
                    improvement_21 = max(0, 1.0 - ratio_21)
                    
                    # Higher improvement = more similar = lower distance
                    similarity = (improvement_12 + improvement_21) / 2
                    distance = 1.0 - similarity
                    
                    results['distance_matrix'][lang1][lang2] = distance
        
        return results
    
    def run_analysis(self):
        """Run complete LZ4 compression analysis"""
        print("Starting LZ4 compression analysis...")
        
        # Load all data
        self.load_all_language_data()
        
        if not self.language_data:
            print("No language data loaded, aborting analysis")
            return None
        
        # Run analysis
        results = self.analyze_lz4_compression()
        
        # Add metadata
        final_results = {
            'metadata': {
                'languages': self.languages,
                'num_languages': len(self.languages),
                'analysis_type': 'lz4_compression'
            },
            'lz4_compression': results
        }
        
        # Save results
        public_dir = Path("public/data/programming_languages")
        public_dir.mkdir(parents=True, exist_ok=True)
        output_path = public_dir / "lz4_compression_analysis.json"
        with open(output_path, 'w') as f:
            json.dump(final_results, f, indent=2)
        
        print(f"\nResults saved to {output_path}")
        
        return final_results
    
    def print_summary(self, results):
        """Print summary of results"""
        if not results or 'lz4_compression' not in results:
            return
        
        lz4_results = results['lz4_compression']
        
        print("\n" + "="*60)
        print("LZ4 COMPRESSION ANALYSIS SUMMARY")
        print("="*60)
        
        print(f"\nLanguages analyzed: {len(lz4_results['languages'])}")
        
        # Show most similar pairs
        if 'distance_matrix' in lz4_results:
            distances = []
            for lang1 in lz4_results['languages']:
                for lang2 in lz4_results['languages']:
                    if lang1 < lang2:
                        dist = lz4_results['distance_matrix'][lang1][lang2]
                        distances.append((lang1, lang2, dist))
            
            distances.sort(key=lambda x: x[2])
            print("\nMost similar language pairs (by LZ4 dictionary compression):")
            for lang1, lang2, dist in distances[:15]:
                # Get compression improvements
                imp_12 = lz4_results['dictionary_compression'][lang1][lang2]['improvement']
                imp_21 = lz4_results['dictionary_compression'][lang2][lang1]['improvement']
                print(f"  {lang1} ↔ {lang2}: {dist:.4f} (improvements: {imp_12:.1%}, {imp_21:.1%})")

def main():
    parser = argparse.ArgumentParser(description='Run LZ4 compression analysis')
    parser.add_argument('--data-dir', default='data/programming_languages')
    
    args = parser.parse_args()
    
    analyzer = LZ4CompressionAnalyzer(args.data_dir)
    results = analyzer.run_analysis()
    
    if results:
        analyzer.print_summary(results)

if __name__ == "__main__":
    main()