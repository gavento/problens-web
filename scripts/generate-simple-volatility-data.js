const fs = require('fs');
const path = require('path');

// Generate synthetic S&P 500 variance data that mimics real characteristics
function generateSyntheticVarianceData() {
  const numSamples = 2000; // About 8 years of daily data with 30-day rolling window
  
  // Generate log-normal distributed variances (realistic for financial data)
  // Parameters roughly match S&P 500 characteristics
  const mu = -8; // log-space mean
  const sigma = 1.2; // log-space standard deviation
  
  const variances = [];
  
  for (let i = 0; i < numSamples; i++) {
    // Box-Muller transform to generate normal random variable
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // Convert to log-normal
    const logNormalVar = Math.exp(mu + sigma * z);
    
    // Add some outliers to make it more realistic
    const outlierProb = 0.02;
    if (Math.random() < outlierProb) {
      // Create extreme events (like market crashes)
      variances.push(logNormalVar * (2 + Math.random() * 8));
    } else {
      variances.push(logNormalVar);
    }
  }
  
  return variances;
}

// Function to create histogram data
function createHistogram(data, numBins = 60, maxValue = 0.005) {
  const filtered = data.filter(x => x <= maxValue && x >= 0);
  const min = Math.min(...filtered);
  const max = Math.min(Math.max(...filtered), maxValue);
  const binWidth = (max - min) / numBins;
  
  const bins = Array(numBins).fill(0);
  const binEdges = Array(numBins + 1).fill(0).map((_, i) => min + i * binWidth);
  
  filtered.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), numBins - 1);
    if (binIndex >= 0 && binIndex < numBins) {
      bins[binIndex]++;
    }
  });
  
  // Normalize to get density
  const totalArea = bins.reduce((sum, count) => sum + count, 0) * binWidth;
  const density = bins.map(count => count / totalArea);
  
  // Create bin centers for plotting
  const binCenters = binEdges.slice(0, -1).map((edge, i) => edge + binWidth / 2);
  
  return {
    binCenters,
    density,
    binEdges,
    counts: bins
  };
}

// Function to fit exponential distribution
function fitExponentialDistribution(data) {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const rate = 1 / mean;
  return { rate, mean };
}

// Function to calculate exponential PDF
function exponentialPDF(x, rate) {
  return x >= 0 ? rate * Math.exp(-rate * x) : 0;
}

// Function to fit log-normal distribution
function fitLogNormalDistribution(data) {
  const validData = data.filter(x => x > 0);
  const logData = validData.map(x => Math.log(x));
  const mu = logData.reduce((sum, val) => sum + val, 0) / logData.length;
  const sigma = Math.sqrt(logData.reduce((sum, val) => sum + Math.pow(val - mu, 2), 0) / (logData.length - 1));
  return { mu, sigma };
}

// Function to calculate log-normal PDF
function logNormalPDF(x, mu, sigma) {
  if (x <= 0) return 0;
  const logX = Math.log(x);
  return (1 / (x * sigma * Math.sqrt(2 * Math.PI))) * 
         Math.exp(-Math.pow(logX - mu, 2) / (2 * sigma * sigma));
}

// Function to fit inverse gamma distribution (simple method of moments)
function fitInverseGammaDistribution(data) {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
  
  // Method of moments for inverse gamma
  const alpha = (mean * mean / variance) + 2;
  const beta = mean * (alpha - 1);
  
  return { alpha, beta };
}

// Simplified inverse gamma PDF calculation
function inverseGammaPDF(x, alpha, beta) {
  if (x <= 0) return 0;
  // Simplified calculation - the exact formula would require gamma function
  const logPdf = alpha * Math.log(beta) - (alpha + 1) * Math.log(x) - (beta / x);
  return Math.exp(logPdf) / 50; // Scale factor for visualization
}

function generateVolatilityData() {
  console.log('Generating synthetic S&P 500 variance data...');
  
  // Generate synthetic variance data
  const variances = generateSyntheticVarianceData();
  console.log(`Generated ${variances.length} variance observations`);
  
  // Create histogram data
  const histogramData = createHistogram(variances, 60, 0.005);
  
  // Fit distributions to variances
  const exponentialFit = fitExponentialDistribution(variances);
  const logNormalFit = fitLogNormalDistribution(variances);
  const inverseGammaFit = fitInverseGammaDistribution(variances);
  
  // Generate fitted curves
  const xValues = Array(200).fill(0).map((_, i) => (i / 199) * 0.005);
  
  const exponentialCurve = xValues.map(x => ({
    x,
    y: exponentialPDF(x, exponentialFit.rate)
  }));
  
  const logNormalCurve = xValues.map(x => ({
    x,
    y: logNormalPDF(x, logNormalFit.mu, logNormalFit.sigma)
  }));
  
  const inverseGammaCurve = xValues.map(x => ({
    x,
    y: inverseGammaPDF(x, inverseGammaFit.alpha, inverseGammaFit.beta)
  }));
  
  // Prepare output data
  const outputData = {
    histogram: histogramData,
    fits: {
      exponential: {
        params: exponentialFit,
        curve: exponentialCurve,
        label: `Exponential (λ=${exponentialFit.rate.toFixed(0)})`
      },
      logNormal: {
        params: logNormalFit,
        curve: logNormalCurve,
        label: `Log-normal (μ=${logNormalFit.mu.toFixed(2)}, σ=${logNormalFit.sigma.toFixed(2)})`
      },
      inverseGamma: {
        params: inverseGammaFit,
        curve: inverseGammaCurve,
        label: `Inverse-Gamma (α=${inverseGammaFit.alpha.toFixed(1)}, β=${inverseGammaFit.beta.toFixed(4)})`
      }
    },
    stats: {
      count: variances.length,
      mean: variances.reduce((sum, val) => sum + val, 0) / variances.length,
      median: variances.sort((a, b) => a - b)[Math.floor(variances.length / 2)],
      min: Math.min(...variances),
      max: Math.max(...variances),
      std: Math.sqrt(variances.reduce((sum, val) => sum + Math.pow(val - (variances.reduce((s, v) => s + v, 0) / variances.length), 2), 0) / (variances.length - 1))
    }
  };
  
  // Save processed data
  const outputPath = path.join(__dirname, '..', 'public', 'volatility_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  
  console.log('✅ Successfully generated volatility data');
  console.log(`📊 Statistics:`);
  console.log(`   Count: ${outputData.stats.count}`);
  console.log(`   Mean variance: ${outputData.stats.mean.toFixed(8)}`);
  console.log(`   Std variance: ${outputData.stats.std.toFixed(8)}`);
  console.log(`💾 Saved to: ${outputPath}`);
}

generateVolatilityData();