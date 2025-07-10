"use client";

/*
 * ================================================================================
 * XKCD COUNTDOWN PROBABILITY CALCULATOR WIDGET
 * ================================================================================
 *
 * OVERVIEW:
 * This widget implements a Bayesian probability calculator inspired by the XKCD
 * "Countdown" comic. It calculates the probability distribution over 14-digit
 * numbers given partial evidence about their digits.
 *
 * COLUMN STRUCTURE:
 * The widget displays 14 columns, where column i (0-indexed) represents numbers:
 * - First (13-i) positions must be zeros
 * - Position (14-i) must be non-zero (1-9)
 * - Last i positions can be anything (0-9)
 *
 * Examples:
 * - Column 0: 0000000000000X (X ∈ {1-9})
 * - Column 1: 000000000000XY (X ∈ {1-9}, Y ∈ {0-9})
 * - Column 13: XYYYYYYYYYYYYYY (X ∈ {1-9}, Y ∈ {0-9})
 *
 * MATHEMATICAL FRAMEWORK:
 * - Prior: P(X) ∝ X^(-λ) (power-law distribution)
 * - Evidence: Binary likelihood based on pattern matching
 * - Posterior: P(X|E) ∝ P(E|X) × P(X)
 *
 * ================================================================================
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { InlineMath } from "react-katex";

// ================================================================================
// TYPE DEFINITIONS
// ================================================================================

type ViewMode = "prior" | "likelihood" | "posterior";
type EvidencePattern = (string | "*")[];

interface ColumnData {
  index: number;
  prior: number;
  likelihood: number;
  unnormalizedPosterior: number;
  posterior: number;
  compatibleCount: number;
  range: { min: number; max: number };
}

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

// Utility ----------------------------------------------------
// Treat both the asterisk character and the framed-picture emoji as wildcards so
// that the code works regardless of which representation happens to be in the
// state array.
const isWildcard = (digit: string) => digit === "*" || digit === "🖼️";
// ================================================================================
// COLUMN LOGIC
// ================================================================================

/**
 * Calculate how many numbers in column i are compatible with the evidence pattern
 * Column i has: (13-i) leading zeros, non-zero at position (14-i), then i free positions
 */
function getCompatibleCount(columnIndex: number, pattern: EvidencePattern): number {
  const leadingZeros = 13 - columnIndex;
  const nonZeroPos = 13 - columnIndex; // 0-indexed position

  // Check if any of the leading zero positions have a non-zero revealed digit
  for (let pos = 0; pos < leadingZeros; pos++) {
    if (pattern[pos] !== "*" && pattern[pos] !== "0") {
      return 0; // Incompatible
    }
  }

  // Check the non-zero position
  if (pattern[nonZeroPos] === "0") {
    return 0; // Must be non-zero but evidence shows zero
  }

  // Count wildcards in the free positions (last columnIndex positions)
  let wildcardCount = 0;
  for (let pos = 14 - columnIndex; pos < 14; pos++) {
    if (pattern[pos] === "*") {
      wildcardCount++;
    }
  }

  // If non-zero position is wildcard, we have 9 choices (1-9)
  // Otherwise it's fixed to the revealed digit
  const nonZeroChoices = pattern[nonZeroPos] === "*" ? 9 : 1;

  // Each wildcard in free positions gives 10 choices
  return nonZeroChoices * Math.pow(10, wildcardCount);
}

/**
 * Sample a number uniformly from column i that matches the evidence pattern
 */
function sampleFromColumn(columnIndex: number, pattern: EvidencePattern): number | null {
  const compatibleCount = getCompatibleCount(columnIndex, pattern);
  if (compatibleCount === 0) return null;

  const leadingZeros = 13 - columnIndex;
  const nonZeroPos = 13 - columnIndex;

  // Build the number string
  let numberStr = "";

  // Add leading zeros
  for (let i = 0; i < leadingZeros; i++) {
    numberStr += "0";
  }

  // Add non-zero digit
  if (pattern[nonZeroPos] === "*") {
    // Random non-zero digit
    numberStr += Math.floor(Math.random() * 9 + 1).toString();
  } else {
    // Fixed digit from evidence
    numberStr += pattern[nonZeroPos];
  }

  // Add remaining digits
  for (let pos = 14 - columnIndex; pos < 14; pos++) {
    if (pattern[pos] === "*") {
      // Random digit 0-9
      numberStr += Math.floor(Math.random() * 10).toString();
    } else {
      // Fixed digit from evidence
      numberStr += pattern[pos];
    }
  }

  return parseInt(numberStr, 10);
}

/**
 * Calculate the range of numbers in column i
 */
function getColumnRange(columnIndex: number): { min: number; max: number } {
  const leadingZeros = 13 - columnIndex;

  // Minimum: leading zeros, then 1, then all zeros
  const minStr = "0".repeat(leadingZeros) + "1" + "0".repeat(columnIndex);

  // Maximum: leading zeros, then 9, then all 9s
  const maxStr = "0".repeat(leadingZeros) + "9" + "9".repeat(columnIndex);

  return {
    min: parseInt(minStr, 10),
    max: parseInt(maxStr, 10),
  };
}

/**
 * Calculate prior probability mass for a column under power-law prior
 */
function getColumnPriorMass(columnIndex: number, lambda: number): number {
  const { min, max } = getColumnRange(columnIndex);

  if (lambda === 0) {
    // Uniform prior
    return (max - min + 1) / 1e14;
  } else if (Math.abs(lambda - 1) < 1e-10) {
    // Log-uniform prior
    const integral = Math.log(max + 1) - Math.log(min);
    const normalizer = Math.log(1e14);
    return integral / normalizer;
  } else {
    // General power-law
    const exponent = 1 - lambda;
    const integral = (Math.pow(max + 1, exponent) - Math.pow(min, exponent)) / exponent;
    const normalizer = (Math.pow(1e14, exponent) - 1) / exponent;
    return integral / normalizer;
  }
}

/**
 * Calculate likelihood for a column (fraction of column numbers matching evidence)
 */
function getColumnLikelihood(columnIndex: number, pattern: EvidencePattern): number {
  const { min, max } = getColumnRange(columnIndex);
  const totalInColumn = max - min + 1;
  const compatibleCount = getCompatibleCount(columnIndex, pattern);

  return compatibleCount / totalInColumn;
}

/**
 * Calculate posterior probability that all wildcards equal 0 using importance sampling
 */
function calculateWildcardZeroProbability(pattern: EvidencePattern, data: ColumnData[]): number {
  // Find all wildcard positions
  const wildcardPositions = pattern.reduce((positions, digit, index) => {
    if (isWildcard(digit)) positions.push(index);
    return positions;
  }, [] as number[]);

  if (wildcardPositions.length === 0) {
    return 1.0; // No wildcards, probability is 1
  }

  const numSamples = 100;
  let zeroWildcardCount = 0;
  let totalWeight = 0;

  // Importance sampling
  for (let i = 0; i < numSamples; i++) {
    // Sample a compatible number from the posterior distribution
    let cumulativePosterior = 0;
    const randomValue = Math.random();

    for (const columnData of data) {
      cumulativePosterior += columnData.posterior;
      if (randomValue <= cumulativePosterior) {
        // Use the efficient sampleFromColumn function instead of checking all numbers
        const sampledNumber = sampleFromColumn(columnData.index, pattern);
        
        if (sampledNumber !== null) {
          const numberStr = sampledNumber.toString().padStart(14, "0");
          
          // Check if all wildcards are zero
          const allWildcardsZero = wildcardPositions.every((pos) => numberStr[pos] === "0");
          if (allWildcardsZero) {
            zeroWildcardCount++;
          }
          totalWeight++;
        }
        break;
      }
    }
  }

  return totalWeight > 0 ? zeroWildcardCount / totalWeight : 0;
}

const XKCDCountdownWidget: React.FC = () => {
  // ================================================================================
  // COMPONENT STATE
  // ================================================================================

  const [lambda, setLambda] = useState(1.0);
  const [logScale, setLogScale] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("posterior");

  // Evidence pattern - default to "******00002382" (last 8 digits match)
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
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // ================================================================================
  // PROBABILITY CALCULATIONS
  // ================================================================================

  const columnData = useMemo(() => {
    const data = [];

    for (let i = 0; i < 14; i++) {
      const prior = getColumnPriorMass(i, lambda);
      const likelihood = getColumnLikelihood(i, evidencePattern);
      const unnormalizedPosterior = prior * likelihood;
      const compatibleCount = getCompatibleCount(i, evidencePattern);
      const range = getColumnRange(i);

      data.push({
        index: i,
        prior,
        likelihood,
        unnormalizedPosterior,
        compatibleCount,
        range,
      });
    }

    // Normalize posterior
    const posteriorSum = data.reduce((sum, col) => sum + col.unnormalizedPosterior, 0);

    return data.map((col) => ({
      ...col,
      posterior: posteriorSum > 0 ? col.unnormalizedPosterior / posteriorSum : 0,
    }));
  }, [lambda, evidencePattern]);

  // Get max values for scaling
  const maxValues = useMemo(() => {
    return {
      prior: Math.max(...columnData.map((d) => d.prior)),
      likelihood: Math.max(...columnData.map((d) => d.likelihood)),
      posterior: Math.max(...columnData.map((d) => d.posterior)),
    };
  }, [columnData]);

  // Calculate probability that all wildcards equal 0
  const wildcardZeroProbability = useMemo(() => {
    return calculateWildcardZeroProbability(evidencePattern, columnData);
  }, [evidencePattern, columnData]);

  // Count wildcards for display
  const wildcardCount = useMemo(() => {
    return evidencePattern.filter(isWildcard).length;
  }, [evidencePattern]);

  // ================================================================================
  // UI HELPERS
  // ================================================================================


  // Ensure the dropdown never overflows the viewport horizontally so that
  // the browser doesn’t try to auto‐scroll the evidence row (which caused the
  // “dancing” horizontal scrollbar that appeared when hovering buttons on the
  // left). We simply clamp the centre of the dropdown so that its leftmost /
  // rightmost edge is always visible.


  // ================================================================================
  // EVIDENCE INPUT ROW COMPONENT
  // ================================================================================

  const EvidenceInputRow: React.FC = () => {
    // Helper to convert pattern array to a string with '*' for wildcards.
    const patternToString = useCallback((patternArr: string[]) => {
      return patternArr.map((d) => (isWildcard(d) ? "*" : d)).join("");
    }, []);

    // Local state mirrors the current mask in the text field.
    const [maskInput, setMaskInput] = useState(patternToString(evidencePattern));

    // Keep text field in sync when the pattern changes elsewhere.
    useEffect(() => {
      setMaskInput(patternToString(evidencePattern));
    }, [patternToString]);

    const applyMaskFromInput = () => {
      const trimmed = maskInput.trim();
      if (trimmed.length !== 14) return; // Ignore invalid length

      const newPattern = trimmed.split("").map((ch) => {
        return ch === "*" ? "*" : ch; // keep digits as is, * stays *
      });

      setEvidencePattern(newPattern);
    };

    // Auto-apply changes on input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.replace(/[^0-9\*]/g, "").slice(0, 14);
      setMaskInput(newValue);
      
      // Auto-apply if length is 14
      if (newValue.length === 14) {
        const newPattern = newValue.split("").map((ch) => {
          return ch === "*" ? "*" : ch;
        });
        setEvidencePattern(newPattern);
      }
    };

    return (
      <div className="bg-white rounded-lg px-4 py-2 mb-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Select evidence:</h4>

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={maskInput}
              onChange={handleInputChange}
              placeholder="Enter digits and * for hidden"
              className="w-64 sm:w-80 px-3 py-2 border border-gray-300 rounded text-center font-mono text-lg tracking-widest"
            />
            <button
              onClick={applyMaskFromInput}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
            >
              Apply
            </button>
          </div>
          
          <div className="text-center">
            <p className="widget-explanation">
              Current pattern: <span className="font-mono text-lg">{patternToString(evidencePattern)}</span>
            </p>
            <p className="widget-explanation text-sm text-gray-600">
              Use digits 0-9 for known values, * for hidden digits (wildcards)
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ================================================================================
  // VIEW MODE SLIDER
  // ================================================================================

  const ViewModeSlider: React.FC = () => {
    const options: ViewMode[] = ["prior", "likelihood", "posterior"];
    const currentIndex = options.indexOf(viewMode);

    return (
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-80 h-12 bg-gray-200 rounded-full p-1">
          <div className="absolute inset-1 bg-gray-100 rounded-full"></div>

          <div
            className="absolute top-1 h-10 w-24 bg-blue-500 rounded-full transition-all duration-300 ease-out shadow-lg"
            style={{
              left: `calc(${currentIndex * 33.33}% + 4px)`,
              width: "calc(33.33% - 8px)",
            }}
          ></div>

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

  // Get current data based on view mode
  const getCurrentValue = (col: (typeof columnData)[0]) => {
    switch (viewMode) {
      case "prior":
        return col.prior;
      case "likelihood":
        return col.likelihood;
      case "posterior":
        return col.posterior;
    }
  };

  // Helper to format numbers in LaTeX scientific notation
  const formatNumberForLatex = (num: number): string => {
    const exp = num.toExponential(0);
    const [mantissa, exponent] = exp.split("e");
    const expNum = parseInt(exponent);
    if (mantissa === "1") {
      return `10^{${expNum}}`;
    }
    return `${mantissa} \\times 10^{${expNum}}`;
  };

  const currentMaxValue = maxValues[viewMode];

  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-lg space-y-3 sm:space-y-4 max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-center text-gray-800">XKCD Countdown Probability Calculator</h3>

      {/* Lambda Slider */}
      <div className="bg-white rounded-lg px-4 py-2">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Select prior:</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 w-8">0.0</span>
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

          <p className="widget-explanation">
            Select <InlineMath math="\lambda" /> in the power-law prior <InlineMath math="p(x) \propto x^{-\lambda}" />
          </p>
          <p className="widget-explanation">
            <strong>λ = 0:</strong> Uniform prior • <strong>λ = 1:</strong> Log-uniform prior
          </p>
        </div>
      </div>

      {/* Evidence Input */}
      <EvidenceInputRow />

      {/* Posterior Probability Display */}
      {wildcardCount > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="widget-explanation text-blue-800">
            <strong>Posterior probability all 🖼️ = 0:</strong> {(wildcardZeroProbability * 100).toFixed(2)}%
          </p>
        </div>
      )}

      {/* Distribution Chart */}
      <div className="bg-white rounded-lg p-4">
        <ViewModeSlider />

        <div className="w-full relative">
          <button
            onClick={() => setLogScale(!logScale)}
            className="absolute top-2 right-2 px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 z-10"
          >
            {logScale ? "Log" : "Normal"} scale
          </button>

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

            <g transform="translate(60, 20)">
              {/* Y-axis */}
              <line x1="0" y1="0" x2="0" y2="300" stroke="#6b7280" strokeWidth="1" />

              {/* X-axis */}
              <line x1="0" y1="300" x2="560" y2="300" stroke="#6b7280" strokeWidth="1" />

              {/* X-axis labels */}
              {Array.from({ length: 14 }, (_, i) => (
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
                if (logScale && currentMaxValue > 0) {
                  // Log scale labels using clean powers of 10
                  if (viewMode === "likelihood") {
                    // Find appropriate range of powers for likelihood
                    const maxExp = Math.floor(Math.log10(currentMaxValue));
                    const minExp = maxExp - 6; // 6 orders of magnitude
                    const exponents = [];
                    for (let exp = maxExp; exp >= minExp; exp--) {
                      exponents.push(exp);
                    }

                    return exponents.slice(0, 6).map((exp, i) => {
                      const yPos = 300 - ((exponents.length - 1 - i) / (exponents.length - 1)) * 280;
                      return (
                        <g key={i}>
                          <line x1="-5" y1={yPos} x2="0" y2={yPos} stroke="#6b7280" strokeWidth="1" />
                          <text x="-10" y={yPos + 5} textAnchor="end" fontSize="10" fill="#6b7280">
                            <tspan>10</tspan>
                            <tspan fontSize="8" dy="-3">
                              {exp}
                            </tspan>
                          </text>
                        </g>
                      );
                    });
                  } else {
                    // Prior/Posterior: powers from 10^0 down to 10^-4
                    const exponents = [0, -1, -2, -3, -4];

                    return exponents.map((exp, i) => {
                      const yPos = 300 - ((exponents.length - 1 - i) / (exponents.length - 1)) * 280;
                      return (
                        <g key={i}>
                          <line x1="-5" y1={yPos} x2="0" y2={yPos} stroke="#6b7280" strokeWidth="1" />
                          <text x="-10" y={yPos + 5} textAnchor="end" fontSize="10" fill="#6b7280">
                            {exp === 0 ? (
                              "1"
                            ) : (
                              <>
                                <tspan>10</tspan>
                                <tspan fontSize="8" dy="-3">
                                  {exp}
                                </tspan>
                              </>
                            )}
                          </text>
                        </g>
                      );
                    });
                  }
                } else {
                  // Linear scale labels
                  const maxValue = viewMode === "prior" || viewMode === "posterior" ? 1.0 : currentMaxValue;
                  return [0, 0.2, 0.4, 0.6, 0.8, 1.0].map((val, i) => (
                    <g key={i}>
                      <line x1="-5" y1={300 - val * 300} x2="0" y2={300 - val * 300} stroke="#6b7280" strokeWidth="1" />
                      <text x="-10" y={305 - val * 300} textAnchor="end" fontSize="10" fill="#6b7280">
                        {(val * maxValue).toFixed(3)}
                      </text>
                    </g>
                  ));
                }
              })()}

              {/* Bars */}
              {columnData.map((col, i) => {
                const value = getCurrentValue(col);
                let barHeight;

                if (logScale && value > 0) {
                  if (viewMode === "likelihood") {
                    const maxExp = Math.floor(Math.log10(currentMaxValue));
                    const minExp = maxExp - 6;
                    const logValue = Math.log10(value);
                    barHeight = ((logValue - minExp) / (maxExp - minExp)) * 280;
                  } else {
                    // Prior/Posterior: scale from 10^-4 to 10^0 (1.0)
                    const logValue = Math.log10(Math.max(value, 1e-4));
                    const logMax = 0; // log10(1.0) = 0
                    const logMin = -4; // log10(1e-4) = -4
                    barHeight = ((logValue - logMin) / (logMax - logMin)) * 280;
                  }
                } else {
                  // Linear scale
                  const maxValue = viewMode === "prior" || viewMode === "posterior" ? 1.0 : currentMaxValue;
                  barHeight = (value / maxValue) * 280;
                }

                // For likelihood view, ensure any non-zero value has visible height
                if (viewMode === "likelihood" && value > 0) {
                  barHeight = Math.max(15, Math.min(280, barHeight)); // Larger minimum for likelihood
                } else {
                  barHeight = value > 0 ? Math.max(5, Math.min(280, barHeight)) : 0;
                }

                return (
                  <rect
                    key={i}
                    x={i * 40}
                    y={300 - barHeight}
                    width="38"
                    height={barHeight}
                    fill="url(#barGradient)"
                    stroke="#1e40af"
                    strokeWidth="0.5"
                    className="hover:opacity-80 cursor-pointer"
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                );
              })}
            </g>

            <text x="20" y="50%" textAnchor="middle" fontSize="12" fill="#6b7280" transform="rotate(-90, 20, 180)">
              {viewMode === "likelihood" ? "Likelihood" : "Probability"}
            </text>
          </svg>

          {/* Tooltip */}
          {hoveredBar !== null && (
            <div
              className="absolute z-50 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg pointer-events-none"
              style={{
                left: hoveredBar < 7 ? `${60 + hoveredBar * 40}px` : "auto",
                right: hoveredBar >= 7 ? `${60 + (13 - hoveredBar) * 40}px` : "auto",
                top: "40px",
                minWidth: "256px",
              }}
            >
              <div className="font-semibold text-blue-200">Column {hoveredBar + 1} Details</div>
              <div className="mt-1 space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-gray-300">Numbers in [</span>
                  <span className="text-white">
                    <InlineMath math={formatNumberForLatex(columnData[hoveredBar].range.min)} />
                  </span>
                  <span className="text-gray-300">,</span>
                  <span className="text-white">
                    <InlineMath math={formatNumberForLatex(columnData[hoveredBar].range.max + 1)} />
                  </span>
                  <span className="text-gray-300">)</span>
                </div>
                {viewMode !== "prior" && (
                  <div>
                    <span className="text-gray-300">Numbers compatible with evidence:</span>{" "}
                    {columnData[hoveredBar].compatibleCount.toLocaleString()}
                  </div>
                )}
                <div>
                  <span className="text-gray-300">{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}:</span>{" "}
                  {getCurrentValue(columnData[hoveredBar]).toExponential(4)}
                </div>
              </div>
              <div
                className="absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
                style={{
                  left: hoveredBar < 7 ? "20px" : "auto",
                  right: hoveredBar >= 7 ? "20px" : "auto",
                }}
              ></div>
            </div>
          )}
        </div>

        <p className="widget-explanation">Hover over bars to see exact values.</p>
      </div>
    </div>
  );
};

export default XKCDCountdownWidget;
