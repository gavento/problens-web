"use client";

import React, { useState, useEffect } from "react";

interface VolatilityData {
  histogram: {
    binCenters: number[];
    density: number[];
    binEdges: number[];
    counts: number[];
  };
  fits: {
    exponential: {
      params: { rate: number; mean: number };
      curve: { x: number; y: number }[];
      label: string;
    };
    logNormal: {
      params: { mu: number; sigma: number };
      curve: { x: number; y: number }[];
      label: string;
    };
    inverseGamma: {
      params: { alpha: number; beta: number };
      curve: { x: number; y: number }[];
      label: string;
    };
  };
  stats: {
    count: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    std: number;
  };
}

const VolatilityDistributionWidget: React.FC = () => {
  const [data, setData] = useState<VolatilityData | null>(null);
  const [isLogScale, setIsLogScale] = useState(false);
  const [showFits, setShowFits] = useState({
    exponential: true,
    logNormal: true,
    inverseGamma: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const basePath = process.env.NODE_ENV === 'production' ? '/problens-web' : '';
        const response = await fetch(`${basePath}/volatility_data.json`);
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.status}`);
        }
        const volatilityData = await response.json();
        setData(volatilityData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading volatility data:', err);
        setError('Failed to load volatility data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleFit = (fitType: keyof typeof showFits) => {
    setShowFits(prev => ({
      ...prev,
      [fitType]: !prev[fitType]
    }));
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error || 'No data available'}</p>
      </div>
    );
  }

  const chartWidth = 600;
  const chartHeight = 300;
  const margin = { top: 20, right: 20, bottom: 50, left: 60 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Find max values for scaling
  const maxX = 0.005; // Fixed to match original plot
  const maxDensity = Math.max(...data.histogram.density);
  const maxFitY = Math.max(
    ...Object.values(data.fits).flatMap(fit => fit.curve.map(point => point.y))
  );
  const maxY = Math.max(maxDensity, maxFitY);

  const scaleY = isLogScale ? 
    (y: number) => y <= 0 ? plotHeight : plotHeight - (Math.log10(y + 1) / Math.log10(maxY + 1)) * plotHeight :
    (y: number) => plotHeight - (y / maxY) * plotHeight;

  const scaleX = (x: number) => (x / maxX) * plotWidth;

  // Generate Y-axis ticks
  const yTicks = isLogScale ? 
    [0.1, 1, 10, 100, 1000, 10000].filter(v => v <= maxY) :
    Array.from({ length: 6 }, (_, i) => (i / 5) * maxY);

  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-lg space-y-4 max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800">
        S&P 500 Variance Distribution
      </h3>
      
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        {/* Scale Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Y-axis:</span>
          <button
            onClick={() => setIsLogScale(!isLogScale)}
            className={`px-3 py-1 text-sm rounded border transition-colors ${
              isLogScale
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {isLogScale ? 'Log Scale' : 'Linear Scale'}
          </button>
        </div>

        {/* Fit Toggles */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Show fits:</span>
          <div className="flex gap-1">
            {Object.entries(showFits).map(([fitType, isVisible]) => (
              <button
                key={fitType}
                onClick={() => toggleFit(fitType as keyof typeof showFits)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  isVisible
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {fitType === 'exponential' ? 'Exp' : 
                 fitType === 'logNormal' ? 'LogN' : 'InvΓ'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded-lg border">
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="border border-gray-200 rounded">
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            
            {/* Y-axis */}
            <line x1="0" y1="0" x2="0" y2={plotHeight} stroke="#6b7280" strokeWidth="1" />
            
            {/* X-axis */}
            <line x1="0" y1={plotHeight} x2={plotWidth} y2={plotHeight} stroke="#6b7280" strokeWidth="1" />
            
            {/* Y-axis labels and grid */}
            {yTicks.map((tick, i) => {
              const y = scaleY(tick);
              return (
                <g key={i}>
                  <line 
                    x1="-5" 
                    y1={y} 
                    x2="0" 
                    y2={y} 
                    stroke="#6b7280" 
                    strokeWidth="1" 
                  />
                  <line 
                    x1="0" 
                    y1={y} 
                    x2={plotWidth} 
                    y2={y} 
                    stroke="#e5e7eb" 
                    strokeWidth="0.5" 
                  />
                  <text 
                    x="-10" 
                    y={y + 3} 
                    textAnchor="end" 
                    fontSize="10" 
                    fill="#6b7280"
                  >
                    {tick >= 1 ? tick.toFixed(0) : tick.toFixed(1)}
                  </text>
                </g>
              );
            })}
            
            {/* X-axis labels */}
            {[0, 0.001, 0.002, 0.003, 0.004, 0.005].map((tick, i) => {
              const x = scaleX(tick);
              return (
                <g key={i}>
                  <line 
                    x1={x} 
                    y1={plotHeight} 
                    x2={x} 
                    y2={plotHeight + 5} 
                    stroke="#6b7280" 
                    strokeWidth="1" 
                  />
                  <text 
                    x={x} 
                    y={plotHeight + 18} 
                    textAnchor="middle" 
                    fontSize="10" 
                    fill="#6b7280"
                  >
                    {tick.toFixed(3)}
                  </text>
                </g>
              );
            })}
            
            {/* Histogram bars */}
            {data.histogram.binCenters.map((binCenter, i) => {
              const density = data.histogram.density[i];
              if (density <= 0 || binCenter > maxX) return null;
              
              const x = scaleX(binCenter);
              const y = scaleY(density);
              const height = plotHeight - y;
              const binWidth = data.histogram.binEdges[1] - data.histogram.binEdges[0];
              const barWidth = scaleX(binWidth) * 0.8;
              
              return (
                <rect
                  key={i}
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={height}
                  fill="#93c5fd"
                  stroke="#3b82f6"
                  strokeWidth="0.5"
                  opacity="0.7"
                >
                  <title>
                    {`Variance: ${binCenter.toFixed(6)}\\nDensity: ${density.toFixed(1)}`}
                  </title>
                </rect>
              );
            })}
            
            {/* Fitted curves */}
            {showFits.exponential && (
              <path
                d={data.fits.exponential.curve
                  .filter(point => point.x <= maxX && point.y > 0)
                  .map((point, i) => 
                    `${i === 0 ? 'M' : 'L'} ${scaleX(point.x)} ${scaleY(point.y)}`
                  ).join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
              />
            )}
            
            {showFits.logNormal && (
              <path
                d={data.fits.logNormal.curve
                  .filter(point => point.x <= maxX && point.y > 0)
                  .map((point, i) => 
                    `${i === 0 ? 'M' : 'L'} ${scaleX(point.x)} ${scaleY(point.y)}`
                  ).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />
            )}
            
            {showFits.inverseGamma && (
              <path
                d={data.fits.inverseGamma.curve
                  .filter(point => point.x <= maxX && point.y > 0)
                  .map((point, i) => 
                    `${i === 0 ? 'M' : 'L'} ${scaleX(point.x)} ${scaleY(point.y)}`
                  ).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />
            )}
          </g>
          
          {/* Chart title */}
          <text x={chartWidth / 2} y={15} textAnchor="middle" fontSize="12" fill="#374151" fontWeight="bold">
            Daily Variance Distribution (30-day rolling window)
          </text>
          
          {/* X-axis label */}
          <text x={chartWidth / 2} y={chartHeight - 10} textAnchor="middle" fontSize="11" fill="#6b7280">
            Variance (σ²)
          </text>
          
          {/* Y-axis label */}
          <text x={15} y={chartHeight / 2} textAnchor="middle" fontSize="11" fill="#6b7280" transform={`rotate(-90, 15, ${chartHeight / 2})`}>
            Probability Density
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="bg-white p-3 rounded-lg border">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-blue-300 border border-blue-500 rounded"></div>
            <span>Variance distribution</span>
          </div>
          {showFits.exponential && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-500"></div>
              <span>{data.fits.exponential.label}</span>
            </div>
          )}
          {showFits.logNormal && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span>{data.fits.logNormal.label}</span>
            </div>
          )}
          {showFits.inverseGamma && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500"></div>
              <span>{data.fits.inverseGamma.label}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Statistics */}
      <div className="bg-white p-3 rounded-lg border text-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div><strong>Count:</strong> {data.stats.count.toLocaleString()}</div>
          <div><strong>Mean:</strong> {data.stats.mean.toFixed(6)}</div>
          <div><strong>Median:</strong> {data.stats.median.toFixed(6)}</div>
          <div><strong>Std:</strong> {data.stats.std.toFixed(6)}</div>
          <div><strong>Min:</strong> {data.stats.min.toFixed(6)}</div>
          <div><strong>Max:</strong> {data.stats.max.toFixed(6)}</div>
        </div>
      </div>
    </div>
  );
};

export default VolatilityDistributionWidget;