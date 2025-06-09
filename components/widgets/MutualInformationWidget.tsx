"use client";

import React, { useState, useMemo, useCallback } from "react";

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

  // Calculate marginal probabilities
  const marginals = useMemo(() => {
    const sun = jointProbs[0] + jointProbs[1] + jointProbs[2];
    const cloud = jointProbs[3] + jointProbs[4] + jointProbs[5];
    const walk = jointProbs[0] + jointProbs[3];
    const bike = jointProbs[1] + jointProbs[4];
    const bus = jointProbs[2] + jointProbs[5];
    
    return { sun, cloud, walk, bike, bus };
  }, [jointProbs]);

  // Calculate mutual information
  const mutualInformation = useMemo(() => {
    let mi = 0;
    
    const entries = [
      { joint: jointProbs[0], marginal: marginals.sun * marginals.walk },
      { joint: jointProbs[1], marginal: marginals.sun * marginals.bike },
      { joint: jointProbs[2], marginal: marginals.sun * marginals.bus },
      { joint: jointProbs[3], marginal: marginals.cloud * marginals.walk },
      { joint: jointProbs[4], marginal: marginals.cloud * marginals.bike },
      { joint: jointProbs[5], marginal: marginals.cloud * marginals.bus },
    ];

    entries.forEach(({ joint, marginal }) => {
      if (joint > 1e-10 && marginal > 1e-10) {
        mi += joint * Math.log(joint / marginal);
      }
    });

    return mi / Math.log(2); // Convert to bits
  }, [jointProbs, marginals]);

  // Update distribution function - SIMPLE: only maintain sum = 1
  const updateDistribution = useCallback((
    index: number,
    newValue: number
  ) => {
    const clampedValue = Math.max(0, Math.min(1, newValue));
    const newDist = [...jointProbs];
    
    // Simple constraint: Just maintain sum = 1
    const remainingMass = 1 - clampedValue;
    const currentRemainingMass = jointProbs.reduce((sum, p, i) => i === index ? sum : sum + p, 0);
    
    if (currentRemainingMass > 0) {
      const scaleFactor = remainingMass / currentRemainingMass;
      for (let i = 0; i < newDist.length; i++) {
        if (i === index) {
          newDist[i] = clampedValue;
        } else {
          newDist[i] = jointProbs[i] * scaleFactor;
        }
      }
    } else {
      newDist[index] = clampedValue;
      const remaining = (1 - clampedValue) / (newDist.length - 1);
      for (let i = 0; i < newDist.length; i++) {
        if (i !== index) {
          newDist[i] = remaining;
        }
      }
    }
    
    // Validate and set
    const isValid = newDist.every(val => isFinite(val) && val >= 0 && val <= 1);
    if (isValid) {
      setJointProbs(newDist);
    }
  }, [jointProbs]);

  // Handle bar dragging
  const handleBarDrag = useCallback((
    index: number,
    event: React.MouseEvent<SVGRectElement>
  ) => {
    const svg = event.currentTarget.closest('svg')!;
    const svgRect = svg.getBoundingClientRect();
    const baseY = 50 + Math.floor(index / 3) * 95;  // Increased spacing for taller bars
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const y = moveEvent.clientY - svgRect.top;
      const relativeY = y - baseY;
      const probability = Math.max(0, Math.min(1, 1 - (relativeY / 80)));  // 80 = barMaxHeight
      
      updateDistribution(index, probability);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateDistribution]);

  // Reset to default distribution
  const resetToDefault = useCallback(() => {
    setJointProbs([0.14, 0.21, 0.35, 0.06, 0.09, 0.15]);
  }, []);

  const barMaxHeight = 80;  // Increased height for easier grabbing
  const barWidth = 35;

  // Define the 2x3 table structure
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
          Drag bars to adjust probabilities
        </p>
        <p className="text-xs text-blue-600 mt-1">
          All 6 probabilities must sum to 1. Other bars adjust automatically.
        </p>
      </div>

      {/* Joint Distribution Table */}
      <div className="bg-white rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">Joint Distribution P(Weather, Transport)</h4>
        
        <div className="flex justify-center overflow-x-auto">
          <svg width="450" height="280" className="border rounded bg-white">
            {/* Background */}
            <rect width="450" height="280" fill="#f9fafb" stroke="#e5e7eb" />
            
            {/* Column headers (Transport) */}
            <text x="135" y="30" textAnchor="middle" fontSize="28" fill="#374151">🚶‍♀️</text>
            <text x="235" y="30" textAnchor="middle" fontSize="28" fill="#374151">🚲</text>
            <text x="335" y="30" textAnchor="middle" fontSize="28" fill="#374151">🚌</text>
            
            {/* Row headers (Weather) */}
            <text x="50" y="90" textAnchor="middle" fontSize="28" fill="#374151">☀️</text>
            <text x="50" y="185" textAnchor="middle" fontSize="28" fill="#374151">☁️</text>
            
            {/* Grid lines */}
            <line x1="85" y1="45" x2="385" y2="45" stroke="#d1d5db" strokeWidth="1" />
            <line x1="85" y1="140" x2="385" y2="140" stroke="#d1d5db" strokeWidth="1" />
            <line x1="85" y1="235" x2="385" y2="235" stroke="#d1d5db" strokeWidth="1" />
            <line x1="85" y1="45" x2="85" y2="235" stroke="#d1d5db" strokeWidth="1" />
            <line x1="185" y1="45" x2="185" y2="235" stroke="#d1d5db" strokeWidth="1" />
            <line x1="285" y1="45" x2="285" y2="235" stroke="#d1d5db" strokeWidth="1" />
            <line x1="385" y1="45" x2="385" y2="235" stroke="#d1d5db" strokeWidth="1" />
            
            {/* Probability bars */}
            {tableData.map((row, rowIndex) => 
              row.map((cell, colIndex) => {
                const prob = jointProbs[cell.index];
                const barHeight = prob * barMaxHeight;
                const x = 117.5 + colIndex * 100;
                const baseY = 50 + rowIndex * 95;  // Increased spacing for taller bars
                const y = baseY + barMaxHeight - barHeight;
                
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
            
            {/* Marginal probabilities */}
            {/* Weather marginals (right side) */}
            <text x="395" y="100" fontSize="12" fontWeight="bold" fill="#059669" textAnchor="start">
              {(marginals.sun * 100).toFixed(1)}%
            </text>
            <text x="395" y="195" fontSize="12" fontWeight="bold" fill="#059669" textAnchor="start">
              {(marginals.cloud * 100).toFixed(1)}%
            </text>
            
            {/* Transport marginals (bottom) */}
            <text x="135" y="255" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#059669">
              {(marginals.walk * 100).toFixed(1)}%
            </text>
            <text x="235" y="255" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#059669">
              {(marginals.bike * 100).toFixed(1)}%
            </text>
            <text x="335" y="255" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#059669">
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
            I(X;Y) = Σ P(x,y) log₂ [P(x,y) / (P(x)P(y))]
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
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