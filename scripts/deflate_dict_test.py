#!/usr/bin/env python3
"""
Test DEFLATE dictionary compression: C dictionary on C++ code.
Uses static Huffman codes (Z_FIXED) to prevent adaptation.
"""

import zlib
from pathlib import Path

def test_deflate_dictionary():
    data_dir = Path("public/data/programming_languages")
    
    # Load C dictionary
    c_dict_file = data_dir / "c_dictionary.bin"
    with open(c_dict_file, 'rb') as f:
        c_dict = f.read()
    
    print(f"C dictionary loaded: {len(c_dict)} bytes")
    
    # Load C++ code
    cpp_file = data_dir / "cpp_consolidated.txt"
    with open(cpp_file, 'r', encoding='utf-8') as f:
        cpp_code = f.read()
    
    cpp_bytes = cpp_code.encode('utf-8')
    print(f"C++ code loaded: {len(cpp_bytes)} bytes ({len(cpp_bytes)/1024:.1f} KB)")
    
    # Test 1: Compress C++ without dictionary
    print("\n1. Compressing C++ WITHOUT dictionary (static Huffman)...")
    comp_no_dict = zlib.compressobj(
        level=9,
        method=zlib.DEFLATED,
        wbits=-zlib.MAX_WBITS,  # Raw DEFLATE (no headers)
        memLevel=8,
        strategy=zlib.Z_FIXED   # Static Huffman - no adaptation
    )
    compressed_no_dict = comp_no_dict.compress(cpp_bytes) + comp_no_dict.flush()
    print(f"   Compressed size: {len(compressed_no_dict)} bytes ({len(compressed_no_dict)/len(cpp_bytes):.1%})")
    
    # Test 2: Compress C++ with C dictionary
    print("\n2. Compressing C++ WITH C dictionary (static Huffman)...")
    comp_with_dict = zlib.compressobj(
        level=9,
        method=zlib.DEFLATED,
        wbits=-zlib.MAX_WBITS,  # Raw DEFLATE (no headers)
        memLevel=8,
        strategy=zlib.Z_FIXED,  # Static Huffman - no adaptation
        zdict=c_dict            # Preset dictionary
    )
    compressed_with_dict = comp_with_dict.compress(cpp_bytes) + comp_with_dict.flush()
    print(f"   Compressed size: {len(compressed_with_dict)} bytes ({len(compressed_with_dict)/len(cpp_bytes):.1%})")
    
    # Compare results
    print("\n" + "="*50)
    print("RESULTS:")
    print("="*50)
    print(f"Original C++ size: {len(cpp_bytes):,} bytes")
    print(f"Without dictionary: {len(compressed_no_dict):,} bytes ({len(compressed_no_dict)/len(cpp_bytes):.1%})")
    print(f"With C dictionary: {len(compressed_with_dict):,} bytes ({len(compressed_with_dict)/len(cpp_bytes):.1%})")
    print(f"Bytes saved: {len(compressed_no_dict) - len(compressed_with_dict):,}")
    print(f"Improvement: {(len(compressed_no_dict) - len(compressed_with_dict))/len(compressed_no_dict):.1%}")
    print(f"Compression ratio: {len(compressed_with_dict)/len(compressed_no_dict):.3f}")
    
    # Verify decompression works
    print("\n3. Verifying decompression...")
    decomp = zlib.decompressobj(-zlib.MAX_WBITS, zdict=c_dict)
    recovered = decomp.decompress(compressed_with_dict) + decomp.flush()
    assert recovered == cpp_bytes, "Decompression failed!"
    print("   ✓ Decompression successful")
    
    # Test 3: Compress same data twice to verify no adaptation
    print("\n4. Testing for adaptation (compressing twice)...")
    comp_test = zlib.compressobj(
        level=9,
        method=zlib.DEFLATED,
        wbits=-zlib.MAX_WBITS,
        memLevel=8,
        strategy=zlib.Z_FIXED,
        zdict=c_dict
    )
    
    # Split C++ code in half
    half = len(cpp_bytes) // 2
    part1 = cpp_bytes[:half]
    part2 = cpp_bytes[half:]
    
    # Compress both parts
    compressed_part1 = comp_test.compress(part1)
    compressed_part2 = comp_test.compress(part2)
    compressed_final = compressed_part1 + compressed_part2 + comp_test.flush()
    
    # Now compress second part with fresh compressor (should be same if no adaptation)
    comp_test2 = zlib.compressobj(
        level=9,
        method=zlib.DEFLATED,
        wbits=-zlib.MAX_WBITS,
        memLevel=8,
        strategy=zlib.Z_FIXED,
        zdict=c_dict
    )
    # Skip first part to align states
    _ = comp_test2.compress(part1)
    compressed_part2_fresh = comp_test2.compress(part2)
    
    print(f"   Part 2 compressed after part 1: {len(compressed_part2)} bytes")
    print(f"   Part 2 compressed fresh: {len(compressed_part2_fresh)} bytes")
    
    if compressed_part2 == compressed_part2_fresh:
        print("   ✓ No adaptation detected - compression is static!")
    else:
        print("   ⚠ Warning: Compression may be adapting")

if __name__ == "__main__":
    test_deflate_dictionary()