import numpy as np
import matplotlib.pyplot as plt
import math

# =======================
# Adjustable parameters
# =======================
N_EXPERIMENTS      = 1
DOMAIN_SIZE        = 150   # We'll treat the domain as integer points in [-75, ..., 74]
N_DATA_POINTS      = 10
POLY_DEG_P         = 3
POLY_DEG_Q         = 500
LEARNING_RATE      = 1e-1
N_ITERATIONS       = 1000  # Base iterations for each call; we call multiple times with different n_iter values.
RANDOM_COEF_SCALE  = 0.1   # Base scale for initialization

np.random.seed(42)

# =======================
# Helper functions
# =======================

def poly_value(x, coefs):
    """
    Evaluates a polynomial at x using coefs:
      coefs[0] + coefs[1]*x + coefs[2]*x^2 + ...
    Assumes x is already scaled in [-1, 1].
    """
    powers = np.array([x**i for i in range(len(coefs))])
    return np.dot(coefs, powers)

def probability_from_logits(logits):
    exps = np.exp(logits - np.max(logits))
    denom = np.sum(exps)
    if denom < 1e-30:  # check for underflow
        return np.ones_like(exps) / len(exps)
    return exps / denom

def kl_divergence(p, q):
    mask = (p > 0)
    return np.sum(p[mask] * np.log(p[mask] / q[mask]))

def random_initial_coefs(deg, base_scale=RANDOM_COEF_SCALE):
    """
    Return a random initialization for a polynomial of degree 'deg'.
    The i-th coefficient is drawn from N(0, (base_scale * 2^0)^2).
    (Note: For now we keep the same scale for all coefficients.)
    """
    coefs = np.array([np.random.randn() * base_scale for i in range(deg+1)])
    print("Random initial coefs:", coefs)
    return coefs

def fit_polynomial_via_gd(xs, ys, deg=20, lr=1e-5, n_iter=1000):
    """
    Fits a polynomial Q (of degree 'deg') to data (xs, ys) using gradient descent.
    Instead of starting from zeros, we start from a random initialization.
    """
    coefs = random_initial_coefs(deg)  # random start
    for _ in range(n_iter):
        grad = np.zeros_like(coefs)
        for x, y in zip(xs, ys):
            pred = poly_value(x, coefs)
            error = pred - y
            # accumulate gradient: derivative w.r.t. coefs[j] is error*x^j.
            for j in range(deg + 1):
                grad[j] += error * (x**j)
        grad /= len(xs)
        coefs -= lr * grad
    return coefs

def plot_fit(P_coefs, Q_coefs, domain_raw, scale_fn, sample_xs_raw=None, sample_ys_raw=None):
    """
    Plots the true polynomial P and the fitted polynomial Q.
    
    Parameters:
      P_coefs: Coefficients of true polynomial P.
      Q_coefs: Coefficients of fitted polynomial Q.
      domain_raw: The raw domain values (e.g. array of ints in [-DOMAIN_SIZE/2, DOMAIN_SIZE/2]).
      scale_fn: A function to scale raw x-values into [-1,1].
      sample_xs_raw: Optional list/array of raw x-values used as sample points.
      sample_ys_raw: Optional list/array of perturbed sample values.
                     If provided, these are plotted as the training data.
    """
    domain_scaled = [scale_fn(x) for x in domain_raw]
    p_vals = np.array([poly_value(x, P_coefs) for x in domain_scaled])
    q_vals = np.array([poly_value(x, Q_coefs) for x in domain_scaled])
    
    plt.figure(figsize=(8, 6))
    plt.plot(domain_raw, p_vals, label="True polynomial P", linewidth=2)
    plt.plot(domain_raw, q_vals, label="Fitted polynomial Q", linestyle='--', linewidth=2)
    
    if sample_xs_raw is not None:
        if sample_ys_raw is not None:
            plt.scatter(sample_xs_raw, sample_ys_raw, color='red', zorder=5, label="Perturbed Sample Points")
        else:
            sample_scaled = [scale_fn(x) for x in sample_xs_raw]
            sample_ys = np.array([poly_value(x, P_coefs) for x in sample_scaled])
            plt.scatter(sample_xs_raw, sample_ys, color='red', zorder=5, label="Sample Points")
    
    plt.xlabel("x (raw domain)")
    plt.ylabel("Polynomial value")
    plt.title("Comparison of P and Q")
    plt.legend()
    plt.show()

# ========================
# Main experiment loop
# ========================
all_kls = []

# Our domain is [-DOMAIN_SIZE/2,...,DOMAIN_SIZE/2 - 1]
domain_raw = np.arange(-DOMAIN_SIZE//2, DOMAIN_SIZE//2)

# Helper function to scale raw x-values.
def scale_x(x):
    return x / (DOMAIN_SIZE/2)

# FIXED sample points (drawn once) for all experiments.
fixed_sample_xs_raw = np.linspace(-DOMAIN_SIZE//2, DOMAIN_SIZE//2, num=N_DATA_POINTS)  
#np.random.choice(domain_raw, size=N_DATA_POINTS-2, replace=False)
#fixed_sample_xs_raw = np.append(fixed_sample_xs_raw, np.array([-DOMAIN_SIZE//2, DOMAIN_SIZE//2]))
fixed_sample_xs = [scale_x(xr) for xr in fixed_sample_xs_raw]

# Sample a "true" polynomial P.
P_coefs = random_initial_coefs(POLY_DEG_P, base_scale=RANDOM_COEF_SCALE)

# Generate training data with a small perturbation (noise).
# Here we assume a small noise scale (for example, 0.05). Adjust as needed.
NOISE_SCALE = 0.05
xs_sample = fixed_sample_xs  # already scaled
ys_sample = [poly_value(x, P_coefs) + np.random.randn() * NOISE_SCALE for x in xs_sample]

# Run only one experiment.
for experiment_idx in range(N_EXPERIMENTS):    
    # Fit polynomial Q using gradient descent with random initialization.
    # Try different numbers of iterations and print the training error (MSE) on the sample points.
    for n_iter in [0, 100, 1000, 10000, 50000, 100000, 200000, 500000]:
        Q_coefs = fit_polynomial_via_gd(xs_sample, ys_sample,
                                        deg=POLY_DEG_Q,
                                        lr=LEARNING_RATE,
                                        n_iter=n_iter)
        # Compute training error (mean squared error) on the fixed sample.
        preds = np.array([poly_value(x, Q_coefs) for x in xs_sample])
        targets = np.array(ys_sample)
        train_mse = np.mean((preds - targets)**2)
        
        print(f"n_iter: {n_iter}")
        print("True P coefs:", P_coefs)
        print("Fitted Q coefs:", Q_coefs)
        print(f"Training MSE: {train_mse:.10f}\n")
        plot_fit(P_coefs, Q_coefs, domain_raw, scale_x, fixed_sample_xs_raw, sample_ys_raw=ys_sample)

    # Convert P and Q to probability distributions on the domain.
    domain_scaled = [scale_x(xr) for xr in domain_raw]
    p_logits = np.array([poly_value(x, P_coefs) for x in domain_scaled])
    q_logits = np.array([poly_value(x, Q_coefs) for x in domain_scaled])
    p_prob = probability_from_logits(p_logits)
    q_prob = probability_from_logits(q_logits)

    # Compute KL divergence.
    kl_pq = kl_divergence(p_prob, q_prob)
    if np.isinf(kl_pq) or np.isnan(kl_pq):
        kl_pq = np.nan
    all_kls.append(kl_pq)

all_kls = np.array(all_kls)
valid_kls = all_kls[~np.isnan(all_kls)]

print(f"Count valid KLs: {len(valid_kls)} / {N_EXPERIMENTS}")
if len(valid_kls) > 0:
    print(f"Mean KL: {np.mean(valid_kls):.6f}, Std KL: {np.std(valid_kls):.6f}")
