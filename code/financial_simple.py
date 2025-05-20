import yfinance as yf
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import math
from scipy.special import gammainc, gamma
from scipy.stats import t, norm, laplace

##############################################################################
# HEADER: DOWNLOAD DATA OVER max_months
##############################################################################
max_months = 999
# months_range = np.arange(1, max_months + 1)  # Will comment out the loop usage below.

btc_data = yf.download('BTC-USD', period=f'{max_months}mo', auto_adjust=False)
sap_data = yf.download('SAP',     period=f'{max_months}mo', auto_adjust=False)

def plot_fits(ax, data, title):
    """Plot the histogram + fitted Gaussian, Laplace, and Student‑t for 'data'."""
    if len(data) < 2:
        # If not enough points, just state it
        ax.text(0.5, 0.5, "No data (len<2)", ha='center', va='center', transform=ax.transAxes)
        ax.set_title(title + " (Insufficient data)")
        return

    # Plot histogram (empirical distribution)
    ax.hist(data, bins=50, density=True, alpha=0.5, label='Empirical')

    # Prepare x-range
    xmin, xmax = ax.get_xlim()
    x = np.linspace(xmin, xmax, 400)

    # === Gaussian Fit ===
    mu = np.mean(data)
    std = np.std(data, ddof=1)
    # Only plot if std is positive
    if std > 0 and np.isfinite(mu):
        gauss_pdf = norm.pdf(x, mu, std)
        ax.plot(x, gauss_pdf, 'r-', label='Gaussian')

    # === Laplace Fit ===
    loc_lap = np.median(data)
    scale_lap = np.mean(np.abs(data - loc_lap))
    if scale_lap > 0 and np.isfinite(loc_lap):
        lap_pdf = laplace.pdf(x, loc_lap, scale_lap)
        ax.plot(x, lap_pdf, 'g-', label='Laplace')

    # === Student-t Fit ===
    # Use try/except in case there's something degenerate about the data
    try:
        df_t, loc_t, scale_t = t.fit(data)
        # Only plot if scale_t is positive
        if scale_t > 0 and np.isfinite(df_t) and np.isfinite(loc_t):
            t_pdf = t.pdf(x, df_t, loc=loc_t, scale=scale_t)
            ax.plot(x, t_pdf, 'b-', label='Student-t')
    except Exception as e:
        print(f"Student-t fit failed for {title}: {e}")

    ax.set_title(title)
    ax.grid(True)
    ax.legend()


# Extract full BTC data and compute daily differences
btc_prices = btc_data['Close'].dropna().values.flatten()
btc_diff = np.diff(btc_prices) if len(btc_prices) >= 2 else []

# Extract full SAP data and compute daily differences
sap_prices = sap_data['Close'].dropna().values.flatten()
sap_diff = np.diff(sap_prices) if len(sap_prices) >= 2 else []

# Create a single figure with 2 subplots
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

plot_fits(axes[0], btc_diff, "BTC-USD Daily Differences")
plot_fits(axes[1], sap_diff, "SAP Daily Differences")

plt.tight_layout()
plt.show()
