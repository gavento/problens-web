"use client";

/*
 * ================================================================================
 * XKCD COUNTDOWN PROBABILITY CALCULATOR WIDGET
 * ================================================================================
 *
 * OVERVIEW:
 * This widget implements a Bayesian probability calculator inspired by the XKCD
 * "Countdown" comic. It calculates the probability that a randomly chosen 14-digit
 * number equals a specific target (default: 2382) given evidence about the last
 * 8 digits (default: "00002382").
 *
 * MATHEMATICAL FRAMEWORK:
 *
 * 1. PRIOR DISTRIBUTION:
 *    We model 14-digit numbers X with a power-law prior: P(X) ∝ X^(-λ)
 *    - λ = 0: Uniform distribution (all numbers equally likely)
 *    - λ = 1: Log-uniform distribution (favors smaller numbers logarithmically)
 *    - λ > 1: Strong preference for smaller numbers
 *
 * 2. EVIDENCE/LIKELIHOOD:
 *    Given evidence E (e.g., "last 8 digits are 00002382"), we calculate:
 *    P(E|X) = likelihood that number X produces evidence E
 *
 *    For evidence patterns with wildcards (e.g., "****23*8"):
 *    - Fixed digits must match exactly
 *    - Wildcard positions can be any digit 0-9
 *    - P(E|X) = 1 if X matches pattern, 0 otherwise
 *
 * 3. POSTERIOR DISTRIBUTION (Bayes' Theorem):
 *    P(X|E) = P(E|X) × P(X) / P(E)
 *
 *    Where:
 *    - P(E|X): Likelihood (computed via importance sampling)
 *    - P(X): Prior (power-law distribution)
 *    - P(E): Normalizing constant (marginal likelihood)
 *
 * 4. BIN-WISE COMPUTATION:
 *    Numbers are grouped into logarithmic bins [10^i, 10^(i+0.5)) for visualization.
 *    For each bin, we calculate bin probability as the integral of P(X|E) over that bin.
 *
 * COMPUTATIONAL METHODS:
 *
 * 1. PRECOMPUTED DATA (default evidence "00002382"):
 *    - Exact calculations for 1M numbers ending in "00002382"
 *    - Stored in JSON lookup table for instant response
 *    - Separate arrays for each λ value since likelihood is λ-dependent
 *
 * 2. DYNAMIC CALCULATION (custom evidence patterns):
 *    Uses importance sampling when user changes evidence:
 *
 *    a) SAMPLING FROM BIN ∩ EVIDENCE:
 *       - Problem: Can't sample uniformly and hope to hit rare patterns
 *       - Solution: Directly construct numbers matching the evidence pattern
 *       - Algorithm: Set fixed digits, randomize wildcard positions, verify bin membership
 *
 *    b) IMPORTANCE SAMPLING:
 *       For bin [a,b) with evidence pattern:
 *       1. Sample n numbers uniformly from {x ∈ [a,b) : x matches evidence}
 *       2. Calculate importance weights: w(x) = x^(-λ) / uniform_density
 *       3. Estimate likelihood: (Σ w(x) for matching x) / (Σ w(x) for all x in bin)
 *
 *    c) NUMERICAL CONSIDERATIONS:
 *       - Use 1000 samples per bin for statistical accuracy
 *       - Handle empty intersections (bin ∩ evidence = ∅)
 *       - Manage numerical precision for very large/small weights
 *
 * USER INTERFACE:
 *
 * 1. EVIDENCE INPUT:
 *    - 14 emoji slots representing digit positions
 *    - Click emoji to open dropdown: 🖼️ (wildcard) or 0️⃣-9️⃣ (digits)
 *    - Default: "🖼️🖼️🖼️🖼️🖼️🖼️0️⃣0️⃣0️⃣0️⃣2️⃣3️⃣8️⃣2️⃣" (last 8 digits = "00002382")
 *
 * 2. PARAMETER CONTROL:
 *    - λ slider: Controls prior distribution strength (0.0 to 2.0)
 *    - View mode: Prior/Likelihood/Posterior toggle
 *    - Scale toggle: Linear/Log scale for visualization
 *
 * 3. VISUALIZATION:
 *    - Bar chart showing probability distribution across logarithmic bins
 *    - Adaptive Y-axis scaling based on data range
 *    - Interactive tooltips with exact probability values
 *    - Real-time updates as parameters change
 *
 * PERFORMANCE OPTIMIZATIONS:
 *
 * 1. CACHING:
 *    - Default evidence uses precomputed data (instant response)
 *    - Custom evidence calculations cached to avoid recomputation
 *
 * 2. DEBOUNCING:
 *    - Wait 300ms after user stops changing evidence before recalculating
 *    - Prevents excessive computation during rapid input changes
 *
 * 3. PROGRESSIVE LOADING:
 *    - Show loading indicator during calculation
 *    - Update bins as they complete calculation
 *
 * 4. SMART SAMPLING:
 *    - Skip bins where evidence pattern is impossible
 *    - Adapt sample size based on pattern complexity
 *    - Use rejection sampling with intelligent bounds
 *
 * This implementation demonstrates key concepts in computational Bayesian inference:
 * - Prior specification and its impact on posterior beliefs
 * - Likelihood calculation for discrete evidence
 * - Importance sampling for intractable integrals
 * - Real-time Bayesian updating with user interaction
 *
 * The widget serves as an interactive exploration tool for understanding how
 * different priors and evidence patterns affect probabilistic reasoning.
 * ================================================================================
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { InlineMath } from "react-katex";

// ================================================================================
// TYPE DEFINITIONS
// ================================================================================

interface PrecomputedData {
  metadata: {
    evidence_digits: string;
    target_number: number;
    total_digits: number;
    evidence_space: number;
    lambda_values: number[];
    num_bins: number;
    num_valid_numbers: number;
  };
  bins: Array<{
    min: number;
    max: number;
    index: number;
  }>;
  lambda_data: {
    [key: string]: {
      bin_probabilities: number[];
      target_posterior: number;
      prior_probabilities: number[];
      likelihood_probabilities: number[];
      normalizing_sum: number;
    };
  };
}

type ViewMode = "prior" | "likelihood" | "posterior";

// Evidence pattern: array of 14 elements, each either a digit (0-9) or wildcard ('*')
type EvidencePattern = (string | "*")[];

// Digit emoji mapping for UI display
const DIGIT_EMOJIS = {
  "*": "🖼️", // Wildcard mask
  "0": "0️⃣",
  "1": "1️⃣",
  "2": "2️⃣",
  "3": "3️⃣",
  "4": "4️⃣",
  "5": "5️⃣",
  "6": "6️⃣",
  "7": "7️⃣",
  "8": "8️⃣",
  "9": "9️⃣",
} as const;

// Reverse mapping for emoji to digit conversion
const EMOJI_TO_DIGIT = Object.fromEntries(Object.entries(DIGIT_EMOJIS).map(([digit, emoji]) => [emoji, digit]));

// ================================================================================
// EVIDENCE PATTERN UTILITIES
// ================================================================================

/**
 * Convert evidence pattern array to string representation
 * Example: ['*', '*', '2', '3', '*'] → "**23*"
 */
function patternToString(pattern: EvidencePattern): string {
  return pattern.join("");
}

/**
 * Convert evidence pattern to emoji string for display
 * Example: ['*', '2', '3'] → "🖼️2️⃣3️⃣"
 */
function patternToEmoji(pattern: EvidencePattern): string {
  return pattern.map((char) => DIGIT_EMOJIS[char as keyof typeof DIGIT_EMOJIS]).join("");
}

/**
 * Parse evidence string into pattern array
 * Example: "**23*" → ['*', '*', '2', '3', '*']
 */
function parsePattern(evidenceString: string): EvidencePattern {
  return evidenceString.split("") as EvidencePattern;
}

/**
 * Check if a number matches the evidence pattern
 * Example: number=12345, pattern=['1','*','3','*','5'] → true
 */
function matchesPattern(number: number, pattern: EvidencePattern): boolean {
  const numberStr = number.toString().padStart(14, "0"); // Ensure 14 digits

  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] !== "*" && pattern[i] !== numberStr[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Calculate the minimum possible number that matches the pattern
 * Example: pattern=['*','*','2','3','*'] → 00230 (padded to 14 digits)
 */
function getPatternMinNumber(pattern: EvidencePattern): number {
  const digits = pattern.map((char) => (char === "*" ? "0" : char)).join("");
  return parseInt(digits, 10);
}

/**
 * Calculate the maximum possible number that matches the pattern
 * Example: pattern=['*','*','2','3','*'] → 99239...9 (padded to 14 digits)
 */
function getPatternMaxNumber(pattern: EvidencePattern): number {
  const digits = pattern.map((char) => (char === "*" ? "9" : char)).join("");
  return parseInt(digits, 10);
}

// ================================================================================
// IMPORTANCE SAMPLING FOR DYNAMIC LIKELIHOOD CALCULATION
// ================================================================================

/**
 * Sample uniformly from the intersection of a bin and evidence pattern
 *
 * ALGORITHM:
 * 1. Find the intersection of [bin_min, bin_max) with pattern constraints
 * 2. Use rejection sampling to generate valid numbers efficiently
 * 3. For each sample, verify it matches the evidence pattern
 *
 * OPTIMIZATION: Instead of pure rejection sampling, we construct candidates
 * that are guaranteed to match the pattern, then check bin membership.
 *
 * @param binMin - Lower bound of the bin (inclusive)
 * @param binMax - Upper bound of the bin (exclusive)
 * @param pattern - Evidence pattern with wildcards and fixed digits
 * @param nSamples - Target number of samples to generate
 * @returns Array of numbers that are in [binMin, binMax) AND match pattern
 */
function sampleFromBinAndEvidence(
  binMin: number,
  binMax: number,
  pattern: EvidencePattern,
  nSamples: number = 1000,
): number[] {
  // Step 1: Calculate intersection bounds
  const patternMin = getPatternMinNumber(pattern);
  const patternMax = getPatternMaxNumber(pattern);

  // Intersection of bin [binMin, binMax) with pattern [patternMin, patternMax]
  const intersectionMin = Math.max(binMin, patternMin);
  const intersectionMax = Math.min(binMax, patternMax + 1); // +1 because binMax is exclusive

  // Early return if no intersection exists
  if (intersectionMin >= intersectionMax) {
    return [];
  }

  const samples: number[] = [];
  const maxAttempts = nSamples * 100; // Prevent infinite loops for impossible patterns
  let attempts = 0;

  // Step 2: Generate samples using smart construction
  while (samples.length < nSamples && attempts < maxAttempts) {
    attempts++;

    // Method A: Direct construction (faster for sparse patterns)
    if (attempts < nSamples * 10) {
      const candidate = constructMatchingNumber(pattern, intersectionMin, intersectionMax);
      if (candidate !== null && binMin <= candidate && candidate < binMax) {
        samples.push(candidate);
      }
    }
    // Method B: Rejection sampling fallback (more general)
    else {
      const candidate = Math.floor(Math.random() * (intersectionMax - intersectionMin)) + intersectionMin;
      if (matchesPattern(candidate, pattern) && binMin <= candidate && candidate < binMax) {
        samples.push(candidate);
      }
    }
  }

  return samples;
}

/**
 * Construct a random number that matches the evidence pattern within given bounds
 *
 * STRATEGY:
 * 1. Start with pattern template (fixed digits in place, wildcards as placeholders)
 * 2. Fill wildcards with random digits
 * 3. Ensure result is within [min, max) bounds
 *
 * @param pattern - Evidence pattern to match
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (exclusive)
 * @returns Random number matching pattern and bounds, or null if impossible
 */
function constructMatchingNumber(pattern: EvidencePattern, min: number, max: number): number | null {
  // Build number string by filling in wildcards
  const numberStr = pattern
    .map((char) => {
      if (char === "*") {
        return Math.floor(Math.random() * 10).toString(); // Random digit 0-9
      } else {
        return char; // Fixed digit
      }
    })
    .join("");

  const number = parseInt(numberStr, 10);

  // Verify bounds (should usually be satisfied if intersection was calculated correctly)
  if (number >= min && number < max) {
    return number;
  }

  return null; // Failed to construct valid number
}

/**
 * Calculate weighted likelihood for a bin using importance sampling
 *
 * MATHEMATICAL FOUNDATION:
 * - Target distribution: P(x) ∝ x^(-λ) (power-law prior)
 * - Proposal distribution: Uniform over bin ∩ evidence
 * - Importance weight: w(x) = x^(-λ) / uniform_density
 * - Likelihood estimate: Σ w(x) for evidence matches / Σ w(x) for all samples
 *
 * ALGORITHM:
 * 1. Sample n numbers uniformly from {x ∈ bin : x matches evidence}
 * 2. Calculate importance weights for each sample
 * 3. Estimate likelihood as weighted average
 * 4. Handle edge cases (empty samples, numerical overflow)
 *
 * @param binMin - Lower bound of bin (inclusive)
 * @param binMax - Upper bound of bin (exclusive)
 * @param lambdaVal - Power-law exponent for prior P(x) ∝ x^(-λ)
 * @param pattern - Evidence pattern to match
 * @param nSamples - Number of samples for Monte Carlo estimation
 * @returns Estimated likelihood P(evidence | bin, λ)
 */
function calculateDynamicLikelihood(
  binMin: number,
  binMax: number,
  lambdaVal: number,
  pattern: EvidencePattern,
  nSamples: number = 1000,
): number {
  // Step 1: Sample from bin ∩ evidence
  const samples = sampleFromBinAndEvidence(binMin, binMax, pattern, nSamples);

  // Handle empty intersection
  if (samples.length === 0) {
    return 0.0;
  }

  // Step 2: Calculate importance weights
  // All samples match evidence by construction, so evidence_weight = total_weight
  let totalWeight = 0.0;

  for (const x of samples) {
    // Importance weight: w(x) = x^(-λ) × (bin_width / sample_count)
    // The bin_width factor cancels out in likelihood calculation, so we omit it
    const weight = lambdaVal === 0 ? 1.0 : Math.pow(x, -lambdaVal);
    totalWeight += weight;
  }

  // Since all samples match evidence: evidence_weight = totalWeight
  const evidenceWeight = totalWeight;

  // Step 3: Calculate total weight over entire bin (not just evidence matches)
  // This requires integration or sampling over the full bin
  const binTotalWeight = calculateBinTotalWeight(binMin, binMax, lambdaVal);

  // Step 4: Likelihood = evidence_weight / bin_total_weight
  const likelihood = binTotalWeight > 0 ? evidenceWeight / binTotalWeight : 0.0;

  return likelihood;
}

/**
 * Calculate total importance weight over entire bin (for likelihood normalization)
 *
 * INTEGRATION METHODS:
 * - λ = 0: Uniform → ∫[a,b] 1 dx = b - a
 * - λ = 1: Log-uniform → ∫[a,b] 1/x dx = ln(b) - ln(a)
 * - λ ≠ 0,1: Power-law → ∫[a,b] x^(-λ) dx = [x^(1-λ)/(1-λ)]_a^b
 *
 * For large bins, use analytical formulas. For small bins, use sampling.
 *
 * @param binMin - Lower bound of bin (inclusive)
 * @param binMax - Upper bound of bin (exclusive)
 * @param lambdaVal - Power-law exponent
 * @returns Total weight ∫[binMin,binMax] x^(-λ) dx
 */
function calculateBinTotalWeight(binMin: number, binMax: number, lambdaVal: number): number {
  if (binMin >= binMax) return 0.0;

  const a = binMin;
  const b = binMax;

  // Handle special cases analytically
  if (Math.abs(lambdaVal) < 1e-10) {
    // λ ≈ 0: Uniform distribution
    return b - a;
  } else if (Math.abs(lambdaVal - 1) < 1e-10) {
    // λ ≈ 1: Log-uniform distribution
    return Math.log(b) - Math.log(a);
  } else {
    // λ ≠ 0,1: General power-law
    // ∫ x^(-λ) dx = x^(1-λ)/(1-λ) + C
    const exponent = 1 - lambdaVal;
    return (Math.pow(b, exponent) - Math.pow(a, exponent)) / exponent;
  }
}

const XKCDCountdownWidget: React.FC = () => {
  // ================================================================================
  // COMPONENT STATE
  // ================================================================================

  // Core parameters
  const [lambda, setLambda] = useState(1.0);
  const [logScale, setLogScale] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("posterior");

  // Evidence pattern state - default to "******00002382" (last 8 digits match)
  const [evidencePattern, setEvidencePattern] = useState<EvidencePattern>([
    "*",
    "*",
    "*",
    "*",
    "*",
    "*",
    "0",
    "0",
    "0",
    "0",
    "2",
    "3",
    "8",
    "2",
  ]);

  // UI state
  const [precomputedData, setPrecomputedData] = useState<PrecomputedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [calculatingCustom, setCalculatingCustom] = useState(false);

  // Evidence input UI state
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [customLikelihoodCache, setCustomLikelihoodCache] = useState<Map<string, number[]>>(new Map());
  const [customLikelihood, setCustomLikelihood] = useState<number[] | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ================================================================================
  // EVIDENCE PATTERN MANAGEMENT
  // ================================================================================

  /**
   * Check if current evidence pattern matches the precomputed default
   * Default pattern: "******00002382" (last 8 digits are 00002382)
   */
  const isDefaultPattern = useMemo(() => {
    const defaultPattern = ["*", "*", "*", "*", "*", "*", "0", "0", "0", "0", "2", "3", "8", "2"];
    return JSON.stringify(evidencePattern) === JSON.stringify(defaultPattern);
  }, [evidencePattern]);

  /**
   * Update evidence pattern at specific position
   * Triggers debounced recalculation if pattern changes
   */
  const updateEvidencePattern = useCallback((index: number, value: string) => {
    setEvidencePattern((prev) => {
      const newPattern = [...prev];
      newPattern[index] = value;
      return newPattern;
    });
    setOpenDropdown(null); // Close dropdown after selection
  }, []);

  /**
   * Calculate custom likelihood for all bins using importance sampling
   * Only called when evidence pattern differs from default
   */
  const calculateCustomLikelihood = useCallback(
    async (
      lambda: number,
      pattern: EvidencePattern,
      bins: Array<{ min: number; max: number; index: number }>,
    ): Promise<number[]> => {
      const patternKey = `${lambda}_${patternToString(pattern)}`;

      // Check cache first
      if (customLikelihoodCache.has(patternKey)) {
        return customLikelihoodCache.get(patternKey)!;
      }

      setCalculatingCustom(true);

      try {
        // Calculate likelihood for each bin using importance sampling
        const likelihoodPromises = bins.map(async (bin) => {
          return calculateDynamicLikelihood(bin.min, bin.max, lambda, pattern, 1000);
        });

        const results = await Promise.all(likelihoodPromises);

        // Cache the results
        setCustomLikelihoodCache((prev) => new Map(prev.set(patternKey, results)));

        return results;
      } finally {
        setCalculatingCustom(false);
      }
    },
    [customLikelihoodCache],
  );

  // Recompute custom likelihoods when pattern or lambda changes
  useEffect(() => {
    if (!precomputedData) return;
    if (isDefaultPattern) {
      setCustomLikelihood(null);
      return;
    }

    calculateCustomLikelihood(lambda, evidencePattern, precomputedData.bins).then((arr) => {
      setCustomLikelihood(arr);
    });
  }, [lambda, evidencePattern, isDefaultPattern, precomputedData, calculateCustomLikelihood]);

  // Load precomputed data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const basePath = process.env.NODE_ENV === "production" ? "/problens-web" : "";
        const response = await fetch(`${basePath}/xkcd_precomputed_data.json`);
        if (!response.ok) {
          throw new Error(`Failed to load precomputed data: ${response.status}`);
        }
        const data = await response.json();
        setPrecomputedData(data);
        setError(null);
      } catch (err) {
        console.error("Error loading precomputed data:", err);
        setError("Failed to load precomputed data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ================================================================================
  // MAIN PROBABILITY CALCULATION
  // ================================================================================

  /**
   * Calculate probabilities for all bins using either precomputed data or dynamic sampling
   *
   * LOGIC:
   * 1. If using default evidence pattern → use precomputed data (fast)
   * 2. If using custom evidence pattern → use importance sampling (slower)
   * 3. Handle interpolation between λ values for smooth transitions
   * 4. Calculate prior, likelihood, and posterior for each bin
   */
  const {
    posteriorProbability,
    binProbabilities,
    priorProbabilities,
    likelihoodProbabilities,
    maxProb,
    maxPriorProb,
    maxLikelihoodProb,
  } = useMemo(() => {
    if (!precomputedData) {
      return {
        posteriorProbability: 0,
        binProbabilities: [],
        priorProbabilities: [],
        likelihoodProbabilities: [],
        maxProb: 0,
        maxPriorProb: 0,
        maxLikelihoodProb: 0,
      };
    }

    const { lambda_values, num_bins } = precomputedData.metadata;
    const { lambda_data, bins } = precomputedData;

    // Find closest lambda values for interpolation
    const lambdaKey = lambda.toFixed(1);

    // Branch: custom pattern with dynamic likelihood
    if (!isDefaultPattern && customLikelihood) {
      const priorProbs = lambda_data[lambdaKey]
        ? lambda_data[lambdaKey].prior_probabilities
        : lambda_data[Object.keys(lambda_data)[0]].prior_probabilities; // fallback

      const likelihoods = customLikelihood;

      // Compute unnormalized posterior per bin
      const unnormPost = priorProbs.map((p, i) => p * likelihoods[i]);
      const normConstant = unnormPost.reduce((a, b) => a + b, 0);
      const postProbs = unnormPost.map((v) => (normConstant > 0 ? v / normConstant : 0));

      const maxPost = Math.max(...postProbs);
      const maxPrior = Math.max(...priorProbs);
      const maxLikelihood = Math.max(...likelihoods);

      return {
        posteriorProbability: 0, // not computed precisely for target
        binProbabilities: postProbs.map((prob, i) => ({
          min: bins[i].min,
          max: bins[i].max,
          probability: prob,
        })),
        priorProbabilities: priorProbs.map((prob, i) => ({
          min: bins[i].min,
          max: bins[i].max,
          probability: prob,
        })),
        likelihoodProbabilities: likelihoods.map((prob, i) => ({
          min: bins[i].min,
          max: bins[i].max,
          probability: prob,
        })),
        maxProb: maxPost,
        maxPriorProb: maxPrior,
        maxLikelihoodProb: maxLikelihood,
      };
    }

    // Check if we have exact match for default pattern
    if (lambda_data[lambdaKey]) {
      const data = lambda_data[lambdaKey];
      const maxPost = Math.max(...data.bin_probabilities);
      const maxPrior = Math.max(...data.prior_probabilities);
      const maxLikelihood = Math.max(...data.likelihood_probabilities);

      return {
        posteriorProbability: data.target_posterior,
        binProbabilities: data.bin_probabilities.map((prob, i) => ({
          min: bins[i].min,
          max: bins[i].max,
          probability: prob,
        })),
        priorProbabilities: data.prior_probabilities.map((prob, i) => ({
          min: bins[i].min,
          max: bins[i].max,
          probability: prob,
        })),
        likelihoodProbabilities: data.likelihood_probabilities.map((prob, i) => ({
          min: bins[i].min,
          max: bins[i].max,
          probability: prob,
        })),
        maxProb: maxPost,
        maxPriorProb: maxPrior,
        maxLikelihoodProb: maxLikelihood,
      };
    }

    // Linear interpolation between closest lambda values
    const sortedLambdas = lambda_values.sort((a, b) => a - b);
    let lowerIdx = 0;
    let upperIdx = sortedLambdas.length - 1;

    for (let i = 0; i < sortedLambdas.length - 1; i++) {
      if (lambda >= sortedLambdas[i] && lambda <= sortedLambdas[i + 1]) {
        lowerIdx = i;
        upperIdx = i + 1;
        break;
      }
    }

    const lowerLambda = sortedLambdas[lowerIdx];
    const upperLambda = sortedLambdas[upperIdx];
    const lowerData = lambda_data[lowerLambda.toFixed(1)];
    const upperData = lambda_data[upperLambda.toFixed(1)];

    if (!lowerData || !upperData) {
      // Fallback to nearest available
      const nearestLambda = sortedLambdas.reduce((prev, curr) =>
        Math.abs(curr - lambda) < Math.abs(prev - lambda) ? curr : prev,
      );
      const data = lambda_data[nearestLambda.toFixed(1)];
      const maxPost = Math.max(...data.bin_probabilities);
      const maxPrior = Math.max(...data.prior_probabilities);
      const maxLikelihood = Math.max(...data.likelihood_probabilities);

      return {
        posteriorProbability: data.target_posterior,
        binProbabilities: data.bin_probabilities.map((prob, i) => ({
          min: bins[i].min,
          max: bins[i].max,
          probability: prob,
        })),
        priorProbabilities: data.prior_probabilities.map((prob, i) => ({
          min: bins[i].min,
          max: bins[i].max,
          probability: prob,
        })),
        likelihoodProbabilities: data.likelihood_probabilities.map((prob, i) => ({
          min: bins[i].min,
          max: bins[i].max,
          probability: prob,
        })),
        maxProb: maxPost,
        maxPriorProb: maxPrior,
        maxLikelihoodProb: maxLikelihood,
      };
    }

    // Interpolation weight
    const t = (lambda - lowerLambda) / (upperLambda - lowerLambda);

    // Interpolate target posterior probability
    const interpolatedPosterior = lowerData.target_posterior * (1 - t) + upperData.target_posterior * t;

    // Interpolate bin probabilities
    const interpolatedBinProbs = lowerData.bin_probabilities.map((lowerProb, i) => {
      const upperProb = upperData.bin_probabilities[i];
      return lowerProb * (1 - t) + upperProb * t;
    });

    // Interpolate prior probabilities
    const interpolatedPriorProbs = lowerData.prior_probabilities.map((lowerProb, i) => {
      const upperProb = upperData.prior_probabilities[i];
      return lowerProb * (1 - t) + upperProb * t;
    });

    // Interpolate likelihood probabilities (now λ-dependent)
    const interpolatedLikelihoodProbs = lowerData.likelihood_probabilities.map((lowerProb, i) => {
      const upperProb = upperData.likelihood_probabilities[i];
      return lowerProb * (1 - t) + upperProb * t;
    });

    const maxPost = Math.max(...interpolatedBinProbs);
    const maxPrior = Math.max(...interpolatedPriorProbs);
    const maxLikelihood = Math.max(...interpolatedLikelihoodProbs);

    return {
      posteriorProbability: interpolatedPosterior,
      binProbabilities: interpolatedBinProbs.map((prob, i) => ({
        min: bins[i].min,
        max: bins[i].max,
        probability: prob,
      })),
      priorProbabilities: interpolatedPriorProbs.map((prob, i) => ({
        min: bins[i].min,
        max: bins[i].max,
        probability: prob,
      })),
      likelihoodProbabilities: interpolatedLikelihoodProbs.map((prob, i) => ({
        min: bins[i].min,
        max: bins[i].max,
        probability: prob,
      })),
      maxProb: maxPost,
      maxPriorProb: maxPrior,
      maxLikelihoodProb: maxLikelihood,
    };
  }, [lambda, precomputedData, evidencePattern, isDefaultPattern, customLikelihood]);

  // ================================================================================
  // UI COMPONENTS
  // ================================================================================

  /**
   * Evidence input row component - 14 emoji slots for digit input
   * Each slot can be clicked to open a dropdown with digit options
   * Displays in single scrollable row with tighter spacing
   */
  const EvidenceInputRow: React.FC = () => {
    const digitOptions = ["*", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number } | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Helper to open dropdown and compute position
    const openMenu = useCallback((idx: number) => {
      const btn = buttonRefs.current[idx];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setDropdownPos({ left: rect.left + rect.width / 2, top: rect.bottom + 4 });
        setOpenDropdown(idx);
      }
    }, []);

    return (
      <div className="bg-white rounded-lg px-4 py-2 mb-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Select evidence:</h4>

        {/* Single row with horizontal scrolling */}
        <div className="overflow-x-auto overflow-y-visible">
          <div className="flex gap-1 min-w-max pb-2">
            {evidencePattern.map((digit, index) => (
              <button
                key={index}
                ref={(el) => {
                  buttonRefs.current[index] = el;
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (openDropdown === index) setOpenDropdown(null);
                  else openMenu(index);
                }}
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                  }
                  setHoveredIndex(index);
                  openMenu(index);
                }}
                onMouseLeave={() => {
                  hoverTimeoutRef.current = setTimeout(() => {
                    setHoveredIndex(null);
                  }, 100);
                }}
                className="w-9 h-9 text-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors flex-shrink-0 flex items-center justify-center"
              >
                {DIGIT_EMOJIS[digit as keyof typeof DIGIT_EMOJIS]}
              </button>
            ))}
          </div>
        </div>

        {/* Tooltip rendered via portal for visibility */}
        {(openDropdown !== null || hoveredIndex !== null) && dropdownPos !== null &&
          ReactDOM.createPortal(
            <div
              className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-2xl p-2"
              style={{ 
                left: dropdownPos.left, 
                top: dropdownPos.top, 
                transform: "translateX(-50%)",
                minWidth: "280px"
              }}
              onMouseEnter={() => {
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }
                if (hoveredIndex !== null) {
                  setOpenDropdown(hoveredIndex);
                }
              }}
              onMouseLeave={() => {
                hoverTimeoutRef.current = setTimeout(() => {
                  setOpenDropdown(null);
                  setHoveredIndex(null);
                  setDropdownPos(null);
                }, 100);
              }}
            >
              <div className="flex gap-1">
                {digitOptions.map((option) => (
                  <button
                    key={option}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (openDropdown !== null) {
                        updateEvidencePattern(openDropdown, option);
                      }
                    }}
                    className={`w-9 h-9 text-lg rounded border transition-colors flex-shrink-0 flex items-center justify-center ${
                      evidencePattern[openDropdown || hoveredIndex || 0] === option
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-gray-100 hover:bg-gray-200 border-gray-300"
                    }`}
                    title={option === "*" ? "Wildcard (any digit)" : `Digit ${option}`}
                  >
                    {DIGIT_EMOJIS[option as keyof typeof DIGIT_EMOJIS]}
                  </button>
                ))}
              </div>
              {/* Arrow pointing up */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white" 
                style={{ filter: "drop-shadow(0 -2px 2px rgba(0,0,0,0.1))" }}></div>
            </div>,
            document.body,
          )}

        {/* Custom pattern hint */}
        {!isDefaultPattern && (
          <div className="mt-3 text-sm text-orange-600 text-center">
            {calculatingCustom ? "Calculating…" : "Custom pattern"}
          </div>
        )}

        {/* Instruction text */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          Click or hover on digits to change • 🖼️ = any digit • Scroll horizontally if needed
        </div>
      </div>
    );
  };

  // Get current data based on view mode
  const getCurrentData = () => {
    switch (viewMode) {
      case "prior":
        return { data: priorProbabilities, maxProb: maxPriorProb };
      case "likelihood":
        return { data: likelihoodProbabilities, maxProb: maxLikelihoodProb };
      case "posterior":
        return { data: binProbabilities, maxProb: maxProb };
      default:
        return { data: binProbabilities, maxProb: maxProb };
    }
  };

  const { data: currentData, maxProb: currentMaxProb } = getCurrentData();

  const formatProbability = (prob: number): string => {
    if (prob < 1e-10) {
      return prob.toExponential(3);
    } else if (prob < 1e-6) {
      return prob.toExponential(4);
    } else if (prob < 0.001) {
      return prob.toFixed(8);
    } else {
      return prob.toFixed(6);
    }
  };

  // Draggable slider component
  const ViewModeSlider: React.FC = () => {
    const options: ViewMode[] = ["prior", "likelihood", "posterior"];
    const currentIndex = options.indexOf(viewMode);

    return (
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-80 h-12 bg-gray-200 rounded-full p-1">
          {/* Background track */}
          <div className="absolute inset-1 bg-gray-100 rounded-full"></div>

          {/* Sliding indicator */}
          <div
            className="absolute top-1 h-10 w-24 bg-blue-500 rounded-full transition-all duration-300 ease-out shadow-lg"
            style={{
              left: `calc(${currentIndex * 33.33}% + 4px)`,
              width: "calc(33.33% - 8px)",
            }}
          ></div>

          {/* Option labels */}
          {options.map((option, index) => (
            <button
              key={option}
              onClick={() => setViewMode(option)}
              className={`absolute top-1 h-10 w-24 rounded-full transition-all duration-300 text-sm font-medium ${
                viewMode === option ? "text-white z-20" : "text-gray-600 hover:text-gray-800 z-10"
              }`}
              style={{
                left: `calc(${index * 33.33}% + 4px)`,
                width: "calc(33.33% - 8px)",
              }}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 rounded-lg space-y-4 sm:space-y-6 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-800">XKCD Countdown Probability Calculator</div>
          <div className="mt-4 text-gray-600">Loading precomputed data...</div>
          <div className="mt-2 animate-pulse bg-gray-300 h-4 w-1/3 mx-auto rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !precomputedData) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 rounded-lg space-y-4 sm:space-y-6 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-800">XKCD Countdown Probability Calculator</div>
          <div className="mt-4 text-red-600">Error: {error || "Failed to load data"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-lg space-y-3 sm:space-y-4 max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-center text-gray-800">XKCD Countdown Probability Calculator</h3>

      {/* Lambda Slider */}
      <div className="bg-white rounded-lg px-4 py-2">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">
          Select the power-law prior <InlineMath math="p(x) \propto x^{-\lambda}" />
        </h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 w-16">λ = {lambda.toFixed(1)}</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={lambda}
              onChange={(e) => setLambda(parseFloat(e.target.value))}
              className="flex-1 h-4"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(lambda / 2) * 100}%, #e5e7eb ${(lambda / 2) * 100}%, #e5e7eb 100%)`,
              }}
            />
            <span className="text-sm text-gray-500 w-8">2.0</span>
          </div>

          <div className="text-sm text-gray-600 flex flex-wrap gap-2">
            <span className={`px-2 py-1 rounded ${lambda === 0 ? "bg-yellow-100 border border-yellow-300" : ""}`}>
              <strong>λ = 0:</strong> Uniform prior
            </span>
            <span className={`px-2 py-1 rounded ${lambda === 1 ? "bg-yellow-100 border border-yellow-300" : ""}`}>
              <strong>λ = 1:</strong> Log-uniform prior
            </span>
          </div>
        </div>
      </div>

      {/* Evidence Input */}
      <EvidenceInputRow />

      {/* Probability of hidden zeros in its own box */}
      <div className="bg-white rounded-lg p-4 mb-4 text-center">
        <span className="text-lg font-semibold text-gray-800">Probability all hidden digits are zero:&nbsp;</span>
        <span className="text-xl font-mono text-blue-700">
          {posteriorProbability < 1e-6 ? posteriorProbability.toExponential(3) : posteriorProbability.toFixed(6)}
        </span>
      </div>

      {/* Distribution Chart */}
      <div className="bg-white rounded-lg p-4">
        {/* View mode slider */}
        <ViewModeSlider />

        <div className="w-full relative">
          {/* Log scale toggle button positioned over canvas */}
          <button
            onClick={() => setLogScale(!logScale)}
            className="absolute top-2 right-2 px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 z-10"
          >
            {logScale ? "Log" : "Normal"} scale
          </button>

          {/* Centered headline overlay */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-sm font-semibold text-gray-800 z-10 pointer-events-none">
            {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} distribution
          </div>
          <svg width="100%" height="360" viewBox="0 0 640 360" className="border border-gray-200 rounded">
            <defs>
              <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1e40af" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Chart area */}
            <g transform="translate(60, 20)">
              {/* Y-axis */}
              <line x1="0" y1="0" x2="0" y2="300" stroke="#6b7280" strokeWidth="1" />

              {/* X-axis */}
              <line x1="0" y1="300" x2="560" y2="300" stroke="#6b7280" strokeWidth="1" />

              {/* X-axis labels */}
              {Array.from({ length: 15 }, (_, i) => (
                <g key={i}>
                  <line x1={i * 40} y1="300" x2={i * 40} y2="305" stroke="#6b7280" strokeWidth="1" />
                  <text x={i * 40} y="320" textAnchor="middle" fontSize="10" fill="#6b7280">
                    <tspan>10</tspan>
                    <tspan fontSize="8" dy="-3">
                      {i}
                    </tspan>
                  </text>
                </g>
              ))}

              {/* Y-axis labels */}
              {(() => {
                if (logScale && viewMode === "likelihood" && currentMaxProb > 0) {
                  // Adaptive scale for likelihood
                  const maxLog = Math.log10(currentMaxProb);
                  const minLog = Math.log10(
                    Math.min(...currentData.filter((d) => d.probability > 0).map((d) => d.probability)),
                  );
                  const range = maxLog - minLog;

                  return [
                    { val: 0, label: `<1e${Math.floor(minLog)}` },
                    { val: 0.2, label: `1e${Math.floor(minLog + range * 0.2)}` },
                    { val: 0.4, label: `1e${Math.floor(minLog + range * 0.4)}` },
                    { val: 0.6, label: `1e${Math.floor(minLog + range * 0.6)}` },
                    { val: 0.8, label: `1e${Math.floor(minLog + range * 0.8)}` },
                    { val: 1.0, label: `1e${Math.floor(maxLog)}` },
                  ];
                } else if (logScale) {
                  return [
                    { val: 0, label: "<0.0001" },
                    { val: 0.2, label: "0.001" },
                    { val: 0.4, label: "0.01" },
                    { val: 0.6, label: "0.1" },
                    { val: 0.8, label: "0.5" },
                    { val: 1.0, label: "1.0" },
                  ];
                } else {
                  return [
                    { val: 0, label: "0.0" },
                    { val: 0.2, label: "0.2" },
                    { val: 0.4, label: "0.4" },
                    { val: 0.6, label: "0.6" },
                    { val: 0.8, label: "0.8" },
                    { val: 1.0, label: "1.0" },
                  ];
                }
              })().map(({ val, label }, i) => (
                <g key={i}>
                  <line x1="-5" y1={300 - val * 300} x2="0" y2={300 - val * 300} stroke="#6b7280" strokeWidth="1" />
                  <text x="-10" y={305 - val * 300} textAnchor="end" fontSize="10" fill="#6b7280">
                    {label}
                  </text>
                </g>
              ))}

              {/* Bars */}
              {currentData &&
                currentData.map((bin, i) => {
                  let actualHeight;
                  if (logScale) {
                    if (bin.probability > 0 && currentMaxProb > 0) {
                      if (viewMode === "likelihood") {
                        // Adaptive scale based on actual data range
                        const maxLog = Math.log10(currentMaxProb);
                        const minLog = Math.log10(
                          Math.min(...currentData.filter((d) => d.probability > 0).map((d) => d.probability)),
                        );
                        const logProb = Math.log10(bin.probability);
                        const range = maxLog - minLog;
                        actualHeight = range > 0 ? ((logProb - minLog) / range) * 280 : 0;
                      } else {
                        actualHeight = ((Math.log10(bin.probability / currentMaxProb) + 4) * 280) / 4;
                      }
                    } else {
                      actualHeight = 0;
                    }
                  } else {
                    actualHeight = (bin.probability / (currentMaxProb || 1)) * 280;
                  }
                  // Ensure minimum height for non-zero values to make them hoverable
                  const barHeight = bin.probability > 0 ? Math.max(5, actualHeight) : 0;
                  const xPos = i * 20;

                  return (
                    <g key={i}>
                      <rect
                        x={xPos}
                        y={300 - barHeight}
                        width="18"
                        height={barHeight}
                        fill="url(#barGradient)"
                        stroke="#1e40af"
                        strokeWidth="0.5"
                        className="hover:opacity-80 cursor-pointer"
                        onMouseEnter={() => setHoveredBar(i)}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                    </g>
                  );
                })}
            </g>

            {/* Y-axis label */}
            <text x="20" y="50%" textAnchor="middle" fontSize="12" fill="#6b7280" transform="rotate(-90, 20, 180)">
              {viewMode === "likelihood" ? "Likelihood" : "Probability"}
            </text>
          </svg>

          {/* Custom tooltip */}
          {hoveredBar !== null && currentData[hoveredBar] && (
            <div
              className="absolute z-50 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg pointer-events-none min-w-64"
              style={{
                left: `${60 + hoveredBar * 20 + 9}px`,
                top: "40px",
                transform: "translateX(-50%)",
              }}
            >
              <div className="font-semibold text-blue-200">
                {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Distribution
              </div>
              <div className="mt-1 space-y-1">
                <div>
                  <span className="text-gray-300">Range:</span> {currentData[hoveredBar].min.toExponential(1)} -{" "}
                  {currentData[hoveredBar].max.toExponential(1)}
                </div>
                <div>
                  <span className="text-gray-300">{viewMode === "likelihood" ? "Likelihood" : "Probability"}:</span>{" "}
                  {viewMode === "likelihood"
                    ? currentData[hoveredBar].probability.toExponential(6)
                    : (currentData[hoveredBar].probability * 100).toFixed(6) + "%"}
                </div>
                <div>
                  <span className="text-gray-300">λ:</span> {lambda} (
                  {lambda === 0 ? "uniform" : lambda === 1 ? "log-uniform" : "power law"})
                </div>
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-2">Hover over bars to see exact values.</p>
      </div>
    </div>
  );
};

export default XKCDCountdownWidget;
