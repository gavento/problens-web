#!/usr/bin/env python3
"""
Precompute XKCD countdown probability data for fast widget performance.
Generates lookup tables for all 1M possible numbers at different λ values.
"""

import json
import numpy as np
from pathlib import Path
import time

def create_bins():
    """Create log-scale bins from 10^0 to 10^14 in half-decade intervals."""
    bins = []
    for i in range(14):
        # First half of decade: 10^i to 10^(i+0.5)
        bins.append({
            'min': 10**i,
            'max': 10**(i + 0.5),
            'index': len(bins)
        })
        # Second half of decade: 10^(i+0.5) to 10^(i+1)
        bins.append({
            'min': 10**(i + 0.5),
            'max': 10**(i + 1),
            'index': len(bins)
        })
    return bins

def find_bin_index(number, bins):
    """Find which bin a number belongs to."""
    for i, bin_info in enumerate(bins):
        if bin_info['min'] <= number < bin_info['max']:
            return i
    # Handle edge case for maximum value
    if number == bins[-1]['max']:
        return len(bins) - 1
    return -1

def precompute_posterior_data():
    """Precompute all posterior probability data."""
    print("Starting XKCD countdown precomputation...")
    
    # Constants
    evidence_digits = "00002382"
    target_number = 2382
    total_digits = 14
    evidence_space = 10**(total_digits - len(evidence_digits))  # 10^6
    
    # Lambda values to precompute (0.0 to 2.0 in 0.1 increments)
    lambda_values = [round(i * 0.1, 1) for i in range(21)]  # [0.0, 0.1, ..., 2.0]
    
    # Create bins
    bins = create_bins()
    
    print(f"Computing for {len(lambda_values)} λ values: {lambda_values}")
    print(f"Processing {evidence_space:,} numbers...")
    
    # Precompute bin assignments for all numbers (this is independent of λ)
    print("Precomputing bin assignments...")
    bin_assignments = {}
    base_number = int(evidence_digits)
    
    for prefix in range(evidence_space):
        full_number = prefix * (10**len(evidence_digits)) + base_number
        if full_number > 0:
            bin_index = find_bin_index(full_number, bins)
            if bin_index >= 0:
                bin_assignments[prefix] = {
                    'number': full_number,
                    'bin_index': bin_index,
                    'is_target': full_number == target_number
                }
    
    print(f"Found {len(bin_assignments):,} valid numbers")
    
    # Precompute weights for all λ values
    print("Precomputing weights for all λ values...")
    
    lambda_data = {}
    
    for lambda_val in lambda_values:
        print(f"  Computing λ = {lambda_val}")
        start_time = time.time()
        
        # Initialize bins for this λ
        bin_probs = [0.0] * len(bins)
        normalizing_sum = 0.0
        target_weight = 0.0
        
        # Compute weights for all valid numbers
        for prefix, number_info in bin_assignments.items():
            full_number = number_info['number']
            
            # Compute weight: x^(-λ)
            if lambda_val == 0:
                weight = 1.0
            else:
                weight = full_number ** (-lambda_val)
            
            normalizing_sum += weight
            bin_probs[number_info['bin_index']] += weight
            
            if number_info['is_target']:
                target_weight = weight
        
        # Normalize
        if normalizing_sum > 0:
            normalized_bins = [p / normalizing_sum for p in bin_probs]
            target_posterior = target_weight / normalizing_sum
        else:
            normalized_bins = [0.0] * len(bins)
            target_posterior = 1.0 / evidence_space
        
        lambda_data[str(lambda_val)] = {
            'bin_probabilities': normalized_bins,
            'target_posterior': target_posterior,
            'normalizing_sum': normalizing_sum
        }
        
        elapsed = time.time() - start_time
        print(f"    Completed in {elapsed:.2f}s, target P = {target_posterior:.6e}")
    
    # Prepare output data
    output_data = {
        'metadata': {
            'evidence_digits': evidence_digits,
            'target_number': target_number,
            'total_digits': total_digits,
            'evidence_space': evidence_space,
            'lambda_values': lambda_values,
            'num_bins': len(bins),
            'num_valid_numbers': len(bin_assignments)
        },
        'bins': [
            {
                'min': bin_info['min'],
                'max': bin_info['max'],
                'index': bin_info['index']
            }
            for bin_info in bins
        ],
        'lambda_data': lambda_data
    }
    
    return output_data

def analytical_prior_probability(a, b, lambda_val, max_value=10**14):
    """Calculate analytical prior probability for bin [a,b] with power law x^(-λ)."""
    if a <= 0:
        a = 1  # Handle edge case
    
    if abs(lambda_val) < 1e-10:  # λ = 0 (uniform)
        return (b - a) / (max_value - 1)
    elif abs(lambda_val - 1) < 1e-10:  # λ = 1 (log-uniform)
        return np.log(b / a) / np.log(max_value)
    else:  # λ ≠ 0,1 (power law)
        numerator = b**(1 - lambda_val) - a**(1 - lambda_val)
        denominator = max_value**(1 - lambda_val) - 1**(1 - lambda_val)
        return numerator / denominator

def compute_likelihood_for_bin(bin_min, bin_max, evidence_suffix):
    """Compute likelihood that a uniform random number from [bin_min, bin_max) ends with evidence_suffix."""
    # Convert evidence suffix to integer
    suffix_int = int(evidence_suffix)
    modulus = 10**len(evidence_suffix)
    
    # Find integer range in the bin
    a = int(np.ceil(bin_min))
    b = int(np.floor(bin_max))
    
    if a > b:
        return 0.0  # No integers in this range
    
    # Count integers in [a, b] that are congruent to suffix_int (mod modulus)
    # These are numbers of the form: k * modulus + suffix_int
    
    # Find the range of k values
    k_min = max(0, int(np.ceil((a - suffix_int) / modulus)))
    k_max = int(np.floor((b - suffix_int) / modulus))
    
    if k_min > k_max:
        count_matching = 0
    else:
        count_matching = k_max - k_min + 1
    
    # Total count of integers in [a, b]
    total_count = b - a + 1
    
    # Likelihood
    if total_count == 0:
        return 0.0
    
    return count_matching / total_count

def compute_weighted_likelihood_for_bin(bin_min, bin_max, lambda_val, evidence_suffix):
    """Compute weighted likelihood for a bin given power-law prior x^(-λ)."""
    # Convert evidence suffix to integer
    suffix_int = int(evidence_suffix)
    modulus = 10**len(evidence_suffix)
    
    # Find integer range in the bin
    a = int(np.ceil(bin_min))
    b = int(np.floor(bin_max))
    
    if a > b:
        return 0.0  # No integers in this range
    
    total_weight = 0.0
    evidence_weight = 0.0
    
    # For efficiency, we'll use the mathematical formula for power law sums
    # when possible, and fall back to iteration for smaller ranges
    
    if b - a > 100000:  # Use analytical approximation for large ranges
        if abs(lambda_val) < 1e-10:  # λ ≈ 0 (uniform)
            return compute_likelihood_for_bin(bin_min, bin_max, evidence_suffix)
        elif abs(lambda_val - 1) < 1e-10:  # λ ≈ 1 (log-uniform)
            # For log-uniform, weight ∝ 1/x
            total_weight = np.log(b) - np.log(a)
            # Find numbers ending in evidence_suffix
            k_min = max(0, int(np.ceil((a - suffix_int) / modulus)))
            k_max = int(np.floor((b - suffix_int) / modulus))
            
            if k_min <= k_max:
                for k in range(k_min, k_max + 1):
                    num = k * modulus + suffix_int
                    if a <= num <= b:
                        evidence_weight += 1.0 / num
            
            return evidence_weight / total_weight if total_weight > 0 else 0.0
        else:
            # General power law x^(-λ)
            if lambda_val != 1:
                total_weight = (a**(1-lambda_val) - (b+1)**(1-lambda_val)) / (lambda_val - 1)
            else:
                total_weight = np.log(b) - np.log(a)
            
            # Calculate evidence weight by summing over matching numbers
            k_min = max(0, int(np.ceil((a - suffix_int) / modulus)))
            k_max = int(np.floor((b - suffix_int) / modulus))
            
            if k_min <= k_max:
                for k in range(k_min, k_max + 1):
                    num = k * modulus + suffix_int
                    if a <= num <= b:
                        evidence_weight += num ** (-lambda_val)
            
            return evidence_weight / total_weight if total_weight > 0 else 0.0
    
    else:  # Direct computation for smaller ranges
        for num in range(a, b + 1):
            if lambda_val == 0:
                weight = 1.0
            else:
                weight = num ** (-lambda_val)
            
            total_weight += weight
            
            if num % modulus == suffix_int:
                evidence_weight += weight
        
        return evidence_weight / total_weight if total_weight > 0 else 0.0

def add_prior_and_likelihood_data(output_data):
    """Add analytical prior probabilities and weighted likelihood data to the output data."""
    print("Computing analytical prior probabilities and weighted likelihood...")
    
    bins = output_data['bins']
    lambda_values = output_data['metadata']['lambda_values']
    evidence_digits = output_data['metadata']['evidence_digits']
    
    # Add prior probabilities and weighted likelihood for each λ value
    for lambda_val in lambda_values:
        print(f"  Computing λ = {lambda_val}")
        
        prior_probs = []
        likelihood_probs = []
        
        for bin_info in bins:
            # Prior probability
            prob = analytical_prior_probability(
                bin_info['min'], 
                bin_info['max'], 
                lambda_val
            )
            prior_probs.append(prob)
            
            # Weighted likelihood for this λ value
            likelihood = compute_weighted_likelihood_for_bin(
                bin_info['min'], 
                bin_info['max'], 
                lambda_val,
                evidence_digits
            )
            likelihood_probs.append(likelihood)
        
        # Add to existing lambda data
        output_data['lambda_data'][str(lambda_val)]['prior_probabilities'] = prior_probs
        output_data['lambda_data'][str(lambda_val)]['likelihood_probabilities'] = likelihood_probs
        
        # Verify normalization and report max likelihood
        total_prior = sum(prior_probs)
        max_likelihood = max(likelihood_probs)
        print(f"    Prior sum = {total_prior:.6f}, Max likelihood = {max_likelihood:.6e}")

def main():
    """Main execution function."""
    start_total = time.time()
    
    # Precompute posterior data
    output_data = precompute_posterior_data()
    
    # Add analytical prior and likelihood data
    add_prior_and_likelihood_data(output_data)
    
    # Save to file
    script_dir = Path(__file__).parent
    output_path = script_dir.parent / 'public' / 'xkcd_precomputed_data.json'
    
    print(f"\nSaving data to {output_path}")
    with open(output_path, 'w') as f:
        json.dump(output_data, f, separators=(',', ':'))  # Compact format
    
    file_size = output_path.stat().st_size / (1024 * 1024)  # MB
    total_time = time.time() - start_total
    
    print(f"✓ Precomputation complete!")
    print(f"  File size: {file_size:.2f} MB")
    print(f"  Total time: {total_time:.2f} seconds")
    print(f"  λ values: {len(output_data['metadata']['lambda_values'])}")
    print(f"  Valid numbers: {output_data['metadata']['num_valid_numbers']:,}")
    print(f"  Bins: {output_data['metadata']['num_bins']}")

if __name__ == '__main__':
    main()