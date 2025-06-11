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

      <div className="bg-white rounded-lg p-4 sm:p-6 space-y-4">
        {/* Prior odds input */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700 block">Prior odds:</span>
          <div className="flex items-center justify-center space-x-2">
            <input
              type="number"
              value={priorFair}
              onChange={(e) => setPriorFair(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-2 border border-gray-300 rounded text-center"
              step="0.1"
              min="0"
            />
            <span className="text-gray-500 text-lg">:</span>
            <input
              type="number"
              value={priorBiased}
              onChange={(e) => setPriorBiased(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-2 border border-gray-300 rounded text-center"
              step="0.1"
              min="0"
            />
          </div>
          <div className="text-xs text-gray-500 text-center">(Fair : Biased)</div>
        </div>

        {/* Likelihood input */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700 block">Likelihood of heads:</span>
          <div className="flex items-center justify-center space-x-2">
            <input
              type="number"
              value={likelihoodFair}
              onChange={(e) => setLikelihoodFair(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-2 border border-gray-300 rounded text-center"
              step="0.01"
              min="0"
              max="1"
            />
            <span className="text-gray-500 text-lg">:</span>
            <input
              type="number"
              value={likelihoodBiased}
              onChange={(e) => setLikelihoodBiased(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-2 border border-gray-300 rounded text-center"
              step="0.01"
              min="0"
              max="1"
            />
          </div>
          <div className="text-xs text-gray-500 text-center">(Fair : Biased)</div>
        </div>

        {/* Multiplication symbols */}
        <div className="flex justify-center items-center space-x-8 text-gray-400 text-xl">
          <span>×</span>
        </div>

        {/* Horizontal line */}
        <div className="border-t border-gray-300"></div>

        {/* Posterior results */}
        <div className="mt-4 space-y-3">
          {/* Posterior odds */}
          <div className="flex items-center py-2 px-3 rounded bg-gray-50">
            <span className="text-sm font-medium text-gray-700 w-24">Posterior odds</span>
            <div className="flex-1 flex items-center justify-center space-x-2">
              <span className="font-mono text-sm font-bold">
                {calculations.posteriorFair.toFixed(2)}
              </span>
              <span className="text-gray-500">:</span>
              <span className="font-mono text-sm font-bold">
                {calculations.posteriorBiased.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Posterior probabilities */}
          <div className="flex items-center py-2 px-3 rounded bg-green-50">
            <span className="text-sm font-medium text-gray-700 w-24">Probabilities</span>
            <div className="flex-1 flex items-center justify-center space-x-2">
              <span className="font-mono text-sm font-bold text-blue-600">
                {calculations.probFair.toFixed(1)}%
              </span>
              <span className="text-gray-500">:</span>
              <span className="font-mono text-sm font-bold text-blue-600">
                {calculations.probBiased.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BayesCalculatorWidget;