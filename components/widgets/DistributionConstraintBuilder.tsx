"use client";

import React, { useState, useMemo, useCallback } from "react";
import KatexMath from "@/components/content/KatexMath";

type Lambda = {
  id: string;
  name: string;
  mathDisplay: string;
  value: number;
  power: number;
};

type Props = {
  title?: string;
};

const DistributionConstraintBuilder: React.FC<Props> = ({
  title = "Maximum Entropy Distribution Builder"
}) => {
  const [lambdas, setLambdas] = useState<Lambda[]>([
    { id: "lambda0", name: "λ₀", mathDisplay: "\\lambda_0", value: 0, power: 0 },
    { id: "lambda1", name: "λ₁", mathDisplay: "\\lambda_1", value: 0, power: 1 },
    { id: "lambda2", name: "λ₂", mathDisplay: "\\lambda_2", value: 0, power: 2 },
    { id: "lambda3", name: "λ₃", mathDisplay: "\\lambda_3", value: 0, power: 3 },
  ]);

  // Numerical integration helper
  const integrate = useCallback((f: (x: number) => number, start = 0, end = 1, steps = 1000) => {
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
    // p(x) ∝ exp(λ₀ + λ₁x + λ₂x² + ...)
    const unnormalizedPdf = (x: number) => {
      let exponent = 0;
      lambdas.forEach(lambda => {
        exponent += lambda.value * Math.pow(x, lambda.power);
      });
      // Clip to prevent numerical overflow
      exponent = Math.max(-50, Math.min(50, exponent));
      return Math.exp(exponent);
    };

    // Calculate normalization constant
    const Z = integrate(unnormalizedPdf);
    
    // Normalized PDF
    const pdf = (x: number) => unnormalizedPdf(x) / Z;

    // Generate points for visualization
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      points.push({ x, y: pdf(x) });
    }

    // Calculate expectations
    const expectations: { power: number; value: number }[] = [];
    for (let power = 1; power <= 4; power++) {
      const expectation = integrate(x => pdf(x) * Math.pow(x, power));
      expectations.push({ power, value: expectation });
    }

    // Calculate entropy
    const entropy = -integrate(x => {
      const p = pdf(x);
      return p > 0 ? p * Math.log(p) : 0;
    });

    return { points, expectations, entropy, Z };
  }, [lambdas, integrate]);

  const updateLambda = (id: string, value: number) => {
    setLambdas(prev => prev.map(l => 
      l.id === id ? { ...l, value } : l
    ));
  };

  const resetLambdas = () => {
    setLambdas(prev => prev.map(l => ({ ...l, value: 0 })));
  };

  // Find the maximum y-value for scaling
  const maxY = Math.max(...results.points.map(p => p.y), 0.1);

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
          <KatexMath math={`p(x) \\propto \\exp\\left(${
            lambdas.map(l => 
              l.power === 0 
                ? `\\lambda_0` 
                : l.power === 1 
                  ? `\\lambda_1 x` 
                  : `\\lambda_${l.power} x^${l.power}`
            ).join(' + ')
          }\\right)`} />
        </div>
        <p className="text-sm text-blue-700 mt-2">
          Adjust the λ values below to shape the distribution
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Panel - Lambda inputs */}
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

          <div className="space-y-3">
            {lambdas.map((lambda) => (
              <div key={lambda.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                <div className="w-12">
                  <KatexMath math={lambda.mathDisplay} />
                </div>
                <span className="text-gray-600">=</span>
                <input
                  type="number"
                  step="0.1"
                  value={lambda.value}
                  onChange={(e) => updateLambda(lambda.id, parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500 w-24">
                  {lambda.power === 0 ? 'normalization' : `for x^${lambda.power}`}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg text-sm">
            <p className="text-yellow-800">
              <strong>Note:</strong> Large positive λ values can cause numerical overflow. 
              The distribution is automatically normalized.
            </p>
          </div>
        </div>

        {/* Right Panel - Visualization */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Distribution</h4>
          
          {/* Distribution Plot */}
          <div className="bg-white p-4 rounded-lg border">
            <svg width="100%" height="250" viewBox="0 0 400 250" className="border">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map(x => (
                <g key={x}>
                  <line x1={x * 360 + 20} y1={20} x2={x * 360 + 20} y2={220} 
                        stroke="#e5e7eb" strokeWidth="1" />
                  <text x={x * 360 + 20} y={235} textAnchor="middle" className="text-xs fill-gray-600">
                    {x}
                  </text>
                </g>
              ))}
              
              {/* Y-axis labels */}
              {[0, 0.5, 1].map((y, i) => (
                <text key={i} x="10" y={220 - i * 100} textAnchor="end" className="text-xs fill-gray-600">
                  {(maxY * y).toFixed(1)}
                </text>
              ))}
              
              {/* Distribution curve */}
              {results.points && (
                <>
                  {/* Fill under curve */}
                  <path
                    d={`M 20 220 ${results.points.map(p => 
                      `L ${p.x * 360 + 20} ${220 - (p.y / maxY) * 200}`
                    ).join(' ')} L 380 220 Z`}
                    fill="#3b82f6"
                    fillOpacity="0.2"
                  />
                  {/* Curve line */}
                  <path
                    d={`M ${results.points.map(p => 
                      `${p.x * 360 + 20} ${220 - (p.y / maxY) * 200}`
                    ).join(' L ')}`}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                </>
              )}
              
              {/* Axes */}
              <line x1="20" y1="220" x2="380" y2="220" stroke="#374151" strokeWidth="2" />
              <line x1="20" y1="20" x2="20" y2="220" stroke="#374151" strokeWidth="2" />
              
              {/* Labels */}
              <text x="200" y="248" textAnchor="middle" className="text-sm fill-gray-700">x</text>
              <text x="10" y="10" textAnchor="middle" className="text-sm fill-gray-700">p(x)</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Expectations Display */}
      <div className="bg-white rounded-lg p-4 space-y-3">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Computed Expectations</h4>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {results.expectations.map(exp => (
            <div key={exp.power} className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">
                <KatexMath math={`E[X^${exp.power}]`} />
              </div>
              <div className="text-lg font-mono font-semibold text-gray-800">
                {exp.value.toFixed(4)}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Entropy</div>
            <div className="text-lg font-mono font-semibold text-gray-800">
              {results.entropy.toFixed(4)}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Normalization (Z)</div>
            <div className="text-lg font-mono font-semibold text-gray-800">
              {results.Z.toFixed(4)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributionConstraintBuilder;