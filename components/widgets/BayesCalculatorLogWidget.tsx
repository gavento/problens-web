"use client";

import React, { useState, useMemo } from "react";
import KatexMath from "@/components/content/KatexMath";

type Props = {
  title?: string;
};

const BayesCalculatorLogWidget: React.FC<Props> = ({
  title = "Bayes Calculator (Log Space)"
}) => {
  const [priorLogFair, setPriorLogFair] = useState(1);
  const [priorLogBiased, setPriorLogBiased] = useState(0);
  const [likelihoodLogFair, setLikelihoodLogFair] = useState(-1);
  const [likelihoodLogBiased, setLikelihoodLogBiased] = useState(-2);

  const calculations = useMemo(() => {
    // Posterior log odds = Prior log odds + Likelihood log ratio
    const posteriorLogFair = priorLogFair + likelihoodLogFair;
    const posteriorLogBiased = priorLogBiased + likelihoodLogBiased;
    
    // Convert back to regular odds
    const posteriorFair = Math.pow(2, posteriorLogFair);
    const posteriorBiased = Math.pow(2, posteriorLogBiased);
    
    // Convert to probabilities
    const total = posteriorFair + posteriorBiased;
    const probFair = total > 0 ? (posteriorFair / total) * 100 : 50;
    const probBiased = total > 0 ? (posteriorBiased / total) * 100 : 50;
    
    return {
      posteriorLogFair,
      posteriorLogBiased,
      posteriorFair,
      posteriorBiased,
      probFair,
      probBiased
    };
  }, [priorLogFair, priorLogBiased, likelihoodLogFair, likelihoodLogBiased]);

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-4 max-w-2xl mx-auto">
      {title && (
        <h3 className="text-lg font-semibold text-center text-gray-800">
          {title}
        </h3>
      )}

      <div className="bg-white rounded-lg p-6 space-y-4">
        {/* Prior log odds input */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 w-36">Prior log odds:</span>
          <input
            type="number"
            value={priorLogFair}
            onChange={(e) => setPriorLogFair(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
            step="0.1"
          />
          <span className="text-gray-500">:</span>
          <input
            type="number"
            value={priorLogBiased}
            onChange={(e) => setPriorLogBiased(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
            step="0.1"
          />
          <span className="text-sm text-gray-500">(log₂ of Fair : Biased)</span>
        </div>

        {/* Likelihood log ratio input */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 w-36">Likelihood log ratio:</span>
          <input
            type="number"
            value={likelihoodLogFair}
            onChange={(e) => setLikelihoodLogFair(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
            step="0.01"
          />
          <span className="text-gray-500">:</span>
          <input
            type="number"
            value={likelihoodLogBiased}
            onChange={(e) => setLikelihoodLogBiased(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
            step="0.01"
          />
          <span className="text-sm text-gray-500">(log₂ of Fair : Biased)</span>
        </div>

        {/* Addition symbols */}
        <div className="flex items-center space-x-2">
          <span className="w-36"></span>
          <span className="w-16 text-center text-gray-400">+</span>
          <span className="text-gray-500"></span>
          <span className="w-16 text-center text-gray-400">+</span>
        </div>

        {/* Horizontal line */}
        <div className="border-t border-gray-300 mx-8"></div>

        {/* Posterior log odds result */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 w-36">Posterior log odds:</span>
          <div className="w-16 px-2 py-1 bg-purple-50 border border-purple-200 rounded text-center text-sm font-mono">
            {calculations.posteriorLogFair.toFixed(2)}
          </div>
          <span className="text-gray-500">:</span>
          <div className="w-16 px-2 py-1 bg-purple-50 border border-purple-200 rounded text-center text-sm font-mono">
            {calculations.posteriorLogBiased.toFixed(2)}
          </div>
        </div>

        {/* Posterior odds (converted back) */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 w-36">Posterior odds:</span>
          <div className="w-16 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-center text-sm font-mono">
            {calculations.posteriorFair.toFixed(2)}
          </div>
          <span className="text-gray-500">:</span>
          <div className="w-16 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-center text-sm font-mono">
            {calculations.posteriorBiased.toFixed(2)}
          </div>
          <span className="text-sm text-gray-500 ml-2">
            (<KatexMath math={`2^{${calculations.posteriorLogFair.toFixed(2)}} : 2^{${calculations.posteriorLogBiased.toFixed(2)}}`} />)
          </span>
        </div>

        {/* Probability conversion */}
        <div className="bg-green-50 rounded-lg p-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Posterior probabilities:</span>
            <div className="flex items-center space-x-2">
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

      {/* Instructions */}
      <div className="text-center text-sm text-gray-600">
        In log space, multiplication becomes addition. Notice how much simpler the arithmetic is!
      </div>
    </div>
  );
};

export default BayesCalculatorLogWidget;