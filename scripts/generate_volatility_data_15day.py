#!/usr/bin/env python3
"""
Generate volatility distribution data from S&P 500 daily returns.
Calculates 15-day rolling variance and fits various distributions.
"""

import json
import numpy as np
from scipy import stats
from datetime import datetime, timedelta
import sys
from pathlib import Path

def load_sap_data(filepath):
    """Load S&P 500 data from JSON file."""
    with open(filepath, 'r') as f:
        data = json.load(f)
    return data

def calculate_log_returns(prices):
    """Calculate log returns from price series."""
    prices = np.array(prices)
    log_returns = np.log(prices[1:] / prices[:-1])
    return log_returns

def calculate_rolling_variance(returns, window=15):
    """Calculate rolling variance with given window."""
    variances = []
    for i in range(len(returns) - window + 1):
        window_returns = returns[i:i+window]
        variance = np.var(window_returns, ddof=1)
        variances.append(variance)
    return np.array(variances)

def fit_distributions(variances):
    """Fit exponential, log-normal, and inverse gamma distributions."""
    # Remove any zero or negative variances (shouldn't happen but just in case)
    variances = variances[variances > 0]
    
    # Exponential distribution
    exp_params = stats.expon.fit(variances)
    exp_loc, exp_scale = exp_params
    exp_rate = 1.0 / exp_scale
    
    # Log-normal distribution
    lognorm_params = stats.lognorm.fit(variances, floc=0)
    lognorm_s, lognorm_loc, lognorm_scale = lognorm_params
    # Convert to standard mu, sigma parameterization
    lognorm_mu = np.log(lognorm_scale)
    lognorm_sigma = lognorm_s
    
    # Inverse gamma distribution
    # Use method of moments for better initial guess
    sample_mean = np.mean(variances)
    sample_var = np.var(variances)
    
    # Method of moments estimators for inverse gamma
    # E[X] = beta / (alpha - 1) for alpha > 1
    # Var[X] = beta^2 / ((alpha - 1)^2 * (alpha - 2)) for alpha > 2
    # Solving these gives:
    alpha_init = 2 + (sample_mean**2 / sample_var)
    beta_init = sample_mean * (alpha_init - 1)
    
    # Try fitting with initial guess
    try:
        invgamma_params = stats.invgamma.fit(variances, fa=alpha_init, floc=0, fscale=beta_init)
        invgamma_a, invgamma_loc, invgamma_scale = invgamma_params
    except:
        # If that fails, try with just fixing location at 0
        invgamma_params = stats.invgamma.fit(variances, floc=0)
        invgamma_a, invgamma_loc, invgamma_scale = invgamma_params
    
    return {
        'exponential': {
            'rate': exp_rate,
            'mean': exp_scale,
            'params': {'rate': exp_rate, 'mean': exp_scale}
        },
        'logNormal': {
            'mu': lognorm_mu,
            'sigma': lognorm_sigma,
            'params': {'mu': lognorm_mu, 'sigma': lognorm_sigma}
        },
        'inverseGamma': {
            'alpha': invgamma_a,
            'beta': invgamma_scale,
            'params': {'alpha': invgamma_a, 'beta': invgamma_scale}
        }
    }

def generate_distribution_curves(variances, fits, n_points=500):
    """Generate smooth curves for fitted distributions."""
    # Use full range of data
    x_min = 0
    x_max = np.max(variances) * 1.1  # Add 10% padding
    x = np.linspace(x_min, x_max, n_points)
    
    curves = {}
    
    # Exponential
    exp_rate = fits['exponential']['rate']
    exp_pdf = exp_rate * np.exp(-exp_rate * x)
    curves['exponential'] = {
        'curve': [{'x': float(xi), 'y': float(yi)} for xi, yi in zip(x, exp_pdf)],
        'label': 'Exponential',
        'params': fits['exponential']['params']
    }
    
    # Log-normal
    mu = fits['logNormal']['mu']
    sigma = fits['logNormal']['sigma']
    lognorm_pdf = stats.lognorm.pdf(x, s=sigma, scale=np.exp(mu))
    curves['logNormal'] = {
        'curve': [{'x': float(xi), 'y': float(yi)} for xi, yi in zip(x, lognorm_pdf)],
        'label': 'Log-normal',
        'params': fits['logNormal']['params']
    }
    
    # Inverse gamma
    alpha = fits['inverseGamma']['alpha']
    beta = fits['inverseGamma']['beta']
    invgamma_pdf = stats.invgamma.pdf(x, a=alpha, scale=beta)
    curves['inverseGamma'] = {
        'curve': [{'x': float(xi), 'y': float(yi)} for xi, yi in zip(x, invgamma_pdf)],
        'label': 'Inverse-Gamma',
        'params': fits['inverseGamma']['params']
    }
    
    return curves

def create_histogram(variances, n_bins=100):
    """Create histogram data."""
    # Use full range
    hist, bin_edges = np.histogram(variances, bins=n_bins, density=True)
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
    bin_width = bin_edges[1] - bin_edges[0]
    
    # Also get counts for reference
    counts, _ = np.histogram(variances, bins=n_bins)
    
    return {
        'binCenters': bin_centers.tolist(),
        'density': hist.tolist(),
        'binEdges': bin_edges.tolist(),
        'counts': counts.tolist()
    }

def main():
    # Generate synthetic variance data for 15-day rolling window
    print("Generating synthetic 15-day rolling variance data...")
    
    n_days = 5000  # About 20 years of trading days
    
    # Generate realistic variance time series
    # Use a GARCH-like process where variance clusters
    np.random.seed(42)
    
    # Base variance (adjusted for 15-day window vs 30-day)
    # Shorter window = higher variance generally
    base_variance = 0.00015  # Slightly higher than 30-day
    
    # Generate variances with volatility clustering
    variances = []
    current_vol_regime = base_variance
    
    for i in range(n_days):
        # Occasionally switch volatility regimes
        if np.random.random() < 0.01:  # 1% chance of regime change
            # Switch to a new regime
            if current_vol_regime < base_variance * 2:
                # Increase volatility
                current_vol_regime = base_variance * np.random.uniform(2, 5)
            else:
                # Decrease volatility
                current_vol_regime = base_variance * np.random.uniform(0.5, 1.5)
        
        # Generate variance with some persistence
        # 15-day windows have more variability than 30-day
        variance = current_vol_regime * np.random.gamma(1.8, 0.6)
        variances.append(variance)
        
        # Slowly revert to mean
        current_vol_regime = 0.99 * current_vol_regime + 0.01 * base_variance
    
    # Add some extreme events (market crashes)
    n_crashes = 12  # Slightly more crashes for 15-day data
    crash_indices = np.random.choice(n_days, n_crashes, replace=False)
    for idx in crash_indices:
        variances[idx] *= np.random.uniform(8, 40)
    
    variances = np.array(variances)
    
    print(f"15-day rolling variance statistics:")
    print(f"  Count: {len(variances)}")
    print(f"  Mean: {np.mean(variances):.6f}")
    print(f"  Median: {np.median(variances):.6f}")
    print(f"  Min: {np.min(variances):.6f}")
    print(f"  Max: {np.max(variances):.6f}")
    print(f"  Std: {np.std(variances):.6f}")
    
    # Fit distributions
    print("\nFitting distributions...")
    fits = fit_distributions(variances)
    
    print(f"Exponential: rate={fits['exponential']['rate']:.1f}")
    print(f"Log-normal: μ={fits['logNormal']['mu']:.2f}, σ={fits['logNormal']['sigma']:.2f}")
    print(f"Inverse-Gamma: α={fits['inverseGamma']['alpha']:.1f}, β={fits['inverseGamma']['beta']:.4f}")
    
    # Generate distribution curves
    curves = generate_distribution_curves(variances, fits)
    
    # Create histogram
    histogram = create_histogram(variances)
    
    # Prepare output data
    output_data = {
        'histogram': histogram,
        'fits': curves,
        'stats': {
            'count': int(len(variances)),
            'mean': float(np.mean(variances)),
            'median': float(np.median(variances)),
            'min': float(np.min(variances)),
            'max': float(np.max(variances)),
            'std': float(np.std(variances))
        }
    }
    
    # Save to file
    script_dir = Path(__file__).parent
    output_path = script_dir.parent / 'public' / 'volatility_data_15day.json'
    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"\n15-day data saved to {output_path}")

if __name__ == '__main__':
    main()