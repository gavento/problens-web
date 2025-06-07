"use client";

import React, { useState, useMemo, useCallback } from "react";
import KatexMath from "@/components/content/KatexMath";

type Props = {
  title?: string;
};

const MutualInformationWidget: React.FC<Props> = ({
  title = "Mutual Information Explorer"
}) => {
  // Fixed marginal probabilities
  const weatherProbs = { sun: 0.7, cloud: 0.3 };
  const transportProbs = { walk: 0.2, bike: 0.3, bus: 0.5 };
  
  // Initialize joint distribution as independent
  const [jointProbs, setJointProbs] = useState({
    sunWalk: weatherProbs.sun * transportProbs.walk,
    sunBike: weatherProbs.sun * transportProbs.bike,
    sunBus: weatherProbs.sun * transportProbs.bus,
    cloudWalk: weatherProbs.cloud * transportProbs.walk,
    cloudBike: weatherProbs.cloud * transportProbs.bike,
    cloudBus: weatherProbs.cloud * transportProbs.bus,
  });

  // Calculate mutual information
  const mutualInformation = useMemo(() => {
    let mi = 0;
    
    // I(X;Y) = sum p(x,y) log(p(x,y) / (p(x)p(y)))
    const entries = [
      { joint: jointProbs.sunWalk, marginal: weatherProbs.sun * transportProbs.walk },
      { joint: jointProbs.sunBike, marginal: weatherProbs.sun * transportProbs.bike },
      { joint: jointProbs.sunBus, marginal: weatherProbs.sun * transportProbs.bus },
      { joint: jointProbs.cloudWalk, marginal: weatherProbs.cloud * transportProbs.walk },
      { joint: jointProbs.cloudBike, marginal: weatherProbs.cloud * transportProbs.bike },
      { joint: jointProbs.cloudBus, marginal: weatherProbs.cloud * transportProbs.bus },
    ];

    entries.forEach(({ joint, marginal }) => {
      if (joint > 1e-10 && marginal > 1e-10) {
        mi += joint * Math.log(joint / marginal);
      }
    });

    return mi / Math.log(2); // Convert to bits
  }, [jointProbs, weatherProbs, transportProbs]);

  // Update distribution while maintaining fixed marginals
  const updateDistribution = useCallback((
    key: string,
    newValue: number
  ) => {
    const clampedValue = Math.max(0, Math.min(1, newValue));
    
    // Determine which weather and transport category this cell belongs to
    const isSun = key.startsWith('sun');
    const weatherKey = isSun ? 'sun' : 'cloud';
    const transportKey = key.includes('Walk') ? 'walk' : key.includes('Bike') ? 'bike' : 'bus';
    
    // Get the maximum possible value for this cell given marginal constraints
    const weatherMarginal = weatherProbs[weatherKey as keyof typeof weatherProbs];
    const transportMarginal = transportProbs[transportKey as keyof typeof transportProbs];
    const maxPossible = Math.min(weatherMarginal, transportMarginal);
    
    const finalValue = Math.min(clampedValue, maxPossible);
    const oldValue = jointProbs[key as keyof typeof jointProbs];
    const change = finalValue - oldValue;
    
    if (Math.abs(change) < 1e-10) return; // No significant change
    
    // Start with current probabilities
    const newProbs = { ...jointProbs };
    newProbs[key as keyof typeof jointProbs] = finalValue;
    
    // We need to redistribute the change while maintaining fixed marginals
    // Strategy: adjust other cells in the same row and column proportionally
    
    // Find cells in the same weather row (excluding the changed cell)
    const sameWeatherKeys = Object.keys(newProbs).filter(k => 
      k !== key && k.startsWith(isSun ? 'sun' : 'cloud')
    );
    
    // Find cells in the same transport column (excluding the changed cell)
    const sameTransportKeys = Object.keys(newProbs).filter(k => 
      k !== key && (
        (transportKey === 'walk' && k.includes('Walk')) ||
        (transportKey === 'bike' && k.includes('Bike')) ||
        (transportKey === 'bus' && k.includes('Bus'))
      )
    );
    
    // Calculate current sums for validation
    const currentWeatherSum = sameWeatherKeys.reduce((sum, k) => 
      sum + newProbs[k as keyof typeof jointProbs], 0) + finalValue;
    const currentTransportSum = sameTransportKeys.reduce((sum, k) => 
      sum + newProbs[k as keyof typeof jointProbs], 0) + finalValue;
    
    // If we need to reduce other probabilities in the same row/column
    if (change > 0) {
      // Reduce proportionally from same weather row
      const weatherExcess = currentWeatherSum - weatherMarginal;
      if (weatherExcess > 1e-10 && sameWeatherKeys.length > 0) {
        const weatherReduction = weatherExcess / sameWeatherKeys.length;
        sameWeatherKeys.forEach(k => {
          newProbs[k as keyof typeof jointProbs] = Math.max(0, 
            newProbs[k as keyof typeof jointProbs] - weatherReduction);
        });
      }
      
      // Reduce proportionally from same transport column
      const transportExcess = currentTransportSum - transportMarginal;
      if (transportExcess > 1e-10 && sameTransportKeys.length > 0) {
        const transportReduction = transportExcess / sameTransportKeys.length;
        sameTransportKeys.forEach(k => {
          newProbs[k as keyof typeof jointProbs] = Math.max(0, 
            newProbs[k as keyof typeof jointProbs] - transportReduction);
        });
      }
    } else if (change < 0) {
      // Increase proportionally in same weather row
      const weatherDeficit = weatherMarginal - currentWeatherSum;
      if (weatherDeficit > 1e-10 && sameWeatherKeys.length > 0) {
        const weatherIncrease = weatherDeficit / sameWeatherKeys.length;
        sameWeatherKeys.forEach(k => {
          newProbs[k as keyof typeof jointProbs] = Math.min(1, 
            newProbs[k as keyof typeof jointProbs] + weatherIncrease);
        });
      }
      
      // Increase proportionally in same transport column
      const transportDeficit = transportMarginal - currentTransportSum;
      if (transportDeficit > 1e-10 && sameTransportKeys.length > 0) {
        const transportIncrease = transportDeficit / sameTransportKeys.length;
        sameTransportKeys.forEach(k => {
          newProbs[k as keyof typeof jointProbs] = Math.min(1, 
            newProbs[k as keyof typeof jointProbs] + transportIncrease);
        });
      }
    }
    
    // Final normalization to ensure exact marginal constraints
    // This is a simplified projection - adjust all probabilities to satisfy constraints
    const weatherKeys = {
      sun: ['sunWalk', 'sunBike', 'sunBus'],
      cloud: ['cloudWalk', 'cloudBike', 'cloudBus']
    };
    
    const transportKeys = {
      walk: ['sunWalk', 'cloudWalk'],
      bike: ['sunBike', 'cloudBike'],
      bus: ['sunBus', 'cloudBus']
    };
    
    // Adjust weather marginals
    Object.entries(weatherKeys).forEach(([weather, keys]) => {
      const currentSum = keys.reduce((sum, k) => sum + newProbs[k as keyof typeof jointProbs], 0);
      const targetSum = weatherProbs[weather as keyof typeof weatherProbs];
      if (Math.abs(currentSum - targetSum) > 1e-10 && currentSum > 0) {
        const scaleFactor = targetSum / currentSum;
        keys.forEach(k => {
          newProbs[k as keyof typeof jointProbs] *= scaleFactor;
        });
      }
    });
    
    // Adjust transport marginals
    Object.entries(transportKeys).forEach(([transport, keys]) => {
      const currentSum = keys.reduce((sum, k) => sum + newProbs[k as keyof typeof jointProbs], 0);
      const targetSum = transportProbs[transport as keyof typeof transportProbs];
      if (Math.abs(currentSum - targetSum) > 1e-10 && currentSum > 0) {
        const scaleFactor = targetSum / currentSum;
        keys.forEach(k => {
          newProbs[k as keyof typeof jointProbs] *= scaleFactor;
        });
      }
    });
    
    setJointProbs(newProbs);
  }, [jointProbs, weatherProbs, transportProbs]);

  // Handle bar dragging with the same mechanism as DistributionComparisonWidget
  const handleBarDrag = useCallback((
    key: string,
    event: React.MouseEvent<SVGRectElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const svg = event.currentTarget.closest('svg')!;
    const svgRect = svg.getBoundingClientRect();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.clientX - svgRect.left;
      const relativeX = x - 100; // Account for margin
      const barMaxWidth = 200;
      const probability = Math.max(0, Math.min(1, relativeX / barMaxWidth));
      
      updateDistribution(key, probability);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateDistribution]);

  // Reset to default distribution
  const resetToDefault = () => {
    setJointProbs({
      sunWalk: weatherProbs.sun * transportProbs.walk,
      sunBike: weatherProbs.sun * transportProbs.bike,
      sunBus: weatherProbs.sun * transportProbs.bus,
      cloudWalk: weatherProbs.cloud * transportProbs.walk,
      cloudBike: weatherProbs.cloud * transportProbs.bike,
      cloudBus: weatherProbs.cloud * transportProbs.bus,
    });
  };

  const barMaxWidth = 200;
  const maxProb = Math.max(...Object.values(jointProbs), 0.001);

  // Define the 2x3 table structure
  const tableData = [
    [
      { key: 'sunWalk', weather: '☀️', transport: '🚶‍♀️' },
      { key: 'sunBike', weather: '☀️', transport: '🚲' },
      { key: 'sunBus', weather: '☀️', transport: '🚌' }
    ],
    [
      { key: 'cloudWalk', weather: '☁️', transport: '🚶‍♀️' },
      { key: 'cloudBike', weather: '☁️', transport: '🚲' },
      { key: 'cloudBus', weather: '☁️', transport: '🚌' }
    ]
  ];

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-6 max-w-5xl mx-auto">
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
          Marginals are fixed: P(☀️) = 70%, P(☁️) = 30%, P(🚶‍♀️) = 20%, P(🚲) = 30%, P(🚌) = 50%
        </p>
      </div>

      {/* Joint Distribution Table */}
      <div className="bg-white rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">Joint Distribution P(Weather, Transport)</h4>
        
        <div className="flex justify-center">
          <svg width="600" height="300" className="border rounded bg-white">
            {/* Background */}
            <rect width="600" height="300" fill="#f9fafb" stroke="#e5e7eb" />
            
            {/* Column headers (Transport) */}
            <text x="200" y="30" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#374151">🚶‍♀️ Walk</text>
            <text x="350" y="30" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#374151">🚲 Bike</text>
            <text x="500" y="30" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#374151">🚌 Bus</text>
            
            {/* Row headers (Weather) */}
            <text x="80" y="100" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#374151">☀️ Sun</text>
            <text x="80" y="200" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#374151">☁️ Cloud</text>
            
            {/* Grid lines */}
            <line x1="100" y1="50" x2="550" y2="50" stroke="#d1d5db" strokeWidth="1" />
            <line x1="100" y1="150" x2="550" y2="150" stroke="#d1d5db" strokeWidth="1" />
            <line x1="100" y1="250" x2="550" y2="250" stroke="#d1d5db" strokeWidth="1" />
            <line x1="100" y1="50" x2="100" y2="250" stroke="#d1d5db" strokeWidth="1" />
            <line x1="250" y1="50" x2="250" y2="250" stroke="#d1d5db" strokeWidth="1" />
            <line x1="400" y1="50" x2="400" y2="250" stroke="#d1d5db" strokeWidth="1" />
            <line x1="550" y1="50" x2="550" y2="250" stroke="#d1d5db" strokeWidth="1" />
            
            {/* Probability bars for each cell */}
            {tableData.map((row, rowIndex) => 
              row.map((cell, colIndex) => {
                const prob = jointProbs[cell.key as keyof typeof jointProbs];
                const barWidth = (prob / maxProb) * 140; // Max width of 140px
                const x = 105 + colIndex * 150;
                const y = 70 + rowIndex * 100;
                
                return (
                  <g key={cell.key}>
                    {/* Probability bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={30}
                      fill="#3b82f6"
                      stroke="#2563eb"
                      strokeWidth="1"
                      className="cursor-grab hover:fill-blue-500"
                      onMouseDown={(e) => handleBarDrag(cell.key, e)}
                    />
                    
                    {/* Probability text inside bar (if bar is wide enough) */}
                    {barWidth > 50 && (
                      <text
                        x={x + barWidth / 2}
                        y={y + 20}
                        textAnchor="middle"
                        fontSize="12"
                        fill="white"
                        fontWeight="bold"
                      >
                        {(prob * 100).toFixed(1)}%
                      </text>
                    )}
                    
                    {/* Probability text outside bar (if bar is too narrow) */}
                    {barWidth <= 50 && (
                      <text
                        x={x + barWidth + 5}
                        y={y + 20}
                        fontSize="12"
                        fill="#374151"
                        fontWeight="bold"
                      >
                        {(prob * 100).toFixed(1)}%
                      </text>
                    )}
                  </g>
                );
              })
            )}
            
            {/* Marginal probabilities */}
            {/* Weather marginals (right side) */}
            <text x="570" y="100" fontSize="14" fontWeight="bold" fill="#059669">
              {(weatherProbs.sun * 100).toFixed(0)}%
            </text>
            <text x="570" y="200" fontSize="14" fontWeight="bold" fill="#059669">
              {(weatherProbs.cloud * 100).toFixed(0)}%
            </text>
            
            {/* Transport marginals (bottom) */}
            <text x="175" y="270" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#059669">
              {(transportProbs.walk * 100).toFixed(0)}%
            </text>
            <text x="325" y="270" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#059669">
              {(transportProbs.bike * 100).toFixed(0)}%
            </text>
            <text x="475" y="270" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#059669">
              {(transportProbs.bus * 100).toFixed(0)}%
            </text>
            
            {/* Labels for marginals */}
            <text x="570" y="40" fontSize="12" fill="#6b7280" textAnchor="middle">P(Weather)</text>
            <text x="325" y="290" fontSize="12" fill="#6b7280" textAnchor="middle">P(Transport)</text>
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
      <div className="flex justify-center">
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