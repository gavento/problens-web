import os
import pickle
import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.stats import norm, laplace
from datetime import datetime
import requests

##############################################################################
# CONFIGURATION
##############################################################################
max_months = 999
# Choose which asset to analyze: 'BTC' or 'SAP'
ASSET_TO_ANALYZE = 'SAP'  # Change this to 'SAP' to analyze S&P instead
# Number of standard deviations to cover in the histogram
STD_RANGE = 3  # Shows data within ±3 standard deviations

##############################################################################
# CREATE OUTPUT AND CACHE DIRECTORIES
##############################################################################
output_dir = 'financial'
cache_dir = 'financial_cache'
os.makedirs(output_dir, exist_ok=True)
os.makedirs(cache_dir, exist_ok=True)

# Determine filename prefix based on asset
filename_prefix = ASSET_TO_ANALYZE.lower()

##############################################################################
# FUNCTIONS TO LOAD OR DOWNLOAD DATA
##############################################################################
def load_or_download_btc(max_months, cache_filename):
    """
    Load BTC-USD daily close prices from cache if available;
    otherwise download from Binance public API, cache them, and return a DataFrame.
    """
    cache_path = os.path.join(cache_dir, cache_filename)
    if os.path.exists(cache_path):
        print(f"Loading cached BTC data from {cache_path}")
        with open(cache_path, 'rb') as f:
            df = pickle.load(f)
        print(f"Loaded {len(df)} daily data points from cache")
        return df

    print("Downloading BTC-USD data from Binance API...")
    symbol = 'BTCUSDT'
    interval = '1d'
    limit = 1000  # Binance max per request

    all_klines = []
    start_time = 0  # start from earliest available
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
    """
    Load SAP equity data via yfinance from cache if available;
    otherwise download via yfinance, cache it, and return a DataFrame.
    """
    import yfinance as yf

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

# MAIN DATA LOADING LOGIC
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

##############################################################################
# FUNCTION TO PLOT HISTOGRAM + FITTED DISTRIBUTIONS & COMPUTE KL DIVERGENCES
##############################################################################
def plot_and_compute_kl(ax, data_values, title, std_range=3):
    """
    Plot the histogram of 'data_values', overlay Gaussian and Laplace fits,
    and compute KL(empirical || Gaussian) and KL(empirical || Laplace).
    Returns (kl_gaussian, kl_laplace).
    """
    if len(data_values) < 2:
        ax.text(0.5, 0.5, "No data (len<2)", ha='center', va='center', transform=ax.transAxes)
        ax.set_title(title + " (Insufficient data)")
        return None, None

    mu = np.mean(data_values)
    std = np.std(data_values, ddof=1)

    # If statistics are valid, proceed
    if std > 0 and np.isfinite(mu) and np.isfinite(std):
        hist_min = mu - std_range * std
        hist_max = mu + std_range * std
        data_filtered = data_values[(data_values >= hist_min) & (data_values <= hist_max)]

        # Compute histogram (counts) over truncated range
        counts, bin_edges = np.histogram(data_filtered, bins=50, range=(hist_min, hist_max))
        total_counts = counts.sum()
        if total_counts == 0:
            # No data in the truncated range
            ax.hist(data_filtered, bins=50, density=True, alpha=0.5, label='Empirical')
            ax.text(0.5, 0.5, "No data in range", ha='center', va='center', transform=ax.transAxes)
            ax.set_title(title)
            return None, None

        # Empirical probability per bin
        P = counts.astype(float) / total_counts
        # Bin centers
        bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2.0

        # Gaussian PDF at bin centers (un-normalized over discrete bins)
        gauss_pdf_vals = norm.pdf(bin_centers, mu, std)
        # Normalize discrete Gaussian probabilities over bins
        Q_gauss = gauss_pdf_vals / np.sum(gauss_pdf_vals)

        # Laplace parameters
        loc_lap = np.median(data_values)
        scale_lap = np.mean(np.abs(data_values - loc_lap))
        lap_pdf_vals = laplace.pdf(bin_centers, loc_lap, scale_lap) if scale_lap > 0 and np.isfinite(loc_lap) else np.zeros_like(bin_centers)
        # Normalize discrete Laplace probabilities over bins
        if lap_pdf_vals.sum() > 0:
            Q_laplace = lap_pdf_vals / np.sum(lap_pdf_vals)
        else:
            Q_laplace = np.zeros_like(bin_centers)

        # Compute KL divergences: sum_{j, P_j>0} P_j * log(P_j / Q_j)
        mask = P > 0
        kl_gauss = np.sum(P[mask] * np.log(P[mask] / Q_gauss[mask]))
        kl_laplace = np.sum(P[mask] * np.log(P[mask] / Q_laplace[mask])) if Q_laplace[mask].all() else np.inf

        # Plot empirical histogram (normalized density)
        ax.hist(data_filtered, bins=50, density=True, alpha=0.5, label='Empirical',
                range=(hist_min, hist_max))

        # Prepare smooth x-range for plotting continuous PDFs
        x = np.linspace(hist_min, hist_max, 400)

        # Plot Gaussian fit
        gauss_pdf_continuous = norm.pdf(x, mu, std)
        ax.plot(x, gauss_pdf_continuous, 'r-', label='Gaussian')

        # Plot Laplace fit
        if scale_lap > 0 and np.isfinite(loc_lap):
            laplace_pdf_continuous = laplace.pdf(x, loc_lap, scale_lap)
            ax.plot(x, laplace_pdf_continuous, 'g-', label='Laplace')

        ax.set_xlim(hist_min, hist_max)
    else:
        # Fallback: plot raw histogram only
        ax.hist(data_values, bins=50, density=True, alpha=0.5, label='Empirical')
        ax.text(0.5, 0.5, "Invalid statistics", ha='center', va='center', transform=ax.transAxes)
        kl_gauss, kl_laplace = None, None

    ax.set_title(title)
    ax.grid(False)
    ax.set_xlabel('')
    ax.set_ylabel('')
    ax.set_xticks([])
    ax.set_yticks([])
    ax.legend(fontsize=12)
    return kl_gauss, kl_laplace

##############################################################################
# EXTRACT PRICE DATA AND COMPUTE NORMALIZED DAILY DIFFERENCES
##############################################################################
all_prices = data['Close'].dropna().values.flatten()
# Compute normalized differences: (a_{i+1}/a_i) - 1
if len(all_prices) >= 2:
    all_price_returns = (all_prices[1:] / all_prices[:-1]) - 1
else:
    all_price_returns = []

max_days = len(all_price_returns)
if max_days == 0:
    print("No price returns to analyze. Exiting.")
    exit(1)

print(f"Total available data points: {max_days}")
print(f"Data date range: {data.index[0].strftime('%Y-%m-%d')} to {data.index[-1].strftime('%Y-%m-%d')}")
print(f"Generating plots for 1 to {max_days} days...")

##############################################################################
# GENERATE AND SAVE HISTOGRAM + FIT PLOTS AND PRINT KL DIVERGENCES
##############################################################################
step = 20
for i in range(step, max_days + 1, step):
    price_returns = all_price_returns[-i:] if i <= len(all_price_returns) else all_price_returns
    if len(price_returns) < 2:
        continue

    fig, ax = plt.subplots(1, 1, figsize=(10, 6))
    kl_gauss, kl_laplace = plot_and_compute_kl(
        ax,
        price_returns,
        f"{asset_name} Daily Returns ({i} days)",
        STD_RANGE
    )

    # Print KL divergences to terminal
    if kl_gauss is not None and kl_laplace is not None:
        print(f"{i:4d} days: KL(emp || Gaussian) = {kl_gauss:.6f}, KL(emp || Laplace) = {kl_laplace:.6f}")
    else:
        print(f"{i:4d} days: KL could not be computed (insufficient or invalid data)")

    # Save the plot
    filename = f"{filename_prefix}_plot{i:04d}.png"
    filepath = os.path.join(output_dir, filename)
    plt.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()

    if i % 100 == 0 or i == max_days:
        print(f"Generated plot {i}/{max_days}")

print(f"\nAll plots saved in '{output_dir}/'")
print(f"Files range from {filename_prefix}_plot0001.png to {filename_prefix}_plot{max_days:04d}.png")

##############################################################################
# PRINT FINAL STATISTICS FOR THE FULL DATASET
##############################################################################
if len(all_price_returns) > 0:
    print(f"\nFull {asset_name} Dataset Statistics:")
    print(f"Total data points: {len(all_price_returns)}")
    print(f"Mean daily return: {np.mean(all_price_returns):.4f}")
    print(f"Standard deviation: {np.std(all_price_returns, ddof=1):.4f}")

print(f"\nData cached in '{cache_dir}/'")
print("To force re-download, delete the cache file and run again")
