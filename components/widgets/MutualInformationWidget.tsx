"use client";

import React, { useState, useMemo, useCallback } from "react";
import KatexMath from "@/components/content/KatexMath";

type Props = {
  title?: string;
  showToggle?: boolean;
};

const MutualInformationWidget: React.FC<Props> = ({
  title = "Mutual Information Explorer",
  showToggle = false
}) => {
  // Joint distribution - 6 values that sum to 1
  const [jointProbs, setJointProbs] = useState<number[]>([0.14, 0.21, 0.35, 0.06, 0.09, 0.15]);
  const [constrainMarginals, setConstrainMarginals] = useState(!showToggle); // If no toggle, always constrained
  
  // Fixed marginals
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
      // Constrained mode - maintain fixed marginals
      const clampedValue = Math.max(0, Math.min(1, newValue));
      const newDist = [...jointProbs];
      
      // Set the new value
      newDist[index] = clampedValue;
      
      // Identify which marginals are affected
      const rowIndex = Math.floor(index / 3); // 0 for sun, 1 for cloud
      const colIndex = index % 3; // 0 for walk, 1 for bike, 2 for bus
      
      // Get target marginals
      const targetWeatherMarginal = rowIndex === 0 ? targetMarginals.sun : targetMarginals.cloud;
      const targetTransportMarginal = colIndex === 0 ? targetMarginals.walk : 
                                     colIndex === 1 ? targetMarginals.bike : targetMarginals.bus;
      
      // Find the other cell in the same column (transport marginal constraint)
      const otherRowIndex = 1 - rowIndex; // If 0 then 1, if 1 then 0
      const otherCellInColumn = otherRowIndex * 3 + colIndex;
      
      // Adjust the other cell in same column to maintain transport marginal
      newDist[otherCellInColumn] = targetTransportMarginal - clampedValue;
      
      // Make sure the other cell is non-negative
      if (newDist[otherCellInColumn] < 0) {
        newDist[otherCellInColumn] = 0;
        newDist[index] = targetTransportMarginal;
      }
      
      // Now adjust the other two cells in the same row to maintain weather marginal
      const rowStart = rowIndex * 3;
      const otherIndicesInRow = [];
      for (let i = 0; i < 3; i++) {
        if (i !== colIndex) {
          otherIndicesInRow.push(rowStart + i);
        }
      }
      
      // Calculate how much probability mass we need for the other two cells in this row
      const remainingForRow = targetWeatherMarginal - newDist[index];
      
      // Distribute proportionally among the other two cells in the row
      const currentSumOtherInRow = otherIndicesInRow.reduce((sum, i) => sum + jointProbs[i], 0);
      
      if (currentSumOtherInRow > 0 && remainingForRow >= 0) {
        otherIndicesInRow.forEach(i => {
          newDist[i] = (jointProbs[i] / currentSumOtherInRow) * remainingForRow;
        });
      } else if (remainingForRow >= 0) {
        // Equal distribution if no prior distribution
        const equalShare = remainingForRow / otherIndicesInRow.length;
        otherIndicesInRow.forEach(i => {
          newDist[i] = equalShare;
        });
      }
      
      // Now adjust the corresponding cells in the other row to maintain transport marginals
      for (let c = 0; c < 3; c++) {
        if (c !== colIndex) {
          const targetTransportMarginalForC = c === 0 ? targetMarginals.walk : 
                                            c === 1 ? targetMarginals.bike : targetMarginals.bus;
          const cellThisRow = rowIndex * 3 + c;
          const cellOtherRow = otherRowIndex * 3 + c;
          newDist[cellOtherRow] = targetTransportMarginalForC - newDist[cellThisRow];
          
          // Ensure non-negative
          if (newDist[cellOtherRow] < 0) {
            newDist[cellOtherRow] = 0;
            newDist[cellThisRow] = targetTransportMarginalForC;
          }
        }
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
    const barMaxHeight = 50; // Maximum bar height
    const baseY = 50 + Math.floor(index / 3) * 65; // Starting Y position for this row
    
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

  const barMaxHeight = 50;
  const barWidth = 35;

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
          <svg width="450" height="220" className="border rounded bg-white">
            {/* Background */}
            <rect width="450" height="220" fill="#f9fafb" stroke="#e5e7eb" />
            
            {/* Column headers (Transport) - just emojis */}
            <text x="135" y="30" textAnchor="middle" fontSize="20" fill="#374151">🚶‍♀️</text>
            <text x="235" y="30" textAnchor="middle" fontSize="20" fill="#374151">🚲</text>
            <text x="335" y="30" textAnchor="middle" fontSize="20" fill="#374151">🚌</text>
            
            {/* Row headers (Weather) - just emojis */}
            <text x="50" y="75" textAnchor="middle" fontSize="20" fill="#374151">☀️</text>
            <text x="50" y="145" textAnchor="middle" fontSize="20" fill="#374151">☁️</text>
            
            {/* Grid lines */}
            <line x1="85" y1="45" x2="385" y2="45" stroke="#d1d5db" strokeWidth="1" />
            <line x1="85" y1="110" x2="385" y2="110" stroke="#d1d5db" strokeWidth="1" />
            <line x1="85" y1="175" x2="385" y2="175" stroke="#d1d5db" strokeWidth="1" />
            <line x1="85" y1="45" x2="85" y2="175" stroke="#d1d5db" strokeWidth="1" />
            <line x1="185" y1="45" x2="185" y2="175" stroke="#d1d5db" strokeWidth="1" />
            <line x1="285" y1="45" x2="285" y2="175" stroke="#d1d5db" strokeWidth="1" />
            <line x1="385" y1="45" x2="385" y2="175" stroke="#d1d5db" strokeWidth="1" />
            
            {/* Probability bars for each cell - now vertical */}
            {tableData.map((row, rowIndex) => 
              row.map((cell, colIndex) => {
                const prob = jointProbs[cell.index];
                const barHeight = prob * barMaxHeight;
                const x = 117.5 + colIndex * 100;
                const baseY = 50 + rowIndex * 65;
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
                      y={baseY + barMaxHeight + 8}
                      textAnchor="middle"
                      fontSize="10"
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
            <text x="395" y="80" fontSize="12" fontWeight="bold" fill="#059669" textAnchor="start">
              {(marginals.sun * 100).toFixed(1)}%
            </text>
            <text x="395" y="145" fontSize="12" fontWeight="bold" fill="#059669" textAnchor="start">
              {(marginals.cloud * 100).toFixed(1)}%
            </text>
            
            {/* Transport marginals (bottom) */}
            <text x="135" y="195" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#059669">
              {(marginals.walk * 100).toFixed(1)}%
            </text>
            <text x="235" y="195" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#059669">
              {(marginals.bike * 100).toFixed(1)}%
            </text>
            <text x="335" y="195" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#059669">
              {(marginals.bus * 100).toFixed(1)}%
            </text>
          </svg>
        </div>
      </div>

      {/* Mutual Information Display */}
      <div className="bg-white rounded-lg p-4">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600 mb-2">
            I(Weather; Transport) = {mutualInformation.toFixed(4)} bits
          </div>
          <div className="text-sm text-gray-600">
            <KatexMath math="I(X;Y) = D((X,Y), X \otimes Y) = \sum_{x,y} P(x,y) \log_2 \frac{P(x,y)}{P(x)P(y)}" />
          </div>
          
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {showToggle && (
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
        )}
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