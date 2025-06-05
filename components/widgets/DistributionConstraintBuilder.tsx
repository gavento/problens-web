"use client";

import React, { useState, useMemo, useCallback } from "react";
import KatexMath from "@/components/content/KatexMath";

type Constraint = {
  id: string;
  name: string;
  mathDisplay: string;
  enabled: boolean;
  value: number;
  defaultValue: number;
  power: number;
};

type OptimizationResult = {
  success: boolean;
  error?: string;
  distribution?: {
    points: { x: number; y: number }[];
    lambdas: number[];
    entropy: number;
  };
};

type Props = {
  title?: string;
};

const DistributionConstraintBuilder: React.FC<Props> = ({
  title = "Distribution Constraint Builder"
}) => {
  const [constraints, setConstraints] = useState<Constraint[]>([
    { id: "mean", name: "E[X]", mathDisplay: "E[X]", enabled: true, value: 0.5, defaultValue: 0.5, power: 1 },
    { id: "secondMoment", name: "E[X²]", mathDisplay: "E[X^2]", enabled: false, value: 0.33, defaultValue: 0.33, power: 2 },
    { id: "thirdMoment", name: "E[X³]", mathDisplay: "E[X^3]", enabled: false, value: 0.25, defaultValue: 0.25, power: 3 },
    { id: "fourthMoment", name: "E[X⁴]", mathDisplay: "E[X^4]", enabled: false, value: 0.2, defaultValue: 0.2, power: 4 },
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

  // Calculate the distribution for given lambdas
  const calculateDistribution = useCallback((lambdas: number[], enabledConstraints: Constraint[]) => {
    // p(x) ∝ exp(λ₀ + λ₁x + λ₂x² + ...)
    const unnormalizedPdf = (x: number) => {
      let exponent = lambdas[0]; // λ₀ for normalization
      enabledConstraints.forEach((constraint, i) => {
        exponent += lambdas[i + 1] * Math.pow(x, constraint.power);
      });
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

    // Calculate entropy
    const entropy = -integrate(x => {
      const p = pdf(x);
      return p > 0 ? p * Math.log(p) : 0;
    });

    return { points, entropy };
  }, [integrate]);

  // Check if constraints are feasible
  const checkFeasibility = useCallback((enabledConstraints: Constraint[]) => {
    // Basic feasibility checks for polynomial moments
    const moments = enabledConstraints.map(c => ({ power: c.power, value: c.value })).sort((a, b) => a.power - b.power);
    
    // Check if all values are in [0,1] for moments of distributions on [0,1]
    for (const moment of moments) {
      if (moment.value < 0 || moment.value > 1) {
        return `E[X^${moment.power}] = ${moment.value.toFixed(3)} is outside [0,1]`;
      }
    }

    // Check Jensen's inequality constraints
    // E[X²] ≥ E[X]²
    const mean = moments.find(m => m.power === 1);
    const secondMoment = moments.find(m => m.power === 2);
    if (mean && secondMoment && secondMoment.value < mean.value * mean.value) {
      return `E[X²] = ${secondMoment.value.toFixed(3)} < E[X]² = ${(mean.value * mean.value).toFixed(3)}. This violates Var(X) ≥ 0.`;
    }

    // E[X³] ≥ E[X²]^(3/2) for X ∈ [0,1]
    const thirdMoment = moments.find(m => m.power === 3);
    if (secondMoment && thirdMoment && thirdMoment.value < Math.pow(secondMoment.value, 3/2)) {
      return `E[X³] = ${thirdMoment.value.toFixed(3)} < E[X²]^(3/2) = ${Math.pow(secondMoment.value, 3/2).toFixed(3)}`;
    }

    return null; // No errors
  }, []);

  // Find optimal lambdas using gradient descent
  const findOptimalLambdas = useCallback((enabledConstraints: Constraint[]) => {
    const numLambdas = enabledConstraints.length + 1; // +1 for normalization
    let lambdas = new Array(numLambdas).fill(0);
    
    // Simple gradient descent
    const learningRate = 0.1;
    const maxIterations = 500;
    const tolerance = 1e-6;
    
    for (let iter = 0; iter < maxIterations; iter++) {
      // Calculate current distribution
      const unnormalizedPdf = (x: number) => {
        let exponent = lambdas[0];
        enabledConstraints.forEach((constraint, i) => {
          exponent += lambdas[i + 1] * Math.pow(x, constraint.power);
        });
        // Clip to prevent numerical overflow
        exponent = Math.max(-50, Math.min(50, exponent));
        return Math.exp(exponent);
      };

      const Z = integrate(unnormalizedPdf);
      if (!isFinite(Z) || Z <= 0) {
        // Reset if we get numerical issues
        lambdas = lambdas.map(() => (Math.random() - 0.5) * 0.1);
        continue;
      }

      const pdf = (x: number) => unnormalizedPdf(x) / Z;

      // Calculate gradients
      const gradients = new Array(numLambdas).fill(0);
      
      // Gradient for normalization constraint
      gradients[0] = 1 - Z;

      // Gradients for moment constraints
      let maxError = 0;
      enabledConstraints.forEach((constraint, i) => {
        const calculatedMoment = integrate(x => pdf(x) * Math.pow(x, constraint.power));
        const error = calculatedMoment - constraint.value;
        gradients[i + 1] = error;
        maxError = Math.max(maxError, Math.abs(error));
      });

      // Check convergence
      if (maxError < tolerance) {
        break;
      }

      // Update lambdas
      for (let i = 0; i < numLambdas; i++) {
        lambdas[i] -= learningRate * gradients[i];
      }
    }

    return lambdas;
  }, [integrate]);

  // Main optimization
  const optimizationResult: OptimizationResult = useMemo(() => {
    const enabledConstraints = constraints.filter(c => c.enabled);
    
    if (enabledConstraints.length === 0) {
      // Uniform distribution when no constraints
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i <= 200; i++) {
        const x = i / 200;
        points.push({ x, y: 1 });
      }
      return {
        success: true,
        distribution: {
          points,
          lambdas: [0],
          entropy: 0 // log(1) = 0 for uniform on [0,1]
        }
      };
    }

    // Check feasibility
    const feasibilityError = checkFeasibility(enabledConstraints);
    if (feasibilityError) {
      return {
        success: false,
        error: feasibilityError
      };
    }

    try {
      // Find optimal lambdas
      const lambdas = findOptimalLambdas(enabledConstraints);
      
      // Calculate the distribution
      const { points, entropy } = calculateDistribution(lambdas, enabledConstraints);
      
      // Verify constraints are satisfied
      const unnormalizedPdf = (x: number) => {
        let exponent = lambdas[0];
        enabledConstraints.forEach((constraint, i) => {
          exponent += lambdas[i + 1] * Math.pow(x, constraint.power);
        });
        return Math.exp(Math.max(-50, Math.min(50, exponent)));
      };
      const Z = integrate(unnormalizedPdf);
      const pdf = (x: number) => unnormalizedPdf(x) / Z;
      
      // Check if constraints are approximately satisfied
      for (const constraint of enabledConstraints) {
        const calculatedMoment = integrate(x => pdf(x) * Math.pow(x, constraint.power));
        if (Math.abs(calculatedMoment - constraint.value) > 0.01) {
          return {
            success: false,
            error: `Could not satisfy constraint E[X^${constraint.power}] = ${constraint.value}. Got ${calculatedMoment.toFixed(3)} instead.`
          };
        }
      }
      
      return {
        success: true,
        distribution: { points, lambdas, entropy }
      };
    } catch (error) {
      return {
        success: false,
        error: "Numerical optimization failed. Try different constraint values."
      };
    }
  }, [constraints, checkFeasibility, findOptimalLambdas, calculateDistribution, integrate]);

  const updateConstraint = (id: string, field: 'enabled' | 'value', newValue: boolean | number) => {
    setConstraints(prev => prev.map(c => 
      c.id === id ? { ...c, [field]: newValue } : c
    ));
  };

  const resetToDefaults = () => {
    setConstraints(prev => prev.map(c => ({
      ...c,
      enabled: c.id === "mean",
      value: c.defaultValue
    })));
  };

  // Find the maximum y-value for scaling
  const maxY = optimizationResult.success && optimizationResult.distribution
    ? Math.max(...optimizationResult.distribution.points.map(p => p.y))
    : 1;

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-6 max-w-6xl mx-auto">
      {title && (
        <h3 className="text-xl font-semibold text-center text-gray-800">
          {title}
        </h3>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Panel - Constraints */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-gray-800">Polynomial Constraints</h4>
            <button
              onClick={resetToDefaults}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="space-y-3">
            {constraints.map((constraint) => (
              <div key={constraint.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                <input
                  type="checkbox"
                  checked={constraint.enabled}
                  onChange={(e) => updateConstraint(constraint.id, 'enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                
                <div className="flex-1 flex items-center space-x-2">
                  <div className="w-16">
                    <KatexMath math={constraint.mathDisplay} />
                  </div>
                  <span className="text-gray-600">=</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={constraint.value}
                    onChange={(e) => updateConstraint(constraint.id, 'value', parseFloat(e.target.value) || 0)}
                    disabled={!constraint.enabled}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <p className="text-blue-800">
              <strong>Tips:</strong> For distributions on [0,1]:
            </p>
            <ul className="mt-1 ml-4 list-disc text-blue-700">
              <li>All moments must be between 0 and 1</li>
              <li>E[X²] ≥ E[X]² (variance is non-negative)</li>
              <li>Start with just the mean constraint</li>
            </ul>
          </div>
        </div>

        {/* Right Panel - Result */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Maximum Entropy Distribution</h4>
          
          {optimizationResult.success ? (
            <div className="space-y-4">
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
                  {optimizationResult.distribution && (
                    <>
                      {/* Fill under curve */}
                      <path
                        d={`M 20 220 ${optimizationResult.distribution.points.map(p => 
                          `L ${p.x * 360 + 20} ${220 - (p.y / maxY) * 200}`
                        ).join(' ')} L 380 220 Z`}
                        fill="#3b82f6"
                        fillOpacity="0.2"
                      />
                      {/* Curve line */}
                      <path
                        d={`M ${optimizationResult.distribution.points.map(p => 
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

              {/* Info */}
              <div className="bg-white p-3 rounded-lg border">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Entropy:</span>
                    <span className="ml-2 font-mono">{optimizationResult.distribution?.entropy.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Active constraints:</span>
                    <span className="ml-2">{constraints.filter(c => c.enabled).length}</span>
                  </div>
                </div>
              </div>

              {/* Formula */}
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm text-gray-700 text-center">
                  Distribution form: <KatexMath math={`p(x) \\propto \\exp\\left(${
                    constraints.filter(c => c.enabled).length === 0 
                      ? '0' 
                      : constraints.filter(c => c.enabled)
                          .map((c, i) => `\\lambda_${i+1} x^${c.power}`)
                          .join(' + ')
                  }\\right)`} />
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-100 border-l-4 border-red-500 p-4">
              <p className="font-semibold text-red-800">Cannot create distribution</p>
              <p className="text-red-700 text-sm mt-1">{optimizationResult.error}</p>
              <p className="text-xs text-red-600 mt-2">
                Try adjusting constraint values or removing conflicting constraints.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DistributionConstraintBuilder;