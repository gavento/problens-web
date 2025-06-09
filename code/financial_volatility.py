import os
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.stats import norm, chi2
import yfinance as yf

##############################################################################
# CONFIGURATION
##############################################################################
max_months = 999
ROLLING_WINDOW_DAYS = 30  # Days for volatility calculation
ASSET_TO_ANALYZE = 'SAP'  # Change to 'BTC' for Bitcoin analysis
cache_dir = 'financial_cache'
os.makedirs(cache_dir, exist_ok=True)

##############################################################################
# LOAD DATA FUNCTIONS
##############################################################################
def load_or_download_btc(max_months, cache_filename):
    """Load BTC-USD daily close prices from cache or download from Binance."""
    cache_path = os.path.join(cache_dir, cache_filename)
    if os.path.exists(cache_path):
        print(f"Loading cached BTC data from {cache_path}")
        with open(cache_path, 'rb') as f:
            df = pickle.load(f)
        print(f"Loaded {len(df)} daily data points from cache")
        return df

    print("Downloading BTC-USD data from Binance API...")
    import requests
    import time
    
    symbol = 'BTCUSDT'
    interval = '1d'
    limit = 1000

    all_klines = []
    start_time = 0
    while True:
        url = 'https://api.binance.com/api/v3/klines'
        params = {
            'symbol': symbol,
            'interval': interval,
            'startTime': start_time,
            'limit': limit
        }
        try:
            resp = requests.get(url, params=params, timeout=30)
            resp.raise_for_status()
            klines = resp.json()
            if not klines:
                break
            all_klines.extend(klines)

            if len(klines) < limit:
                break

            last_open_time = klines[-1][0]
            start_time = last_open_time + 1
            time.sleep(0.2)
        except Exception as e:
            print(f"Error downloading from Binance: {e}")
            return pd.DataFrame()

    if not all_klines:
        print("Warning: No BTC data received from Binance")
        return pd.DataFrame()

    timestamps = [k[0] for k in all_klines]
    close_prices = [float(k[4]) for k in all_klines]
    dates = pd.to_datetime(timestamps, unit='ms')
    df = pd.DataFrame({'Close': close_prices}, index=dates)

    df = df.resample('D').last().dropna()

    if max_months is not None and max_months > 0:
        cutoff = pd.Timestamp.now() - pd.DateOffset(months=max_months)
        df = df[df.index >= cutoff]

    with open(cache_path, 'wb') as f:
        pickle.dump(df, f)
    print(f"Downloaded and cached {len(df)} daily data points")
    return df

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

##############################################################################
# MAIN ANALYSIS
##############################################################################

# Load data based on selected asset
if ASSET_TO_ANALYZE == 'BTC':
    cache_filename = f'btc_data_{max_months}mo.pkl'
    data = load_or_download_btc(max_months, cache_filename)
    asset_name = 'BTC-USD'
else:  # SAP
    symbol = 'SAP'
    asset_name = 'SAP'
    cache_filename = f'sap_data_{max_months}mo.pkl'
    data = load_or_download_sap(symbol, f'{max_months}mo', cache_filename)

if data.empty:
    print("No data available. Exiting.")
    exit(1)

print(f"Data date range: {data.index[0].strftime('%Y-%m-%d')} to {data.index[-1].strftime('%Y-%m-%d')}")

##############################################################################
# COMPUTE LOG RETURNS AND ROLLING VOLATILITY
##############################################################################

# Extract price data and compute log returns
all_prices = data['Close'].dropna().values.flatten()
if len(all_prices) >= 2:
    # Compute log returns: ln(S_t / S_{t-1})
    log_returns = np.log(all_prices[1:] / all_prices[:-1])
    dates = data.index[1:]  # Align dates with returns
else:
    print("Insufficient data for returns calculation.")
    exit(1)

print(f"Total log returns: {len(log_returns)}")
print(f"Computing {ROLLING_WINDOW_DAYS}-day rolling volatilities...")

# Compute rolling volatility (standard deviation of log returns)
volatilities = []
volatility_dates = []

for i in range(ROLLING_WINDOW_DAYS - 1, len(log_returns)):
    # Get the window of log returns
    window_returns = log_returns[i - ROLLING_WINDOW_DAYS + 1:i + 1]
    
    # Compute volatility as standard deviation
    volatility = np.std(window_returns, ddof=1)
    volatilities.append(volatility)
    volatility_dates.append(dates[i])

volatilities = np.array(volatilities)
volatility_dates = pd.to_datetime(volatility_dates)

print(f"Computed {len(volatilities)} volatility values")
print(f"Volatility range: {np.min(volatilities):.6f} to {np.max(volatilities):.6f}")
print(f"Mean volatility: {np.mean(volatilities):.6f}")

##############################################################################
# CREATE VOLATILITY HISTOGRAM PLOT
##############################################################################

# Create figure
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10))

# Plot 1: Time series of volatility
ax1.plot(volatility_dates, volatilities, linewidth=0.8, alpha=0.8, color='navy')
ax1.set_title(f'{asset_name} Daily Volatility Over Time ({ROLLING_WINDOW_DAYS}-day rolling window)', fontsize=14)
ax1.set_xlabel('Date', fontsize=12)
ax1.set_ylabel('Volatility (Log Returns Std Dev)', fontsize=12)
ax1.grid(True, alpha=0.3)

# Add some statistics to the time series plot
ax1.axhline(y=np.mean(volatilities), color='red', linestyle='--', alpha=0.7, label=f'Mean: {np.mean(volatilities):.4f}')
ax1.axhline(y=np.median(volatilities), color='green', linestyle='--', alpha=0.7, label=f'Median: {np.median(volatilities):.4f}')
ax1.legend()

# Plot 2: Histogram of volatilities
n_bins = max(30, min(100, len(volatilities) // 20))  # Adaptive bin count
counts, bin_edges, patches = ax2.hist(volatilities, bins=n_bins, density=True, 
                                     alpha=0.7, color='lightcoral', edgecolor='darkred', 
                                     label='Volatility distribution')

# Fit distributions to volatility data
# Chi-square distribution is often used for volatility modeling
# Also try log-normal and gamma distributions

# Log-normal fit (volatilities are always positive)
if np.all(volatilities > 0):
    log_vol = np.log(volatilities)
    mu_lognorm = np.mean(log_vol)
    sigma_lognorm = np.std(log_vol, ddof=1)
    
    # Create x range for plotting
    x_min, x_max = np.min(volatilities), np.max(volatilities)
    x_plot = np.linspace(x_min, x_max, 400)
    
    # Log-normal PDF
    from scipy.stats import lognorm
    lognorm_pdf = lognorm.pdf(x_plot, s=sigma_lognorm, scale=np.exp(mu_lognorm))
    ax2.plot(x_plot, lognorm_pdf, 'b-', linewidth=2, 
             label=f'Log-normal (μ={mu_lognorm:.3f}, σ={sigma_lognorm:.3f})')

# Gamma distribution fit
from scipy.stats import gamma
# Method of moments for gamma distribution
vol_mean = np.mean(volatilities)
vol_var = np.var(volatilities, ddof=1)
if vol_var > 0:
    # Gamma parameters via method of moments
    scale_gamma = vol_var / vol_mean
    shape_gamma = vol_mean / scale_gamma
    
    gamma_pdf = gamma.pdf(x_plot, a=shape_gamma, scale=scale_gamma)
    ax2.plot(x_plot, gamma_pdf, 'g-', linewidth=2,
             label=f'Gamma (α={shape_gamma:.3f}, β={scale_gamma:.6f})')

# Customize histogram plot
ax2.set_xlabel('Volatility (Standard Deviation)', fontsize=12)
ax2.set_ylabel('Probability Density', fontsize=12)
ax2.set_title(f'{asset_name} Volatility Distribution Histogram', fontsize=14)
ax2.legend(fontsize=10)
ax2.grid(True, alpha=0.3)

# Add statistics text box
vol_mean = np.mean(volatilities)
vol_std = np.std(volatilities, ddof=1)
vol_skewness = ((volatilities - vol_mean) / vol_std)**3
vol_skewness_val = vol_skewness.mean()

stats_text = f"""Statistics:
Count: {len(volatilities)}
Mean: {vol_mean:.4f}
Median: {np.median(volatilities):.4f}
Std: {vol_std:.4f}
Min: {np.min(volatilities):.4f}
Max: {np.max(volatilities):.4f}
Skewness: {vol_skewness_val:.3f}"""

ax2.text(0.02, 0.98, stats_text, transform=ax2.transAxes, fontsize=9,
         verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))

# Adjust layout and save
plt.tight_layout()

# Save the plot
output_filename = f'{ASSET_TO_ANALYZE.lower()}_volatility_analysis_{ROLLING_WINDOW_DAYS}day_window.png'
plt.savefig(output_filename, dpi=150, bbox_inches='tight')

# Show the plot
plt.show()

##############################################################################
# PRINT DETAILED RESULTS
##############################################################################

print(f"\n" + "="*70)
print(f"{asset_name} VOLATILITY ANALYSIS")
print(f"="*70)
print(f"Rolling window: {ROLLING_WINDOW_DAYS} days")
print(f"Analysis period: {volatility_dates[0].strftime('%Y-%m-%d')} to {volatility_dates[-1].strftime('%Y-%m-%d')}")
print(f"Total volatility observations: {len(volatilities)}")

print(f"\n📊 VOLATILITY STATISTICS:")
print(f"-" * 40)
print(f"Mean volatility: {np.mean(volatilities):.6f}")
print(f"Median volatility: {np.median(volatilities):.6f}")
print(f"Standard deviation: {np.std(volatilities, ddof=1):.6f}")
print(f"Minimum volatility: {np.min(volatilities):.6f}")
print(f"Maximum volatility: {np.max(volatilities):.6f}")

# Percentiles
percentiles = [5, 10, 25, 75, 90, 95]
print(f"\n📈 VOLATILITY PERCENTILES:")
print(f"-" * 40)
for p in percentiles:
    value = np.percentile(volatilities, p)
    print(f"{p:2d}th percentile: {value:.6f}")

# Periods of high/low volatility
high_vol_threshold = np.percentile(volatilities, 95)
low_vol_threshold = np.percentile(volatilities, 5)

high_vol_periods = volatility_dates[volatilities >= high_vol_threshold]
low_vol_periods = volatility_dates[volatilities <= low_vol_threshold]

print(f"\n🔥 HIGH VOLATILITY PERIODS (>{high_vol_threshold:.4f}):")
print(f"-" * 40)
print(f"Count: {len(high_vol_periods)}")
if len(high_vol_periods) > 0:
    print(f"Most recent: {high_vol_periods[-1].strftime('%Y-%m-%d')}")
    print(f"Earliest: {high_vol_periods[0].strftime('%Y-%m-%d')}")

print(f"\n😴 LOW VOLATILITY PERIODS (<{low_vol_threshold:.4f}):")
print(f"-" * 40)
print(f"Count: {len(low_vol_periods)}")
if len(low_vol_periods) > 0:
    print(f"Most recent: {low_vol_periods[-1].strftime('%Y-%m-%d')}")
    print(f"Earliest: {low_vol_periods[0].strftime('%Y-%m-%d')}")

print(f"\n💾 Plot saved as: {output_filename}")