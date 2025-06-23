#!/usr/bin/env python3
"""
Print the exact dictionary contents for any item
"""

from pathlib import Path
import sys

def load_content_file(item_id):
    """Load content for a specific item"""
    # Get project root (parent of scripts directory)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    content_path = project_root / f"public/data/three_categories/{item_id}.txt"
    if not content_path.exists():
        print(f"Error: File {content_path} not found")
        return None
    
    with open(content_path, 'r', encoding='utf-8', errors='replace') as f:
        return f.read()

def create_dictionary(content, dict_size=1024):
    """Create frequency-based dictionary from most common patterns in first 50% of content (matches analyze_three_categories.py)"""
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

def print_dictionary(item_id, dict_size=1024, show_bytes=False):
    """Print dictionary for a given item"""
    content = load_content_file(item_id)
    if content is None:
        return
    
    dictionary = create_dictionary(content, dict_size)
    
    print(f"Dictionary for {item_id}")
    print("=" * 50)
    print(f"Source content length: {len(content)} characters")
    print(f"Dictionary size: {len(dictionary)} bytes")
    print(f"Built from first {len(content.encode('utf-8'))//2} bytes of content")
    print()
    
    # Convert dictionary back to text (with error handling)
    try:
        dict_text = dictionary.decode('utf-8', errors='replace')
        # Remove null padding for display
        dict_text_clean = dict_text.rstrip('\x00')
        
        print("Dictionary content (as text):")
        print("-" * 30)
        print(repr(dict_text_clean))
        print()
        
        print("Dictionary content (readable):")
        print("-" * 30)
        print(dict_text_clean)
        print()
        
    except Exception as e:
        print(f"Error decoding dictionary as text: {e}")
    
    if show_bytes:
        print("Dictionary content (first 100 bytes as hex):")
        print("-" * 30)
        hex_view = ' '.join(f'{b:02x}' for b in dictionary[:100])
        print(hex_view)
        if len(dictionary) > 100:
            print("...")
        print()

def list_available_items():
    """List all available items"""
    # Get project root (parent of scripts directory)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    data_dir = project_root / "public/data/three_categories"
    if not data_dir.exists():
        print(f"Error: Directory {data_dir} not found")
        return []
    
    items = []
    for file_path in data_dir.glob("*.txt"):
        items.append(file_path.stem)
    
    return sorted(items)

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 print_dictionary.py <item_id> [dict_size] [--bytes]")
        print()
        print("Available items:")
        items = list_available_items()
        for item in items:
            print(f"  {item}")
        print()
        print("Examples:")
        print("  python3 print_dictionary.py animal_elephant")
        print("  python3 print_dictionary.py fruit_pear 512")
        print("  python3 print_dictionary.py country_japan 1024 --bytes")
        return
    
    item_id = sys.argv[1]
    
    # Optional dictionary size
    dict_size = 1024
    if len(sys.argv) > 2 and sys.argv[2].isdigit():
        dict_size = int(sys.argv[2])
    
    # Optional bytes display
    show_bytes = '--bytes' in sys.argv
    
    print_dictionary(item_id, dict_size, show_bytes)

if __name__ == "__main__":
    main()