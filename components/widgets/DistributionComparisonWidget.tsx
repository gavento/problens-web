"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";

type Props = {
  title?: string;
};

const DistributionComparisonWidget: React.FC<Props> = ({ 
  title = "Distribution Comparison"
}) => {
  // Initial probability distributions (each sums to 1)
  const [redDist, setRedDist] = useState<number[]>([0.2, 0.2, 0.2, 0.2, 0.2]);
  const [blueDist, setBlueDist] = useState<number[]>([0.1, 0.4, 0.3, 0.15, 0.05]);
  const [containerWidth, setContainerWidth] = useState(500);

  useEffect(() => {
    const updateWidth = () => {
      setContainerWidth(Math.min(500, window.innerWidth - 80));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  // Chart dimensions - responsive
  const chartWidth = containerWidth;
  const chartHeight = Math.min(300, chartWidth * 0.6);
  const margin = { top: 20, right: 20, bottom: 60, left: 40 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;
  
  // Bar dimensions
  const numCategories = 5;
  const categoryWidth = innerWidth / numCategories;
  const barWidth = categoryWidth * 0.4;
  const barGap = categoryWidth * 0.05;
  
  // Scale for probability (0 to 1)
  const yScale = innerHeight;
  
  // Calculate distance metrics
  const metrics = useMemo(() => {
    // KL divergence: KL(red || blue)
    let kl = 0;
    let isKLInfinite = false;
    
    for (let i = 0; i < redDist.length; i++) {
      const p = redDist[i];
      const q = blueDist[i];
      
      if (p > 0 && q === 0) {
        isKLInfinite = true;
        break;
      } else if (p > 0 && q > 0) {
        kl += p * Math.log2(p / q);
      }
    }
    
    // L1 distance (Manhattan)
    const l1 = redDist.reduce((sum, p, i) => sum + Math.abs(p - blueDist[i]), 0);
    
    // L2 distance (Euclidean)
    const l2 = Math.sqrt(redDist.reduce((sum, p, i) => sum + Math.pow(p - blueDist[i], 2), 0));
    
    return { 
      kl: isKLInfinite ? Infinity : Math.max(0, kl), 
      l1, 
      l2 
    };
  }, [redDist, blueDist]);
  
  // Update distribution while maintaining sum = 1
  const updateDistribution = useCallback((
    distribution: number[], 
    setDistribution: (dist: number[]) => void, 
    index: number, 
    newValue: number
  ) => {
    const clampedValue = Math.max(0, Math.min(1, newValue));
    const newDist = [...distribution];
    
    // Calculate remaining mass to distribute
    const remainingMass = 1 - clampedValue;
    const currentRemainingMass = distribution.reduce((sum, p, i) => i === index ? sum : sum + p, 0);
    
    if (currentRemainingMass > 0) {
      const scaleFactor = remainingMass / currentRemainingMass;
      
      // Update all other probabilities proportionally
      for (let i = 0; i < newDist.length; i++) {
        if (i === index) {
          newDist[i] = clampedValue;
        } else {
          newDist[i] = distribution[i] * scaleFactor;
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
    
    setDistribution(newDist);
  }, []);
  
  // Handle bar dragging
  const handleBarDrag = useCallback((
    isRed: boolean, 
    index: number, 
    event: React.MouseEvent<SVGRectElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const svg = event.currentTarget.closest('svg')!;
    const svgRect = svg.getBoundingClientRect();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const y = moveEvent.clientY - svgRect.top;
      const relativeY = y - margin.top;
      const probability = Math.max(0, Math.min(1, 1 - (relativeY / yScale)));
      
      if (isRed) {
        updateDistribution(redDist, setRedDist, index, probability);
      } else {
        updateDistribution(blueDist, setBlueDist, index, probability);
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [redDist, blueDist, updateDistribution, yScale]);
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4 max-w-3xl mx-auto">
      {title && (
        <h3 className="text-lg font-semibold text-center text-gray-800">
          {title}
        </h3>
      )}
      
      {/* SVG Chart */}
      <div className="flex justify-center overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="border rounded bg-white min-w-0 max-w-full">
          {/* Chart area background */}
          <rect 
            x={margin.left} 
            y={margin.top} 
            width={innerWidth} 
            height={innerHeight} 
            fill="#f9fafb" 
            stroke="#e5e7eb"
          />
          
          {/* Y-axis grid lines */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map(tick => {
            const y = margin.top + innerHeight - (tick * yScale);
            return (
              <g key={tick}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + innerWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="2,2"
                />
                <text
                  x={margin.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}
          
          {/* Category labels */}
          {Array.from({ length: numCategories }, (_, i) => (
            <text
              key={i}
              x={margin.left + i * categoryWidth + categoryWidth / 2}
              y={margin.top + innerHeight + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#374151"
              fontWeight="bold"
            >
              {i + 1}
            </text>
          ))}
          
          {/* Red and Blue bars */}
          {redDist.map((redProb, i) => {
            const blueProb = blueDist[i];
            const categoryX = margin.left + i * categoryWidth;
            
            // Red bar
            const redBarHeight = redProb * yScale;
            const redX = categoryX + barGap;
            const redY = margin.top + innerHeight - redBarHeight;
            
            // Blue bar
            const blueBarHeight = blueProb * yScale;
            const blueX = categoryX + barGap + barWidth + barGap;
            const blueY = margin.top + innerHeight - blueBarHeight;
            
            return (
              <g key={i}>
                {/* Red bar */}
                <rect
                  x={redX}
                  y={redY}
                  width={barWidth}
                  height={redBarHeight}
                  fill="#DC2626"
                  stroke="#B91C1C"
                  strokeWidth="1"
                  className="cursor-ns-resize"
                  onMouseDown={(e) => handleBarDrag(true, i, e)}
                />
                
                {/* Blue bar */}
                <rect
                  x={blueX}
                  y={blueY}
                  width={barWidth}
                  height={blueBarHeight}
                  fill="#2563EB"
                  stroke="#1D4ED8"
                  strokeWidth="1"
                  className="cursor-ns-resize"
                  onMouseDown={(e) => handleBarDrag(false, i, e)}
                />
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
          
          {/* Y-axis label */}
          <text
            x={15}
            y={margin.top + innerHeight / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#374151"
            fontWeight="bold"
            transform={`rotate(-90, 15, ${margin.top + innerHeight / 2})`}
          >
            Probability
          </text>
        </svg>
      </div>
      
      {/* Instructions */}
      <div className="text-center text-sm text-gray-600">
        Drag any bar up or down to adjust probabilities. Other bars will adjust automatically to maintain valid distributions.
      </div>
      
      {/* Distance Metrics */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-white p-3 rounded text-center border">
          <div className="font-semibold text-gray-700">KL Divergence</div>
          <div className="text-xs text-gray-500 mb-1">D(<span className="text-red-600">Red</span>, <span className="text-blue-600">Blue</span>)</div>
          <div className="text-lg text-orange-600 font-mono">
            {metrics.kl === Infinity ? "∞" : metrics.kl.toFixed(3)}
          </div>
        </div>
        <div className="bg-white p-3 rounded text-center border">
          <div className="font-semibold text-gray-700">L1 Distance</div>
          <div className="text-xs text-gray-500 mb-1">Manhattan</div>
          <div className="text-lg text-green-600 font-mono">
            {metrics.l1.toFixed(3)}
          </div>
        </div>
        <div className="bg-white p-3 rounded text-center border">
          <div className="font-semibold text-gray-700">L2 Distance</div>
          <div className="text-xs text-gray-500 mb-1">Euclidean</div>
          <div className="text-lg text-blue-600 font-mono">
            {metrics.l2.toFixed(3)}
          </div>
        </div>
      </div>
      
      {/* Reset button */}
      <div className="text-center">
        <button
          onClick={() => {
            setRedDist([0.2, 0.2, 0.2, 0.2, 0.2]);
            setBlueDist([0.1, 0.4, 0.3, 0.15, 0.05]);
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Reset Distributions
        </button>
      </div>
    </div>
  );
};

export default DistributionComparisonWidget;