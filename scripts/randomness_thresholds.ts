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