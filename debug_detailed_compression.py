#!/usr/bin/env python3
"""
Debug the generalized divergence calculation in detail
"""

import json
import zlib
from pathlib import Path

def create_dictionary(content, dict_size=32768):
    """Create a 32KB dictionary from content"""
    content_bytes = content.encode('utf-8', errors='replace')
    
    # If content is less than 32KB, repeat it
    if len(content_bytes) < dict_size:
        repeat_times = (dict_size // len(content_bytes)) + 1
        content_bytes = content_bytes * repeat_times
    
    # Truncate to exactly 32KB
    return content_bytes[:dict_size]

def compress_with_deflate(data, dictionary=None):
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

# Load sample data
lion_path = Path("public/data/three_categories/animal_lion.txt")
tiger_path = Path("public/data/three_categories/animal_tiger.txt")

with open(lion_path, 'r') as f:
    lion_content = f.read()
    
with open(tiger_path, 'r') as f:
    tiger_content = f.read()

print(f"Lion content length: {len(lion_content)} chars")
print(f"Tiger content length: {len(tiger_content)} chars")

# Create dictionaries
dict_lion = create_dictionary(lion_content)
dict_tiger = create_dictionary(tiger_content)

print(f"Lion dictionary size: {len(dict_lion)} bytes")
print(f"Tiger dictionary size: {len(dict_tiger)} bytes")

# Test compression of Lion content
lion_bytes = lion_content.encode('utf-8')
lion_self_compressed = compress_with_deflate(lion_content, dictionary=dict_lion)
lion_cross_compressed = compress_with_deflate(lion_content, dictionary=dict_tiger)
lion_no_dict = compress_with_deflate(lion_content, dictionary=None)

print(f"\nLion content ({len(lion_bytes)} bytes):")
print(f"  Self-compressed: {len(lion_self_compressed)} bytes")
print(f"  Cross-compressed (tiger dict): {len(lion_cross_compressed)} bytes")
print(f"  No dictionary: {len(lion_no_dict)} bytes")

# Calculate bits per character
lion_self_bits_per_char = (len(lion_self_compressed) * 8) / len(lion_bytes)
lion_cross_bits_per_char = (len(lion_cross_compressed) * 8) / len(lion_bytes)
lion_no_dict_bits_per_char = (len(lion_no_dict) * 8) / len(lion_bytes)

print(f"\nBits per character:")
print(f"  Self-compressed: {lion_self_bits_per_char:.3f} bits/char")
print(f"  Cross-compressed: {lion_cross_bits_per_char:.3f} bits/char")
print(f"  No dictionary: {lion_no_dict_bits_per_char:.3f} bits/char")

# The divergence calculation
divergence = lion_cross_bits_per_char - lion_self_bits_per_char
print(f"\nDivergence (cross - self): {divergence:.3f} bits/char")

# Test what happens with identical content
print(f"\n--- Testing with identical content ---")
lion_self_compressed_identical = compress_with_deflate(lion_content, dictionary=dict_lion)
lion_cross_compressed_identical = compress_with_deflate(lion_content, dictionary=dict_lion)

identical_self_bits = (len(lion_self_compressed_identical) * 8) / len(lion_bytes)
identical_cross_bits = (len(lion_cross_compressed_identical) * 8) / len(lion_bytes)

print(f"Lion with lion dict: {identical_self_bits:.3f} bits/char")
print(f"Lion with lion dict (again): {identical_cross_bits:.3f} bits/char")
print(f"Difference: {identical_cross_bits - identical_self_bits:.3f} bits/char")

# Test compression ratio interpretation
print(f"\n--- Compression ratios ---")
print(f"Original size: {len(lion_bytes)} bytes")
print(f"Self-compressed: {len(lion_self_compressed)} bytes (ratio: {len(lion_self_compressed)/len(lion_bytes):.3f})")
print(f"Cross-compressed: {len(lion_cross_compressed)} bytes (ratio: {len(lion_cross_compressed)/len(lion_bytes):.3f})")

# What should the ideal result be?
print(f"\n--- Expected vs Actual ---")
print(f"If we expect ~1 bit/char difference, that's:")
print(f"  Expected cross: {lion_self_bits_per_char + 1:.3f} bits/char")
print(f"  Actual cross: {lion_cross_bits_per_char:.3f} bits/char")
print(f"  The issue: both self and cross compression are already quite high (~4-5 bits/char)")
print(f"  This suggests the dictionary isn't helping much with compression")