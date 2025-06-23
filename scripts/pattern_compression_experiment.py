#!/usr/bin/env python3
"""
Pattern-based compression analysis using simple string matching.
Count how many patterns from language A appear in language B.
"""

import os
import json
import numpy as np
from collections import defaultdict, Counter
import math
import argparse
from pathlib import Path
import re

class PatternCompressionAnalyzer:
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
    
    def extract_patterns(self, text, min_length=3, max_length=8):
        """Extract common patterns from text"""
        patterns = Counter()
        
        # Extract word patterns (alphanumeric sequences)
        words = re.findall(r'[a-zA-Z_][a-zA-Z0-9_]*', text)
        for word in words:
            if min_length <= len(word) <= max_length:
                patterns[word] += 1
        
        # Extract punctuation patterns
        punct_patterns = re.findall(r'[{}();,.\[\]]+', text)
        for pattern in punct_patterns:
            if min_length <= len(pattern) <= max_length:
                patterns[pattern] += 1
        
        # Extract short character sequences
        for i in range(len(text) - min_length + 1):
            for length in range(min_length, min(max_length + 1, len(text) - i + 1)):
                substr = text[i:i+length]
                # Only include if it has some structure (not all spaces/newlines)
                if len(substr.strip()) >= min_length - 1:
                    patterns[substr] += 1
        
        return patterns
    
    def calculate_pattern_compression_ratio(self, source_lang, target_lang):
        """
        Calculate how well patterns from source_lang compress target_lang.
        Higher ratio = better compression = more similar languages.
        """
        source_text = self.language_data[source_lang]
        target_text = self.language_data[target_lang]
        
        # Extract common patterns from source language
        source_patterns = self.extract_patterns(source_text)
        
        # Get top patterns by frequency
        top_patterns = [pattern for pattern, count in source_patterns.most_common(100) 
                       if count >= 2 and len(pattern) >= 3]
        
        # Count how many characters in target can be "compressed" using source patterns
        target_compressed_chars = 0
        target_remaining = target_text
        
        # Sort patterns by length (longest first for better compression)
        top_patterns.sort(key=len, reverse=True)
        
        for pattern in top_patterns:
            # Count occurrences of this pattern in target
            occurrences = target_remaining.count(pattern)
            if occurrences > 0:
                # "Compress" by replacing pattern with shorter representation
                # Assume we can represent each pattern with 1 byte reference
                chars_saved = occurrences * (len(pattern) - 1)
                target_compressed_chars += chars_saved
                
                # Remove these patterns to avoid double-counting
                target_remaining = target_remaining.replace(pattern, "X")
        
        # Calculate compression ratio
        original_size = len(target_text)
        compressed_size = original_size - target_compressed_chars
        
        if original_size > 0:
            compression_ratio = compressed_size / original_size
        else:
            compression_ratio = 1.0
        
        return compression_ratio, len(top_patterns), target_compressed_chars
    
    def analyze_pattern_compression(self):
        """Analyze pattern-based compression between all language pairs"""
        print(f"\nAnalyzing pattern-based compression...")
        
        results = {
            'languages': self.languages,
            'method': 'pattern_compression',
            'compression_data': {},
            'compression_ratios': {},
            'distance_matrix': {}
        }
        
        print("  Computing pattern compression ratios...")
        for source_lang in self.languages:
            results['compression_data'][source_lang] = {}
            results['compression_ratios'][source_lang] = {}
            
            print(f"    Using {source_lang} patterns to compress others...")
            
            for target_lang in self.languages:
                try:
                    ratio, num_patterns, chars_saved = self.calculate_pattern_compression_ratio(source_lang, target_lang)
                    
                    results['compression_data'][source_lang][target_lang] = {
                        'compression_ratio': ratio,
                        'patterns_used': num_patterns,
                        'chars_saved': chars_saved,
                        'original_size': len(self.language_data[target_lang])
                    }
                    
                    results['compression_ratios'][source_lang][target_lang] = ratio
                    
                except Exception as e:
                    print(f"      Error with {source_lang}→{target_lang}: {e}")
                    results['compression_ratios'][source_lang][target_lang] = 1.0
        
        # Calculate distance matrix
        print("  Calculating distance matrix...")
        for lang1 in self.languages:
            results['distance_matrix'][lang1] = {}
            for lang2 in self.languages:
                if lang1 == lang2:
                    results['distance_matrix'][lang1][lang2] = 0.0
                else:
                    # Get compression ratios in both directions
                    ratio_12 = results['compression_ratios'][lang1].get(lang2, 1.0)  # lang1 patterns for lang2
                    ratio_21 = results['compression_ratios'][lang2].get(lang1, 1.0)  # lang2 patterns for lang1
                    
                    # Convert to distances: lower ratio = better compression = more similar
                    # Distance = average compression ratio (lower = more similar)
                    symmetric_distance = (ratio_12 + ratio_21) / 2
                    results['distance_matrix'][lang1][lang2] = symmetric_distance
        
        return results
    
    def run_analysis(self):
        """Run complete pattern-based compression analysis"""
        print("Starting pattern-based compression analysis...")
        
        # Load all data
        self.load_all_language_data()
        
        if not self.language_data:
            print("No language data loaded, aborting analysis")
            return None
        
        # Run pattern compression analysis
        results = self.analyze_pattern_compression()
        
        # Add metadata
        final_results = {
            'metadata': {
                'languages': self.languages,
                'num_languages': len(self.languages),
                'analysis_type': 'pattern_compression'
            },
            'pattern_compression': results
        }
        
        # Save results
        public_dir = Path("public/data/programming_languages")
        public_dir.mkdir(parents=True, exist_ok=True)
        output_path = public_dir / "pattern_compression_analysis.json"
        with open(output_path, 'w') as f:
            json.dump(final_results, f, indent=2)
        
        print(f"\nResults saved to {output_path}")
        
        return final_results
    
    def print_summary(self, results):
        """Print summary of results"""
        if not results or 'pattern_compression' not in results:
            return
        
        pattern_results = results['pattern_compression']
        
        print("\n" + "="*60)
        print("PATTERN COMPRESSION ANALYSIS SUMMARY")
        print("="*60)
        
        print(f"\nLanguages analyzed: {len(pattern_results['languages'])}")
        
        # Show most similar language pairs
        if 'distance_matrix' in pattern_results:
            distances = []
            for lang1 in pattern_results['languages']:
                for lang2 in pattern_results['languages']:
                    if lang1 < lang2:  # Avoid duplicates
                        dist = pattern_results['distance_matrix'][lang1][lang2]
                        distances.append((lang1, lang2, dist))
            
            distances.sort(key=lambda x: x[2])  # Sort by distance (lowest = most similar)
            print("\nMost similar language pairs (by pattern compression):")
            for lang1, lang2, dist in distances[:15]:
                ratio1 = pattern_results['compression_ratios'][lang1][lang2]
                ratio2 = pattern_results['compression_ratios'][lang2][lang1]
                print(f"  {lang1} ↔ {lang2}: {dist:.4f} (ratios: {ratio1:.3f}, {ratio2:.3f})")
            
            print("\nMost distant language pairs:")
            for lang1, lang2, dist in distances[-10:]:
                ratio1 = pattern_results['compression_ratios'][lang1][lang2]
                ratio2 = pattern_results['compression_ratios'][lang2][lang1]
                print(f"  {lang1} ↔ {lang2}: {dist:.4f} (ratios: {ratio1:.3f}, {ratio2:.3f})")

def main():
    parser = argparse.ArgumentParser(description='Run pattern-based compression language similarity analysis')
    parser.add_argument('--data-dir', default='data/programming_languages', help='Directory containing language data')
    
    args = parser.parse_args()
    
    analyzer = PatternCompressionAnalyzer(args.data_dir)
    results = analyzer.run_analysis()
    
    if results:
        analyzer.print_summary(results)

if __name__ == "__main__":
    main()