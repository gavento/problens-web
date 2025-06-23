#!/usr/bin/env python3
"""
Unified content analysis for both programming languages and texts.
Runs both KL divergence and DEFLATE compression analysis.
"""

import os
import json
import zlib
import numpy as np
from pathlib import Path
from collections import Counter
import argparse

class UnifiedContentAnalyzer:
    def __init__(self, output_dir="public/data"):
        self.output_dir = Path(output_dir)
        self.programming_dir = self.output_dir / "programming_languages"
        self.texts_dir = self.output_dir / "texts"
        
        self.items = {}  # Will store all content items
        self.categories = {}  # Track which category each item belongs to
        
    def load_programming_languages(self):
        """Load programming language data"""
        print("Loading programming languages...")
        
        # Get the 27 languages that were used in DEFLATE analysis
        excluded_languages = {'apl', 'erlang', 'elixir', 'fsharp', 'kotlin', 'swift'}
        
        for file_path in self.programming_dir.glob("*_consolidated.txt"):
            lang = file_path.stem.replace("_consolidated", "")
            if lang not in excluded_languages:
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                        content = f.read()
                    
                    self.items[f"lang_{lang}"] = content
                    self.categories[f"lang_{lang}"] = "programming"
                    print(f"  {lang}: {len(content)} chars")
                    
                except Exception as e:
                    print(f"  Error loading {lang}: {e}")
    
    def load_texts(self):
        """Load text data"""
        print("Loading texts...")
        
        for file_path in self.texts_dir.glob("*.txt"):
            text_name = file_path.stem
            try:
                with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
                
                self.items[f"text_{text_name}"] = content
                self.categories[f"text_{text_name}"] = "text"
                print(f"  {text_name}: {len(content)} chars")
                
            except Exception as e:
                print(f"  Error loading {text_name}: {e}")
    
    def compute_character_frequencies(self, text):
        """Compute character frequency distribution"""
        total_chars = len(text)
        if total_chars == 0:
            return {}
        
        char_counts = Counter(text)
        frequencies = {}
        
        for char, count in char_counts.items():
            frequencies[char] = count / total_chars
        
        return frequencies
    
    def compute_kl_divergence(self, freq1, freq2, min_freq=2**-10):
        """Compute symmetrized KL divergence between two frequency distributions"""
        # Get all characters that appear in either distribution
        all_chars = set(freq1.keys()) | set(freq2.keys())
        
        # Ensure minimum frequency to avoid log(0)
        p = np.array([max(freq1.get(char, 0), min_freq) for char in all_chars])
        q = np.array([max(freq2.get(char, 0), min_freq) for char in all_chars])
        
        # Normalize to ensure they sum to 1
        p = p / np.sum(p)
        q = q / np.sum(q)
        
        # Compute KL divergences in both directions
        kl_pq = np.sum(p * np.log2(p / q))
        kl_qp = np.sum(q * np.log2(q / p))
        
        # Return symmetrized KL divergence
        return (kl_pq + kl_qp) / 2
    
    def compute_entropy(self, frequencies):
        """Compute Shannon entropy"""
        if not frequencies:
            return 0
        
        entropy = 0
        for freq in frequencies.values():
            if freq > 0:
                entropy -= freq * np.log2(freq)
        
        return entropy
    
    def run_kl_analysis(self):
        """Run KL divergence analysis on all content"""
        print("\nRunning KL divergence analysis...")
        
        # Compute character frequencies for all items
        frequencies = {}
        entropies = {}
        
        for item_id, content in self.items.items():
            freq = self.compute_character_frequencies(content)
            frequencies[item_id] = freq
            entropies[item_id] = self.compute_entropy(freq)
            print(f"  {item_id}: entropy = {entropies[item_id]:.3f}")
        
        # Compute pairwise KL divergences
        item_ids = list(self.items.keys())
        distance_matrix = {}
        
        for item1 in item_ids:
            distance_matrix[item1] = {}
            for item2 in item_ids:
                if item1 == item2:
                    distance_matrix[item1][item2] = 0.0
                else:
                    kl_dist = self.compute_kl_divergence(frequencies[item1], frequencies[item2])
                    distance_matrix[item1][item2] = kl_dist
        
        return {
            'languages': item_ids,
            'distance_matrix': distance_matrix,
            'entropy_values': entropies,
            'categories': self.categories
        }
    
    def compress_with_deflate(self, data, dictionary=None):
        """Compress data using DEFLATE with optional dictionary"""
        data_bytes = data.encode('utf-8') if isinstance(data, str) else data
        
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
        
        return comp.compress(data_bytes) + comp.flush()
    
    def create_dictionary(self, content, dict_size=32768):
        """Create a 32KB dictionary from content"""
        content_bytes = content.encode('utf-8', errors='replace')
        
        # If content is less than 32KB, repeat it
        if len(content_bytes) < dict_size:
            repeat_times = (dict_size // len(content_bytes)) + 1
            content_bytes = content_bytes * repeat_times
        
        # Truncate to exactly 32KB
        return content_bytes[:dict_size]
    
    def run_deflate_analysis(self):
        """Run DEFLATE compression analysis on all content"""
        print("\nRunning DEFLATE compression analysis...")
        
        item_ids = list(self.items.keys())
        
        # Create dictionaries for each item
        dictionaries = {}
        for item_id, content in self.items.items():
            dictionaries[item_id] = self.create_dictionary(content)
            print(f"  Created dictionary for {item_id}: {len(dictionaries[item_id])} bytes")
        
        # Compute baseline compression (no dictionary)
        baseline_compression = {}
        for item_id, content in self.items.items():
            original_size = len(content.encode('utf-8'))
            compressed = self.compress_with_deflate(content, dictionary=None)
            compressed_size = len(compressed)
            
            baseline_compression[item_id] = {
                'original': original_size,
                'compressed': compressed_size,
                'ratio': compressed_size / original_size
            }
        
        # Compute dictionary compression for all pairs
        compression_benefits = {}
        for dict_item in item_ids:
            compression_benefits[dict_item] = {}
            
            for target_item in item_ids:
                if dict_item == target_item:
                    # Self-compression: improvement should be very high
                    compression_benefits[dict_item][target_item] = 0.95  # Assume 95% improvement
                else:
                    # Cross-compression
                    dictionary = dictionaries[dict_item]
                    target_content = self.items[target_item]
                    
                    # Get baseline
                    baseline_size = baseline_compression[target_item]['compressed']
                    
                    # Compress with dictionary
                    dict_compressed = self.compress_with_deflate(target_content, dictionary=dictionary)
                    dict_size = len(dict_compressed)
                    
                    # Calculate improvement
                    improvement = (baseline_size - dict_size) / baseline_size
                    compression_benefits[dict_item][target_item] = improvement
        
        # Calculate distance matrix
        distance_matrix = {}
        for item1 in item_ids:
            distance_matrix[item1] = {}
            for item2 in item_ids:
                if item1 == item2:
                    distance_matrix[item1][item2] = 0.0
                else:
                    # Get improvements in both directions
                    imp_12 = compression_benefits[item1].get(item2, 0)
                    imp_21 = compression_benefits[item2].get(item1, 0)
                    
                    # Convert to distance: more improvement = more similar = lower distance
                    max_improvement = 0.20
                    dist_12 = 1.0 - (imp_12 / max_improvement)
                    dist_21 = 1.0 - (imp_21 / max_improvement)
                    
                    # Symmetric distance
                    distance = (dist_12 + dist_21) / 2
                    distance_matrix[item1][item2] = max(0, min(1, distance))
        
        return {
            'languages': item_ids,
            'distance_matrix': distance_matrix,
            'compression_benefits': compression_benefits,
            'baseline_compression': baseline_compression,
            'categories': self.categories
        }
    
    def run_full_analysis(self):
        """Run complete analysis pipeline"""
        print("Starting unified content analysis...")
        
        # Load all content
        self.load_programming_languages()
        self.load_texts()
        
        if not self.items:
            print("No content loaded!")
            return
        
        print(f"\nLoaded {len(self.items)} items:")
        programming_count = sum(1 for cat in self.categories.values() if cat == "programming")
        text_count = sum(1 for cat in self.categories.values() if cat == "text")
        print(f"  Programming languages: {programming_count}")
        print(f"  Texts: {text_count}")
        
        # Run both analyses
        kl_results = self.run_kl_analysis()
        deflate_results = self.run_deflate_analysis()
        
        # Combine results
        final_results = {
            'metadata': {
                'total_items': len(self.items),
                'programming_languages': programming_count,
                'texts': text_count,
                'analysis_types': ['kl_divergence', 'deflate_compression']
            },
            'kl_analysis': {
                'baseline': kl_results
            },
            'deflate_analysis': deflate_results
        }
        
        # Save results
        output_path = self.output_dir / "unified_content_analysis.json"
        with open(output_path, 'w') as f:
            json.dump(final_results, f, indent=2)
        
        print(f"\nResults saved to: {output_path}")
        return final_results

def main():
    analyzer = UnifiedContentAnalyzer()
    results = analyzer.run_full_analysis()
    
    if results:
        print("\nAnalysis complete!")
        print(f"Total items analyzed: {results['metadata']['total_items']}")
        print(f"Programming languages: {results['metadata']['programming_languages']}")
        print(f"Texts: {results['metadata']['texts']}")

if __name__ == "__main__":
    main()