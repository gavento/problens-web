"use client";

import React, { useState, useMemo, useCallback } from "react";
import KatexMath from "@/components/content/KatexMath";

type Props = {
  title?: string;
};

const MutualInformationWidget: React.FC<Props> = ({
  title = "Mutual Information Explorer"
}) => {
  // Joint distribution - 6 values that sum to 1
  const [jointProbs, setJointProbs] = useState<number[]>([0.14, 0.21, 0.35, 0.06, 0.09, 0.15]);
  const [constrainMarginals, setConstrainMarginals] = useState(false);
  
  // Target marginals when constrained
  const targetMarginals = useMemo(() => ({
    sun: 0.7, cloud: 0.3, walk: 0.2, bike: 0.3, bus: 0.5
  }), []);

  // Calculate marginal probabilities
  const marginals = useMemo(() => {
    // Weather marginals: P(sun) = sum of first 3, P(cloud) = sum of last 3
    const sun = jointProbs[0] + jointProbs[1] + jointProbs[2];
    const cloud = jointProbs[3] + jointProbs[4] + jointProbs[5];
    
    // Transport marginals: P(walk) = jointProbs[0] + jointProbs[3], etc.
    const walk = jointProbs[0] + jointProbs[3];
    const bike = jointProbs[1] + jointProbs[4];
    const bus = jointProbs[2] + jointProbs[5];
    
    return { sun, cloud, walk, bike, bus };
  }, [jointProbs]);

  // Calculate mutual information
  const mutualInformation = useMemo(() => {
    let mi = 0;
    
    // I(X;Y) = sum p(x,y) log(p(x,y) / (p(x)p(y)))
    const entries = [
      { joint: jointProbs[0], marginal: marginals.sun * marginals.walk },  // sun, walk
      { joint: jointProbs[1], marginal: marginals.sun * marginals.bike },  // sun, bike
      { joint: jointProbs[2], marginal: marginals.sun * marginals.bus },   // sun, bus
      { joint: jointProbs[3], marginal: marginals.cloud * marginals.walk }, // cloud, walk
      { joint: jointProbs[4], marginal: marginals.cloud * marginals.bike }, // cloud, bike
      { joint: jointProbs[5], marginal: marginals.cloud * marginals.bus },  // cloud, bus
    ];

    entries.forEach(({ joint, marginal }) => {
      if (joint > 1e-10 && marginal > 1e-10) {
        mi += joint * Math.log(joint / marginal);
      }
    });

    return mi / Math.log(2); // Convert to bits
  }, [jointProbs, marginals]);

  // Update distribution - either constrained or unconstrained
  const updateDistribution = useCallback((
    index: number,
    newValue: number
  ) => {
    if (constrainMarginals) {
      // Constrained mode - try to maintain target marginals
      const clampedValue = Math.max(0, Math.min(1, newValue));
      const newDist = [...jointProbs];
      
      // First set the new value
      newDist[index] = clampedValue;
      
      // Identify which marginals are affected
      const rowIndex = Math.floor(index / 3); // 0 for sun, 1 for cloud
      const colIndex = index % 3; // 0 for walk, 1 for bike, 2 for bus
      
      // Adjust row to maintain weather marginal
      const rowIndices = rowIndex === 0 ? [0, 1, 2] : [3, 4, 5];
      const targetRowSum = rowIndex === 0 ? targetMarginals.sun : targetMarginals.cloud;
      const currentRowSum = rowIndices.reduce((sum, i) => sum + newDist[i], 0);
      
      if (currentRowSum > 0 && Math.abs(currentRowSum - targetRowSum) > 1e-10) {
        const scale = targetRowSum / currentRowSum;
        rowIndices.forEach(i => {
          newDist[i] *= scale;
        });
      }
      
      // Adjust column to maintain transport marginal
      const colIndices = [colIndex, colIndex + 3];
      const targetColSum = colIndex === 0 ? targetMarginals.walk : 
                          colIndex === 1 ? targetMarginals.bike : targetMarginals.bus;
      const currentColSum = colIndices.reduce((sum, i) => sum + newDist[i], 0);
      
      if (currentColSum > 0 && Math.abs(currentColSum - targetColSum) > 1e-10) {
        const scale = targetColSum / currentColSum;
        colIndices.forEach(i => {
          newDist[i] *= scale;
        });
      }
      
      // Normalize to ensure sum = 1
      const totalSum = newDist.reduce((sum, p) => sum + p, 0);
      if (totalSum > 0) {
        newDist.forEach((_, i) => {
          newDist[i] /= totalSum;
        });
      }
      
      setJointProbs(newDist);
    } else {
      // Unconstrained mode - just maintain sum = 1
      const clampedValue = Math.max(0, Math.min(1, newValue));
      const newDist = [...jointProbs];
      
      // Calculate remaining mass to distribute
      const remainingMass = 1 - clampedValue;
      const currentRemainingMass = jointProbs.reduce((sum, p, i) => i === index ? sum : sum + p, 0);
      
      if (currentRemainingMass > 0) {
        const scaleFactor = remainingMass / currentRemainingMass;
        
        // Update all other probabilities proportionally
        for (let i = 0; i < newDist.length; i++) {
          if (i === index) {
            newDist[i] = clampedValue;
          } else {
            newDist[i] = jointProbs[i] * scaleFactor;
          }
        }
      } else {
        // Edge case: if all other probabilities are 0
        newDist[index] = clampedValue;
        const remaining = (1 - clampedValue) / (newDist.length - 1);
        for (let i = 0; i < newDist.length; i++) {
          if (i !== index) {
            newDist[i] = remaining;
          }
        }
      }
      
      setJointProbs(newDist);
    }
  }, [jointProbs, constrainMarginals, targetMarginals]);

  // Handle bar dragging - vertical dragging like DistributionComparisonWidget
  const handleBarDrag = useCallback((
    index: number,
    event: React.MouseEvent<SVGRectElement>
  ) => {
    const svg = event.currentTarget.closest('svg')!;
    const svgRect = svg.getBoundingClientRect();
    const barMaxHeight = 60; // Maximum bar height
    const baseY = 60 + Math.floor(index / 3) * 80; // Starting Y position for this row
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const y = moveEvent.clientY - svgRect.top;
      const relativeY = y - baseY;
      const probability = Math.max(0, Math.min(1, 1 - (relativeY / barMaxHeight)));
      
      updateDistribution(index, probability);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateDistribution]);

  // Reset to default distribution (independent)
  const resetToDefault = useCallback(() => {
    // Independent distribution: 70% sun, 30% cloud; 20% walk, 30% bike, 50% bus
    setJointProbs([0.14, 0.21, 0.35, 0.06, 0.09, 0.15]);
  }, []);

  const barMaxHeight = 60;
  const barWidth = 40;

  // Define the 2x3 table structure with indices
  const tableData = [
    [
      { index: 0, weather: '☀️', transport: '🚶‍♀️', label: 'Sun, Walk' },
      { index: 1, weather: '☀️', transport: '🚲', label: 'Sun, Bike' },
      { index: 2, weather: '☀️', transport: '🚌', label: 'Sun, Bus' }
    ],
    [
      { index: 3, weather: '☁️', transport: '🚶‍♀️', label: 'Cloud, Walk' },
      { index: 4, weather: '☁️', transport: '🚲', label: 'Cloud, Bike' },
      { index: 5, weather: '☁️', transport: '🚌', label: 'Cloud, Bus' }
    ]
  ];

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-6 max-w-3xl mx-auto">
      {title && (
        <h3 className="text-xl font-semibold text-center text-gray-800">
          {title}
        </h3>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-700">
          Drag the bars to adjust the joint distribution P(Weather, Transport)
        </p>
        <p className="text-xs text-blue-600 mt-1">
          {constrainMarginals 
            ? "Fixed marginals: P(☀️) = 70%, P(☁️) = 30%, P(🚶‍♀️) = 20%, P(🚲) = 30%, P(🚌) = 50%"
            : "All 6 probabilities must sum to 1. Other bars adjust automatically."}
        </p>
      </div>

      {/* Joint Distribution Table */}
      <div className="bg-white rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">Joint Distribution P(Weather, Transport)</h4>
        
        <div className="flex justify-center overflow-x-auto">
          <svg width="450" height="250" className="border rounded bg-white">
            {/* Background */}
            <rect width="450" height="250" fill="#f9fafb" stroke="#e5e7eb" />
            
            {/* Column headers (Transport) - just emojis */}
            <text x="175" y="35" textAnchor="middle" fontSize="24" fill="#374151">🚶‍♀️</text>
            <text x="300" y="35" textAnchor="middle" fontSize="24" fill="#374151">🚲</text>
            <text x="425" y="35" textAnchor="middle" fontSize="24" fill="#374151">🚌</text>
            
            {/* Row headers (Weather) - just emojis */}
            <text x="60" y="85" textAnchor="middle" fontSize="24" fill="#374151">☀️</text>
            <text x="60" y="165" textAnchor="middle" fontSize="24" fill="#374151">☁️</text>
            
            {/* Grid lines */}
            <line x1="90" y1="50" x2="450" y2="50" stroke="#d1d5db" strokeWidth="1" />
            <line x1="90" y1="130" x2="450" y2="130" stroke="#d1d5db" strokeWidth="1" />
            <line x1="90" y1="210" x2="450" y2="210" stroke="#d1d5db" strokeWidth="1" />
            <line x1="90" y1="50" x2="90" y2="210" stroke="#d1d5db" strokeWidth="1" />
            <line x1="225" y1="50" x2="225" y2="210" stroke="#d1d5db" strokeWidth="1" />
            <line x1="350" y1="50" x2="350" y2="210" stroke="#d1d5db" strokeWidth="1" />
            <line x1="450" y1="50" x2="450" y2="210" stroke="#d1d5db" strokeWidth="1" />
            
            {/* Probability bars for each cell - now vertical */}
            {tableData.map((row, rowIndex) => 
              row.map((cell, colIndex) => {
                const prob = jointProbs[cell.index];
                const barHeight = prob * barMaxHeight;
                const x = 115 + colIndex * 125;
                const baseY = 60 + rowIndex * 80;
                const y = baseY + barMaxHeight - barHeight; // Bar grows upward
                
                return (
                  <g key={cell.index}>
                    {/* Background area for dragging */}
                    <rect
                      x={x}
                      y={baseY}
                      width={barWidth}
                      height={barMaxHeight}
                      fill="transparent"
                      className="cursor-ns-resize"
                      onMouseDown={(e) => handleBarDrag(cell.index, e)}
                    />
                    
                    {/* Probability bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill="#3b82f6"
                      stroke="#2563eb"
                      strokeWidth="1"
                      className="pointer-events-none"
                    />
                    
                    {/* Probability text below bar */}
                    <text
                      x={x + barWidth / 2}
                      y={baseY + barMaxHeight + 10}
                      textAnchor="middle"
                      fontSize="12"
                      fill="#374151"
                      fontWeight="bold"
                    >
                      {(prob * 100).toFixed(1)}%
                    </text>
                  </g>
                );
              })
            )}
            
            {/* Marginal probabilities (calculated dynamically) */}
            {/* Weather marginals (right side) */}
            <text x="445" y="90" fontSize="13" fontWeight="bold" fill="#059669" textAnchor="end">
              {(marginals.sun * 100).toFixed(1)}%
            </text>
            <text x="445" y="170" fontSize="13" fontWeight="bold" fill="#059669" textAnchor="end">
              {(marginals.cloud * 100).toFixed(1)}%
            </text>
            
            {/* Transport marginals (bottom) */}
            <text x="155" y="230" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#059669">
              {(marginals.walk * 100).toFixed(1)}%
            </text>
            <text x="280" y="230" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#059669">
              {(marginals.bike * 100).toFixed(1)}%
            </text>
            <text x="405" y="230" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#059669">
              {(marginals.bus * 100).toFixed(1)}%
            </text>
          </svg>
        </div>
      </div>

      {/* Mutual Information Display */}
      <div className="bg-white rounded-lg p-6">
        <div className="text-center">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Mutual Information</h4>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            I(Weather; Transport) = {mutualInformation.toFixed(4)} bits
          </div>
          <div className="text-sm text-gray-600">
            <KatexMath math="I(X;Y) = \sum_{x,y} P(x,y) \log_2 \frac{P(x,y)}{P(x)P(y)}" />
          </div>
          
          {/* Independence indicator */}
          <div className="mt-4">
            {Math.abs(mutualInformation) < 0.001 ? (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Variables are independent
              </div>
            ) : (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                ⚡ Variables are dependent
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setConstrainMarginals(!constrainMarginals)}
          className={`px-6 py-2 rounded-lg transition-colors ${
            constrainMarginals 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {constrainMarginals ? 'Fixed Marginals' : 'Free Marginals'}
        </button>
        <button
          onClick={resetToDefault}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
};

export default MutualInformationWidget;