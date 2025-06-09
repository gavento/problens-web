import os
import pickle
import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.stats import norm, laplace, t as student_t
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

# Choose which distributions to fit (set to True/False)
FIT_GAUSSIAN = True
FIT_LAPLACE = True
FIT_STUDENT_T = True

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
    Plot the histogram of 'data_values', overlay Gaussian, Laplace, and Student-t fits,
    and compute KL divergences for enabled distributions.
    Returns (kl_gaussian, kl_laplace, kl_student_t).
    """
    if len(data_values) < 2:
        ax.text(0.5, 0.5, "No data (len<2)", ha='center', va='center', transform=ax.transAxes)
        ax.set_title(title + " (Insufficient data)")
        return None, None, None

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
            return None, None, None

        # Empirical probability per bin
        P = counts.astype(float) / total_counts
        # Bin centers
        bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2.0

        # Initialize KL divergences
        kl_gauss, kl_laplace, kl_student_t = None, None, None
        
        # Gaussian PDF at bin centers (un-normalized over discrete bins)
        if FIT_GAUSSIAN:
            gauss_pdf_vals = norm.pdf(bin_centers, mu, std)
            # Normalize discrete Gaussian probabilities over bins
            Q_gauss = gauss_pdf_vals / np.sum(gauss_pdf_vals)
            # Compute KL divergence
            mask = P > 0
            kl_gauss = np.sum(P[mask] * np.log(P[mask] / Q_gauss[mask]))

        # Laplace parameters
        if FIT_LAPLACE:
            loc_lap = np.median(data_values)
            scale_lap = np.mean(np.abs(data_values - loc_lap))
            lap_pdf_vals = laplace.pdf(bin_centers, loc_lap, scale_lap) if scale_lap > 0 and np.isfinite(loc_lap) else np.zeros_like(bin_centers)
            # Normalize discrete Laplace probabilities over bins
            if lap_pdf_vals.sum() > 0:
                Q_laplace = lap_pdf_vals / np.sum(lap_pdf_vals)
                mask = P > 0
                kl_laplace = np.sum(P[mask] * np.log(P[mask] / Q_laplace[mask])) if Q_laplace[mask].all() else np.inf
                
        # Student-t parameters
        if FIT_STUDENT_T:
            # Fit Student-t distribution using method of moments
            # Estimate degrees of freedom from kurtosis
            kurtosis = np.mean(((data_values - mu) / std) ** 4) - 3
            # For Student-t: excess kurtosis = 6/(df-4) for df > 4
            # Solve for df: df = 4 + 6/kurtosis (if kurtosis > 0)
            if kurtosis > 0:
                df = 4 + 6 / kurtosis
                df = max(2.1, min(df, 100))  # Clamp between 2.1 and 100
            else:
                df = 100  # Large df approximates normal distribution
                
            # Student-t PDF at bin centers
            t_pdf_vals = student_t.pdf(bin_centers, df, loc=mu, scale=std)
            # Normalize discrete Student-t probabilities over bins
            if t_pdf_vals.sum() > 0:
                Q_student_t = t_pdf_vals / np.sum(t_pdf_vals)
                mask = P > 0
                kl_student_t = np.sum(P[mask] * np.log(P[mask] / Q_student_t[mask])) if Q_student_t[mask].all() else np.inf

        # Plot empirical histogram (normalized density)
        ax.hist(data_filtered, bins=50, density=True, alpha=0.5, label='Empirical',
                range=(hist_min, hist_max))

        # Prepare smooth x-range for plotting continuous PDFs
        x = np.linspace(hist_min, hist_max, 400)

        # Plot Gaussian fit
        if FIT_GAUSSIAN:
            gauss_pdf_continuous = norm.pdf(x, mu, std)
            ax.plot(x, gauss_pdf_continuous, 'r-', label='Gaussian')

        # Plot Laplace fit
        if FIT_LAPLACE and 'scale_lap' in locals() and scale_lap > 0 and np.isfinite(loc_lap):
            laplace_pdf_continuous = laplace.pdf(x, loc_lap, scale_lap)
            ax.plot(x, laplace_pdf_continuous, 'g-', label='Laplace')
            
        # Plot Student-t fit
        if FIT_STUDENT_T and 'df' in locals():
            t_pdf_continuous = student_t.pdf(x, df, loc=mu, scale=std)
            ax.plot(x, t_pdf_continuous, 'b-', label=f'Student-t (df={df:.1f})')

        ax.set_xlim(hist_min, hist_max)
    else:
        # Fallback: plot raw histogram only
        ax.hist(data_values, bins=50, density=True, alpha=0.5, label='Empirical')
        ax.text(0.5, 0.5, "Invalid statistics", ha='center', va='center', transform=ax.transAxes)
        kl_gauss, kl_laplace, kl_student_t = None, None, None

    ax.set_title(title)
    ax.grid(False)
    ax.set_xlabel('')
    ax.set_ylabel('')
    ax.set_xticks([])
    ax.set_yticks([])
    ax.legend(fontsize=12)
    return kl_gauss, kl_laplace, kl_student_t

##############################################################################
# EXTRACT PRICE DATA AND COMPUTE BOTH TYPES OF RETURNS
##############################################################################
all_prices = data['Close'].dropna().values.flatten()
if len(all_prices) >= 2:
    # Compute normalized differences: (a_{i+1}/a_i) - 1
    all_price_returns = (all_prices[1:] / all_prices[:-1]) - 1
    # Compute log returns: ln(a_{i+1}/a_i)
    all_log_returns = np.log(all_prices[1:] / all_prices[:-1])
else:
    all_price_returns = []
    all_log_returns = []

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
    kl_gauss, kl_laplace, kl_student_t = plot_and_compute_kl(
        ax,
        price_returns,
        f"{asset_name} Daily Returns ({i} days)",
        STD_RANGE
    )

    # Print KL divergences to terminal
    kl_values = []
    if FIT_GAUSSIAN and kl_gauss is not None:
        kl_values.append(f"KL(emp || Gaussian) = {kl_gauss:.6f}")
    if FIT_LAPLACE and kl_laplace is not None:
        kl_values.append(f"KL(emp || Laplace) = {kl_laplace:.6f}")
    if FIT_STUDENT_T and kl_student_t is not None:
        kl_values.append(f"KL(emp || Student-t) = {kl_student_t:.6f}")
    
    if kl_values:
        print(f"{i:4d} days: {', '.join(kl_values)}")
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
# CREATE SPECIAL LOG RETURNS PLOT FOR LAST 100 DAYS
##############################################################################
if ASSET_TO_ANALYZE == 'SAP' and len(all_log_returns) >= 100:
    print(f"\nCreating special log returns plot for last 100 days...")
    
    # Get last 100 days of log returns
    last_100_log_returns = all_log_returns[-100:]
    
    # Create figure
    fig, ax = plt.subplots(1, 1, figsize=(12, 8))
    
    # Plot histogram of log returns
    n_bins = 30
    counts, bin_edges, patches = ax.hist(last_100_log_returns, bins=n_bins, density=True, 
                                       alpha=0.7, color='lightblue', label='Log returns data')
    
    # Fit Gaussian distribution
    mu_gauss = np.mean(last_100_log_returns)
    std_gauss = np.std(last_100_log_returns, ddof=1)
    
    # Fit Laplace distribution  
    loc_laplace = np.median(last_100_log_returns)
    scale_laplace = np.mean(np.abs(last_100_log_returns - loc_laplace))
    
    # Create smooth x-range for plotting PDFs
    x_min = np.min(last_100_log_returns)
    x_max = np.max(last_100_log_returns)
    x_range = x_max - x_min
    x_plot = np.linspace(x_min - 0.2*x_range, x_max + 0.2*x_range, 400)
    
    # Plot Gaussian fit
    gauss_pdf = norm.pdf(x_plot, mu_gauss, std_gauss)
    ax.plot(x_plot, gauss_pdf, 'r-', linewidth=2, label=f'Gaussian fit (μ={mu_gauss:.4f}, σ={std_gauss:.4f})')
    
    # Plot Laplace fit
    laplace_pdf = laplace.pdf(x_plot, loc_laplace, scale_laplace)
    ax.plot(x_plot, laplace_pdf, 'g-', linewidth=2, label=f'Laplace fit (loc={loc_laplace:.4f}, scale={scale_laplace:.4f})')
    
    # Calculate KL divergences
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2.0
    empirical_probs = counts / np.sum(counts) * (bin_edges[1] - bin_edges[0])
    
    # Gaussian KL divergence
    gauss_probs = norm.pdf(bin_centers, mu_gauss, std_gauss)
    gauss_probs = gauss_probs / np.sum(gauss_probs) * (bin_edges[1] - bin_edges[0])
    mask = empirical_probs > 1e-10
    kl_gauss = np.sum(empirical_probs[mask] * np.log(empirical_probs[mask] / gauss_probs[mask]))
    
    # Laplace KL divergence  
    laplace_probs = laplace.pdf(bin_centers, loc_laplace, scale_laplace)
    laplace_probs = laplace_probs / np.sum(laplace_probs) * (bin_edges[1] - bin_edges[0])
    kl_laplace = np.sum(empirical_probs[mask] * np.log(empirical_probs[mask] / laplace_probs[mask]))
    
    # Customize plot
    ax.set_xlabel('Log Returns: ln(S_t / S_{t-1})', fontsize=14)
    ax.set_ylabel('Probability Density', fontsize=14)
    ax.set_title(f'{asset_name} Log Returns - Last 100 Days\nGaussian KL: {kl_gauss:.4f}, Laplace KL: {kl_laplace:.4f}', fontsize=16)
    ax.legend(fontsize=12)
    ax.grid(True, alpha=0.3)
    
    # Save the special plot
    special_filename = f"{filename_prefix}_log_returns_100days.png"
    special_filepath = os.path.join(output_dir, special_filename)
    plt.savefig(special_filepath, dpi=150, bbox_inches='tight')
    plt.show()  # Display the plot
    
    print(f"Special log returns plot saved as: {special_filename}")
    print(f"Gaussian KL divergence: {kl_gauss:.6f}")
    print(f"Laplace KL divergence: {kl_laplace:.6f}")
    print(f"Better fit: {'Laplace' if kl_laplace < kl_gauss else 'Gaussian'}")

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
