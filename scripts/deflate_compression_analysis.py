#!/usr/bin/env python3
"""
Full DEFLATE dictionary compression analysis for all language pairs.
Uses static Huffman codes (Z_FIXED) to ensure no adaptation.
"""

import zlib
import json
from pathlib import Path
import numpy as np

class DeflateCompressionAnalyzer:
    def __init__(self, data_dir="public/data/programming_languages"):
        self.data_dir = Path(data_dir)
        self.languages = []
        self.dictionaries = {}
        self.language_data = {}
        self.load_metadata()
    
    def load_metadata(self):
        """Load dictionary metadata"""
        metadata_file = self.data_dir / "deflate_dictionaries.json"
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        self.languages = metadata['languages']
        print(f"Found {len(self.languages)} languages with dictionaries")
        
        # Load all dictionaries
        print("Loading dictionaries...")
        for lang in self.languages:
            dict_file = self.data_dir / f"{lang}_dictionary.bin"
            with open(dict_file, 'rb') as f:
                self.dictionaries[lang] = f.read()
        
        # Load all language data
        print("Loading language data...")
        for lang in self.languages:
            data_file = self.data_dir / f"{lang}_consolidated.txt"
            with open(data_file, 'r', encoding='utf-8') as f:
                content = f.read()
            self.language_data[lang] = content.encode('utf-8')
            print(f"  {lang}: {len(self.language_data[lang])} bytes")
    
    def compress_with_dict(self, data, dictionary=None):
        """Compress data with optional dictionary using static Huffman"""
        if dictionary:
            comp = zlib.compressobj(
                level=9,
                method=zlib.DEFLATED,
                wbits=-zlib.MAX_WBITS,  # Raw DEFLATE
                memLevel=8,
                strategy=zlib.Z_FIXED,  # Static Huffman
                zdict=dictionary
            )
        else:
            comp = zlib.compressobj(
                level=9,
                method=zlib.DEFLATED,
                wbits=-zlib.MAX_WBITS,  # Raw DEFLATE
                memLevel=8,
                strategy=zlib.Z_FIXED   # Static Huffman
            )
        
        return comp.compress(data) + comp.flush()
    
    def analyze_compression(self):
        """Run full compression analysis"""
        print("\nRunning DEFLATE dictionary compression analysis...")
        
        results = {
            'languages': self.languages,
            'method': 'deflate_static_dictionary',
            'baseline_compression': {},
            'dictionary_compression': {},
            'compression_benefits': {},
            'distance_matrix': {}
        }
        
        # Step 1: Baseline compression (no dictionary)
        print("\n1. Computing baseline compression (no dictionary)...")
        for lang in self.languages:
            data = self.language_data[lang]
            compressed = self.compress_with_dict(data, dictionary=None)
            ratio = len(compressed) / len(data)
            
            results['baseline_compression'][lang] = {
                'original': len(data),
                'compressed': len(compressed),
                'ratio': ratio
            }
            print(f"  {lang}: {len(data)} → {len(compressed)} ({ratio:.1%})")
        
        # Step 2: Dictionary compression for all pairs
        print("\n2. Computing dictionary compression for all pairs...")
        for dict_lang in self.languages:
            results['dictionary_compression'][dict_lang] = {}
            results['compression_benefits'][dict_lang] = {}
            
            print(f"\n  Using {dict_lang} dictionary:")
            dictionary = self.dictionaries[dict_lang]
            
            for target_lang in self.languages:
                data = self.language_data[target_lang]
                
                # Compress with dictionary
                compressed = self.compress_with_dict(data, dictionary=dictionary)
                dict_ratio = len(compressed) / len(data)
                
                # Compare to baseline
                baseline_size = results['baseline_compression'][target_lang]['compressed']
                improvement = (baseline_size - len(compressed)) / baseline_size
                
                results['dictionary_compression'][dict_lang][target_lang] = {
                    'compressed_size': len(compressed),
                    'ratio': dict_ratio,
                    'improvement': improvement
                }
                
                results['compression_benefits'][dict_lang][target_lang] = improvement
                
                if improvement > 0.01:  # Only print significant improvements
                    print(f"    → {target_lang}: {improvement:.1%} improvement")
        
        # Step 3: Calculate distance matrix
        print("\n3. Calculating distance matrix...")
        for lang1 in self.languages:
            results['distance_matrix'][lang1] = {}
            for lang2 in self.languages:
                if lang1 == lang2:
                    results['distance_matrix'][lang1][lang2] = 0.0
                else:
                    # Get improvements in both directions
                    imp_12 = results['compression_benefits'][lang1].get(lang2, 0)
                    imp_21 = results['compression_benefits'][lang2].get(lang1, 0)
                    
                    # Convert to distance: more improvement = more similar = lower distance
                    # Normalize by maximum observed improvement (~15-20%)
                    max_improvement = 0.20
                    dist_12 = 1.0 - (imp_12 / max_improvement)
                    dist_21 = 1.0 - (imp_21 / max_improvement)
                    
                    # Symmetric distance
                    distance = (dist_12 + dist_21) / 2
                    results['distance_matrix'][lang1][lang2] = max(0, min(1, distance))
        
        return results
    
    def save_results(self, results):
        """Save results to JSON"""
        output_file = self.data_dir / "deflate_compression_analysis.json"
        
        # Add metadata
        final_results = {
            'metadata': {
                'languages': self.languages,
                'num_languages': len(self.languages),
                'analysis_type': 'deflate_static_dictionary',
                'dictionary_size': 32768,
                'compression_strategy': 'Z_FIXED (static Huffman)',
                'notes': 'No adaptive learning - pure dictionary-based compression'
            },
            'deflate_analysis': results
        }
        
        with open(output_file, 'w') as f:
            json.dump(final_results, f, indent=2)
        
        print(f"\nResults saved to: {output_file}")
        return output_file
    
    def print_summary(self, results):
        """Print analysis summary"""
        print("\n" + "="*60)
        print("DEFLATE STATIC DICTIONARY COMPRESSION SUMMARY")
        print("="*60)
        
        # Find most similar pairs
        distances = []
        for lang1 in self.languages:
            for lang2 in self.languages:
                if lang1 < lang2:
                    dist = results['distance_matrix'][lang1][lang2]
                    imp_12 = results['compression_benefits'][lang1][lang2]
                    imp_21 = results['compression_benefits'][lang2][lang1]
                    distances.append((lang1, lang2, dist, imp_12, imp_21))
        
        distances.sort(key=lambda x: x[2])
        
        print("\nMost similar language pairs (by dictionary compression):")
        for lang1, lang2, dist, imp_12, imp_21 in distances[:15]:
            print(f"  {lang1:>12} ↔ {lang2:<12}: {dist:.3f} (improvements: {imp_12:.1%}, {imp_21:.1%})")
        
        print("\nMost different language pairs:")
        for lang1, lang2, dist, imp_12, imp_21 in distances[-10:]:
            print(f"  {lang1:>12} ↔ {lang2:<12}: {dist:.3f} (improvements: {imp_12:.1%}, {imp_21:.1%})")

def main():
    analyzer = DeflateCompressionAnalyzer()
    results = analyzer.analyze_compression()
    analyzer.save_results(results)
    analyzer.print_summary(results)

if __name__ == "__main__":
    main()