import os
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.stats import norm, laplace
import yfinance as yf

##############################################################################
# CONFIGURATION
##############################################################################
max_months = 999
DAYS_TO_ANALYZE = 1000  # Change this parameter to analyze different time windows
cache_dir = 'financial_cache'
os.makedirs(cache_dir, exist_ok=True)

##############################################################################
# LOAD SAP DATA
##############################################################################
def load_or_download_sap(symbol, period, cache_filename):
    """Load SAP equity data via yfinance from cache or download it."""
    cache_path = os.path.join(cache_dir, cache_filename)
    if os.path.exists(cache_path):
        print(f"Loading cached {symbol} data from {cache_path}")
        with open(cache_path, 'rb') as f:
            data = pickle.load(f)
        print(f"Loaded {len(data)} data points from cache")
        return data

    print(f"Downloading {symbol} data via yfinance...")
    try:
        data = yf.download(symbol, period=period, auto_adjust=False)
        if data.empty:
            print(f"Warning: No data received for {symbol}")
            return pd.DataFrame()

        with open(cache_path, 'wb') as f:
            pickle.dump(data, f)
        print(f"Downloaded and cached {len(data)} data points for {symbol}")
        return data
    except Exception as e:
        print(f"Error downloading {symbol}: {e}")
        return pd.DataFrame()

# Load SAP data
symbol = 'SAP'
cache_filename = f'sap_data_{max_months}mo.pkl'
data = load_or_download_sap(symbol, f'{max_months}mo', cache_filename)

if data.empty:
    print("No data available. Exiting.")
    exit(1)

print(f"Data date range: {data.index[0].strftime('%Y-%m-%d')} to {data.index[-1].strftime('%Y-%m-%d')}")

##############################################################################
# COMPUTE BOTH TYPES OF RETURNS FOR LAST N DAYS
##############################################################################
all_prices = data['Close'].dropna().values.flatten()
if len(all_prices) >= DAYS_TO_ANALYZE + 1:  # Need N+1 prices for N returns
    # Compute both types of returns
    all_log_returns = np.log(all_prices[1:] / all_prices[:-1])  # ln(S_t / S_{t-1})
    all_normalized_returns = (all_prices[1:] / all_prices[:-1]) - 1  # (S_t - S_{t-1}) / S_{t-1}
    
    # Get last N days of both return types
    log_returns_subset = all_log_returns[-DAYS_TO_ANALYZE:]
    normalized_returns_subset = all_normalized_returns[-DAYS_TO_ANALYZE:]
    
    print(f"Analyzing last {DAYS_TO_ANALYZE} days of SAP returns (both log and normalized)...")
    print(f"Date range for analysis: {data.index[-(DAYS_TO_ANALYZE+1)].strftime('%Y-%m-%d')} to {data.index[-1].strftime('%Y-%m-%d')}")
    
    ##############################################################################
    # CREATE SIDE-BY-SIDE PLOTS FOR BOTH RETURN TYPES
    ##############################################################################
    
    # Create figure with two subplots
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(20, 8))
    
    # Adaptive bin count for both plots
    n_bins = max(10, min(30, DAYS_TO_ANALYZE // 5))
    
    def create_return_plot(ax, returns_data, title_prefix, xlabel):
        """Helper function to create a return plot with fits"""
        # Plot histogram
        counts, bin_edges, patches = ax.hist(returns_data, bins=n_bins, density=True, 
                                           alpha=0.7, color='lightblue', edgecolor='navy', 
                                           label='Returns data')
        
        # Fit Gaussian distribution
        mu_gauss = np.mean(returns_data)
        std_gauss = np.std(returns_data, ddof=1)
        
        # Fit Laplace distribution  
        loc_laplace = np.median(returns_data)
        scale_laplace = np.mean(np.abs(returns_data - loc_laplace))
        
        # Create smooth x-range for plotting PDFs
        x_min = np.min(returns_data)
        x_max = np.max(returns_data)
        x_range = x_max - x_min
        x_plot = np.linspace(x_min - 0.3*x_range, x_max + 0.3*x_range, 400)
        
        # Plot Gaussian fit
        gauss_pdf = norm.pdf(x_plot, mu_gauss, std_gauss)
        ax.plot(x_plot, gauss_pdf, 'r-', linewidth=3, 
                label=f'Gaussian (μ={mu_gauss:.4f}, σ={std_gauss:.4f})')
        
        # Plot Laplace fit
        laplace_pdf = laplace.pdf(x_plot, loc_laplace, scale_laplace)
        ax.plot(x_plot, laplace_pdf, 'g-', linewidth=3, 
                label=f'Laplace (loc={loc_laplace:.4f}, scale={scale_laplace:.4f})')
        
        # Calculate KL divergences
        bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2.0
        bin_width = bin_edges[1] - bin_edges[0]
        empirical_probs = counts * bin_width
        empirical_probs = empirical_probs / np.sum(empirical_probs)
        
        # Gaussian KL divergence
        gauss_probs = norm.pdf(bin_centers, mu_gauss, std_gauss) * bin_width
        gauss_probs = gauss_probs / np.sum(gauss_probs)
        mask = empirical_probs > 1e-10
        kl_gauss = np.sum(empirical_probs[mask] * np.log(empirical_probs[mask] / gauss_probs[mask]))
        
        # Laplace KL divergence  
        laplace_probs = laplace.pdf(bin_centers, loc_laplace, scale_laplace) * bin_width
        laplace_probs = laplace_probs / np.sum(laplace_probs)
        kl_laplace = np.sum(empirical_probs[mask] * np.log(empirical_probs[mask] / laplace_probs[mask]))
        
        # Customize plot
        ax.set_xlabel(xlabel, fontsize=12)
        ax.set_ylabel('Probability Density', fontsize=12)
        ax.set_title(f'{title_prefix} - Last {DAYS_TO_ANALYZE} Days\nGaussian KL: {kl_gauss:.4f}, Laplace KL: {kl_laplace:.4f}', 
                    fontsize=14, pad=15)
        ax.legend(fontsize=10, loc='upper right')
        ax.grid(True, alpha=0.3)
        
        # Add statistics
        mean_val = np.mean(returns_data)
        std_val = np.std(returns_data, ddof=1)
        skewness = ((returns_data - mean_val) / std_val)**3
        skewness_val = skewness.mean()
        
        stats_text = f"""Statistics:
Mean: {mean_val:.4f}
Std: {std_val:.4f}
Min: {np.min(returns_data):.4f}
Max: {np.max(returns_data):.4f}
Skewness: {skewness_val:.3f}"""
        
        ax.text(0.02, 0.98, stats_text, transform=ax.transAxes, fontsize=9,
                verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))
        
        return kl_gauss, kl_laplace, mu_gauss, std_gauss, loc_laplace, scale_laplace
    
    # Create log returns plot
    log_kl_gauss, log_kl_laplace, log_mu_gauss, log_std_gauss, log_loc_laplace, log_scale_laplace = \
        create_return_plot(ax1, log_returns_subset, 'SAP Log Returns', 'Log Returns: ln(S_t / S_{t-1})')
    
    # Create normalized returns plot  
    norm_kl_gauss, norm_kl_laplace, norm_mu_gauss, norm_std_gauss, norm_loc_laplace, norm_scale_laplace = \
        create_return_plot(ax2, normalized_returns_subset, 'SAP Normalized Returns', 'Normalized Returns: (S_t - S_{t-1}) / S_{t-1}')
    
    # Save the plot
    output_filename = f'sap_returns_comparison_{DAYS_TO_ANALYZE}days.png'
    plt.tight_layout()
    plt.savefig(output_filename, dpi=150, bbox_inches='tight')
    
    # Show the plot
    plt.show()
    
    # Print detailed comparison results
    print(f"\n" + "="*80)
    print(f"SAP RETURNS ANALYSIS COMPARISON - LAST {DAYS_TO_ANALYZE} DAYS")
    print(f"="*80)
    print(f"Data points: {len(log_returns_subset)}")
    
    print(f"\n📊 LOG RETURNS: ln(S_t / S_{{t-1}})")
    print(f"-" * 40)
    print(f"Mean: {np.mean(log_returns_subset):.6f}")
    print(f"Std:  {np.std(log_returns_subset, ddof=1):.6f}")
    print(f"Min:  {np.min(log_returns_subset):.6f}")
    print(f"Max:  {np.max(log_returns_subset):.6f}")
    print(f"\nDistribution Fits:")
    print(f"  Gaussian: μ={log_mu_gauss:.6f}, σ={log_std_gauss:.6f}")
    print(f"  Laplace:  loc={log_loc_laplace:.6f}, scale={log_scale_laplace:.6f}")
    print(f"KL Divergences:")
    print(f"  Gaussian: {log_kl_gauss:.6f}")
    print(f"  Laplace:  {log_kl_laplace:.6f}")
    print(f"Best fit: {'Laplace' if log_kl_laplace < log_kl_gauss else 'Gaussian'}")
    
    print(f"\n📈 NORMALIZED RETURNS: (S_t - S_{{t-1}}) / S_{{t-1}}")
    print(f"-" * 40)
    print(f"Mean: {np.mean(normalized_returns_subset):.6f}")
    print(f"Std:  {np.std(normalized_returns_subset, ddof=1):.6f}")
    print(f"Min:  {np.min(normalized_returns_subset):.6f}")
    print(f"Max:  {np.max(normalized_returns_subset):.6f}")
    print(f"\nDistribution Fits:")
    print(f"  Gaussian: μ={norm_mu_gauss:.6f}, σ={norm_std_gauss:.6f}")
    print(f"  Laplace:  loc={norm_loc_laplace:.6f}, scale={norm_scale_laplace:.6f}")
    print(f"KL Divergences:")
    print(f"  Gaussian: {norm_kl_gauss:.6f}")
    print(f"  Laplace:  {norm_kl_laplace:.6f}")
    print(f"Best fit: {'Laplace' if norm_kl_laplace < norm_kl_gauss else 'Gaussian'}")
    
    print(f"\n🔍 COMPARISON SUMMARY:")
    print(f"-" * 40)
    print(f"Log returns best fit:        {'Laplace' if log_kl_laplace < log_kl_gauss else 'Gaussian'} (KL: {min(log_kl_gauss, log_kl_laplace):.4f})")
    print(f"Normalized returns best fit: {'Laplace' if norm_kl_laplace < norm_kl_gauss else 'Gaussian'} (KL: {min(norm_kl_gauss, norm_kl_laplace):.4f})")
    
    # Calculate correlation between the two return types
    correlation = np.corrcoef(log_returns_subset, normalized_returns_subset)[0, 1]
    print(f"Correlation between log and normalized returns: {correlation:.6f}")
    
    print(f"\n💾 Plot saved as: {output_filename}")
    
else:
    print(f"Insufficient data for {DAYS_TO_ANALYZE}-day analysis.")