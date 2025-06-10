"use client";

import React, { useState, useMemo } from "react";

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
    // For uniform prior (λ = 0): P(X = 2382 | evidence) = 1 / evidenceSpace
    if (priorType === 'uniform' || lambda === 0) {
      return 1 / evidenceSpace;
    }
    
    // For log-uniform prior (λ = 1): P(X) ∝ 1/X
    if (priorType === 'log-uniform' || lambda === 1) {
      // Calculate normalizing constant for log-uniform over evidence space
      // Numbers from 10^(totalDigits-evidenceDigits.length) * 10^(evidenceDigits.length) + targetNumber pattern
      // Simplified: we need to sum 1/x for all x in evidence space
      
      // For log-uniform, the posterior is proportional to 1/targetNumber
      // We need to normalize over all numbers ending in evidenceDigits
      let normalizingSum = 0;
      const baseNumber = parseInt(evidenceDigits);
      
      // Sum over all 6-digit prefixes (000000 to 999999) + evidenceDigits
      for (let prefix = 0; prefix < evidenceSpace; prefix++) {
        const fullNumber = prefix * Math.pow(10, evidenceDigits.length) + baseNumber;
        if (fullNumber > 0) {
          normalizingSum += 1 / fullNumber;
        }
      }
      
      return (1 / targetNumber) / normalizingSum;
    }
    
    // For power-law prior (general λ): P(X) ∝ X^(-λ)
    if (priorType === 'power-law') {
      let normalizingSum = 0;
      const baseNumber = parseInt(evidenceDigits);
      
      // Sum over all 6-digit prefixes + evidenceDigits  
      for (let prefix = 0; prefix < evidenceSpace; prefix++) {
        const fullNumber = prefix * Math.pow(10, evidenceDigits.length) + baseNumber;
        if (fullNumber > 0) {
          normalizingSum += Math.pow(fullNumber, -lambda);
        }
      }
      
      return Math.pow(targetNumber, -lambda) / normalizingSum;
    }
    
    return 0;
  }, [priorType, lambda, targetNumber, evidenceSpace, evidenceDigits]);

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
    <div className="p-6 bg-gray-50 rounded-lg space-y-6 max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-center text-gray-800">
        XKCD Countdown Probability Calculator
      </h3>
      

      {/* Prior Selection */}
      <div className="bg-white rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Select Prior Distribution</h4>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { type: 'uniform' as PriorType, label: 'Uniform', description: 'All numbers equally likely' },
            { type: 'log-uniform' as PriorType, label: 'Log-uniform', description: 'P(X) ∝ 1/X' },
            { type: 'power-law' as PriorType, label: 'Power-law', description: 'P(X) ∝ X^(-λ)' }
          ].map(prior => (
            <button
              key={prior.type}
              onClick={() => handlePriorChange(prior.type)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                priorType === prior.type
                  ? 'bg-blue-100 border-blue-300'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="font-semibold">{prior.label}</div>
              <div className="text-sm text-gray-600">{prior.description}</div>
            </button>
          ))}
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
              <strong>λ = 0:</strong> Uniform prior (all numbers equally likely)
            </p>
            <p className={`p-2 rounded mt-1 ${lambda === 1 ? 'bg-yellow-100 border border-yellow-300' : ''}`}>
              <strong>λ = 1:</strong> Log-uniform prior (inverse relationship, like Benford&apos;s law)
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Results</h4>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600 mb-1">Current Prior:</div>
            <div className="font-medium">{getPriorDescription()}</div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Posterior Probability:</div>
            <div className="text-2xl font-bold text-blue-800">
              P(X = {targetNumber.toLocaleString()} | evidence) = {formatProbability(posteriorProbability)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {posteriorProbability < 1e-6 ? 'Very unlikely' : 
               posteriorProbability < 0.001 ? 'Unlikely' :
               posteriorProbability < 0.1 ? 'Possible' : 'Likely'}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            <p><strong>Note:</strong> The uniform prior gives equal probability to all {evidenceSpace.toLocaleString()} numbers ending in {evidenceDigits}.</p>
            <p>Power-law priors bias toward smaller numbers when λ {`>`} 0, larger numbers when λ {`<`} 0.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XKCDCountdownWidget;