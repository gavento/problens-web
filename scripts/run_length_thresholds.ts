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