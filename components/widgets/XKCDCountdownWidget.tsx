"use client";

import React, { useState, useMemo } from "react";
import { InlineMath } from 'react-katex';

const XKCDCountdownWidget: React.FC = () => {
  const [lambda, setLambda] = useState(1.0);
  const [logScale, setLogScale] = useState(true);
  const [showPosterior, setShowPosterior] = useState(true);

  const targetNumber = 2382;
  const evidenceDigits = "00002382";
  const totalDigits = 14;
  
  // Total space: 14-digit decimal numbers (10^14 total numbers)
  // Evidence space: numbers ending in 00002382 (8 digits fixed)
  // So we have 10^(14-8) = 10^6 = 1,000,000 numbers that satisfy the evidence
  
  const totalSpace = Math.pow(10, totalDigits);
  const evidenceSpace = Math.pow(10, totalDigits - evidenceDigits.length);
  
  // Precompute all calculations for smoother performance
  const { posteriorProbability, binProbabilities, priorProbabilities, maxProb, maxPriorProb } = useMemo(() => {
    const baseNumber = parseInt(evidenceDigits);
    
    // Create log-scale bins from 10^0 to 10^14
    const bins = [];
    for (let i = 0; i < 14; i++) {
      bins.push({
        min: Math.pow(10, i),
        max: Math.pow(10, i + 0.5),
        probability: 0
      });
      bins.push({
        min: Math.pow(10, i + 0.5),
        max: Math.pow(10, i + 1),
        probability: 0
      });
    }
    
    let normalizingSum = 0;
    let targetPosterior = 0;
    
    // Calculate probabilities for all valid numbers
    for (let prefix = 0; prefix < evidenceSpace; prefix++) {
      const fullNumber = prefix * Math.pow(10, evidenceDigits.length) + baseNumber;
      if (fullNumber > 0) {
        const weight = lambda === 0 ? 1 : Math.pow(fullNumber, -lambda);
        normalizingSum += weight;
        
        if (fullNumber === targetNumber) {
          targetPosterior = weight;
        }
        
        // Add to appropriate bin
        const binIndex = bins.findIndex(bin => fullNumber >= bin.min && fullNumber < bin.max);
        if (binIndex >= 0) {
          bins[binIndex].probability += weight;
        }
      }
    }
    
    // Normalize
    if (normalizingSum === 0) {
      return {
        posteriorProbability: 1 / evidenceSpace,
        binProbabilities: bins.map(bin => ({
          ...bin,
          probability: 0
        })),
        maxProb: 0
      };
    }
    
    const normalizedBins = bins.map(bin => ({
      ...bin,
      probability: bin.probability / normalizingSum
    }));
    
    // Calculate prior probabilities analytically using continuous approximation
    const priorBins = [];
    for (let i = 0; i < 14; i++) {
      priorBins.push({
        min: Math.pow(10, i),
        max: Math.pow(10, i + 0.5),
        probability: 0
      });
      priorBins.push({
        min: Math.pow(10, i + 0.5),
        max: Math.pow(10, i + 1),
        probability: 0
      });
    }
    
    // Analytical computation of prior probabilities
    const calculateBinProbability = (a: number, b: number, lambda: number): number => {
      if (lambda === 0) {
        // Uniform distribution: P(x ∈ [a,b]) = (b-a) / (10^14 - 1)
        return (b - a) / (Math.pow(10, 14) - 1);
      } else if (Math.abs(lambda - 1) < 1e-10) {
        // Log-uniform distribution: P(x ∈ [a,b]) = ln(b/a) / ln(10^14)
        if (a <= 0) a = 1; // Handle edge case
        return Math.log(b / a) / Math.log(Math.pow(10, 14));
      } else {
        // Power law x^(-λ): P(x ∈ [a,b]) = [b^(1-λ) - a^(1-λ)] / [10^14^(1-λ) - 1^(1-λ)]
        if (a <= 0) a = 1; // Handle edge case
        const numerator = Math.pow(b, 1 - lambda) - Math.pow(a, 1 - lambda);
        const denominator = Math.pow(Math.pow(10, 14), 1 - lambda) - 1;
        return numerator / denominator;
      }
    };
    
    const normalizedPriorBins = priorBins.map(bin => ({
      ...bin,
      probability: calculateBinProbability(bin.min, bin.max, lambda)
    }));
    
    const maxProb = Math.max(...normalizedBins.map(b => b.probability));
    const maxPriorProb = Math.max(...normalizedPriorBins.map(b => b.probability));
    
    return {
      posteriorProbability: targetPosterior / normalizingSum,
      binProbabilities: normalizedBins,
      priorProbabilities: normalizedPriorBins,
      maxProb,
      maxPriorProb
    };
  }, [lambda, targetNumber, evidenceSpace, evidenceDigits]);

  const currentData = showPosterior ? binProbabilities : priorProbabilities;
  const currentMaxProb = showPosterior ? maxProb : maxPriorProb;

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


  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-lg space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-center text-gray-800">
        XKCD Countdown Probability Calculator
      </h3>
      

      {/* Evidence */}
      <div className="bg-white rounded-lg p-4">
        <div className="text-center text-gray-700">
          <strong>Evidence:</strong> "last eight digits are 00002382"
        </div>
      </div>

      {/* Lambda Slider */}
      <div className="bg-white rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">
          Select λ for the power-law prior <InlineMath math="P(x) \propto x^{-\lambda}" />
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
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(lambda / 2) * 100}%, #e5e7eb ${(lambda / 2) * 100}%, #e5e7eb 100%)`
              }}
            />
            <span className="text-sm text-gray-500 w-8">2.0</span>
          </div>
          
          <div className="text-sm text-gray-600 flex flex-wrap gap-2">
            <span className={`px-2 py-1 rounded ${lambda === 0 ? 'bg-yellow-100 border border-yellow-300' : ''}`}>
              <strong>λ = 0:</strong> Uniform prior
            </span>
            <span className={`px-2 py-1 rounded ${lambda === 1 ? 'bg-yellow-100 border border-yellow-300' : ''}`}>
              <strong>λ = 1:</strong> Log-uniform prior
            </span>
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="bg-white rounded-lg p-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-lg text-center text-blue-800">
            <InlineMath math="P(X = 2382 \mid \text{evidence}) = " />
            <span className="font-bold">{formatProbability(posteriorProbability)}</span>
          </div>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="bg-white rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-semibold text-gray-800">
            Full {showPosterior ? 'posterior' : 'prior'} distribution
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPosterior(!showPosterior)}
              className="px-3 py-1 text-sm rounded bg-green-500 text-white hover:bg-green-600"
            >
              Show {showPosterior ? 'prior' : 'posterior'}
            </button>
            <button
              onClick={() => setLogScale(!logScale)}
              className="px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              {logScale ? 'Log' : 'Normal'} scale
            </button>
          </div>
        </div>
        <div className="w-full">
          <svg width="100%" height="300" viewBox="0 0 640 300" className="border border-gray-200 rounded">
            <defs>
              <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1e40af" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            
            {/* Chart area */}
            <g transform="translate(60, 20)">
              {/* Y-axis */}
              <line x1="0" y1="0" x2="0" y2="240" stroke="#6b7280" strokeWidth="1" />
              
              {/* X-axis */}
              <line x1="0" y1="240" x2="560" y2="240" stroke="#6b7280" strokeWidth="1" />
              
              {/* X-axis labels */}
              {Array.from({ length: 15 }, (_, i) => (
                <g key={i}>
                  <line 
                    x1={i * 40} 
                    y1="240" 
                    x2={i * 40} 
                    y2="245" 
                    stroke="#6b7280" 
                    strokeWidth="1" 
                  />
                  <text 
                    x={i * 40} 
                    y="260" 
                    textAnchor="middle" 
                    fontSize="10" 
                    fill="#6b7280"
                  >
                    <tspan>10</tspan>
                    <tspan fontSize="8" dy="-3">{i}</tspan>
                  </text>
                </g>
              ))}
              
              {/* Y-axis labels */}
              {(logScale ? 
                [{ val: 0, label: '0.0001' }, { val: 0.25, label: '0.001' }, { val: 0.5, label: '0.01' }, { val: 0.75, label: '0.1' }, { val: 1.0, label: '1.0' }] :
                [{ val: 0, label: '0.0' }, { val: 0.2, label: '0.2' }, { val: 0.4, label: '0.4' }, { val: 0.6, label: '0.6' }, { val: 0.8, label: '0.8' }, { val: 1.0, label: '1.0' }]
              ).map(({ val, label }, i) => (
                <g key={i}>
                  <line 
                    x1="-5" 
                    y1={240 - val * 240} 
                    x2="0" 
                    y2={240 - val * 240} 
                    stroke="#6b7280" 
                    strokeWidth="1" 
                  />
                  <text 
                    x="-10" 
                    y={245 - val * 240} 
                    textAnchor="end" 
                    fontSize="10" 
                    fill="#6b7280"
                  >
                    {label}
                  </text>
                </g>
              ))}
              
              {/* Bars */}
              {currentData && currentData.map((bin, i) => {
                const actualHeight = logScale ? 
                  (bin.probability > 0 && currentMaxProb ? Math.log10(bin.probability / currentMaxProb) + 4 : 0) * 220 / 4 :
                  (bin.probability / (currentMaxProb || 1)) * 220;
                const barHeight = Math.max(0, actualHeight);
                const xPos = i * 20;
                
                return (
                  <g key={i}>
                    <rect
                      x={xPos}
                      y={240 - barHeight}
                      width="18"
                      height={barHeight}
                      fill="url(#barGradient)"
                      stroke="#1e40af"
                      strokeWidth="0.5"
                      className="hover:opacity-80 cursor-pointer"
                    />
                    {/* Tooltip on hover */}
                    <rect
                      x={xPos}
                      y={240 - barHeight}
                      width="18"
                      height={barHeight}
                      fill="transparent"
                      className="hover:stroke-red-500 hover:stroke-2"
                    >
                      <title>
                        {`Range: ${bin.min.toExponential(1)} - ${bin.max.toExponential(1)}\nProbability: ${(bin.probability * 100).toFixed(6)}%\n${showPosterior ? 'Posterior' : 'Prior'} probability mass in this range\nλ = ${lambda} (${lambda === 0 ? 'uniform' : lambda === 1 ? 'log-uniform' : 'power law'})`}
                      </title>
                    </rect>
                  </g>
                );
              })}
            </g>
            
            
            {/* Y-axis label */}
            <text x="20" y="50%" textAnchor="middle" fontSize="12" fill="#6b7280" transform="rotate(-90, 20, 150)">
              Probability
            </text>
          </svg>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Hover over bars to see exact values.
        </p>
      </div>
    </div>
  );
};

export default XKCDCountdownWidget;