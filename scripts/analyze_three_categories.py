#!/usr/bin/env python3
"""
Analyze three categories (countries, fruits, animals) using KL divergence and generalized divergence
"""

import os
import json
import zlib
import numpy as np
from pathlib import Path
from collections import Counter
import argparse

class ThreeCategoriesAnalyzer:
    def __init__(self, output_dir="public/data"):
        self.output_dir = Path(output_dir)
        self.three_categories_dir = self.output_dir / "three_categories"
        
        self.items = {}  # Will store all content items
        self.categories = {}  # Track which category each item belongs to
        
    def load_content(self):
        """Load content from three categories"""
        print("Loading three categories content...")
        
        for file_path in self.three_categories_dir.glob("*.txt"):
            item_name = file_path.stem
            try:
                with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
                
                # Determine category from filename
                if item_name.startswith('country_'):
                    category = 'country'
                    display_name = item_name.replace('country_', '').title()
                elif item_name.startswith('sport_'):
                    category = 'sport'
                    display_name = item_name.replace('sport_', '').title()
                elif item_name.startswith('animal_'):
                    category = 'animal'
                    display_name = item_name.replace('animal_', '').title()
                else:
                    category = 'other'
                    display_name = item_name
                
                self.items[item_name] = content
                self.categories[item_name] = category
                print(f"  {display_name} ({category}): {len(content)} chars")
                
            except Exception as e:
                print(f"  Error loading {item_name}: {e}")
    
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
        print("\\nRunning KL divergence analysis...")
        
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
    
    def create_dictionary(self, content, dict_size=1024):
        """Create frequency-based dictionary from most common patterns in first 50% of content"""
        import re
        from collections import Counter
        
        content_bytes = content.encode('utf-8', errors='replace')
        
        # Use first 50% of content as dictionary source
        dict_source_end = len(content_bytes) // 2
        dict_source_text = content_bytes[:dict_source_end].decode('utf-8', errors='replace')
        
        # Extract different types of patterns
        
        # 1. Words (most important)
        words = re.findall(r'\b\w+\b', dict_source_text.lower())
        word_counts = Counter(words)
        
        # 2. Common bigrams and trigrams
        bigrams = []
        trigrams = []
        for i in range(len(dict_source_text) - 2):
            if dict_source_text[i:i+2].isalnum() or ' ' in dict_source_text[i:i+2]:
                bigrams.append(dict_source_text[i:i+2])
            if dict_source_text[i:i+3].isalnum() or ' ' in dict_source_text[i:i+3]:
                trigrams.append(dict_source_text[i:i+3])
        
        bigram_counts = Counter(bigrams)
        trigram_counts = Counter(trigrams)
        
        # 3. Build dictionary content prioritizing by frequency and usefulness
        dictionary_content = []
        current_size = 0
        
        # Add most frequent words first (they compress best)
        for word, count in word_counts.most_common():
            if count >= 2:  # Only words that appear multiple times
                word_with_space = f" {word} "
                word_bytes = word_with_space.encode('utf-8')
                if current_size + len(word_bytes) <= dict_size:
                    dictionary_content.append(word_with_space)
                    current_size += len(word_bytes)
                else:
                    break
        
        # Add frequent trigrams that aren't already covered
        for trigram, count in trigram_counts.most_common():
            if count >= 2 and trigram not in ''.join(dictionary_content):
                trigram_bytes = trigram.encode('utf-8')
                if current_size + len(trigram_bytes) <= dict_size:
                    dictionary_content.append(trigram)
                    current_size += len(trigram_bytes)
                else:
                    break
        
        # Add frequent bigrams to fill remaining space
        for bigram, count in bigram_counts.most_common():
            if count >= 3 and bigram not in ''.join(dictionary_content):
                bigram_bytes = bigram.encode('utf-8')
                if current_size + len(bigram_bytes) <= dict_size:
                    dictionary_content.append(bigram)
                    current_size += len(bigram_bytes)
                else:
                    break
        
        # Convert to bytes and pad to exact dict_size
        dict_text = ''.join(dictionary_content)
        dict_bytes = dict_text.encode('utf-8', errors='replace')
        
        if len(dict_bytes) < dict_size:
            # Pad with null bytes
            padding = b'\x00' * (dict_size - len(dict_bytes))
            dict_bytes += padding
        else:
            # Truncate if too long
            dict_bytes = dict_bytes[:dict_size]
        
        return dict_bytes
    
    def get_test_content(self, content):
        """Get the last 50% of content for testing (when using first 50% as dictionary)"""
        content_bytes = content.encode('utf-8')
        test_start = len(content_bytes) // 2  # Skip first 50%
        return content_bytes[test_start:].decode('utf-8', errors='replace')
    
    def compute_generalized_divergence(self, content_a, content_b):
        """
        Compute generalized divergence between two texts using compression.
        Uses first 50% as dictionary, tests on remaining 50% for self-compression.
        Returns bits per character difference when using each other's dictionaries.
        """
        # Create dictionaries from first 50% of each content
        dict_a = self.create_dictionary(content_a)
        dict_b = self.create_dictionary(content_b)
        
        # Get test content (last 50% for both self and cross-compression)
        test_a = self.get_test_content(content_a)
        test_b = self.get_test_content(content_b)
        
        # Compress A: test portion with A's dict vs test portion with B's dict
        test_a_bytes = test_a.encode('utf-8')
        test_b_bytes = test_b.encode('utf-8')
        
        a_self_compressed = self.compress_with_deflate(test_a, dictionary=dict_a)
        a_cross_compressed = self.compress_with_deflate(test_a, dictionary=dict_b)
        
        # Compress B: test portion with B's dict vs test portion with A's dict  
        b_self_compressed = self.compress_with_deflate(test_b, dictionary=dict_b)
        b_cross_compressed = self.compress_with_deflate(test_b, dictionary=dict_a)
        
        # Calculate bits per character difference
        # For A: how much worse is using B's dictionary vs A's own dictionary
        a_self_bits_per_char = (len(a_self_compressed) * 8) / len(test_a_bytes)
        a_cross_bits_per_char = (len(a_cross_compressed) * 8) / len(test_a_bytes)
        divergence_a_to_b = a_cross_bits_per_char - a_self_bits_per_char
        
        # For B: how much worse is using A's dictionary vs B's own dictionary
        b_self_bits_per_char = (len(b_self_compressed) * 8) / len(test_b_bytes)
        b_cross_bits_per_char = (len(b_cross_compressed) * 8) / len(test_b_bytes)
        divergence_b_to_a = b_cross_bits_per_char - b_self_bits_per_char
        
        # Symmetrize: average the two directions
        symmetric_divergence = (divergence_a_to_b + divergence_b_to_a) / 2
        
        return symmetric_divergence
    
    def run_generalized_divergence_analysis(self):
        """Run generalized divergence analysis on all content"""
        print("\\nRunning generalized divergence analysis...")
        
        item_ids = list(self.items.keys())
        
        # Compute generalized divergence matrix
        distance_matrix = {}
        for item1 in item_ids:
            distance_matrix[item1] = {}
            print(f"  Computing distances for {item1}...")
            
            for item2 in item_ids:
                if item1 == item2:
                    distance_matrix[item1][item2] = 0.0
                else:
                    # Compute generalized divergence
                    gen_div = self.compute_generalized_divergence(
                        self.items[item1], 
                        self.items[item2]
                    )
                    distance_matrix[item1][item2] = gen_div
                    print(f"    {item1} ↔ {item2}: {gen_div:.3f} bits/char")
        
        return {
            'languages': item_ids,
            'distance_matrix': distance_matrix,
            'categories': self.categories
        }
    
    def run_full_analysis(self):
        """Run complete analysis pipeline"""
        print("Starting three categories content analysis...")
        
        # Load all content
        self.load_content()
        
        if not self.items:
            print("No content loaded!")
            return
        
        print(f"\\nLoaded {len(self.items)} items:")
        country_count = sum(1 for cat in self.categories.values() if cat == "country")
        sport_count = sum(1 for cat in self.categories.values() if cat == "sport")
        animal_count = sum(1 for cat in self.categories.values() if cat == "animal")
        print(f"  Countries: {country_count}")
        print(f"  Sports: {sport_count}")
        print(f"  Animals: {animal_count}")
        
        # Run both analyses
        kl_results = self.run_kl_analysis()
        gen_div_results = self.run_generalized_divergence_analysis()
        
        # Combine results
        final_results = {
            'metadata': {
                'total_items': len(self.items),
                'countries': country_count,
                'fruits': sport_count,
                'animals': animal_count,
                'analysis_types': ['kl_divergence', 'generalized_divergence']
            },
            'kl_analysis': {
                'baseline': kl_results
            },
            'generalized_divergence_analysis': gen_div_results
        }
        
        # Save results
        output_path = self.output_dir / "three_categories_analysis.json"
        with open(output_path, 'w') as f:
            json.dump(final_results, f, indent=2)
        
        print(f"\\nResults saved to: {output_path}")
        return final_results

def main():
    analyzer = ThreeCategoriesAnalyzer()
    results = analyzer.run_full_analysis()
    
    if results:
        print("\\nAnalysis complete!")
        print(f"Total items analyzed: {results['metadata']['total_items']}")
        print(f"Countries: {results['metadata']['countries']}")
        print(f"Sports: {results['metadata']['fruits']}")
        print(f"Animals: {results['metadata']['animals']}")

if __name__ == "__main__":
    main()