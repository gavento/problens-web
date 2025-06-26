#!/usr/bin/env python3
"""
Calibrate chi-square thresholds for the CoinFlipRandomnessWidget
through Monte Carlo simulation.
"""

import numpy as np
import json
from typing import Dict, List, Tuple
import time

def generate_random_sequence(n: int) -> List[int]:
    """Generate a random binary sequence of length n."""
    return np.random.randint(0, 2, n).tolist()

def count_kmers(sequence: List[int], k: int) -> Dict[str, int]:
    """Count occurrences of all k-mers in the sequence."""
    counts = {}
    
    # Initialize all possible k-mers to 0
    for i in range(2**k):
        kmer = format(i, f'0{k}b')
        counts[kmer] = 0
    
    # Count k-mers
    for i in range(len(sequence) - k + 1):
        kmer = ''.join(str(bit) for bit in sequence[i:i+k])
        counts[kmer] += 1
    
    return counts

def compute_chi_square(sequence: List[int], k: int) -> float:
    """Compute chi-square statistic for k-mer distribution."""
    n = len(sequence)
    num_kmers = n - k + 1
    
    if num_kmers < 5:  # Not enough observations
        return 0.0
    
    observed = count_kmers(sequence, k)
    expected = num_kmers / (2**k)
    
    chi_square = 0.0
    for kmer, obs_count in observed.items():
        if expected > 0:
            chi_square += (obs_count - expected)**2 / expected
    
    return chi_square

def simulate_thresholds(num_simulations: int = 10000) -> Dict[Tuple[int, int], float]:
    """
    Run Monte Carlo simulation to find 95th percentile thresholds.
    Returns dict mapping (n, k) to threshold.
    """
    print(f"Running {num_simulations} simulations...")
    
    # Sequence lengths to test
    sequence_lengths = list(range(10, 201, 10))  # 10, 20, 30, ..., 200
    k_values = [1, 2, 3, 4]
    
    thresholds = {}
    
    for n in sequence_lengths:
        print(f"\nProcessing n={n}...")
        
        for k in k_values:
            if n - k + 1 < 5:  # Skip if too few k-mers
                continue
                
            chi_squares = []
            start_time = time.time()
            
            # Run simulations
            for _ in range(num_simulations):
                seq = generate_random_sequence(n)
                chi_sq = compute_chi_square(seq, k)
                chi_squares.append(chi_sq)
            
            # Find 95th percentile
            chi_squares.sort()
            percentile_95 = chi_squares[int(0.95 * num_simulations)]
            thresholds[(n, k)] = percentile_95
            
            elapsed = time.time() - start_time
            print(f"  k={k}: 95th percentile = {percentile_95:.3f} "
                  f"(theoretical: {get_theoretical_threshold(k):.3f}) "
                  f"[{elapsed:.1f}s]")
    
    return thresholds

def get_theoretical_threshold(k: int) -> float:
    """Get theoretical chi-square threshold for given k."""
    # Chi-square critical values at 95% confidence level
    # df = 2^k - 1
    chi_square_95 = {
        1: 3.841,   # df = 1
        2: 7.815,   # df = 3
        3: 14.067,  # df = 7
        4: 24.996   # df = 15
    }
    return chi_square_95.get(k, 30.0)

def create_threshold_function(thresholds: Dict[Tuple[int, int], float]) -> str:
    """
    Create TypeScript code for the threshold function based on empirical data.
    """
    # Convert to nested dict for easier access
    by_k = {}
    for (n, k), threshold in thresholds.items():
        if k not in by_k:
            by_k[k] = {}
        by_k[k][n] = threshold
    
    code = """// Empirically determined chi-square thresholds (95th percentile)
// Based on {} simulations for each (n, k) pair
const EMPIRICAL_THRESHOLDS: Record<number, Record<number, number>> = {{
""".format(num_simulations)
    
    for k in sorted(by_k.keys()):
        code += f"  {k}: {{\n"
        for n in sorted(by_k[k].keys()):
            code += f"    {n}: {by_k[k][n]:.3f},\n"
        code += "  },\n"
    
    code += """};

// Get empirically calibrated threshold for given k and sequence length
const getEmpiricalThreshold = (k: number, sequenceLength: number): number => {
  const kThresholds = EMPIRICAL_THRESHOLDS[k];
  if (!kThresholds) return 30; // fallback
  
  // Find the two nearest sequence lengths
  const lengths = Object.keys(kThresholds).map(Number).sort((a, b) => a - b);
  
  // If exact match, return it
  if (kThresholds[sequenceLength]) {
    return kThresholds[sequenceLength];
  }
  
  // If below minimum or above maximum, use nearest
  if (sequenceLength <= lengths[0]) {
    return kThresholds[lengths[0]];
  }
  if (sequenceLength >= lengths[lengths.length - 1]) {
    return kThresholds[lengths[lengths.length - 1]];
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
  
  const lowerThreshold = kThresholds[lower];
  const upperThreshold = kThresholds[upper];
  const ratio = (sequenceLength - lower) / (upper - lower);
  
  return lowerThreshold + ratio * (upperThreshold - lowerThreshold);
};"""
    
    return code

def save_results(thresholds: Dict[Tuple[int, int], float], filename: str = "randomness_thresholds.json"):
    """Save results to JSON file."""
    # Convert tuple keys to strings for JSON
    json_data = {
        f"{n},{k}": threshold 
        for (n, k), threshold in thresholds.items()
    }
    
    with open(filename, 'w') as f:
        json.dump(json_data, f, indent=2)
    
    print(f"\nResults saved to {filename}")

if __name__ == "__main__":
    import sys
    
    # Number of simulations (can be overridden by command line argument)
    num_simulations = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
    
    print(f"Calibrating chi-square thresholds for coin flip randomness test")
    print(f"This may take a while...")
    
    # Run simulations
    start_time = time.time()
    thresholds = simulate_thresholds(num_simulations)
    total_time = time.time() - start_time
    
    print(f"\nTotal simulation time: {total_time:.1f} seconds")
    
    # Save raw results
    save_results(thresholds)
    
    # Generate TypeScript code
    ts_code = create_threshold_function(thresholds)
    
    # Save TypeScript code
    with open("randomness_thresholds.ts", 'w') as f:
        f.write(ts_code)
    
    print("\nTypeScript code saved to randomness_thresholds.ts")
    print("\nSummary of results:")
    print("n\tk=1\tk=2\tk=3\tk=4")
    
    for n in range(10, 201, 10):
        row = f"{n}"
        for k in [1, 2, 3, 4]:
            if (n, k) in thresholds:
                row += f"\t{thresholds[(n, k)]:.2f}"
            else:
                row += "\t-"
        print(row)