'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts';
import { PolynomialRegression } from 'ml-regression-polynomial';

interface Point {
  x: number;
  y: number;
}

interface ModelResult {
  degree: number;
  mse: number;
  aic: number;
  aicPenalty: number;
  logMSE: number;
  model: any;
  coefficients: number[];
}

const PolynomialRegressionWidget: React.FC = () => {
  // Default points forming a noisy cubic pattern
  const defaultPoints: Point[] = [
    { x: 0.5, y: 2.8 },
    { x: 0.71, y: 2.4 },
    { x: 0.92, y: 3.1 },
    { x: 1.13, y: 3.5 },
    { x: 1.34, y: 3.0 },
    { x: 1.55, y: 3.8 },
    { x: 1.76, y: 3.4 },
    { x: 1.97, y: 4.1 },
    { x: 2.18, y: 3.9 },
    { x: 2.39, y: 3.2 },
    { x: 2.61, y: 3.7 },
    { x: 2.82, y: 3.1 },
    { x: 3.03, y: 2.8 },
    { x: 3.24, y: 2.2 },
    { x: 3.45, y: 2.5 },
    { x: 3.66, y: 1.8 },
    { x: 3.87, y: 1.3 },
    { x: 4.08, y: 1.7 },
    { x: 4.29, y: 1.1 },
    { x: 4.5, y: 1.5 },
  ];

  const [points, setPoints] = useState<Point[]>(defaultPoints);
  const [isCreatingData, setIsCreatingData] = useState(false);
  const [modelResults, setModelResults] = useState<ModelResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hoveredDegree, setHoveredDegree] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [regularizationConstant, setRegularizationConstant] = useState<number>(2); // AIC default
  
  // Calculate BIC constant based on sample size
  const bicConstant = useMemo(() => {
    return Math.log(points.length);
  }, [points.length]);

  // SVG dimensions for click area
  const width = 600;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };

  // Cross-validation with 90/10 split
  const crossValidate = useCallback((points: Point[], degree: number, numFolds: number = 10): number => {
    const n = points.length;
    const testSize = Math.max(1, Math.floor(n * 0.1)); // At least 1 test point
    
    let totalMSE = 0;
    
    for (let fold = 0; fold < numFolds; fold++) {
      // Shuffle and split
      const shuffled = [...points].sort(() => Math.random() - 0.5);
      const testPoints = shuffled.slice(0, testSize);
      const trainPoints = shuffled.slice(testSize);
      
      // Extract x,y arrays
      const trainX = trainPoints.map(p => p.x);
      const trainY = trainPoints.map(p => p.y);
      
      try {
        // Fit model
        const regression = new PolynomialRegression(trainX, trainY, degree);
        
        // Evaluate on test set
        let mse = 0;
        for (const point of testPoints) {
          const prediction = regression.predict(point.x);
          mse += Math.pow(point.y - prediction, 2);
        }
        mse /= testPoints.length;
        
        totalMSE += mse;
      } catch (e) {
        // If fitting fails (e.g., singular matrix), return large MSE
        return 1e10;
      }
    }
    
    return totalMSE / numFolds;
  }, []);

  // Handle click to add points
  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGElement>) => {
    if (!isCreatingData) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left - margin.left) / (rect.width - margin.left - margin.right) * 5;
    const y = (1 - (e.clientY - rect.top - margin.top) / (rect.height - margin.top - margin.bottom)) * 5;
    
    if (x >= 0 && x <= 5 && y >= 0 && y <= 5) {
      setPoints(prev => [...prev, { x, y }]);
    }
  }, [isCreatingData]);

  // Reset to empty canvas
  const handleReset = () => {
    setPoints([]);
    setIsCreatingData(true);
    setModelResults([]);
    setError('');
    setHoveredDegree(null);
  };

  // Fit all polynomial models
  const handleRun = async () => {
    if (points.length < 3) {
      setError('Please add at least 3 points');
      return;
    }
    
    setIsRunning(true);
    setIsCreatingData(false);
    setError('');
    const results: ModelResult[] = [];
    
    try {
      for (let degree = 1; degree <= Math.min(10, points.length - 1); degree++) {
        // Get cross-validated MSE
        const mse = crossValidate(points, degree);
        
        // Fit on full dataset for visualization
        const x = points.map(p => p.x);
        const y = points.map(p => p.y);
        const model = new PolynomialRegression(x, y, degree);
        
        // Calculate AIC components
        const n = points.length;
        const k = degree + 1; // number of parameters
        const logMSE = n * Math.log(mse);
        const aicPenalty = regularizationConstant * k;
        const aic = aicPenalty + logMSE;
        
        results.push({
          degree,
          mse,
          aic,
          aicPenalty,
          logMSE,
          model,
          coefficients: model.coefficients
        });
        
        // Update UI periodically
        if (degree % 3 === 0) {
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

  // Generate smooth curve for plotting
  const generateCurve = useCallback((model: any, numPoints: number = 100): Point[] => {
    const curvePoints: Point[] = [];
    for (let i = 0; i <= numPoints; i++) {
      const x = i / numPoints * 5;
      const y = model.predict(x);
      curvePoints.push({ x, y });
    }
    return curvePoints;
  }, []);

  // Get model curve for visualization
  const modelCurve = useMemo(() => {
    if (hoveredDegree === null) return [];
    const result = modelResults.find(r => r.degree === hoveredDegree);
    if (!result) return [];
    return generateCurve(result.model);
  }, [hoveredDegree, modelResults, generateCurve]);

  // Calculate chart data with dynamic regularization
  const chartData = useMemo(() => {
    return modelResults.map(result => ({
      ...result,
      aicPenalty: regularizationConstant * (result.degree + 1),
      aic: regularizationConstant * (result.degree + 1) + result.logMSE
    }));
  }, [modelResults, regularizationConstant]);

  // Handle slider drag
  const handleSliderDrag = useCallback((event: React.MouseEvent<SVGElement>) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.clientX - rect.left;
      const sliderWidth = 400; // Width of the slider
      const sliderMargin = 50;
      const relativeX = Math.max(0, Math.min(1, (x - sliderMargin) / sliderWidth));
      
      // Interpolate between AIC (2) and BIC (log(n))
      const newConstant = 2 + relativeX * (bicConstant - 2);
      setRegularizationConstant(newConstant);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [bicConstant]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      <h3 className="text-xl font-semibold mb-4">Polynomial Regression & AIC Model Selection</h3>
      
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
          disabled={points.length < 3 || isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400"
        >
          {isRunning ? 'Running...' : 'Run'}
        </button>
        {isCreatingData && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Click on the plot to add data points
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Scatter plot with polynomial curves */}
      <div className="border rounded p-4">
        <h4 className="text-lg font-semibold mb-3">
          Data Points {points.length > 0 && `(${points.length} points)`}
        </h4>
        <svg 
          width={width} 
          height={height} 
          className="w-full cursor-crosshair" 
          style={{ maxWidth: `${width}px` }}
          onClick={handleCanvasClick}
        >
          {/* Grid lines */}
          {[0, 1, 2, 3, 4, 5].map(val => (
            <g key={val}>
              <line
                x1={margin.left + (val / 5) * (width - margin.left - margin.right)}
                y1={margin.top}
                x2={margin.left + (val / 5) * (width - margin.left - margin.right)}
                y2={height - margin.bottom}
                stroke="#e5e7eb"
                strokeDasharray="2,2"
              />
              <line
                x1={margin.left}
                y1={height - margin.bottom - (val / 5) * (height - margin.top - margin.bottom)}
                x2={width - margin.right}
                y2={height - margin.bottom - (val / 5) * (height - margin.top - margin.bottom)}
                stroke="#e5e7eb"
                strokeDasharray="2,2"
              />
            </g>
          ))}
          
          {/* Axes */}
          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="#374151"
            strokeWidth="2"
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            stroke="#374151"
            strokeWidth="2"
          />
          
          {/* Axis labels */}
          {[0, 1, 2, 3, 4, 5].map(val => (
            <g key={val}>
              <text
                x={margin.left + (val / 5) * (width - margin.left - margin.right)}
                y={height - margin.bottom + 20}
                textAnchor="middle"
                fontSize="12"
                fill="#374151"
              >
                {val}
              </text>
              <text
                x={margin.left - 10}
                y={height - margin.bottom - (val / 5) * (height - margin.top - margin.bottom) + 5}
                textAnchor="end"
                fontSize="12"
                fill="#374151"
              >
                {val}
              </text>
            </g>
          ))}
          
          {/* Axis titles */}
          <text
            x={margin.left + (width - margin.left - margin.right) / 2}
            y={height - 5}
            textAnchor="middle"
            fontSize="14"
            fill="#374151"
            fontWeight="bold"
          >
            x
          </text>
          <text
            x={15}
            y={margin.top + (height - margin.top - margin.bottom) / 2}
            textAnchor="middle"
            fontSize="14"
            fill="#374151"
            fontWeight="bold"
            transform={`rotate(-90, 15, ${margin.top + (height - margin.top - margin.bottom) / 2})`}
          >
            y
          </text>
          
          {/* Model curve if hovering */}
          {hoveredDegree !== null && modelCurve.length > 0 && (
            <polyline
              points={modelCurve.map(p => 
                `${margin.left + (p.x / 5) * (width - margin.left - margin.right)},${height - margin.bottom - (Math.min(5, Math.max(0, p.y)) / 5) * (height - margin.top - margin.bottom)}`
              ).join(' ')}
              fill="none"
              stroke="#ff7300"
              strokeWidth="3"
              opacity="0.8"
            />
          )}
          
          {/* Data points */}
          {points.map((point, i) => (
            <circle
              key={i}
              cx={margin.left + (point.x / 5) * (width - margin.left - margin.right)}
              cy={height - margin.bottom - (point.y / 5) * (height - margin.top - margin.bottom)}
              r="5"
              fill="#8884d8"
              stroke="#6b63c7"
              strokeWidth="2"
            />
          ))}
          
          {/* Legend if model is shown */}
          {hoveredDegree !== null && (
            <g>
              <rect x={width - 150} y={margin.top + 10} width={15} height={15} fill="#8884d8" />
              <text x={width - 130} y={margin.top + 22} fontSize="12" fill="#374151">Data Points</text>
              <rect x={width - 150} y={margin.top + 30} width={15} height={15} fill="#ff7300" />
              <text x={width - 130} y={margin.top + 42} fontSize="12" fill="#374151">
                Polynomial (degree {hoveredDegree})
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Model selection results */}
      {modelResults.length > 0 && (
        <>
          {/* AIC comparison chart */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Model Comparison</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart 
                data={chartData} 
                margin={{ top: 20, right: 20, left: 60, bottom: 40 }}
                onMouseMove={(e: any) => {
                  if (e && e.activeLabel) {
                    setHoveredDegree(e.activeLabel);
                  }
                }}
                onMouseLeave={() => setHoveredDegree(null)}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="degree" 
                  label={{ value: 'Polynomial Degree', position: 'insideBottom', offset: -10 }}
                  domain={[1, chartData.length]}
                  ticks={chartData.map(r => r.degree)}
                />
                <YAxis 
                  label={{ value: 'Value', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip formatter={(value: number) => value.toFixed(2)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="logMSE" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="n × log(MSE)" 
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="aicPenalty" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name={`${regularizationConstant.toFixed(1)}k (penalty)`} 
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="aic" 
                  stroke="#ff7300" 
                  strokeWidth={3}
                  name="Total" 
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Regularization slider */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h5 className="text-md font-semibold mb-3">Regularization Constant</h5>
              <svg width="500" height="80" className="w-full" style={{ maxWidth: '500px' }}>
                {/* Slider track */}
                <rect
                  x="50"
                  y="30"
                  width="400"
                  height="8"
                  fill="#e5e7eb"
                  rx="4"
                />
                
                {/* Slider handle */}
                <circle
                  cx={50 + 400 * ((regularizationConstant - 2) / (bicConstant - 2))}
                  cy="34"
                  r="12"
                  fill="#3b82f6"
                  stroke="#1d4ed8"
                  strokeWidth="2"
                  className="cursor-pointer"
                  onMouseDown={handleSliderDrag}
                />
                
                {/* Labels */}
                <text x="50" y="20" textAnchor="middle" fontSize="12" fill="#374151">
                  AIC (2)
                </text>
                <text x="450" y="20" textAnchor="middle" fontSize="12" fill="#374151">
                  BIC ({bicConstant.toFixed(1)})
                </text>
                <text x="250" y="65" textAnchor="middle" fontSize="14" fill="#374151" fontWeight="bold">
                  Current: {regularizationConstant.toFixed(2)}
                </text>
                
                {/* Click area for the entire slider */}
                <rect
                  x="50"
                  y="10"
                  width="400"
                  height="40"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseDown={handleSliderDrag}
                />
              </svg>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Drag to adjust the penalty constant between AIC (more permissive) and BIC (more conservative)
              </p>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default PolynomialRegressionWidget;