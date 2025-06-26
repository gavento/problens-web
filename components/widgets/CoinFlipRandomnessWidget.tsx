"use client";

import React, { useState, useMemo } from "react";
import { InlineMath } from 'react-katex';
import { getAssetPath } from '@/lib/utils';
import * as Tooltip from '@radix-ui/react-tooltip';

type CoinSide = 'H' | 'T';

interface KmerTest {
  k: number;
  expectedCounts: Record<string, number>;
  observedCounts: Record<string, number>;
  chiSquare: number;
  threshold: number;
  isRandom: boolean;
}

interface RunLengthTest {
  runType: 'H' | 'T';
  runLengths: number[];
  observedCounts: Record<string, number>;
  expectedCounts: Record<string, number>;
  chiSquare: number;
  threshold: number;
  isRandom: boolean;
}

// Empirically determined chi-square thresholds (95th percentile)
// Based on 10000 simulations for each (n, k) pair
const EMPIRICAL_THRESHOLDS: Record<number, Record<number, number>> = {
  1: {
    10: 3.600,
    20: 3.200,
    30: 3.333,
    40: 3.600,
    50: 3.920,
    60: 3.267,
    70: 3.657,
    80: 4.050,
    90: 3.600,
    100: 4.000,
    110: 3.636,
    120: 4.033,
    130: 3.723,
    140: 4.114,
    150: 3.840,
    160: 4.225,
    170: 3.976,
    180: 3.756,
    190: 3.558,
    200: 3.920,
  },
  2: {
    10: 9.222,
    20: 8.579,
    30: 8.655,
    40: 9.308,
    50: 9.204,
    60: 9.000,
    70: 9.203,
    80: 9.354,
    90: 9.202,
    100: 9.485,
    110: 9.128,
    120: 9.168,
    130: 9.140,
    140: 9.230,
    150: 9.255,
    160: 9.025,
    170: 9.107,
    180: 9.045,
    190: 8.989,
    200: 9.302,
  },
  3: {
    10: 20.000,
    20: 17.556,
    30: 17.714,
    40: 17.579,
    50: 17.333,
    60: 17.862,
    70: 17.412,
    80: 17.590,
    90: 17.636,
    100: 17.918,
    110: 17.185,
    120: 17.729,
    130: 17.750,
    140: 17.710,
    150: 17.838,
    160: 17.595,
    170: 17.238,
    180: 17.596,
    190: 17.617,
    200: 17.596,
  },
  4: {
    10: 27.286,
    20: 31.000,
    30: 31.667,
    40: 30.892,
    50: 31.638,
    60: 31.421,
    70: 31.627,
    80: 31.260,
    90: 31.253,
    100: 31.495,
    110: 31.318,
    120: 31.650,
    130: 31.362,
    140: 31.526,
    150: 31.177,
    160: 31.637,
    170: 31.802,
    180: 31.000,
    190: 31.610,
    200: 31.467,
  },
};

// Get empirically calibrated threshold for given k and sequence length
const getEmpiricalThreshold = (k: number, sequenceLength: number): number => {
  const kThresholds = EMPIRICAL_THRESHOLDS[k];
  if (!kThresholds) return 30; // fallback
  
  // Find the two nearest sequence lengths
  const lengths = Object.keys(kThresholds).map(Number).sort((a, b) => a - b);
  
  // If exact match, return it
  if (kThresholds[sequenceLength]) {
    return kThresholds[sequenceLength];
  }
  
  // If below minimum or above maximum, use nearest
  if (sequenceLength <= lengths[0]) {
    return kThresholds[lengths[0]];
  }
  if (sequenceLength >= lengths[lengths.length - 1]) {
    return kThresholds[lengths[lengths.length - 1]];
  }
  
  // Linear interpolation between nearest points
  let lower = lengths[0];
  let upper = lengths[1];
  
  for (let i = 0; i < lengths.length - 1; i++) {
    if (lengths[i] <= sequenceLength && sequenceLength <= lengths[i + 1]) {
      lower = lengths[i];
      upper = lengths[i + 1];
      break;
    }
  }
  
  const lowerThreshold = kThresholds[lower];
  const upperThreshold = kThresholds[upper];
  const ratio = (sequenceLength - lower) / (upper - lower);
  
  return lowerThreshold + ratio * (upperThreshold - lowerThreshold);
};

// Empirically determined chi-square thresholds for run length tests (95th percentile)
// Based on 10000 simulations for each (n, run_type) pair
const RUN_LENGTH_THRESHOLDS: Record<string, Record<number, number>> = {
  'H': {
    10: 10.000,
    20: 10.333,
    30: 9.667,
    40: 9.727,
    50: 9.727,
    60: 9.462,
    70: 9.737,
    80: 9.588,
    90: 9.667,
    100: 9.480,
    110: 9.467,
    120: 9.370,
    130: 9.375,
    140: 9.452,
    150: 9.375,
    160: 9.486,
    170: 9.638,
    180: 9.419,
    190: 9.419,
    200: 9.520,
  },
  'T': {
    10: 10.000,
    20: 10.333,
    30: 9.857,
    40: 9.667,
    50: 9.545,
    60: 9.588,
    70: 9.588,
    80: 9.667,
    90: 9.667,
    100: 9.364,
    110: 9.667,
    120: 9.231,
    130: 9.727,
    140: 9.727,
    150: 9.424,
    160: 9.432,
    170: 9.429,
    180: 9.571,
    190: 9.419,
    200: 9.696,
  },
};

// Get empirically calibrated threshold for run length tests
const getRunLengthThreshold = (runType: string, sequenceLength: number): number => {
  const typeThresholds = RUN_LENGTH_THRESHOLDS[runType];
  if (!typeThresholds) return 15; // fallback
  
  // Find the two nearest sequence lengths
  const lengths = Object.keys(typeThresholds).map(Number).sort((a, b) => a - b);
  
  // If exact match, return it
  if (typeThresholds[sequenceLength]) {
    return typeThresholds[sequenceLength];
  }
  
  // If below minimum or above maximum, use nearest
  if (sequenceLength <= lengths[0]) {
    return typeThresholds[lengths[0]];
  }
  if (sequenceLength >= lengths[lengths.length - 1]) {
    return typeThresholds[lengths[lengths.length - 1]];
  }
  
  // Linear interpolation between nearest points
  let lower = lengths[0];
  let upper = lengths[1];
  
  for (let i = 0; i < lengths.length - 1; i++) {
    if (lengths[i] <= sequenceLength && sequenceLength <= lengths[i + 1]) {
      lower = lengths[i];
      upper = lengths[i + 1];
      break;
    }
  }
  
  const lowerThreshold = typeThresholds[lower];
  const upperThreshold = typeThresholds[upper];
  const ratio = (sequenceLength - lower) / (upper - lower);
  
  return lowerThreshold + ratio * (upperThreshold - lowerThreshold);
};

const CoinFlipRandomnessWidget: React.FC = () => {
  const [sequence, setSequence] = useState<CoinSide[]>([]);
  const [textInput, setTextInput] = useState<string>('');
  
  // Generate all possible k-mers for a given k
  const generateKmers = (k: number): string[] => {
    const kmers: string[] = [];
    const total = Math.pow(2, k);
    for (let i = 0; i < total; i++) {
      const binary = i.toString(2).padStart(k, '0');
      const kmer = binary.replace(/0/g, 'H').replace(/1/g, 'T');
      kmers.push(kmer);
    }
    return kmers;
  };

  // Count k-mers in sequence
  const countKmers = (seq: CoinSide[], k: number): Record<string, number> => {
    const counts: Record<string, number> = {};
    const kmers = generateKmers(k);
    
    // Initialize all k-mers to 0
    kmers.forEach(kmer => counts[kmer] = 0);
    
    // Count occurrences
    for (let i = 0; i <= seq.length - k; i++) {
      const kmer = seq.slice(i, i + k).join('');
      if (counts.hasOwnProperty(kmer)) {
        counts[kmer]++;
      }
    }
    
    return counts;
  };

  // Calculate chi-square test statistic
  const chiSquareTest = (observed: Record<string, number>, expected: Record<string, number>, k: number, sequenceLength: number) => {
    let chiSquare = 0;
    
    for (const kmer in expected) {
      if (expected[kmer] > 0) {
        const obs = observed[kmer] || 0;
        const exp = expected[kmer];
        chiSquare += Math.pow(obs - exp, 2) / exp;
      }
    }
    
    const threshold = getEmpiricalThreshold(k, sequenceLength);
    
    return { chiSquare, threshold };
  };

  // Get run lengths for a specific coin side
  const getRunLengths = (seq: CoinSide[], runType: CoinSide): number[] => {
    if (seq.length === 0) return [];
    
    const runs: number[] = [];
    let currentRunLength = 0;
    let currentValue: CoinSide | null = null;
    
    for (const flip of seq) {
      if (flip === runType) {
        if (currentValue === runType) {
          currentRunLength++;
        } else {
          currentRunLength = 1;
          currentValue = runType;
        }
      } else {
        if (currentValue === runType && currentRunLength > 0) {
          runs.push(currentRunLength);
          currentRunLength = 0;
        }
        currentValue = flip;
      }
    }
    
    // Don't forget the last run if it ends with the target type
    if (currentValue === runType && currentRunLength > 0) {
      runs.push(currentRunLength);
    }
    
    return runs;
  };

  // Compute chi-square test for run lengths
  const runLengthChiSquareTest = (seq: CoinSide[], runType: CoinSide): { chiSquare: number; threshold: number; observedCounts: Record<string, number>; expectedCounts: Record<string, number>; runLengths: number[] } => {
    const runLengths = getRunLengths(seq, runType);
    
    if (runLengths.length === 0) {
      return { 
        chiSquare: 0, 
        threshold: getRunLengthThreshold(runType, seq.length),
        observedCounts: {},
        expectedCounts: {},
        runLengths: []
      };
    }
    
    // Group runs into categories: 1, 2, 3, 4, 5+
    const maxCategory = 5;
    const observedCounts: Record<string, number> = {};
    const expectedCounts: Record<string, number> = {};
    
    // Initialize counts
    for (let i = 1; i <= maxCategory; i++) {
      const key = i === maxCategory ? '5+' : i.toString();
      observedCounts[key] = 0;
    }
    
    // Count observed runs
    for (const runLength of runLengths) {
      if (runLength <= maxCategory - 1) {
        observedCounts[runLength.toString()]++;
      } else {
        observedCounts['5+']++;
      }
    }
    
    // Calculate expected counts based on geometric distribution
    const totalRuns = runLengths.length;
    for (let k = 1; k < maxCategory; k++) {
      expectedCounts[k.toString()] = totalRuns * Math.pow(0.5, k);
    }
    // For 5+ category: P(X >= 5) = 0.5^4 = 1/16
    expectedCounts['5+'] = totalRuns * Math.pow(0.5, maxCategory - 1);
    
    // Compute chi-square statistic
    let chiSquare = 0;
    for (let i = 1; i <= maxCategory; i++) {
      const key = i === maxCategory ? '5+' : i.toString();
      const obs = observedCounts[key];
      const exp = expectedCounts[key];
      if (exp > 0) {
        chiSquare += Math.pow(obs - exp, 2) / exp;
      }
    }
    
    const threshold = getRunLengthThreshold(runType, seq.length);
    
    return { chiSquare, threshold, observedCounts, expectedCounts, runLengths };
  };

  // Run statistical tests
  const tests = useMemo((): KmerTest[] => {
    if (sequence.length < 4) return [];
    
    const results: KmerTest[] = [];
    
    for (let k = 1; k <= 4; k++) {
      const maxLength = sequence.length - k + 1;
      if (maxLength < 5) continue; // Need at least 5 observations
      
      const observed = countKmers(sequence, k);
      const expectedCount = maxLength / Math.pow(2, k);
      
      const expected: Record<string, number> = {};
      const kmers = generateKmers(k);
      kmers.forEach(kmer => expected[kmer] = expectedCount);
      
      const { chiSquare, threshold } = chiSquareTest(observed, expected, k, sequence.length);
      
      results.push({
        k,
        expectedCounts: expected,
        observedCounts: observed,
        chiSquare,
        threshold,
        isRandom: chiSquare <= threshold // Pass if chi-square is below empirical threshold
      });
    }
    
    return results;
  }, [sequence]);

  // Run length statistical tests
  const runTests = useMemo((): RunLengthTest[] => {
    if (sequence.length < 10) return []; // Need at least 10 flips for meaningful run analysis
    
    const results: RunLengthTest[] = [];
    
    for (const runType of ['H', 'T'] as const) {
      const { chiSquare, threshold, observedCounts, expectedCounts, runLengths } = runLengthChiSquareTest(sequence, runType);
      
      results.push({
        runType,
        runLengths,
        observedCounts,
        expectedCounts,
        chiSquare,
        threshold,
        isRandom: chiSquare <= threshold
      });
    }
    
    return results;
  }, [sequence]);

  const addCoin = (side: CoinSide) => {
    setSequence(prev => {
      const newSeq = [...prev, side];
      setTextInput(newSeq.join(''));
      return newSeq;
    });
  };

  const resetSequence = () => {
    setSequence([]);
    setTextInput('');
  };

  const addRandomFlips = (length: number = 20) => {
    const newFlips: CoinSide[] = [];
    for (let i = 0; i < length; i++) {
      newFlips.push(Math.random() < 0.5 ? 'H' : 'T');
    }
    setSequence(prev => {
      const updatedSequence = [...prev, ...newFlips];
      setTextInput(updatedSequence.join(''));
      return updatedSequence;
    });
  };

  const handleTextInput = () => {
    const cleaned = textInput.toUpperCase().replace(/[^HT]/g, '');
    if (cleaned && cleaned.match(/^[HT]+$/)) {
      const newSequence = cleaned.split('').map(char => char as CoinSide);
      setSequence(newSequence);
      setTextInput(cleaned);
    }
  };

  return (
    <Tooltip.Provider>
      <div className="p-4 sm:p-6 bg-gray-50 rounded-lg space-y-4 sm:space-y-6 max-w-4xl mx-auto">
        <h3 className="text-xl font-semibold text-center text-gray-800">
          Coin Flip Randomness Tester
        </h3>
        
        <p className="text-center text-gray-600">
          Click coins to build a sequence, then see if it passes statistical tests for randomness
        </p>

        {/* Main content area with coins and buttons */}
        <div className="flex justify-center gap-4">
          {/* Coin buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => addCoin('H')}
              className="flex flex-col items-center justify-center w-24 h-24 bg-white rounded-lg border-2 border-gray-300 hover:border-blue-400 transition-colors p-2"
            >
              <img 
                src={getAssetPath('/images/coin_heads_big.png')} 
                alt="Heads" 
                className="w-20 h-20"
              />
              <span className="text-xs font-medium -mt-1">Heads (H)</span>
            </button>
            
            <button
              onClick={() => addCoin('T')}
              className="flex flex-col items-center justify-center w-24 h-24 bg-white rounded-lg border-2 border-gray-300 hover:border-blue-400 transition-colors p-2"
            >
              <img 
                src={getAssetPath('/images/coin_tail_big.png')} 
                alt="Tails" 
                className="w-20 h-20"
              />
              <span className="text-xs font-medium -mt-1">Tails (T)</span>
            </button>
          </div>

          {/* Control buttons to the right */}
          <div className="flex flex-col gap-2">
            <button
              onClick={resetSequence}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
            >
              Reset
            </button>
            <button
              onClick={() => addRandomFlips(20)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
            >
              Random 20
            </button>
          </div>
        </div>

        {/* Current sequence */}
        <div className="bg-white rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            Current Sequence ({sequence.length} flips)
          </h4>
          <div className="min-h-[60px] p-3 bg-gray-50 rounded border-2 border-dashed border-gray-300">
            {sequence.length === 0 ? (
              <p className="text-gray-500 text-center">Click coins above to build your sequence</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {sequence.map((flip, i) => (
                  <span 
                    key={i}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded text-sm font-bold ${
                      flip === 'H' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {flip}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Text input */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600">Alternatively, write text here:</span>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="e.g., HHTHT"
              className="flex-1 px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleTextInput}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              OK
            </button>
          </div>
        </div>

        {/* Test results */}
        {(tests.length > 0 || runTests.length > 0) && (
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Randomness Tests
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map((test, i) => (
                <Tooltip.Root key={i}>
                  <Tooltip.Trigger asChild>
                    <div className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-help">
                      <div className="flex justify-between items-center">
                        <h5 className="text-sm font-semibold">
                          {test.k}-mer Test
                        </h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          test.isRandom 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {test.isRandom ? '✓ PASS' : '✗ FAIL'}
                        </span>
                      </div>
                    </div>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-gray-800 text-white text-sm p-3 rounded shadow-lg max-w-md"
                      sideOffset={5}
                    >
                      <div className="space-y-2">
                        <div className="font-semibold">{test.k}-mer Test Details</div>
                        <div>Chi-square statistic: {test.chiSquare.toFixed(3)}</div>
                        <div>Threshold (95%): {test.threshold.toFixed(3)}</div>
                        <div>Patterns tested: {Object.keys(test.expectedCounts).length}</div>
                        <div className="text-xs">
                          <div className="font-semibold mt-2">Pattern counts (observed/expected):</div>
                          {Object.keys(test.expectedCounts).map(kmer => (
                            <div key={kmer}>
                              {kmer}: {test.observedCounts[kmer] || 0}/{test.expectedCounts[kmer].toFixed(1)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <Tooltip.Arrow className="fill-gray-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              ))}
              {runTests.map((test, i) => (
                <Tooltip.Root key={`run-${i}`}>
                  <Tooltip.Trigger asChild>
                    <div className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-help">
                      <div className="flex justify-between items-center">
                        <h5 className="text-sm font-semibold">
                          {test.runType}-Run Test
                        </h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          test.isRandom 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {test.isRandom ? '✓ PASS' : '✗ FAIL'}
                        </span>
                      </div>
                    </div>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-gray-800 text-white text-sm p-3 rounded shadow-lg max-w-md"
                      sideOffset={5}
                    >
                      <div className="space-y-2">
                        <div className="font-semibold">{test.runType}-Run Test Details</div>
                        <div>Chi-square statistic: {test.chiSquare.toFixed(3)}</div>
                        <div>Threshold (95%): {test.threshold.toFixed(3)}</div>
                        <div>Total runs: {test.runLengths.length}</div>
                        <div className="text-xs">
                          <div className="font-semibold mt-2">Run length counts (observed/expected):</div>
                          {Object.keys(test.expectedCounts).map(length => (
                            <div key={length}>
                              {length}: {test.observedCounts[length] || 0}/{test.expectedCounts[length].toFixed(1)}
                            </div>
                          ))}
                        </div>
                        {test.runLengths.length > 0 && (
                          <div className="text-xs">
                            <div className="font-semibold mt-2">Longest run: {Math.max(...test.runLengths)}</div>
                          </div>
                        )}
                      </div>
                      <Tooltip.Arrow className="fill-gray-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              ))}
            </div>
        </div>
      )}

      </div>
    </Tooltip.Provider>
  );
};

export default CoinFlipRandomnessWidget;