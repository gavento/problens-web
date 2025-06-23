#!/usr/bin/env python3
"""
Test Zstd dictionary compression: Train dictionary on C, compress C++ with it.
"""

import os
import subprocess
import tempfile
from pathlib import Path

def test_zstd_dictionary():
    # Paths
    c_file = Path("public/data/programming_languages/c_consolidated.txt")
    cpp_file = Path("public/data/programming_languages/cpp_consolidated.txt")
    
    if not c_file.exists() or not cpp_file.exists():
        print("Error: C or C++ consolidated files not found")
        return
    
    # Read the data
    with open(c_file, 'r') as f:
        c_data = f.read()
    with open(cpp_file, 'r') as f:
        cpp_data = f.read()
    
    print(f"C code size: {len(c_data)} bytes ({len(c_data)/1024:.1f} KB)")
    print(f"C++ code size: {len(cpp_data)} bytes ({len(cpp_data)/1024:.1f} KB)")
    
    # Create temporary files
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)
        
        # Write C samples for dictionary training
        c_samples_dir = tmpdir / "c_samples"
        c_samples_dir.mkdir()
        
        # Split C code into multiple samples (Zstd needs multiple samples for training)
        lines = c_data.split('\n')
        chunk_size = len(lines) // 10  # Split into ~10 chunks
        
        for i in range(10):
            start = i * chunk_size
            end = start + chunk_size if i < 9 else len(lines)
            chunk = '\n'.join(lines[start:end])
            
            sample_file = c_samples_dir / f"sample_{i}.c"
            with open(sample_file, 'w') as f:
                f.write(chunk)
        
        # Train dictionary
        dict_file = tmpdir / "c_dictionary.dict"
        print("\nTraining Zstd dictionary from C samples...")
        
        cmd = ['zstd', '--train', '-o', str(dict_file)]
        cmd.extend([str(f) for f in c_samples_dir.glob("*.c")])
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error training dictionary: {result.stderr}")
            return
        
        print(f"Dictionary created: {dict_file.stat().st_size} bytes")
        
        # Test compression of C++ with and without dictionary
        cpp_test_file = tmpdir / "test.cpp"
        with open(cpp_test_file, 'w') as f:
            f.write(cpp_data)
        
        # Compress without dictionary
        print("\nCompressing C++ without dictionary...")
        cpp_compressed_no_dict = tmpdir / "test_no_dict.cpp.zst"
        cmd = ['zstd', '-f', str(cpp_test_file), '-o', str(cpp_compressed_no_dict)]
        subprocess.run(cmd, check=True)
        no_dict_size = cpp_compressed_no_dict.stat().st_size
        
        # Compress with C dictionary
        print("Compressing C++ with C dictionary...")
        cpp_compressed_with_dict = tmpdir / "test_with_dict.cpp.zst"
        cmd = ['zstd', '-f', '-D', str(dict_file), str(cpp_test_file), '-o', str(cpp_compressed_with_dict)]
        subprocess.run(cmd, check=True)
        with_dict_size = cpp_compressed_with_dict.stat().st_size
        
        # Results
        print("\n" + "="*50)
        print("RESULTS:")
        print("="*50)
        print(f"Original C++ size: {len(cpp_data):,} bytes")
        print(f"Compressed without dictionary: {no_dict_size:,} bytes ({no_dict_size/len(cpp_data):.1%})")
        print(f"Compressed with C dictionary: {with_dict_size:,} bytes ({with_dict_size/len(cpp_data):.1%})")
        print(f"Improvement: {no_dict_size - with_dict_size:,} bytes ({(no_dict_size - with_dict_size)/no_dict_size:.1%})")
        print(f"Compression ratio: {with_dict_size/no_dict_size:.3f}")

if __name__ == "__main__":
    # Check if zstd is installed
    result = subprocess.run(['which', 'zstd'], capture_output=True)
    if result.returncode != 0:
        print("Error: zstd is not installed. Install it with: sudo apt-get install zstd")
        exit(1)
    
    test_zstd_dictionary()