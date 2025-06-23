#!/usr/bin/env python3
"""
Script to run the complete programming language analysis pipeline
and update the web widget with fresh data.
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def main():
    """Run the complete analysis pipeline"""
    print("🚀 Starting Programming Language Analysis Pipeline")
    
    # Change to project root
    os.chdir(Path(__file__).parent.parent)
    
    # Step 1: Collect data from Rosetta Code (optional - only if data doesn't exist)
    if not Path("data/programming_languages").exists() or len(list(Path("data/programming_languages").glob("*_consolidated.txt"))) < 10:
        print("\n📥 No existing language data found, collecting from Rosetta Code...")
        if not run_command("scripts/venv/bin/python scripts/collect-rosetta-code.py --max-tasks 50", "Data collection"):
            print("❌ Data collection failed, but continuing with existing data...")
    else:
        print("\n📁 Using existing language data (skip collection)")
    
    # Step 2: Run compression analysis
    if not run_command("scripts/venv/bin/python scripts/compression_analysis.py --method all", "Compression analysis"):
        print("❌ Compression analysis failed")
        return False
    
    # Step 3: Verify web-accessible files exist
    public_data_dir = Path("public/data/programming_languages")
    if not public_data_dir.exists():
        print("❌ Public data directory not created")
        return False
        
    analysis_file = public_data_dir / "compression_analysis_results.json"
    if not analysis_file.exists():
        print("❌ Analysis results not found in public directory")
        return False
    
    print(f"\n✅ Analysis complete! Results available at:")
    print(f"   📊 {analysis_file}")
    print(f"\n🌐 Web widget will automatically load the new data")
    print(f"   Visit the Coding Theory chapter to see the updated visualization")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)