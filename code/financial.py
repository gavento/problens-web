import yfinance as yf
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import math
from scipy.special import gammainc, gamma
from scipy.stats import t

##############################################################################
# HEADER: DOWNLOAD DATA OVER max_months
##############################################################################
max_months = 100
months_range = np.arange(1, max_months + 1)

btc_data = yf.download('BTC-USD', period=f'{max_months}mo', auto_adjust=False)
sap_data = yf.download('SAP', period=f'{max_months}mo', auto_adjust=False)

##############################################################################
# DEFINE THE EXP-POWER DISTRIBUTION
##############################################################################
class exp_power:
    @staticmethod
    def pdf(x, lam, alpha):
        """
        PDF: 
          f(x;λ,α) = (α * lam^(1/α)) / (2 * Γ(1/α)) * exp(-lam * |x|^α)
        """
        return (alpha * lam**(1/alpha)) / (2 * gamma(1/alpha)) * np.exp(-lam * np.abs(x)**alpha)
    
    @staticmethod
    def cdf(x, lam, alpha):
        """
        CDF for x>=0:
          F(x) = 0.5 + 0.5 * gammainc(1/alpha, lam*(x**alpha))
          and for x < 0:
          F(x) = 0.5 - 0.5 * gammainc(1/alpha, lam*((-x)**alpha))
        """
        x = np.asarray(x)
        result = np.empty_like(x, dtype=float)
        mask = (x >= 0)
        result[mask] = 0.5 + 0.5 * gammainc(1/alpha, lam * (x[mask]**alpha))
        result[~mask] = 0.5 - 0.5 * gammainc(1/alpha, lam * ((-x[~mask])**alpha))
        return result

##############################################################################
# DEFINE THE POWER-LAW DISTRIBUTION
##############################################################################
class power_law:
    @staticmethod
    def pdf(x, beta, delta):
        """
        PDF for a symmetric, shifted power law:
          f(x;β,δ) = (β-1)/(2 * δ^(1-β)) * 1/(|x|+δ)^β, for β > 1.
        """
        return (beta - 1) / (2 * (delta**(1-beta))) / ((np.abs(x) + delta)**beta)
    
    @staticmethod
    def cdf(x, beta, delta):
        """
        CDF for x>=0:
          F(x) = 0.5 + [δ^(1-β) - (x+δ)^(1-β)]/(2 * δ^(1-β)).
          For x < 0, use symmetry.
        """
        x = np.asarray(x)
        cdf_vals = np.empty_like(x, dtype=float)
        pos = (x >= 0)
        cdf_vals[pos] = 0.5 + (delta**(1-beta) - (x[pos] + delta)**(1-beta)) / (2 * delta**(1-beta))
        cdf_vals[~pos] = 0.5 - (delta**(1-beta) - ((np.abs(x[~pos]) + delta)**(1-beta))) / (2 * delta**(1-beta))
        return cdf_vals

##############################################################################
# DEFINE A WRAPPER FOR THE STUDENT-T DISTRIBUTION
##############################################################################
class student_t:
    @staticmethod
    def cdf(x, df, loc, scale):
        return t.cdf(x, df, loc=loc, scale=scale)

##############################################################################
# HELPER: DISCRETE KL DIVERGENCE FUNCTION
##############################################################################
def kl_divergence_discrete(data, dist, params, bins=100, expand_range=3.0):
    """
    Computes the discrete KL divergence between:
      - Q: the empirical distribution (histogram of data)
      - P: a continuous model (dist with params), integrated over the same bins.
    """
    data = np.asarray(data)
    n = len(data)
    if n < 2:
        return float('nan')
    
    data_min, data_max = data.min(), data.max()
    data_std = np.std(data, ddof=1) if n > 1 else 1.0
    left_edge = data_min - expand_range * data_std
    right_edge = data_max + expand_range * data_std
    bin_edges = np.linspace(left_edge, right_edge, bins + 1)
    
    counts, _ = np.histogram(data, bins=bin_edges)
    q = counts.astype(float) / counts.sum()
    
    p = np.zeros_like(q, dtype=float)
    for i in range(bins):
        cdf_low = dist.cdf(bin_edges[i], *params)
        cdf_high = dist.cdf(bin_edges[i+1], *params)
        p[i] = cdf_high - cdf_low
    
    total_p = p.sum()
    if not np.isclose(total_p, 1.0, atol=1e-8):
        p = p / total_p

    kl_val = 0.0
    for i in range(len(q)):
        if q[i] > 0 and p[i] > 0:
            kl_val += q[i] * math.log(q[i] / p[i])
    return kl_val

##############################################################################
# SEARCH OVER TIME PERIODS:
# - Best α (for exp_power) and Best β (for power_law)
# - Fixed exp_power models with α = 0.5, 1, and 2.
# - Best Student-t fit (grid search over ν)
# Also record the number of days (length of the period) for each m.
##############################################################################
alpha_grid = np.arange(0.05, 2.05, 0.1)   # for exp_power search
beta_grid  = np.arange(1.1, 5.1, 0.1)       # for power_law search (β > 1)
nu_grid    = np.arange(2.1, 10, 0.5)         # for student-t search (ν > 2)

# Initialize results lists.
btc_exp_alpha, btc_exp_kl = [], []
sap_exp_alpha, sap_exp_kl = [], []
btc_power_beta, btc_power_kl = [], []
sap_power_beta, sap_power_kl = [], []

# For fixed exp_power models
btc_exp05_kl, btc_exp1_kl, btc_exp2_kl = [], [], []
sap_exp05_kl, sap_exp1_kl, sap_exp2_kl = [], [], []

# For student-t models
btc_t_nu, btc_t_kl = [], []
sap_t_nu, sap_t_kl = [], []

# Record number of days in the period
btc_days = []
sap_days = []

for m in months_range:
    cutoff_btc = btc_data.index[-1] - pd.DateOffset(months=m)
    cutoff_sap = sap_data.index[-1] - pd.DateOffset(months=m)
    
    btc_period = btc_data.loc[btc_data.index >= cutoff_btc]
    sap_period = sap_data.loc[sap_data.index >= cutoff_sap]
    
    btc_prices = btc_period['Close'].dropna().values.flatten()
    sap_prices = sap_period['Close'].dropna().values.flatten()
    
    # Record number of days used
    btc_days.append(len(btc_prices) if len(btc_prices) >= 2 else np.nan)
    sap_days.append(len(sap_prices) if len(sap_prices) >= 2 else np.nan)
    
    # Process BTC data.
    if len(btc_prices) < 2:
        btc_exp_alpha.append(np.nan)
        btc_exp_kl.append(np.nan)
        btc_power_beta.append(np.nan)
        btc_power_kl.append(np.nan)
        btc_exp05_kl.append(np.nan)
        btc_exp1_kl.append(np.nan)
        btc_exp2_kl.append(np.nan)
        btc_t_nu.append(np.nan)
        btc_t_kl.append(np.nan)
    else:
        btc_diff = np.diff(btc_prices)
        n_btc = len(btc_diff)
        
        # --- exp_power search for BTC ---
        kl_vals_exp = []
        for alpha in alpha_grid:
            lam = n_btc / (alpha * np.sum(np.abs(btc_diff)**alpha))
            kl_val = kl_divergence_discrete(btc_diff, exp_power, (lam, alpha), bins=100)
            kl_vals_exp.append(kl_val)
        best_idx = np.nanargmin(kl_vals_exp)
        btc_exp_alpha.append(alpha_grid[best_idx])
        btc_exp_kl.append(kl_vals_exp[best_idx])
        
        # --- Fixed exp_power for BTC ---
        for fixed_alpha, lst in zip([0.5, 1.0, 2.0], [btc_exp05_kl, btc_exp1_kl, btc_exp2_kl]):
            lam_fixed = n_btc / (fixed_alpha * np.sum(np.abs(btc_diff)**fixed_alpha))
            kl_fixed = kl_divergence_discrete(btc_diff, exp_power, (lam_fixed, fixed_alpha), bins=100)
            lst.append(kl_fixed)
        
        # --- power_law search for BTC ---
        delta = np.median(np.abs(btc_diff))
        if delta == 0:
            delta = 1e-6
        kl_vals_power = []
        for beta in beta_grid:
            kl_val = kl_divergence_discrete(btc_diff, power_law, (beta, delta), bins=100)
            kl_vals_power.append(kl_val)
        best_idx = np.nanargmin(kl_vals_power)
        btc_power_beta.append(beta_grid[best_idx])
        btc_power_kl.append(kl_vals_power[best_idx])
        
        # --- Student-t search for BTC ---
        mu_btc = np.mean(btc_diff)
        var_btc = np.var(btc_diff, ddof=1)
        kl_vals_t = []
        for nu in nu_grid:
            sigma = np.sqrt((nu - 2) / nu * var_btc)
            kl_val = kl_divergence_discrete(btc_diff, student_t, (nu, mu_btc, sigma), bins=100)
            kl_vals_t.append(kl_val)
        best_idx = np.nanargmin(kl_vals_t)
        btc_t_nu.append(nu_grid[best_idx])
        btc_t_kl.append(kl_vals_t[best_idx])
    
    # Process SAP data.
    if len(sap_prices) < 2:
        sap_exp_alpha.append(np.nan)
        sap_exp_kl.append(np.nan)
        sap_power_beta.append(np.nan)
        sap_power_kl.append(np.nan)
        sap_exp05_kl.append(np.nan)
        sap_exp1_kl.append(np.nan)
        sap_exp2_kl.append(np.nan)
        sap_t_nu.append(np.nan)
        sap_t_kl.append(np.nan)
    else:
        sap_diff = np.diff(sap_prices)
        n_sap = len(sap_diff)
        
        # --- exp_power search for SAP ---
        kl_vals_exp = []
        for alpha in alpha_grid:
            lam = n_sap / (alpha * np.sum(np.abs(sap_diff)**alpha))
            kl_val = kl_divergence_discrete(sap_diff, exp_power, (lam, alpha), bins=100)
            kl_vals_exp.append(kl_val)
        best_idx = np.nanargmin(kl_vals_exp)
        sap_exp_alpha.append(alpha_grid[best_idx])
        sap_exp_kl.append(kl_vals_exp[best_idx])
        
        # --- Fixed exp_power for SAP ---
        for fixed_alpha, lst in zip([0.5, 1.0, 2.0], [sap_exp05_kl, sap_exp1_kl, sap_exp2_kl]):
            lam_fixed = n_sap / (fixed_alpha * np.sum(np.abs(sap_diff)**fixed_alpha))
            kl_fixed = kl_divergence_discrete(sap_diff, exp_power, (lam_fixed, fixed_alpha), bins=100)
            lst.append(kl_fixed)
        
        # --- power_law search for SAP ---
        delta = np.median(np.abs(sap_diff))
        if delta == 0:
            delta = 1e-6
        kl_vals_power = []
        for beta in beta_grid:
            kl_val = kl_divergence_discrete(sap_diff, power_law, (beta, delta), bins=100)
            kl_vals_power.append(kl_val)
        best_idx = np.nanargmin(kl_vals_power)
        sap_power_beta.append(beta_grid[best_idx])
        sap_power_kl.append(kl_vals_power[best_idx])
        
        # --- Student-t search for SAP ---
        mu_sap = np.mean(sap_diff)
        var_sap = np.var(sap_diff, ddof=1)
        kl_vals_t = []
        for nu in nu_grid:
            sigma = np.sqrt((nu - 2) / nu * var_sap)
            kl_val = kl_divergence_discrete(sap_diff, student_t, (nu, mu_sap, sigma), bins=100)
            kl_vals_t.append(kl_val)
        best_idx = np.nanargmin(kl_vals_t)
        sap_t_nu.append(nu_grid[best_idx])
        sap_t_kl.append(kl_vals_t[best_idx])

##############################################################################
# PLOT 1: Best exp_power α vs. Time Period (months)
##############################################################################
plt.figure(figsize=(10, 6))
plt.plot(months_range, btc_exp_alpha, marker='o', label='BTC-USD Best α')
plt.plot(months_range, sap_exp_alpha, marker='s', label='SAP Best α')
plt.xlabel("Time Period (months)")
plt.ylabel("Best Fit α (exp_power)")
plt.title("Best exp_power α vs. Time Period")
plt.legend()
plt.grid(True)
plt.show()

##############################################################################
# PLOT 2: Best power_law β vs. Time Period (months)
##############################################################################
plt.figure(figsize=(10, 6))
plt.plot(months_range, btc_power_beta, marker='o', label='BTC-USD')
plt.plot(months_range, sap_power_beta, marker='s', label='SAP')
plt.xlabel("Time Period (months)")
plt.ylabel("Best Fit β (power_law)")
plt.title("Best power_law β vs. Time Period")
plt.legend()
plt.grid(True)
plt.show()

##############################################################################
# PLOT 3: Comparison of KL Divergence for exp_power and Student-t Models
# (For BTC-USD and SAP separately)
##############################################################################
# BTC Plot:
plt.figure(figsize=(10, 8))
plt.plot(months_range, btc_exp_kl, linestyle='-', label='Best exp_power (grid search)')
plt.plot(months_range, btc_exp05_kl, linestyle='-', label='Fixed exp_power α=0.5')
plt.plot(months_range, btc_exp1_kl, linestyle='-', label='Fixed exp_power α=1')
plt.plot(months_range, btc_exp2_kl, linestyle='-', label='Fixed exp_power α=2')
plt.plot(months_range, btc_t_kl, linestyle='-', label='Student-t (grid search)')
plt.xlabel("Time Period (months)")
plt.ylabel("Discrete KL Divergence")
plt.title("BTC-USD: KL Divergence Comparison")
plt.legend()
plt.grid(True)
plt.show()

# SAP Plot:
plt.figure(figsize=(10, 8))
plt.plot(months_range, sap_exp_kl, linestyle='-', label='Best exp_power (grid search)')
plt.plot(months_range, sap_exp05_kl, linestyle='-', label='Fixed exp_power α=0.5')
plt.plot(months_range, sap_exp1_kl, linestyle='-', label='Fixed exp_power α=1')
plt.plot(months_range, sap_exp2_kl, linestyle='-', label='Fixed exp_power α=2')
plt.plot(months_range, sap_t_kl, linestyle='-', label='Student-t (grid search)')
plt.xlabel("Time Period (months)")
plt.ylabel("Discrete KL Divergence")
plt.title("SAP: KL Divergence Comparison")
plt.legend()
plt.grid(True)
plt.show()

##############################################################################
# PLOT 4: Best Student-t ν vs. Number of Days in the Time Window
##############################################################################
plt.figure(figsize=(10, 6))
plt.plot(btc_days, btc_t_nu, linestyle='-', marker='o', label='BTC-USD')
plt.plot(sap_days, sap_t_nu, linestyle='-', marker='s', label='SAP')
plt.xlabel("Number of Days in Time Window")
plt.ylabel("Best Student-t ν")
plt.title("Best Student-t ν vs. Number of Days")
plt.legend()
plt.grid(True)
plt.show()
