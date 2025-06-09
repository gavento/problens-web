import os
import pickle
import time
import numpy as np
import pandas as pd
from scipy.stats import norm, laplace
from datetime import datetime
import requests
import json

##############################################################################
# CONFIGURATION
##############################################################################
max_months = 999

##############################################################################
# CREATE CACHE DIRECTORY
##############################################################################
cache_dir = 'financial_cache'
os.makedirs(cache_dir, exist_ok=True)

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

##############################################################################
# FUNCTION TO COMPUTE DISTRIBUTION PARAMETERS AND KL DIVERGENCES
##############################################################################
def compute_distribution_params(data_values):
    """
    Compute distribution parameters and KL divergences for the given data.
    Returns a dictionary with all the computed values.
    """
    if len(data_values) < 2:
        return None
    
    result = {
        'n_samples': len(data_values),
        'mean': float(np.mean(data_values)),
        'std': float(np.std(data_values, ddof=1)),
        'min': float(np.min(data_values)),
        'max': float(np.max(data_values)),
        'median': float(np.median(data_values)),
        'kurtosis': float(np.mean(((data_values - np.mean(data_values)) / np.std(data_values, ddof=1)) ** 4) - 3),
        'distributions': {}
    }
    
    mu = result['mean']
    std = result['std']
    
    if std <= 0 or not np.isfinite(mu) or not np.isfinite(std):
        return None
    
    # Compute histogram for KL divergence calculations
    # Use more bins to ensure good granularity for web display
    # Aim for at least 100 bins, more for larger datasets
    n_bins = max(100, min(200, len(data_values) // 10))
    counts, bin_edges = np.histogram(data_values, bins=n_bins)
    total_counts = counts.sum()
    if total_counts == 0:
        return None
    
    # Store histogram data
    result['histogram'] = {
        'counts': counts.tolist(),
        'bin_edges': bin_edges.tolist()
    }
    
    # Empirical probability per bin
    P = counts.astype(float) / total_counts
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2.0
    
    # Gaussian parameters and KL divergence
    gauss_pdf_vals = norm.pdf(bin_centers, mu, std)
    Q_gauss = gauss_pdf_vals / np.sum(gauss_pdf_vals)
    mask = P > 0
    kl_gauss = float(np.sum(P[mask] * np.log(P[mask] / Q_gauss[mask])))
    
    result['distributions']['gaussian'] = {
        'mu': mu,
        'std': std,
        'kl_divergence': kl_gauss
    }
    
    # Laplace parameters and KL divergence
    loc_lap = np.median(data_values)
    scale_lap = np.mean(np.abs(data_values - loc_lap))
    if scale_lap > 0 and np.isfinite(loc_lap):
        lap_pdf_vals = laplace.pdf(bin_centers, loc_lap, scale_lap)
        if lap_pdf_vals.sum() > 0:
            Q_laplace = lap_pdf_vals / np.sum(lap_pdf_vals)
            kl_laplace = float(np.sum(P[mask] * np.log(P[mask] / Q_laplace[mask]))) if Q_laplace[mask].all() else float('inf')
        else:
            kl_laplace = float('inf')
    else:
        kl_laplace = float('inf')
    
    result['distributions']['laplace'] = {
        'loc': float(loc_lap),
        'scale': float(scale_lap),
        'kl_divergence': kl_laplace
    }
    
    return result

##############################################################################
# MAIN DATA PROCESSING
##############################################################################
def generate_financial_data(asset='BTC'):
    """
    Generate financial data for the specified asset.
    Returns a dictionary with all the computed data.
    """
    print(f"Generating data for {asset}...")
    
    # Load data
    if asset == 'BTC':
        cache_filename = f'btc_data_{max_months}mo.pkl'
        data = load_or_download_btc(max_months, cache_filename)
        asset_name = 'BTC-USD'
    else:  # SAP
        symbol = 'SAP'
        asset_name = 'SAP'
        cache_filename = f'sap_data_{max_months}mo.pkl'
        data = load_or_download_sap(symbol, f'{max_months}mo', cache_filename)
    
    if data.empty:
        print("No data available.")
        return None
    
    # Extract price data and compute normalized daily returns
    all_prices = data['Close'].dropna().values.flatten()
    if len(all_prices) >= 2:
        all_price_returns = (all_prices[1:] / all_prices[:-1]) - 1
    else:
        print("Insufficient data for returns calculation.")
        return None
    
    max_days = len(all_price_returns)
    if max_days == 0:
        print("No price returns to analyze.")
        return None
    
    print(f"Total available data points: {max_days}")
    print(f"Data date range: {data.index[0].strftime('%Y-%m-%d')} to {data.index[-1].strftime('%Y-%m-%d')}")
    
    # Generate data for each day
    results = {
        'asset': asset_name,
        'start_date': data.index[0].strftime('%Y-%m-%d'),
        'end_date': data.index[-1].strftime('%Y-%m-%d'),
        'max_days': max_days,
        'daily_data': {}
    }
    
    print("Computing distribution parameters for each time window...")
    for i in range(1, max_days + 1):
        price_returns = all_price_returns[-i:]
        params = compute_distribution_params(price_returns)
        if params:
            results['daily_data'][i] = params
        
        if i % 100 == 0:
            print(f"Processed {i}/{max_days} days")
    
    print(f"Data generation complete. Processed {len(results['daily_data'])} time windows.")
    return results

##############################################################################
# SAVE DATA TO JSON
##############################################################################
def save_data_to_json(asset='BTC', output_dir='financial_data'):
    """
    Generate and save financial data to JSON file.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    data = generate_financial_data(asset)
    if data:
        output_path = os.path.join(output_dir, f'{asset.lower()}_data.json')
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Data saved to {output_path}")
        return output_path
    else:
        print("Failed to generate data")
        return None

if __name__ == "__main__":
    # Generate data for both assets
    save_data_to_json('BTC')
    save_data_to_json('SAP')