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
  
  // Calculate posterior probability based on selected prior
  const posteriorProbability = useMemo(() => {
    const baseNumber = parseInt(evidenceDigits);
    
    // For uniform prior (λ = 0): P(X = 2382 | evidence) = 1 / evidenceSpace
    if (lambda === 0) {
      return 1 / evidenceSpace;
    }
    
    // For general power-law prior: P(X) ∝ X^(-λ)
    let normalizingSum = 0;
    
    // Sum over all 6-digit prefixes + evidenceDigits  
    for (let prefix = 0; prefix < evidenceSpace; prefix++) {
      const fullNumber = prefix * Math.pow(10, evidenceDigits.length) + baseNumber;
      if (fullNumber > 0) {
        normalizingSum += Math.pow(fullNumber, -lambda);
      }
    }
    
    if (normalizingSum === 0) return 1 / evidenceSpace; // Fallback to uniform
    
    return Math.pow(targetNumber, -lambda) / normalizingSum;
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => handlePriorChange('uniform')}
            className={`p-3 rounded-lg border text-left transition-colors ${
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
            className={`p-3 rounded-lg border text-left transition-colors ${
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
            className={`p-3 rounded-lg border text-left transition-colors ${
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
              className="flex-1 h-2"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(lambda / 2) * 100}%, #e5e7eb ${(lambda / 2) * 100}%, #e5e7eb 100%)`
              }}
            />
            <span className="text-sm text-gray-500 w-8">2.0</span>
          </div>
          
          <div className="text-sm text-gray-600">
            <p className={`p-2 rounded ${lambda === 0 ? 'bg-yellow-100 border border-yellow-300' : ''}`}>
              <strong>λ = 0:</strong> Uniform prior (all scales equally likely)
            </p>
            <p className={`p-2 rounded mt-1 ${lambda === 1 ? 'bg-yellow-100 border border-yellow-300' : ''}`}>
              <strong>λ = 1:</strong> Log-uniform prior (like Benford&apos;s law)
            </p>
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
    </div>
  );
};

export default XKCDCountdownWidget;