"use client";

import React, { useState, useMemo } from "react";

type Props = {
  title?: string;
};

const PollingErrorCalculator: React.FC<Props> = ({
  title = "Polling Error Calculator"
}) => {
  const [desiredError, setDesiredError] = useState(3.0); // percentage
  const [populationSplit, setPopulationSplit] = useState(50.0); // percentage
  const [confidenceLevel, setConfidenceLevel] = useState(95); // percentage

  // Calculate required sample size using the formula for polling
  const calculations = useMemo(() => {
    // Convert to proportions
    const p = populationSplit / 100;
    const errorMargin = desiredError / 100;
    
    // Z-scores for different confidence levels
    const zScores: { [key: number]: number } = {
      90: 1.645,
      95: 1.96,
      99: 2.576
    };
    
    const z = zScores[confidenceLevel];
    
    // Sample size formula: n = (z² * p * (1-p)) / E²
    // For worst case (p=0.5), this simplifies to n = z² / (4E²)
    const sampleSize = Math.ceil((z * z * p * (1 - p)) / (errorMargin * errorMargin));
    
    // Cost estimates (assuming $2 per response)
    const costPerResponse = 2;
    const totalCost = sampleSize * costPerResponse;
    
    // US voting population comparison (roughly 240 million eligible voters)
    const usVotingPopulation = 240_000_000;
    const percentOfUSVoters = (sampleSize / usVotingPopulation) * 100;
    
    return {
      sampleSize,
      totalCost,
      percentOfUSVoters,
      errorMargin: desiredError,
      worstCaseSampleSize: Math.ceil((z * z) / (4 * errorMargin * errorMargin))
    };
  }, [desiredError, populationSplit, confidenceLevel]);

  // Predefined scenarios
  const scenarios = [
    { name: "Typical Poll", error: 3.0, description: "Standard media poll" },
    { name: "High-Quality Poll", error: 2.0, description: "Premium polling" },
    { name: "Super Precise", error: 1.0, description: "Research grade" },
    { name: "Election Night", error: 0.5, description: "Call the race" },
    { name: "Impossible?", error: 0.1, description: "Ultimate precision" }
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(0)}K`;
    }
    return num.toString();
  };

  const formatCurrency = (num: number): string => {
    if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(1)}M`;
    } else if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(0)}K`;
    }
    return `$${num}`;
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-6 max-w-4xl mx-auto">
      {title && (
        <h3 className="text-xl font-semibold text-center text-gray-800">
          {title}
        </h3>
      )}

      {/* Controls */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Desired Margin of Error: ±{desiredError.toFixed(1)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={desiredError}
            onChange={(e) => setDesiredError(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0.1%</span>
            <span>10%</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Population Split: {populationSplit.toFixed(1)}% / {(100 - populationSplit).toFixed(1)}%
          </label>
          <input
            type="range"
            min="45"
            max="55"
            step="0.5"
            value={populationSplit}
            onChange={(e) => setPopulationSplit(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>45/55</span>
            <span>50/50</span>
            <span>55/45</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Confidence Level
          </label>
          <select
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={90}>90%</option>
            <option value={95}>95%</option>
            <option value={99}>99%</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Required Sample Size</h4>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">
                {formatNumber(calculations.sampleSize)}
              </div>
              <div className="text-sm text-gray-600">people needed</div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated cost:</span>
                <span className="font-semibold">{formatCurrency(calculations.totalCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">% of US voters:</span>
                <span className="font-semibold">
                  {calculations.percentOfUSVoters < 0.001 
                    ? "<0.001%" 
                    : `${calculations.percentOfUSVoters.toFixed(3)}%`}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Reality Check</h4>
            
            {calculations.sampleSize > 1_000_000 && (
              <div className="bg-red-100 border-l-4 border-red-500 p-3 text-sm">
                <p className="font-semibold text-red-800">This is getting impractical!</p>
                <p className="text-red-700">You&apos;d need to poll {calculations.percentOfUSVoters.toFixed(2)}% of all US voters.</p>
              </div>
            )}

            {calculations.sampleSize > 100_000 && calculations.sampleSize <= 1_000_000 && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 text-sm">
                <p className="font-semibold text-yellow-800">Very expensive!</p>
                <p className="text-yellow-700">This would cost {formatCurrency(calculations.totalCost)} - way beyond typical polling budgets.</p>
              </div>
            )}

            {calculations.sampleSize <= 100_000 && (
              <div className="bg-green-100 border-l-4 border-green-500 p-3 text-sm">
                <p className="font-semibold text-green-800">Feasible</p>
                <p className="text-green-700">This is within the realm of possibility for well-funded organizations.</p>
              </div>
            )}

            <div className="text-xs text-gray-600">
              <p><strong>Formula:</strong> n = z² × p × (1-p) / E²</p>
              <p>Where n = sample size, z = confidence multiplier, p = population proportion, E = margin of error</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Scenarios */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-800">Quick Scenarios</h4>
        <div className="grid md:grid-cols-5 gap-2">
          {scenarios.map((scenario) => (
            <button
              key={scenario.name}
              onClick={() => setDesiredError(scenario.error)}
              className={`p-3 rounded-lg border text-sm transition-colors ${
                Math.abs(desiredError - scenario.error) < 0.05
                  ? 'bg-blue-100 border-blue-500 text-blue-800'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="font-semibold">{scenario.name}</div>
              <div className="text-xs text-gray-600">±{scenario.error}%</div>
              <div className="text-xs text-gray-500">{scenario.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PollingErrorCalculator;