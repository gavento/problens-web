#!/usr/bin/env python3
"""
Improved dictionary creation using frequency analysis
"""

import re
from collections import Counter
from pathlib import Path

def create_frequency_based_dictionary(content, dict_size=1024):
    """Create dictionary from most frequent patterns in first 50% of content"""
    content_bytes = content.encode('utf-8', errors='replace')
    
    # Use first 50% of content as dictionary source
    dict_source_end = len(content_bytes) // 2
    dict_source_text = content_bytes[:dict_source_end].decode('utf-8', errors='replace')
    
    # Extract different types of patterns
    patterns = []
    
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

def create_simple_dictionary(content, dict_size=1024):
    """Original simple dictionary (first N bytes)"""
    content_bytes = content.encode('utf-8', errors='replace')
    dict_source_end = len(content_bytes) // 2
    dict_source = content_bytes[:dict_source_end]
    
    if len(dict_source) >= dict_size:
        return dict_source[:dict_size]
    else:
        padding = b'\x00' * (dict_size - len(dict_source))
        return dict_source + padding

def compare_dictionary_methods(item_id):
    """Compare simple vs frequency-based dictionary creation"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    content_path = project_root / f"public/data/three_categories/{item_id}.txt"
    
    with open(content_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    print(f"Comparing dictionary methods for {item_id}")
    print("=" * 50)
    print(f"Content length: {len(content)} characters")
    print()
    
    # Create both types of dictionaries
    simple_dict = create_simple_dictionary(content)
    freq_dict = create_frequency_based_dictionary(content)
    
    print("SIMPLE DICTIONARY (first 1024 bytes):")
    print("-" * 30)
    simple_text = simple_dict.decode('utf-8', errors='replace').rstrip('\x00')
    print(f"Text: {simple_text[:200]}{'...' if len(simple_text) > 200 else ''}")
    print()
    
    print("FREQUENCY-BASED DICTIONARY:")
    print("-" * 30)
    freq_text = freq_dict.decode('utf-8', errors='replace').rstrip('\x00')
    print(f"Text: {freq_text[:200]}{'...' if len(freq_text) > 200 else ''}")
    print()
    
    # Analyze word coverage
    content_words = set(re.findall(r'\b\w+\b', content.lower()))
    simple_words = set(re.findall(r'\b\w+\b', simple_text.lower()))
    freq_words = set(re.findall(r'\b\w+\b', freq_text.lower()))
    
    print("WORD COVERAGE ANALYSIS:")
    print("-" * 30)
    print(f"Total unique words in content: {len(content_words)}")
    print(f"Words in simple dictionary: {len(simple_words)} ({len(simple_words & content_words)} relevant)")
    print(f"Words in frequency dictionary: {len(freq_words)} ({len(freq_words & content_words)} relevant)")
    print()
    
    print("FREQUENCY DICTIONARY WORD LIST:")
    print("-" * 30)
    print(f"Words: {sorted(freq_words)}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python3 improved_dictionary.py <item_id>")
        print("Example: python3 improved_dictionary.py animal_elephant")
        sys.exit(1)
    
    compare_dictionary_methods(sys.argv[1])