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
    <div className="p-4 sm:p-6 bg-gray-50 rounded-lg space-y-4 max-w-3xl mx-auto">
      {title && (
        <h3 className="text-lg font-semibold text-center text-gray-800">
          {title}
        </h3>
      )}

      <div className="bg-white rounded-lg p-4 sm:p-6 space-y-4">
        {/* Prior odds input */}
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 w-32 text-right">Prior odds:</span>
          <div className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded bg-blue-50 ml-4">
            <span className="text-xs text-gray-500 w-12 text-right">Fair</span>
            <input
              type="number"
              value={priorFair}
              onChange={(e) => setPriorFair(parseFloat(e.target.value) || 0)}
              className="font-mono text-sm font-bold w-20 text-center border border-gray-300 rounded px-2 py-1"
              step="0.1"
              min="0"
            />
            <span className="text-gray-500 text-lg">:</span>
            <input
              type="number"
              value={priorBiased}
              onChange={(e) => setPriorBiased(parseFloat(e.target.value) || 0)}
              className="font-mono text-sm font-bold w-20 text-center border border-gray-300 rounded px-2 py-1"
              step="0.1"
              min="0"
            />
            <span className="text-xs text-gray-500 w-12">Biased</span>
          </div>
        </div>

        {/* Likelihood input */}
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 w-32 text-right">Likelihood of heads:</span>
          <div className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded bg-orange-50 ml-4">
            <span className="text-xs text-gray-500 w-12 text-right">Fair</span>
            <input
              type="number"
              value={likelihoodFair}
              onChange={(e) => setLikelihoodFair(parseFloat(e.target.value) || 0)}
              className="font-mono text-sm font-bold w-20 text-center border border-gray-300 rounded px-2 py-1"
              step="0.01"
              min="0"
              max="1"
            />
            <div className="w-8 flex justify-center relative">
              <span className="text-gray-500 text-lg">:</span>
              {/* Overlapping operator positioned perfectly between boxes */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-7 z-10">
                <div className="bg-white border-2 border-gray-300 rounded-full w-8 h-8 flex items-center justify-center shadow-sm">
                  <span className="text-blue-600 text-lg font-bold">×</span>
                </div>
              </div>
            </div>
            <input
              type="number"
              value={likelihoodBiased}
              onChange={(e) => setLikelihoodBiased(parseFloat(e.target.value) || 0)}
              className="font-mono text-sm font-bold w-20 text-center border border-gray-300 rounded px-2 py-1"
              step="0.01"
              min="0"
              max="1"
            />
            <span className="text-xs text-gray-500 w-12">Biased</span>
          </div>
        </div>

        {/* Horizontal line */}
        <div className="border-t border-gray-300 ml-32"></div>

        {/* Posterior results */}
        <div className="mt-4 space-y-3">
          {/* Posterior odds */}
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 w-32 text-right">Posterior odds:</span>
            <div className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded bg-gray-50 ml-4">
              <span className="text-xs text-gray-500 w-12 text-right"></span>
              <span className="font-mono text-sm font-bold w-20 text-center">
                {calculations.posteriorFair.toFixed(2)}
              </span>
              <span className="text-gray-500 text-lg">:</span>
              <span className="font-mono text-sm font-bold w-20 text-center">
                {calculations.posteriorBiased.toFixed(2)}
              </span>
              <span className="text-xs text-gray-500 w-12"></span>
            </div>
          </div>

          {/* Posterior probabilities */}
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 w-32 text-right">Probabilities:</span>
            <div className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded bg-green-50 ml-4">
              <span className="text-xs text-gray-500 w-12 text-right"></span>
              <span className="font-mono text-sm font-bold text-blue-600 w-20 text-center">
                {calculations.probFair.toFixed(1)}%
              </span>
              <span className="text-gray-500 text-lg">:</span>
              <span className="font-mono text-sm font-bold text-blue-600 w-20 text-center">
                {calculations.probBiased.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 w-12"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BayesCalculatorWidget;