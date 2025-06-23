#!/usr/bin/env python3
"""
Debug dictionary sizes to understand why we still get negative values
"""

import os
from pathlib import Path

def create_dictionary(content, dict_size=1024):
    """Create a fixed-size dictionary from first 20% of content"""
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

# Load sample data
three_categories_dir = Path("public/data/three_categories")

for file_path in sorted(three_categories_dir.glob("*.txt")):
    item_name = file_path.stem
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    # Create dictionary and check sizes
    dict_bytes = create_dictionary(content)
    content_bytes = content.encode('utf-8')
    
    # Calculate 50% and 50% sizes
    fifty_percent = len(content_bytes) // 2
    
    print(f"{item_name:15} | Content: {len(content_bytes):4} bytes | 50%: {fifty_percent:4} bytes | Dict: {len(dict_bytes):4} bytes | Test: {fifty_percent:4} bytes")