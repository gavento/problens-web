"use client";

import React, { useState, useMemo, useCallback } from "react";
import KatexMath from "@/components/content/KatexMath";

type Lambda = {
  id: string;
  name: string;
  mathDisplay: string;
  value: number;
  type: 'polynomial' | 'log' | 'indicator' | 'sin';
  power?: number;
};

type Props = {
  title?: string;
};

const DistributionConstraintBuilder: React.FC<Props> = ({
  title = "Maximum Entropy Distribution Builder"
}) => {
  const [lambdas, setLambdas] = useState<Lambda[]>([
    { id: "lambda1", name: "λ₁", mathDisplay: "\\lambda_1", value: 20, type: 'polynomial', power: 1 },
    { id: "lambda2", name: "λ₂", mathDisplay: "\\lambda_2", value: -20, type: 'polynomial', power: 2 },
    { id: "lambda3", name: "λ₃", mathDisplay: "\\lambda_3", value: 0, type: 'polynomial', power: 3 },
    { id: "lambdalog", name: "λ_log", mathDisplay: "\\lambda_{\\log}", value: 0, type: 'log' },
    { id: "lambdaind", name: "λ_ind", mathDisplay: "\\lambda_{\\mathbb{1}_{x>2/3}}", value: 0, type: 'indicator' },
    { id: "lambdasin", name: "λ_sin", mathDisplay: "\\lambda_{\\sin}", value: 0, type: 'sin' },
  ]);

  // Numerical integration helper
  const integrate = useCallback((f: (x: number) => number, start = 0.001, end = 0.999, steps = 1000) => {
    const dx = (end - start) / steps;
    let sum = 0;
    for (let i = 0; i < steps; i++) {
      const x1 = start + i * dx;
      const x2 = start + (i + 1) * dx;
      sum += (f(x1) + f(x2)) * dx / 2; // Trapezoidal rule
    }
    return sum;
  }, []);

  // Calculate the distribution and expectations
  const results = useMemo(() => {
    // p(x) ∝ exp(λ₁x + λ₂x² + ... + λ_log*log(x))
    const unnormalizedPdf = (x: number) => {
      let exponent = 0;
      lambdas.forEach(lambda => {
        if (lambda.type === 'polynomial' && lambda.power !== undefined) {
          exponent += lambda.value * Math.pow(x, lambda.power);
        } else if (lambda.type === 'log' && x > 0) {
          exponent += lambda.value * Math.log(x);
        } else if (lambda.type === 'indicator') {
          exponent += lambda.value * (x > 2/3 ? 1 : 0);
        } else if (lambda.type === 'sin') {
          exponent += lambda.value * Math.sin(10 * x);
        }
      });
      // Clip to prevent numerical overflow
      exponent = Math.max(-50, Math.min(50, exponent));
      return Math.exp(exponent);
    };

    // Calculate normalization constant
    const Z = integrate(unnormalizedPdf);
    
    // Lambda_0 is implicitly -log(Z) for normalization
    const lambda0 = -Math.log(Z);
    
    // Normalized PDF
    const pdf = (x: number) => unnormalizedPdf(x) / Z;

    // Generate points for visualization
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      if (x > 0 && x < 1) {
        points.push({ x, y: pdf(x) });
      }
    }

    // Calculate expectations
    const expectations: { label: string; value: number }[] = [];
    
    // E[X], E[X²], E[X³]
    for (let power = 1; power <= 3; power++) {
      const expectation = integrate(x => pdf(x) * Math.pow(x, power));
      expectations.push({ label: `E[X^${power}]`, value: expectation });
    }
    
    // E[log X]
    const expectationLogX = integrate(x => pdf(x) * Math.log(x));
    expectations.push({ label: `E[\\log X]`, value: expectationLogX });
    
    // E[1_{X>2/3}]
    const expectationIndicator = integrate(x => pdf(x) * (x > 2/3 ? 1 : 0));
    expectations.push({ label: `E[\\mathbb{1}_{X>2/3}]`, value: expectationIndicator });
    
    // E[sin(10X)]
    const expectationSin = integrate(x => pdf(x) * Math.sin(10 * x));
    expectations.push({ label: `E[\\sin(10X)]`, value: expectationSin });

    return { points, expectations, lambda0 };
  }, [lambdas, integrate]);

  const updateLambda = (id: string, value: number) => {
    setLambdas(prev => prev.map(l => 
      l.id === id ? { ...l, value } : l
    ));
  };

  const resetLambdas = () => {
    setLambdas([
      { id: "lambda1", name: "λ₁", mathDisplay: "\\lambda_1", value: 20, type: 'polynomial', power: 1 },
      { id: "lambda2", name: "λ₂", mathDisplay: "\\lambda_2", value: -20, type: 'polynomial', power: 2 },
      { id: "lambda3", name: "λ₃", mathDisplay: "\\lambda_3", value: 0, type: 'polynomial', power: 3 },
      { id: "lambdalog", name: "λ_log", mathDisplay: "\\lambda_{\\log}", value: 0, type: 'log' },
      { id: "lambdaind", name: "λ_ind", mathDisplay: "\\lambda_{\\mathbb{1}_{x>2/3}}", value: 0, type: 'indicator' },
      { id: "lambdasin", name: "λ_sin", mathDisplay: "\\lambda_{\\sin}", value: 0, type: 'sin' },
    ]);
  };

  // Find the maximum y-value for scaling
  const maxY = Math.max(...results.points.map(p => p.y), 0.1);

  // Format numbers for display in formula
  const formatNumber = (num: number) => {
    if (num === 0) return '';
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}`;
  };

  // Build the formula string with actual values
  const formulaTerms = lambdas
    .map((l, idx) => {
      if (l.value === 0) return null;
      const absValue = Math.abs(l.value).toFixed(2);
      const sign = l.value >= 0 ? (idx === 0 || lambdas.slice(0, idx).every(prev => prev.value === 0) ? '' : '+') : '-';
      
      if (l.type === 'polynomial' && l.power !== undefined) {
        if (l.power === 1) {
          return `${sign}${absValue} x`;
        }
        return `${sign}${absValue} x^${l.power}`;
      } else if (l.type === 'log') {
        return `${sign}${absValue} \\log x`;
      } else if (l.type === 'indicator') {
        return `${sign}${absValue} \\mathbb{1}_{x>2/3}`;
      } else if (l.type === 'sin') {
        return `${sign}${absValue} \\sin(10x)`;
      }
      return null;
    })
    .filter(Boolean);
  
  const formulaString = formulaTerms.join(' ');

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-6 max-w-6xl mx-auto">
      {title && (
        <h3 className="text-xl font-semibold text-center text-gray-800">
          {title}
        </h3>
      )}

      {/* Formula Display */}
      <div className="bg-blue-50 rounded-lg p-4 text-center">
        <div className="text-lg">
          <KatexMath math={`p(x) \\propto \\exp\\left(${formulaString || '0'}\\right)`} />
        </div>
      </div>

      {/* Lambda inputs */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-semibold text-gray-800">Lambda Parameters</h4>
          <button
            onClick={resetLambdas}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {lambdas.map((lambda) => (
            <div key={lambda.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="w-16">
                <KatexMath math={lambda.mathDisplay} />
              </div>
              <span className="text-gray-600">=</span>
              <input
                type="number"
                step="0.5"
                value={lambda.value}
                onChange={(e) => updateLambda(lambda.id, parseFloat(e.target.value) || 0)}
                className="w-20 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-sm text-gray-500 w-40">
                <KatexMath math={
                  lambda.type === 'polynomial' && lambda.power ? `\\text{for } x^${lambda.power}` : 
                  lambda.type === 'log' ? '\\text{for } \\log x' :
                  lambda.type === 'indicator' ? '\\text{for } \\mathbb{1}_{x>2/3}' :
                  '\\text{for } \\sin(10x)'
                } />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution Visualization */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-800">Distribution</h4>
        
        {/* Distribution Plot */}
        <div className="bg-white p-6 rounded-lg border">
          <svg width="100%" height="350" viewBox="0 0 800 350" className="border">
            {/* Grid lines */}
            {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(x => (
              <g key={x}>
                <line x1={x * 760 + 20} y1={20} x2={x * 760 + 20} y2={320} 
                      stroke="#e5e7eb" strokeWidth="1" strokeDasharray={x % 0.2 === 0 ? "0" : "2,2"} />
                {[0, 0.2, 0.4, 0.6, 0.8, 1.0].includes(x) && (
                  <text x={x * 760 + 20} y={335} textAnchor="middle" className="text-sm fill-gray-600">
                    {x.toFixed(1)}
                  </text>
                )}
              </g>
            ))}
            
            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((y, i) => (
              <text key={i} x="15" y={320 - i * 75} textAnchor="start" className="text-sm fill-gray-600">
                {(maxY * y).toFixed(1)}
              </text>
            ))}
            
            {/* Distribution curve */}
            {results.points && (
              <>
                {/* Fill under curve */}
                <path
                  d={`M 20 320 ${results.points.map(p => 
                    `L ${p.x * 760 + 20} ${320 - (p.y / maxY) * 300}`
                  ).join(' ')} L 780 320 Z`}
                  fill="#3b82f6"
                  fillOpacity="0.2"
                />
                {/* Curve line */}
                <path
                  d={`M ${results.points.map(p => 
                    `${p.x * 760 + 20} ${320 - (p.y / maxY) * 300}`
                  ).join(' L ')}`}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                />
              </>
            )}
            
            {/* Axes */}
            <line x1="20" y1="320" x2="780" y2="320" stroke="#374151" strokeWidth="2" />
            <line x1="20" y1="20" x2="20" y2="320" stroke="#374151" strokeWidth="2" />
            
            {/* Labels */}
            <text x="400" y="348" textAnchor="middle" className="text-base fill-gray-700">x</text>
            <text x="10" y="10" textAnchor="middle" className="text-base fill-gray-700">p(x)</text>
          </svg>
        </div>
      </div>

      {/* Expectations Display */}
      <div className="bg-white rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Computed Expectations</h4>
        
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {results.expectations.map((exp, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">
                <KatexMath math={exp.label} />
              </div>
              <div className="text-lg font-mono font-semibold text-gray-800">
                {exp.value.toFixed(4)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DistributionConstraintBuilder;