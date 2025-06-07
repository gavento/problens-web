"use client";

import React, { useState, useMemo } from "react";

type Props = {
  title?: string;
};

const BayesCalculatorWidget: React.FC<Props> = ({
  title = "Bayes Calculator"
}) => {
  const [priorFair, setPriorFair] = useState(2);
  const [priorBiased, setPriorBiased] = useState(1);
  const [likelihoodFair, setLikelihoodFair] = useState(0.5);
  const [likelihoodBiased, setLikelihoodBiased] = useState(0.25);

  const calculations = useMemo(() => {
    // Posterior odds = Prior odds × Likelihood ratio
    const posteriorFair = priorFair * likelihoodFair;
    const posteriorBiased = priorBiased * likelihoodBiased;
    
    // Convert to probabilities
    const total = posteriorFair + posteriorBiased;
    const probFair = total > 0 ? (posteriorFair / total) * 100 : 50;
    const probBiased = total > 0 ? (posteriorBiased / total) * 100 : 50;
    
    return {
      posteriorFair,
      posteriorBiased,
      probFair,
      probBiased
    };
  }, [priorFair, priorBiased, likelihoodFair, likelihoodBiased]);

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-4 max-w-2xl mx-auto">
      {title && (
        <h3 className="text-lg font-semibold text-center text-gray-800">
          {title}
        </h3>
      )}

      <div className="bg-white rounded-lg p-6 space-y-4">
        {/* Prior odds input */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 w-32">Prior odds:</span>
          <input
            type="number"
            value={priorFair}
            onChange={(e) => setPriorFair(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
            step="0.1"
            min="0"
          />
          <span className="text-gray-500">:</span>
          <input
            type="number"
            value={priorBiased}
            onChange={(e) => setPriorBiased(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
            step="0.1"
            min="0"
          />
          <span className="text-sm text-gray-500">(Fair : Biased)</span>
        </div>

        {/* Likelihood input */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 w-32">Likelihood of heads:</span>
          <input
            type="number"
            value={likelihoodFair}
            onChange={(e) => setLikelihoodFair(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
            step="0.01"
            min="0"
            max="1"
          />
          <span className="text-gray-500">:</span>
          <input
            type="number"
            value={likelihoodBiased}
            onChange={(e) => setLikelihoodBiased(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
            step="0.01"
            min="0"
            max="1"
          />
          <span className="text-sm text-gray-500">(Fair : Biased)</span>
        </div>

        {/* Multiplication symbols */}
        <div className="flex items-center space-x-2">
          <span className="w-32"></span>
          <span className="w-16 text-center text-gray-400">×</span>
          <span className="text-gray-500"></span>
          <span className="w-16 text-center text-gray-400">×</span>
        </div>

        {/* Horizontal line */}
        <div className="border-t border-gray-300 mx-8"></div>

        {/* Posterior odds result */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 w-32">Posterior odds:</span>
          <div className="w-16 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-center text-sm font-mono">
            {calculations.posteriorFair.toFixed(2)}
          </div>
          <span className="text-gray-500">:</span>
          <div className="w-16 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-center text-sm font-mono">
            {calculations.posteriorBiased.toFixed(2)}
          </div>
        </div>

        {/* Probability conversion */}
        <div className="bg-green-50 rounded-lg p-4 mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Posterior probabilities:</div>
          <div className="flex justify-center space-x-8 text-lg">
            <div className="text-center">
              <div className="font-bold text-blue-600">{calculations.probFair.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Fair</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-600">{calculations.probBiased.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Biased</div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-gray-600">
        Adjust the prior odds and likelihood values to see how Bayes theorem updates beliefs
      </div>
    </div>
  );
};

export default BayesCalculatorWidget;