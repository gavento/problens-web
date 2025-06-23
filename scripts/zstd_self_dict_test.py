#!/usr/bin/env python3
"""
Test Zstd dictionary compression: Train dictionary on C++ and compress same C++ file.
"""

import os
import subprocess
import tempfile
from pathlib import Path

def test_self_dictionary():
    # Path
    cpp_file = Path("public/data/programming_languages/cpp_consolidated.txt")
    
    if not cpp_file.exists():
        print("Error: C++ consolidated file not found")
        return
    
    # Read the data
    with open(cpp_file, 'r') as f:
        cpp_data = f.read()
    
    print(f"C++ code size: {len(cpp_data)} bytes ({len(cpp_data)/1024:.1f} KB)")
    
    # Create temporary files
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)
        
        # Split C++ code into training samples and test data
        lines = cpp_data.split('\n')
        
        # Use 80% for training, 20% for testing
        train_size = int(len(lines) * 0.8)
        train_lines = lines[:train_size]
        test_lines = lines[train_size:]
        
        print(f"\nSplitting data:")
        print(f"  Training: {len('\\n'.join(train_lines))} bytes")
        print(f"  Testing: {len('\\n'.join(test_lines))} bytes")
        
        # Create training samples
        cpp_samples_dir = tmpdir / "cpp_samples"
        cpp_samples_dir.mkdir()
        
        # Split training data into chunks for dictionary training
        chunk_size = len(train_lines) // 10
        
        for i in range(10):
            start = i * chunk_size
            end = start + chunk_size if i < 9 else len(train_lines)
            chunk = '\n'.join(train_lines[start:end])
            
            sample_file = cpp_samples_dir / f"sample_{i}.cpp"
            with open(sample_file, 'w') as f:
                f.write(chunk)
        
        # Train dictionary on C++ training data
        dict_file = tmpdir / "cpp_dictionary.dict"
        print("\nTraining Zstd dictionary from C++ samples...")
        
        cmd = ['zstd', '--train', '-o', str(dict_file)]
        cmd.extend([str(f) for f in cpp_samples_dir.glob("*.cpp")])
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error training dictionary: {result.stderr}")
            return
        
        print(f"Dictionary created: {dict_file.stat().st_size} bytes")
        
        # Test compression on different scenarios
        
        # 1. Compress test portion without dictionary
        test_file = tmpdir / "test.cpp"
        test_data = '\n'.join(test_lines)
        with open(test_file, 'w') as f:
            f.write(test_data)
        
        print("\n1. Compressing test portion (20%)...")
        test_no_dict = tmpdir / "test_no_dict.cpp.zst"
        cmd = ['zstd', '-f', str(test_file), '-o', str(test_no_dict)]
        subprocess.run(cmd, check=True)
        test_no_dict_size = test_no_dict.stat().st_size
        
        # With dictionary
        test_with_dict = tmpdir / "test_with_dict.cpp.zst"
        cmd = ['zstd', '-f', '-D', str(dict_file), str(test_file), '-o', str(test_with_dict)]
        subprocess.run(cmd, check=True)
        test_with_dict_size = test_with_dict.stat().st_size
        
        # 2. Compress FULL file (including training data)
        full_file = tmpdir / "full.cpp"
        with open(full_file, 'w') as f:
            f.write(cpp_data)
        
        print("\n2. Compressing FULL C++ file...")
        full_no_dict = tmpdir / "full_no_dict.cpp.zst"
        cmd = ['zstd', '-f', str(full_file), '-o', str(full_no_dict)]
        subprocess.run(cmd, check=True)
        full_no_dict_size = full_no_dict.stat().st_size
        
        # With dictionary trained on part of itself
        full_with_dict = tmpdir / "full_with_dict.cpp.zst"
        cmd = ['zstd', '-f', '-D', str(dict_file), str(full_file), '-o', str(full_with_dict)]
        subprocess.run(cmd, check=True)
        full_with_dict_size = full_with_dict.stat().st_size
        
        # Results
        print("\n" + "="*60)
        print("RESULTS:")
        print("="*60)
        
        print("\nTest portion (unseen 20% of data):")
        print(f"  Original size: {len(test_data):,} bytes")
        print(f"  Without dictionary: {test_no_dict_size:,} bytes")
        print(f"  With C++ dictionary: {test_with_dict_size:,} bytes")
        print(f"  Improvement: {test_no_dict_size - test_with_dict_size:,} bytes ({(test_no_dict_size - test_with_dict_size)/test_no_dict_size:.1%})")
        
        print("\nFull file (including training data):")
        print(f"  Original size: {len(cpp_data):,} bytes")
        print(f"  Without dictionary: {full_no_dict_size:,} bytes ({full_no_dict_size/len(cpp_data):.1%})")
        print(f"  With C++ dictionary: {full_with_dict_size:,} bytes ({full_with_dict_size/len(cpp_data):.1%})")
        print(f"  Improvement: {full_no_dict_size - full_with_dict_size:,} bytes ({(full_no_dict_size - full_with_dict_size)/full_no_dict_size:.1%})")
        print(f"  Note: Dictionary adds {dict_file.stat().st_size:,} bytes overhead if transmitted")

if __name__ == "__main__":
    test_self_dictionary()