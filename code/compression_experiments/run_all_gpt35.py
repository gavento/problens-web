#!/usr/bin/env python3
"""
Run GPT-3.5-turbo-instruct compression analysis on all text files.

Usage:
    OPENAI_API_KEY='your-key' python run_all_gpt35.py
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    """Run analysis on all text files."""
    
    # Check API key
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable not set")
        print("Usage: OPENAI_API_KEY='your-key' python run_all_gpt35.py")
        sys.exit(1)
    
    # Find all text files
    texts_dir = Path("texts")
    if not texts_dir.exists():
        print("Error: texts/ directory not found")
        sys.exit(1)
    
    text_files = list(texts_dir.glob("*.txt"))
    if not text_files:
        print("Error: No .txt files found in texts/ directory")
        sys.exit(1)
    
    print(f"Found {len(text_files)} text files:")
    for f in text_files:
        print(f"  - {f.name}")
    
    print(f"\nRunning GPT-3.5-turbo-instruct analysis...")
    
    # Run analysis on each file
    failed = []
    completed = []
    
    for i, text_file in enumerate(text_files, 1):
        print(f"\n{'='*60}")
        print(f"Processing {i}/{len(text_files)}: {text_file.name}")
        print(f"{'='*60}")
        
        try:
            # Run the analysis script
            result = subprocess.run([
                sys.executable, 
                "analyze_openai_logprobs.py", 
                str(text_file)
            ], check=True, capture_output=False)
            
            completed.append(text_file.name)
            print(f"✅ Completed: {text_file.name}")
            
        except subprocess.CalledProcessError as e:
            failed.append(text_file.name)
            print(f"❌ Failed: {text_file.name} (exit code {e.returncode})")
        except Exception as e:
            failed.append(text_file.name)
            print(f"❌ Error: {text_file.name} - {e}")
    
    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Total files: {len(text_files)}")
    print(f"Completed: {len(completed)}")
    print(f"Failed: {len(failed)}")
    
    if completed:
        print(f"\n✅ Successfully analyzed:")
        for name in completed:
            print(f"  - {name}")
    
    if failed:
        print(f"\n❌ Failed to analyze:")
        for name in failed:
            print(f"  - {name}")
        sys.exit(1)
    else:
        print(f"\n🎉 All analyses completed successfully!")

if __name__ == "__main__":
    main()