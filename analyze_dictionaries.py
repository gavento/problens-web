#!/usr/bin/env python3
"""
Analyze what's inside the compression dictionaries
"""

import json
import zlib
from pathlib import Path
from collections import Counter
import re

def load_analysis_data():
    """Load the analysis results"""
    data_path = Path("public/data/three_categories_analysis.json")
    with open(data_path, 'r') as f:
        return json.load(f)

def load_content_file(item_id):
    """Load content for a specific item"""
    content_path = Path(f"public/data/three_categories/{item_id}.txt")
    with open(content_path, 'r', encoding='utf-8', errors='replace') as f:
        return f.read()

def create_dictionary(content, dict_size=1024):
    """Create a fixed-size dictionary from first 50% of content"""
    content_bytes = content.encode('utf-8', errors='replace')
    
    # Use first 50% of content as dictionary source
    dict_source_end = len(content_bytes) // 2
    dict_source = content_bytes[:dict_source_end]
    
    # Ensure all dictionaries are exactly the same size
    if len(dict_source) >= dict_size:
        # If we have enough content, use first dict_size bytes
        return dict_source[:dict_size]
    else:
        # If not enough content, pad with zeros to reach dict_size
        padding = b'\x00' * (dict_size - len(dict_source))
        return dict_source + padding

def analyze_dictionary_bytes(dictionary):
    """Analyze the byte patterns in a dictionary"""
    # Convert back to text for analysis (lossy but informative)
    try:
        text = dictionary.decode('utf-8', errors='replace')
        # Remove null padding
        text = text.replace('\x00', '')
    except:
        text = ""
    
    return {
        'size': len(dictionary),
        'text_content': text[:200] + "..." if len(text) > 200 else text,
        'byte_frequencies': Counter(dictionary),
        'common_bigrams': get_common_ngrams(text, 2, 10),
        'common_trigrams': get_common_ngrams(text, 3, 10),
        'words': extract_words(text)[:20]  # Top 20 words
    }

def get_common_ngrams(text, n, top_k):
    """Extract most common n-grams"""
    ngrams = []
    for i in range(len(text) - n + 1):
        ngram = text[i:i+n]
        if ngram.isalnum() or ' ' in ngram:  # Only meaningful ngrams
            ngrams.append(ngram)
    
    return Counter(ngrams).most_common(top_k)

def extract_words(text):
    """Extract and count words from text"""
    # Simple word extraction
    words = re.findall(r'\b\w+\b', text.lower())
    return [word for word, count in Counter(words).most_common(20)]

def get_display_name(item_id):
    """Convert item ID to display name"""
    if item_id.startswith('country_'):
        return f"🏛️ {item_id.replace('country_', '').replace('newzealand', 'New Zealand').title()}"
    elif item_id.startswith('fruit_'):
        name = item_id.replace('fruit_', '').title()
        if name == 'Kiwi':
            name = 'Kiwi (fruit)'
        return f"🍎 {name}"
    elif item_id.startswith('animal_'):
        name = item_id.replace('animal_', '').title()
        if name == 'Kiwi':
            name = 'Kiwi (bird)'
        return f"🐱 {name}"
    return item_id

def main():
    data = load_analysis_data()
    
    # Get list of items
    items = data['kl_analysis']['baseline']['languages']
    
    print("COMPRESSION DICTIONARY ANALYSIS")
    print("=" * 50)
    print("Analyzing what's inside the 1024-byte dictionaries built from first 50% of each item's content")
    print()
    
    # Analyze a few representative items from each category
    sample_items = [
        'country_japan',      # Country
        'country_france',     # Country
        'fruit_apple',        # Fruit
        'fruit_pear',         # Fruit (compression outlier)
        'animal_elephant',    # Animal
        'animal_kiwi'         # Animal
    ]
    
    for item_id in sample_items:
        if item_id in items:
            print(f"\n{get_display_name(item_id)}")
            print("-" * 30)
            
            # Load content and create dictionary
            content = load_content_file(item_id)
            dictionary = create_dictionary(content)
            analysis = analyze_dictionary_bytes(dictionary)
            
            print(f"Dictionary size: {analysis['size']} bytes")
            print(f"Content length: {len(content)} chars")
            print()
            
            print("Sample dictionary content:")
            print(f"  \"{analysis['text_content']}\"")
            print()
            
            print("Top words in dictionary:")
            print(f"  {', '.join(analysis['words'][:10])}")
            print()
            
            print("Common bigrams:")
            for bigram, count in analysis['common_bigrams'][:5]:
                print(f"  '{bigram}': {count}")
            print()
            
            print("Common trigrams:")
            for trigram, count in analysis['common_trigrams'][:5]:
                print(f"  '{trigram}': {count}")
            print()
    
    # Comparative analysis
    print("\n" + "=" * 50)
    print("DICTIONARY SIMILARITY ANALYSIS")
    print("=" * 50)
    
    # Create dictionaries for all items and compare
    dictionaries = {}
    for item_id in items:
        content = load_content_file(item_id)
        dictionaries[item_id] = create_dictionary(content)
    
    # Find most similar dictionary pairs
    similarities = []
    items_list = list(items)
    
    for i, item1 in enumerate(items_list):
        for j, item2 in enumerate(items_list):
            if i < j:
                dict1 = dictionaries[item1]
                dict2 = dictionaries[item2]
                
                # Simple byte-level similarity (Jaccard coefficient of bytes)
                set1 = set(dict1)
                set2 = set(dict2)
                similarity = len(set1 & set2) / len(set1 | set2) if (set1 | set2) else 0
                
                similarities.append((similarity, item1, item2))
    
    similarities.sort(reverse=True)
    
    print("\nMost similar dictionary byte patterns:")
    for i, (sim, item1, item2) in enumerate(similarities[:10]):
        name1 = get_display_name(item1)
        name2 = get_display_name(item2)
        print(f"{i+1:2d}. {name1} ↔ {name2}: {sim:.3f}")
    
    print("\nLeast similar dictionary byte patterns:")
    for i, (sim, item1, item2) in enumerate(similarities[-10:]):
        name1 = get_display_name(item1)
        name2 = get_display_name(item2)
        print(f"{i+1:2d}. {name1} ↔ {name2}: {sim:.3f}")

if __name__ == "__main__":
    main()