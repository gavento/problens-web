#!/usr/bin/env python3
"""
Calibrate chi-square thresholds for run length tests in the CoinFlipRandomnessWidget.
"""

import numpy as np
import json
from typing import Dict, List, Tuple
import time
from collections import Counter

def generate_random_sequence(n: int) -> List[int]:
    """Generate a random binary sequence of length n."""
    return np.random.randint(0, 2, n).tolist()

def get_run_lengths(sequence: List[int], run_type: int) -> List[int]:
    """
    Get all run lengths of a specific type (0 for T/tails, 1 for H/heads).
    Returns list of run lengths.
    """
    if not sequence:
        return []
    
    runs = []
    current_run_length = 0
    current_value = None
    
    for bit in sequence:
        if bit == run_type:
            if current_value == run_type:
                current_run_length += 1
            else:
                current_run_length = 1
                current_value = run_type
        else:
            if current_value == run_type and current_run_length > 0:
                runs.append(current_run_length)
                current_run_length = 0
            current_value = bit
    
    # Don't forget the last run if it ends with the target type
    if current_value == run_type and current_run_length > 0:
        runs.append(current_run_length)
    
    return runs

def compute_run_length_chi_square(sequence: List[int], run_type: int) -> float:
    """
    Compute chi-square statistic for run length distribution.
    Tests if run lengths follow geometric distribution with p=0.5.
    """
    n = len(sequence)
    if n < 10:
        return 0.0
    
    run_lengths = get_run_lengths(sequence, run_type)
    
    if len(run_lengths) == 0:
        return 0.0
    
    # For a fair coin, run lengths follow geometric distribution with p=0.5
    # P(run length = k) = (1-p)^(k-1) * p = 0.5^k
    # Expected number of runs of length k = total_runs * 0.5^k
    
    total_runs = len(run_lengths)
    
    # Group runs into categories: 1, 2, 3, 4, 5+
    max_category = 5
    observed = [0] * max_category
    
    for run_length in run_lengths:
        if run_length <= max_category - 1:
            observed[run_length - 1] += 1
        else:
            observed[max_category - 1] += 1  # 5+ category
    
    # Expected counts for geometric distribution
    expected = [0.0] * max_category
    for k in range(1, max_category):
        expected[k - 1] = total_runs * (0.5 ** k)
    
    # For 5+ category: sum of geometric series
    # P(X >= 5) = sum_{k=5}^∞ 0.5^k = 0.5^5 / (1 - 0.5) = 0.5^4 = 1/16
    expected[max_category - 1] = total_runs * (0.5 ** (max_category - 1))
    
    # Compute chi-square statistic
    chi_square = 0.0
    for i in range(max_category):
        if expected[i] > 0:
            chi_square += (observed[i] - expected[i]) ** 2 / expected[i]
    
    return chi_square

def simulate_run_thresholds(num_simulations: int = 10000) -> Dict[Tuple[int, str], float]:
    """
    Run Monte Carlo simulation to find 95th percentile thresholds for run length tests.
    Returns dict mapping (n, run_type) to threshold.
    """
    print(f"Running {num_simulations} simulations for run length tests...")
    
    # Sequence lengths to test
    sequence_lengths = list(range(10, 201, 10))  # 10, 20, 30, ..., 200
    run_types = ['H', 'T']  # Test both heads and tails runs
    
    thresholds = {}
    
    for n in sequence_lengths:
        print(f"\nProcessing n={n}...")
        
        for run_type_name in run_types:
            run_type = 1 if run_type_name == 'H' else 0
            
            chi_squares = []
            start_time = time.time()
            
            # Run simulations
            for _ in range(num_simulations):
                seq = generate_random_sequence(n)
                chi_sq = compute_run_length_chi_square(seq, run_type)
                chi_squares.append(chi_sq)
            
            # Find 95th percentile
            chi_squares.sort()
            percentile_95 = chi_squares[int(0.95 * num_simulations)]
            thresholds[(n, run_type_name)] = percentile_95
            
            elapsed = time.time() - start_time
            print(f"  {run_type_name} runs: 95th percentile = {percentile_95:.3f} "
                  f"(theoretical df=4: {9.488:.3f}) [{elapsed:.1f}s]")
    
    return thresholds

def create_run_threshold_function(thresholds: Dict[Tuple[int, str], float]) -> str:
    """
    Create TypeScript code for the run length threshold function.
    """
    # Convert to nested dict for easier access
    by_type = {}
    for (n, run_type), threshold in thresholds.items():
        if run_type not in by_type:
            by_type[run_type] = {}
        by_type[run_type][n] = threshold
    
    code = """// Empirically determined chi-square thresholds for run length tests (95th percentile)
// Based on {} simulations for each (n, run_type) pair
const RUN_LENGTH_THRESHOLDS: Record<string, Record<number, number>> = {{
""".format(num_simulations)
    
    for run_type in sorted(by_type.keys()):
        code += f"  '{run_type}': {{\n"
        for n in sorted(by_type[run_type].keys()):
            code += f"    {n}: {by_type[run_type][n]:.3f},\n"
        code += "  },\n"
    
    code += """};

// Get empirically calibrated threshold for run length tests
const getRunLengthThreshold = (runType: string, sequenceLength: number): number => {
  const typeThresholds = RUN_LENGTH_THRESHOLDS[runType];
  if (!typeThresholds) return 15; // fallback
  
  // Find the two nearest sequence lengths
  const lengths = Object.keys(typeThresholds).map(Number).sort((a, b) => a - b);
  
  // If exact match, return it
  if (typeThresholds[sequenceLength]) {
    return typeThresholds[sequenceLength];
  }
  
  // If below minimum or above maximum, use nearest
  if (sequenceLength <= lengths[0]) {
    return typeThresholds[lengths[0]];
  }
  if (sequenceLength >= lengths[lengths.length - 1]) {
    return typeThresholds[lengths[lengths.length - 1]];
  }
  
  // Linear interpolation between nearest points
  let lower = lengths[0];
  let upper = lengths[1];
  
  for (let i = 0; i < lengths.length - 1; i++) {
    if (lengths[i] <= sequenceLength && sequenceLength <= lengths[i + 1]) {
      lower = lengths[i];
      upper = lengths[i + 1];
      break;
    }
  }
  
  const lowerThreshold = typeThresholds[lower];
  const upperThreshold = typeThresholds[upper];
  const ratio = (sequenceLength - lower) / (upper - lower);
  
  return lowerThreshold + ratio * (upperThreshold - lowerThreshold);
};"""
    
    return code

def save_run_results(thresholds: Dict[Tuple[int, str], float], filename: str = "run_length_thresholds.json"):
    """Save results to JSON file."""
    # Convert tuple keys to strings for JSON
    json_data = {
        f"{n},{run_type}": threshold 
        for (n, run_type), threshold in thresholds.items()
    }
    
    with open(filename, 'w') as f:
        json.dump(json_data, f, indent=2)
    
    print(f"\nResults saved to {filename}")

if __name__ == "__main__":
    import sys
    
    # Number of simulations (can be overridden by command line argument)
    num_simulations = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
    
    print(f"Calibrating chi-square thresholds for run length tests")
    print(f"This will test both H-runs and T-runs...")
    
    # Run simulations
    start_time = time.time()
    thresholds = simulate_run_thresholds(num_simulations)
    total_time = time.time() - start_time
    
    print(f"\nTotal simulation time: {total_time:.1f} seconds")
    
    # Save raw results
    save_run_results(thresholds)
    
    # Generate TypeScript code
    ts_code = create_run_threshold_function(thresholds)
    
    # Save TypeScript code
    with open("run_length_thresholds.ts", 'w') as f:
        f.write(ts_code)
    
    print("\nTypeScript code saved to run_length_thresholds.ts")
    print("\nSummary of results:")
    print("n\tH-runs\tT-runs")
    
    for n in range(10, 201, 10):
        row = f"{n}"
        for run_type in ['H', 'T']:
            if (n, run_type) in thresholds:
                row += f"\t{thresholds[(n, run_type)]:.2f}"
            else:
                row += "\t-"
        print(row)