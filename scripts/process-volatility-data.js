const fs = require('fs');
const path = require('path');

// Function to calculate log returns
function calculateLogReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }
  return returns;
}

// Function to calculate rolling volatility
function calculateRollingVolatility(returns, windowSize = 30) {
  const volatilities = [];
  
  for (let i = windowSize - 1; i < returns.length; i++) {
    const window = returns.slice(i - windowSize + 1, i + 1);
    const mean = window.reduce((sum, val) => sum + val, 0) / window.length;
    const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (window.length - 1);
    const volatility = Math.sqrt(variance);
    volatilities.push(volatility);
  }
  
  return volatilities;
}

// Function to create histogram data
function createHistogram(data, numBins = 50, maxValue = 0.005) {
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
  return rate * Math.exp(-rate * x);
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

// Function to calculate inverse gamma PDF (simplified)
function inverseGammaPDF(x, alpha, beta) {
  if (x <= 0) return 0;
  // Simplified calculation without gamma function
  return Math.pow(beta, alpha) * Math.pow(x, -alpha - 1) * Math.exp(-beta / x);
}

async function processVolatilityData() {
  try {
    console.log('Reading S&P data...');
    const sapDataPath = path.join(__dirname, '..', 'code', 'financial_data', 'sap_data.json');
    const sapData = JSON.parse(fs.readFileSync(sapDataPath, 'utf8'));
    
    // Extract close prices
    const prices = Object.values(sapData.Close);
    console.log(`Found ${prices.length} price data points`);
    
    // Calculate log returns
    const logReturns = calculateLogReturns(prices);
    console.log(`Calculated ${logReturns.length} log returns`);
    
    // Calculate rolling volatility (30-day window)
    const volatilities = calculateRollingVolatility(logReturns, 30);
    console.log(`Calculated ${volatilities.length} volatility values`);
    
    // Convert to variances
    const variances = volatilities.map(v => v * v);
    
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
      y: inverseGammaPDF(x, inverseGammaFit.alpha, inverseGammaFit.beta) * 1e-6 // Scale down for display
    }));
    
    // Prepare output data
    const outputData = {
      histogram: histogramData,
      fits: {
        exponential: {
          params: exponentialFit,
          curve: exponentialCurve,
          label: `Exponential (λ=${exponentialFit.rate.toFixed(3)})`
        },
        logNormal: {
          params: logNormalFit,
          curve: logNormalCurve,
          label: `Log-normal (μ=${logNormalFit.mu.toFixed(3)}, σ=${logNormalFit.sigma.toFixed(3)})`
        },
        inverseGamma: {
          params: inverseGammaFit,
          curve: inverseGammaCurve,
          label: `Inverse-Gamma (α=${inverseGammaFit.alpha.toFixed(3)}, β=${inverseGammaFit.beta.toFixed(6)})`
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
    
    console.log('✅ Successfully processed volatility data');
    console.log(`📊 Statistics:`);
    console.log(`   Count: ${outputData.stats.count}`);
    console.log(`   Mean variance: ${outputData.stats.mean.toFixed(8)}`);
    console.log(`   Std variance: ${outputData.stats.std.toFixed(8)}`);
    console.log(`💾 Saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error processing volatility data:', error);
    process.exit(1);
  }
}

processVolatilityData();