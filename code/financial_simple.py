import yfinance as yf
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import math
import os
import pickle
from scipy.special import gammainc, gamma
from scipy.stats import t, norm, laplace

##############################################################################
# CONFIGURATION
##############################################################################
max_months = 999
# Choose which asset to analyze: 'BTC' or 'SAP'
ASSET_TO_ANALYZE = 'BTC'  # Change this to 'SAP' to analyze S&P instead
# Number of standard deviations to cover in the histogram
STD_RANGE = 3  # Will show data within +/- 3 standard deviations

##############################################################################
# CREATE OUTPUT DIRECTORY
##############################################################################
output_dir = 'financial'
cache_dir = 'financial_cache'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)
if not os.path.exists(cache_dir):
    os.makedirs(cache_dir)

##############################################################################
# DOWNLOAD OR LOAD CACHED DATA
##############################################################################
def load_or_download_data(symbol, period, cache_filename):
    """Load data from cache or download if cache doesn't exist."""
    cache_path = os.path.join(cache_dir, cache_filename)
    
    if os.path.exists(cache_path):
        print(f"Loading cached data from {cache_path}")
        with open(cache_path, 'rb') as f:
            data = pickle.load(f)
        print(f"Loaded {len(data)} data points from cache")
        return data
    else:
        print(f"Downloading {symbol} data...")
        try:
            data = yf.download(symbol, period=period, auto_adjust=False)
            if data.empty:
                print(f"Warning: No data received for {symbol}")
                return pd.DataFrame()
            
            # Save to cache
            with open(cache_path, 'wb') as f:
                pickle.dump(data, f)
            print(f"Downloaded and cached {len(data)} data points")
            return data
        except Exception as e:
            print(f"Error downloading {symbol}: {e}")
            return pd.DataFrame()

# Download or load cached data
if ASSET_TO_ANALYZE == 'BTC':
    symbol = 'BTC-USD'
    asset_name = 'BTC-USD'
    cache_filename = f'btc_data_{max_months}mo.pkl'
else:  # SAP
    symbol = 'SAP'
    asset_name = 'SAP'
    cache_filename = f'sap_data_{max_months}mo.pkl'

data = load_or_download_data(symbol, f'{max_months}mo', cache_filename)

# Check if we have valid data
if data.empty:
    print("No data available. Exiting.")
    exit(1)

def plot_fits(ax, data, title, std_range=3):
    """Plot the histogram + fitted Gaussian, Laplace, and Student‑t for 'data'."""
    if len(data) < 2:
        # If not enough points, just state it
        ax.text(0.5, 0.5, "No data (len<2)", ha='center', va='center', transform=ax.transAxes)
        ax.set_title(title + " (Insufficient data)")
        return

    # Calculate statistics
    mu = np.mean(data)
    std = np.std(data, ddof=1)
    
    # Define histogram range based on standard deviations
    if std > 0 and np.isfinite(mu) and np.isfinite(std):
        hist_min = mu - std_range * std
        hist_max = mu + std_range * std
        
        # Filter data to the range for histogram
        data_filtered = data[(data >= hist_min) & (data <= hist_max)]
        
        # Plot histogram (empirical distribution) with specified range
        ax.hist(data_filtered, bins=50, density=True, alpha=0.5, label='Empirical', 
                range=(hist_min, hist_max))
        
        # Prepare x-range for fitted distributions
        x = np.linspace(hist_min, hist_max, 400)
        
        # === Gaussian Fit ===
        gauss_pdf = norm.pdf(x, mu, std)
        ax.plot(x, gauss_pdf, 'r-', label='Gaussian')
        
        # === Laplace Fit ===
        loc_lap = np.median(data)
        scale_lap = np.mean(np.abs(data - loc_lap))
        if scale_lap > 0 and np.isfinite(loc_lap):
            lap_pdf = laplace.pdf(x, loc_lap, scale_lap)
            ax.plot(x, lap_pdf, 'g-', label='Laplace')
        
        # Set explicit x-limits
        ax.set_xlim(hist_min, hist_max)
    else:
        # Fallback to original behavior if stats are invalid
        ax.hist(data, bins=50, density=True, alpha=0.5, label='Empirical')
        ax.text(0.5, 0.5, "Invalid statistics", ha='center', va='center', transform=ax.transAxes)

    ax.set_title(title)
    ax.grid(False)
    ax.set_xlabel('')
    ax.set_ylabel('')
    ax.set_xticks([])
    ax.set_yticks([])
    ax.legend(fontsize=12)


# Extract price data and compute daily differences
all_prices = data['Close'].dropna().values.flatten()
all_price_diff = np.diff(all_prices) if len(all_prices) >= 2 else []

# Get the maximum number of days we can analyze
max_days = len(all_price_diff) if len(all_price_diff) > 0 else 0

if max_days == 0:
    print("No price differences to analyze. Exiting.")
    exit(1)

print(f"Total available data points: {max_days}")
print(f"Data date range: {data.index[0].strftime('%Y-%m-%d')} to {data.index[-1].strftime('%Y-%m-%d')}")
print(f"Generating plots for 1 to {max_days} days...")

# Generate plots for different time periods
for i in range(1, max_days + 1):
    # Take the last i days of data
    price_diff = all_price_diff[-i:] if i <= len(all_price_diff) else all_price_diff
    
    # Skip if not enough data
    if len(price_diff) < 2:
        continue
    
    # Create a single figure
    fig, ax = plt.subplots(1, 1, figsize=(10, 6))
    
    # Generate the plot
    plot_fits(ax, price_diff, f"{asset_name} Daily Differences ({i} days)", STD_RANGE)
    
    # Save the plot
    filename = f"plot{i:04d}.png"
    filepath = os.path.join(output_dir, filename)
    plt.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()  # Close the figure to free memory
    
    # Print progress every 500 iterations
    if i % 500 == 0 or i == max_days:
        print(f"Generated plot {i}/{max_days}")

print(f"\nAll plots saved in '{output_dir}/' directory")
print(f"Files range from plot0001.png to plot{max_days:04d}.png")

# Print final statistics for the full dataset
if len(all_price_diff) > 0:
    print(f"\nFull {asset_name} Dataset Statistics:")
    print(f"Total data points: {len(all_price_diff)}")
    print(f"Mean daily change: {np.mean(all_price_diff):.4f}")
    print(f"Standard deviation: {np.std(all_price_diff, ddof=1):.4f}")

print(f"\nData cached in '{cache_dir}/' directory for future runs")
print("To force re-download, delete the cache file and run again")