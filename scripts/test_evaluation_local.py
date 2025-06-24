#!/usr/bin/env python3
"""
Test the LLM evaluation locally with a small model to verify the algorithm works.
"""

import json
import sys
from pathlib import Path

# Add the current directory to path to import the evaluation script
sys.path.append(str(Path(__file__).parent))

try:
    from evaluate_llms_runpod import LLMEvaluator, load_snapshots
    print("Successfully imported evaluation modules")
except ImportError as e:
    print(f"Import error: {e}")
    print("Installing required packages...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "transformers", "torch", "numpy", "tqdm"])
    from evaluate_llms_runpod import LLMEvaluator, load_snapshots

def test_evaluation():
    """Test evaluation on a few snapshots with distilgpt2."""
    print("Testing LLM evaluation with DistilGPT2...")
    
    # Load snapshots
    snapshots_file = "/home/vasek/problens-web/public/data/prediction_snapshots.json"
    try:
        snapshots = load_snapshots(snapshots_file)
    except FileNotFoundError:
        print(f"Error: Snapshots file not found at {snapshots_file}")
        print("Please run scrape_wikipedia_snapshots.py first")
        return
    
    # Test with first 5 snapshots and distilgpt2 (small, fast model)
    test_snapshots = snapshots[:5]
    
    try:
        # Initialize evaluator with small model
        evaluator = LLMEvaluator("distilgpt2")
        
        print(f"\nTesting on {len(test_snapshots)} snapshots:")
        print("-" * 60)
        
        results = []
        for i, snapshot in enumerate(test_snapshots):
            print(f"\nSnapshot {i+1}:")
            print(f"Context: '{snapshot['first_sentence']} {snapshot['context']}'")
            print(f"Target letter: '{snapshot['target_letter']}'")
            
            result = evaluator.evaluate_snapshot(snapshot)
            results.append(result)
            
            print(f"Cross-entropy score: {result['cross_entropy_score']:.2f}")
            print(f"Optimistic score: {result['optimistic_score']:.2f}")
        
        # Calculate averages
        avg_ce = sum(r['cross_entropy_score'] for r in results) / len(results)
        avg_opt = sum(r['optimistic_score'] for r in results) / len(results)
        
        print(f"\nAverage scores:")
        print(f"Cross-entropy: {avg_ce:.2f} bits")
        print(f"Optimistic: {avg_opt:.2f} bits")
        
        print("\nTest completed successfully! The evaluation algorithm works.")
        
    except Exception as e:
        print(f"Error during evaluation: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_evaluation()