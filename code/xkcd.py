import numpy as np
import matplotlib.pyplot as plt

def plot_prior_and_posterior(base=2):
    # total domain size and suffix parameters
    N = 10**14
    suffix = int("00002382")   # the last 8 digits
    step   = 10**8             # so x % 10**8 == suffix

    # collect all x in [0, N) ending with that suffix
    k_max = (N - 1 - suffix) // step
    xs    = np.arange(k_max + 1) * step + suffix

    # posterior weights ~ 1/x on the suffix‐subset
    post_w = 1.0 / xs
    post_w /= post_w.sum()

    # compute bin edges as [base^i, base^(i+1))
    i_max     = int(np.ceil(np.log(xs.max()) / np.log(base)))
    bin_edges = base ** np.arange(i_max + 2)  # base^0 ... base^(i_max+1)

    # histogram posterior into those bins
    post_probs, _ = np.histogram(xs, bins=bin_edges, weights=post_w)

    # compute prior probabilities for each bin analytically:
    # P(x in [e_i, e_{i+1})) = ∫_{e_i}^{e_{i+1}} (1/x) dx / ∫_{1}^{N} (1/x) dx
    log_N = np.log(N)
    prior_probs = np.log(bin_edges[1:] / bin_edges[:-1]) / log_N

    # bar widths
    widths = np.diff(bin_edges)

    # two panels side by side
    fig, axs = plt.subplots(1, 2, figsize=(12, 5), sharex=True)

    # 1) Prior on the left (log‐x, linear y)
    axs[0].bar(bin_edges[:-1], prior_probs, width=widths, align='edge')
    axs[0].set_xscale('log')
    axs[0].set_xlabel('x (log scale)')
    axs[0].set_ylim(1e-5, 1)
    axs[0].set_ylabel('Prior $p(x) \\propto 1/x$')
    axs[0].set_title(f'Prior distribution')

    # 2) Posterior on the right (log‐x, log‐y)
    axs[1].bar(bin_edges[:-1], post_probs, width=widths, align='edge')
    axs[1].set_xscale('log')
    axs[1].set_yscale('log')
    axs[1].set_xlabel('x (log scale)')
    axs[1].set_ylim(1e-5, 1)    
    axs[1].set_ylabel('Posterior p(x | ends with 00002382)')
    axs[1].set_title(f'Posterior distribution')

    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    # example: fifth root of 10
    base = 10 ** (1/2)
    print(f"Using base = {base:.6f}")
    plot_prior_and_posterior(base)
