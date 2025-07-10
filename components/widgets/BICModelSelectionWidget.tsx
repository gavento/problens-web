'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ModelResult {
  model: number;
  crossEntropy: number;
  bic: number;
  total: number;
  lambdas: number[];
  probabilities: number[];
  converged: boolean;
}

const BICModelSelectionWidget: React.FC = () => {
  // Default data points - discrete distribution on 0-9
  const defaultCounts = [1, 2, 3, 4, 3, 2, 1, 1, 2, 1];
  
  const [counts, setCounts] = useState<number[]>(defaultCounts);
  const [isCreatingData, setIsCreatingData] = useState(false);
  const [modelResults, setModelResults] = useState<ModelResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hoveredModel, setHoveredModel] = useState<number | null>(null);

  // SVG dimensions
  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const barWidth = innerWidth / 10 * 0.7;
  const barSpacing = innerWidth / 10;

  // Calculate normalized distribution
  const distribution = useMemo(() => {
    const totalCount = counts.reduce((sum, c) => sum + c, 0);
    if (totalCount === 0) return new Array(10).fill(0);
    return counts.map(c => c / totalCount);
  }, [counts]);

  // Update counts while dragging
  const updateDistribution = useCallback((index: number, newValue: number) => {
    const clampedValue = Math.max(0, Math.min(1, newValue));
    const newCounts = [...counts];
    
    // Convert probability back to count (scale by total)
    const totalCount = counts.reduce((sum, c) => sum + c, 0);
    const targetTotal = Math.max(totalCount, 20); // Minimum total
    newCounts[index] = Math.round(clampedValue * targetTotal);
    
    setCounts(newCounts);
  }, [counts]);

  // Handle bar dragging
  const handleBarDrag = useCallback((index: number, event: React.MouseEvent<SVGRectElement>) => {
    if (!isCreatingData || modelResults.length > 0) return;
    
    const svg = event.currentTarget.closest('svg')!;
    const svgRect = svg.getBoundingClientRect();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const y = moveEvent.clientY - svgRect.top;
      const relativeY = y - margin.top;
      const probability = Math.max(0, Math.min(1, 1 - (relativeY / innerHeight)));
      
      updateDistribution(index, probability);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isCreatingData, modelResults.length, updateDistribution]);

  // Reset button handler
  const handleReset = () => {
    setCounts(new Array(10).fill(0));
    setIsCreatingData(true);
    setModelResults([]);
    setError('');
    setHoveredModel(null);
  };

  // Simple gradient descent optimization (direct cross-entropy minimization)
  const optimizeModel = (empiricalDist: number[], modelOrder: number): { lambdas: number[], probabilities: number[], converged: boolean } => {
    let lambdas = new Array(modelOrder).fill(0); // Start with all zeros
    const learningRate = 0.1;
    const maxIter = 200;
    
    for (let iter = 0; iter < maxIter; iter++) {
      // Compute model probabilities (unnormalized sum = 10)
      const unnormalizedProbs = new Array(10).fill(0);
      for (let x = 0; x <= 9; x++) {
        let exponent = 0;
        for (let j = 0; j < modelOrder; j++) {
          exponent -= lambdas[j] * Math.pow(x, j + 1);
        }
        unnormalizedProbs[x] = Math.exp(exponent);
      }
      
      // Calculate cross-entropy gradient
      const gradients = new Array(modelOrder).fill(0);
      
      for (let j = 0; j < modelOrder; j++) {
        let gradient = 0;
        for (let x = 0; x <= 9; x++) {
          if (empiricalDist[x] > 0) {
            // Gradient of -log(p_model(x)) w.r.t. lambda_j
            gradient += empiricalDist[x] * Math.pow(x, j + 1);
          }
        }
        gradients[j] = gradient;
      }
      
      // Update lambdas
      const stepSize = learningRate / (1 + iter * 0.01);
      for (let j = 0; j < modelOrder; j++) {
        lambdas[j] += stepSize * gradients[j];
      }
      
      // Check convergence
      const maxGradient = Math.max(...gradients.map(Math.abs));
      if (maxGradient < 0.001) {
        break;
      }
    }
    
    // Final computation of normalized probabilities
    const unnormalizedProbs = new Array(10).fill(0);
    for (let x = 0; x <= 9; x++) {
      let exponent = 0;
      for (let j = 0; j < modelOrder; j++) {
        exponent -= lambdas[j] * Math.pow(x, j + 1);
      }
      unnormalizedProbs[x] = Math.exp(exponent);
    }
    
    const Z = unnormalizedProbs.reduce((sum, p) => sum + p, 0);
    const probabilities = unnormalizedProbs.map(p => p / Z);
    
    return { lambdas, probabilities, converged: true };
  };

  // Calculate cross-entropy
  const calculateCrossEntropy = (empiricalDist: number[], modelProbs: number[]): number => {
    let ce = 0;
    for (let x = 0; x <= 9; x++) {
      if (empiricalDist[x] > 0) {
        ce -= empiricalDist[x] * Math.log(modelProbs[x] + 1e-10);
      }
    }
    return ce;
  };

  // Run model fitting
  const handleRun = async () => {
    const totalCount = counts.reduce((sum, c) => sum + c, 0);
    if (totalCount === 0) {
      setError('Please add some data points first');
      return;
    }
    
    setIsRunning(true);
    setIsCreatingData(false);
    setError('');
    const results: ModelResult[] = [];
    
    try {
      for (let modelOrder = 1; modelOrder <= 10; modelOrder++) {
        // Optimize model
        const { lambdas, probabilities, converged } = optimizeModel(distribution, modelOrder);
        
        // Calculate cross-entropy
        const crossEntropy = calculateCrossEntropy(distribution, probabilities);
        
        // Calculate BIC: k * log(n) / (2n)
        const k = modelOrder;
        const bic = (k * Math.log(totalCount)) / (2 * totalCount);
        
        results.push({
          model: modelOrder,
          crossEntropy,
          bic,
          total: crossEntropy + bic,
          lambdas,
          probabilities,
          converged
        });
        
        // Update UI periodically
        if (modelOrder % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      setModelResults(results);
    } catch (error) {
      console.error('Error fitting models:', error);
      setError('Error fitting models. Please try again.');
    }
    
    setIsRunning(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      <h3 className="text-xl font-semibold mb-4">BIC Model Selection</h3>
      
      {/* Control buttons */}
      <div className="flex gap-4 flex-wrap items-center">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          RESET
        </button>
        <button
          onClick={handleRun}
          disabled={counts.reduce((sum, c) => sum + c, 0) === 0 || isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400"
        >
          {isRunning ? 'Running...' : 'Run'}
        </button>
        {isCreatingData && modelResults.length === 0 && (
          <div className="widget-explanation">
            Drag bars up/down to adjust the distribution
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Empirical distribution visualization */}
      <div className="border rounded p-4">
        <h4 className="text-lg font-semibold mb-3">
          Empirical Distribution 
          {counts.reduce((sum, c) => sum + c, 0) > 0 && ` (${counts.reduce((sum, c) => sum + c, 0)} total points)`}
        </h4>
        <svg width={width} height={height} className="w-full" style={{ maxWidth: `${width}px` }}>
          {/* Grid lines */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map(y => (
            <line
              key={y}
              x1={margin.left}
              y1={margin.top + innerHeight * (1 - y)}
              x2={margin.left + innerWidth}
              y2={margin.top + innerHeight * (1 - y)}
              stroke="#e5e7eb"
              strokeDasharray={y === 0 ? "0" : "2,2"}
            />
          ))}
          
          {/* Bars */}
          {distribution.map((prob, i) => {
            const barHeight = prob * innerHeight;
            const x = margin.left + i * barSpacing + (barSpacing - barWidth) / 2;
            const y = margin.top + innerHeight - barHeight;
            
            // Model probability if hovering
            let modelProb = 0;
            if (hoveredModel !== null && modelResults[hoveredModel]) {
              modelProb = modelResults[hoveredModel].probabilities[i];
            }
            const modelBarHeight = modelProb * innerHeight;
            const modelY = margin.top + innerHeight - modelBarHeight;
            
            return (
              <g key={i}>
                {/* Background area for dragging (full height) */}
                <rect
                  x={x}
                  y={margin.top}
                  width={barWidth}
                  height={innerHeight}
                  fill="transparent"
                  className={isCreatingData && modelResults.length === 0 ? "cursor-ns-resize" : ""}
                  onMouseDown={(e) => handleBarDrag(i, e)}
                />
                
                {/* Empirical bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#8884d8"
                  stroke="#6b63c7"
                  strokeWidth="1"
                  className="pointer-events-none"
                />
                
                {/* Model bar (when hovering) */}
                {hoveredModel !== null && (
                  <rect
                    x={x}
                    y={modelY}
                    width={barWidth}
                    height={modelBarHeight}
                    fill="#ff7300"
                    opacity="0.7"
                    className="pointer-events-none"
                  />
                )}
                
                {/* X-axis label */}
                <text
                  x={x + barWidth / 2}
                  y={margin.top + innerHeight + 20}
                  textAnchor="middle"
                  fontSize="14"
                  fill="#374151"
                >
                  {i}
                </text>
              </g>
            );
          })}
          
          {/* Axes */}
          <line
            x1={margin.left}
            y1={margin.top + innerHeight}
            x2={margin.left + innerWidth}
            y2={margin.top + innerHeight}
            stroke="#374151"
            strokeWidth="2"
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={margin.top + innerHeight}
            stroke="#374151"
            strokeWidth="2"
          />
          
          {/* Y-axis labels */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map(y => (
            <text
              key={y}
              x={margin.left - 10}
              y={margin.top + innerHeight * (1 - y) + 5}
              textAnchor="end"
              fontSize="12"
              fill="#374151"
            >
              {y.toFixed(1)}
            </text>
          ))}
          
          {/* Axis labels */}
          <text
            x={margin.left + innerWidth / 2}
            y={height - 5}
            textAnchor="middle"
            fontSize="14"
            fill="#374151"
            fontWeight="bold"
          >
            Value
          </text>
          <text
            x={15}
            y={margin.top + innerHeight / 2}
            textAnchor="middle"
            fontSize="14"
            fill="#374151"
            fontWeight="bold"
            transform={`rotate(-90, 15, ${margin.top + innerHeight / 2})`}
          >
            Probability
          </text>
          
          {/* Legend if model is shown */}
          {hoveredModel !== null && (
            <g>
              <rect x={margin.left + innerWidth - 120} y={margin.top + 10} width={15} height={15} fill="#8884d8" />
              <text x={margin.left + innerWidth - 100} y={margin.top + 22} fontSize="12" fill="#374151">Empirical</text>
              <rect x={margin.left + innerWidth - 120} y={margin.top + 30} width={15} height={15} fill="#ff7300" opacity="0.7" />
              <text x={margin.left + innerWidth - 100} y={margin.top + 42} fontSize="12" fill="#374151">Model {hoveredModel + 1}</text>
            </g>
          )}
        </svg>
      </div>

      {/* Model dots */}
      {modelResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Models:</span>
            <div className="flex gap-2">
              {modelResults.map((result, idx) => (
                <div
                  key={idx}
                  className="relative group"
                  onMouseEnter={() => setHoveredModel(idx)}
                  onMouseLeave={() => setHoveredModel(null)}
                >
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                      result.total === Math.min(...modelResults.map(r => r.total))
                        ? 'bg-green-500 text-white ring-2 ring-green-300'
                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                    }`}
                    title={`Model ${result.model}: Total = ${result.total.toFixed(4)}`}
                  >
                    {result.model}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BIC Results */}
      {modelResults.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3">Model Comparison</h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={modelResults} margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="model" 
                label={{ value: 'Model Order (number of parameters)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                label={{ value: 'Value', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip formatter={(value: number) => value.toFixed(4)} />
              <Legend />
              <Bar dataKey="crossEntropy" fill="#8884d8" name="Cross-Entropy" />
              <Bar dataKey="bic" fill="#82ca9d" name="BIC Penalty" />
              <Bar dataKey="total" fill="#ff7300" name="Total (CE + BIC)" />
            </BarChart>
          </ResponsiveContainer>
          
          {/* Best model info */}
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded">
            <p className="text-sm">
              Best model (lowest total): Order {modelResults.reduce((best, curr) => 
                curr.total < best.total ? curr : best
              ).model}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              BIC = k × log(n) / (2n), where k = number of parameters, n = number of data points
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BICModelSelectionWidget;