"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import KatexMath from "@/components/content/KatexMath";

type Props = {
  title?: string;
};

const MutualInformationWidget: React.FC<Props> = ({
  title = "Mutual Information Explorer"
}) => {
  // Marginal probabilities (fixed from the text)
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

  const [isDragging, setIsDragging] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      if (joint > 0 && marginal > 0) {
        mi += joint * Math.log(joint / marginal);
      }
    });

    return mi / Math.log(2); // Convert to bits
  }, [jointProbs]);

  // Normalize probabilities to ensure they sum to 1
  const normalizeProbs = () => {
    const sum = Object.values(jointProbs).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1) > 0.001) {
      const normalized = {} as typeof jointProbs;
      Object.entries(jointProbs).forEach(([key, value]) => {
        normalized[key as keyof typeof jointProbs] = value / sum;
      });
      setJointProbs(normalized);
    }
  };

  // Reset to independent distribution
  const resetToIndependent = () => {
    setJointProbs({
      sunWalk: weatherProbs.sun * transportProbs.walk,
      sunBike: weatherProbs.sun * transportProbs.bike,
      sunBus: weatherProbs.sun * transportProbs.bus,
      cloudWalk: weatherProbs.cloud * transportProbs.walk,
      cloudBike: weatherProbs.cloud * transportProbs.bike,
      cloudBus: weatherProbs.cloud * transportProbs.bus,
    });
  };

  // Handle dragging
  const handleMouseDown = (key: string) => {
    setIsDragging(key);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    // Calculate new probability based on mouse position
    const newProb = Math.max(0, Math.min(1, 1 - y / height));
    
    setJointProbs(prev => ({
      ...prev,
      [isDragging]: newProb * 0.7, // Scale down to leave room for normalization
    }));
  };

  const handleMouseUp = () => {
    if (isDragging) {
      normalizeProbs();
      setIsDragging(null);
    }
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMouseMove(e as any);
      };
      const handleGlobalMouseUp = () => {
        handleMouseUp();
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  const barData = [
    { key: 'sunWalk', weather: '☀️', transport: '🚶‍♀️', label: 'Sun + Walk' },
    { key: 'sunBike', weather: '☀️', transport: '🚲', label: 'Sun + Bike' },
    { key: 'sunBus', weather: '☀️', transport: '🚌', label: 'Sun + Bus' },
    { key: 'cloudWalk', weather: '☁️', transport: '🚶‍♀️', label: 'Cloud + Walk' },
    { key: 'cloudBike', weather: '☁️', transport: '🚲', label: 'Cloud + Bike' },
    { key: 'cloudBus', weather: '☁️', transport: '🚌', label: 'Cloud + Bus' },
  ];

  const maxProb = Math.max(...Object.values(jointProbs));
  const barMaxHeight = 200;

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-6 max-w-4xl mx-auto">
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
          Marginals are fixed: P(☀️) = 70%, P(🚶‍♀️) = 20%, P(🚲) = 30%, P(🚌) = 50%
        </p>
      </div>

      {/* Joint Distribution Visualization */}
      <div className="bg-white rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Joint Distribution</h4>
        
        <div 
          ref={containerRef}
          className="relative"
          style={{ height: `${barMaxHeight + 100}px` }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div className="flex justify-around items-end" style={{ height: `${barMaxHeight + 50}px` }}>
            {barData.map((bar) => {
              const prob = jointProbs[bar.key as keyof typeof jointProbs];
              const height = (prob / maxProb) * barMaxHeight;
              const isActive = isDragging === bar.key;

              return (
                <div key={bar.key} className="flex flex-col items-center">
                  <div
                    className="relative cursor-grab active:cursor-grabbing"
                    style={{ height: `${barMaxHeight}px` }}
                    onMouseDown={() => handleMouseDown(bar.key)}
                  >
                    <div
                      className={`absolute bottom-0 w-16 rounded-t transition-all ${
                        isActive ? 'bg-blue-500' : 'bg-blue-400 hover:bg-blue-500'
                      }`}
                      style={{ 
                        height: `${height}px`,
                        transition: isDragging ? 'none' : 'height 0.2s ease'
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-mono">
                        {(prob * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-2xl">
                    {bar.weather}{bar.transport}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid lines */}
          {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map(val => (
            <div
              key={val}
              className="absolute left-0 right-0 border-t border-gray-200"
              style={{ 
                bottom: `${50 + (val / maxProb) * barMaxHeight}px`
              }}
            >
              <span className="absolute -left-10 -top-2 text-xs text-gray-500">
                {(val * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={resetToIndependent}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Reset to Independent
          </button>
        </div>
      </div>

      {/* Mutual Information Display */}
      <div className="bg-white rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Mutual Information</h4>
        
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-blue-600">
            {mutualInformation.toFixed(4)} bits
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <KatexMath math="I(X;Y) = \sum_{x,y} p(x,y) \log \frac{p(x,y)}{p(x)p(y)}" />
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-700">
              {mutualInformation < 0.001 ? (
                "The variables are independent! Weather and transport choice are unrelated."
              ) : mutualInformation < 0.1 ? (
                "Weak dependence: Weather has a small influence on transport choice."
              ) : mutualInformation < 0.3 ? (
                "Moderate dependence: Weather noticeably affects transport choice."
              ) : (
                "Strong dependence: Weather significantly determines transport choice."
              )}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Maximum possible: ~0.67 bits (when weather completely determines transport)
            </p>
          </div>
        </div>
      </div>

      {/* Marginal Constraints */}
      <div className="bg-gray-100 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-2">Marginal Constraints (Fixed)</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p>P(☀️) = {(jointProbs.sunWalk + jointProbs.sunBike + jointProbs.sunBus).toFixed(2)} ≈ 0.70</p>
            <p>P(☁️) = {(jointProbs.cloudWalk + jointProbs.cloudBike + jointProbs.cloudBus).toFixed(2)} ≈ 0.30</p>
          </div>
          <div>
            <p>P(🚶‍♀️) = {(jointProbs.sunWalk + jointProbs.cloudWalk).toFixed(2)} ≈ 0.20</p>
            <p>P(🚲) = {(jointProbs.sunBike + jointProbs.cloudBike).toFixed(2)} ≈ 0.30</p>
            <p>P(🚌) = {(jointProbs.sunBus + jointProbs.cloudBus).toFixed(2)} ≈ 0.50</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MutualInformationWidget;