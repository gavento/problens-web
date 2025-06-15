"use client";

import React, { useState, useMemo } from "react";
import { InlineMath } from 'react-katex';

type PriorType = 'uniform' | 'log-uniform' | 'power-law';

const XKCDCountdownWidget: React.FC = () => {
  const [priorType, setPriorType] = useState<PriorType>('uniform');
  const [lambda, setLambda] = useState(1.0);

  const targetNumber = 2382;
  const evidenceDigits = "00002382";
  const totalDigits = 14;
  
  // Total space: 14-digit decimal numbers (10^14 total numbers)
  // Evidence space: numbers ending in 00002382 (8 digits fixed)
  // So we have 10^(14-8) = 10^6 = 1,000,000 numbers that satisfy the evidence
  
  const totalSpace = Math.pow(10, totalDigits);
  const evidenceSpace = Math.pow(10, totalDigits - evidenceDigits.length);
  
  // Calculate posterior probability and bin probabilities
  const { posteriorProbability, binProbabilities } = useMemo(() => {
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
        }))
      };
    }
    
    const normalizedBins = bins.map(bin => ({
      ...bin,
      probability: bin.probability / normalizingSum
    }));
    
    return {
      posteriorProbability: targetPosterior / normalizingSum,
      binProbabilities: normalizedBins
    };
  }, [lambda, targetNumber, evidenceSpace, evidenceDigits]);

  const handlePriorChange = (newPrior: PriorType) => {
    setPriorType(newPrior);
    // Auto-adjust lambda for special cases
    if (newPrior === 'uniform') {
      setLambda(0);
    } else if (newPrior === 'log-uniform') {
      setLambda(1);
    }
  };

  const handleLambdaChange = (newLambda: number) => {
    setLambda(newLambda);
    // Auto-update prior type based on lambda value
    if (newLambda === 0) {
      setPriorType('uniform');
    } else if (newLambda === 1) {
      setPriorType('log-uniform');
    } else {
      setPriorType('power-law');
    }
  };

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

  const getPriorDescription = (): string => {
    if (lambda === 0) {
      return "Uniform prior: All numbers are equally likely";
    } else if (lambda === 1) {
      return "Log-uniform prior: P(X) ∝ 1/X (Benford's law-like)";
    } else {
      return `Power-law prior: P(X) ∝ X^(-${lambda.toFixed(1)})`;
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-lg space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-center text-gray-800">
        XKCD Countdown Probability Calculator
      </h3>
      

      {/* Prior Selection */}
      <div className="bg-white rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Select Prior Distribution</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handlePriorChange('uniform')}
            className={`p-4 rounded-lg border text-left transition-colors min-h-[60px] ${
              priorType === 'uniform'
                ? 'bg-blue-100 border-blue-300'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="font-semibold">Uniform</div>
            <div className="text-sm text-gray-600"><InlineMath math="P(X) = \text{const}" /></div>
          </button>
          
          <button
            onClick={() => handlePriorChange('log-uniform')}
            className={`p-4 rounded-lg border text-left transition-colors min-h-[60px] ${
              priorType === 'log-uniform'
                ? 'bg-blue-100 border-blue-300'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="font-semibold">Log-uniform</div>
            <div className="text-sm text-gray-600"><InlineMath math="P(X) \propto 1/X" /></div>
          </button>
          
          <button
            onClick={() => handlePriorChange('power-law')}
            className={`p-4 rounded-lg border text-left transition-colors min-h-[60px] ${
              priorType === 'power-law'
                ? 'bg-blue-100 border-blue-300'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="font-semibold">Power-law</div>
            <div className="text-sm text-gray-600"><InlineMath math="P(X) \propto X^{-\lambda}" /></div>
          </button>
        </div>
      </div>

      {/* Lambda Slider */}
      <div className="bg-white rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Lambda Parameter (λ)</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 w-16">λ = {lambda.toFixed(1)}</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={lambda}
              onChange={(e) => handleLambdaChange(parseFloat(e.target.value))}
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

      {/* Posterior Distribution Chart */}
      <div className="bg-white rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Posterior Distribution by Scale</h4>
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
                    10^{i}
                  </text>
                </g>
              ))}
              
              {/* Y-axis labels */}
              {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((val, i) => (
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
                    {val.toFixed(1)}
                  </text>
                </g>
              ))}
              
              {/* Bars */}
              {binProbabilities.map((bin, i) => {
                const maxProb = Math.max(...binProbabilities.map(b => b.probability));
                const barHeight = maxProb > 0 ? (bin.probability / maxProb) * 220 : 0;
                const xPos = i * 20;
                
                return (
                  <rect
                    key={i}
                    x={xPos}
                    y={240 - barHeight}
                    width="18"
                    height={barHeight}
                    fill="url(#barGradient)"
                    stroke="#1e40af"
                    strokeWidth="0.5"
                    className="hover:opacity-80"
                  >
                    <title>
                      {`Range: ${bin.min.toExponential(1)} - ${bin.max.toExponential(1)}\\nProbability: ${(bin.probability * 100).toFixed(3)}%`}
                    </title>
                  </rect>
                );
              })}
            </g>
            
            {/* Chart title */}
            <text x="50%" y="15" textAnchor="middle" fontSize="12" fill="#374151" fontWeight="bold">
              Probability Mass by Order of Magnitude
            </text>
            
            {/* Y-axis label */}
            <text x="20" y="50%" textAnchor="middle" fontSize="12" fill="#6b7280" transform="rotate(-90, 20, 150)">
              Probability
            </text>
          </svg>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Each bar shows the total probability mass for numbers in that scale range. 
          Hover over bars to see exact values.
        </p>
      </div>
    </div>
  );
};

export default XKCDCountdownWidget;