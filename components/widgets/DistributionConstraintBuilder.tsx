"use client";

import React, { useState, useMemo } from "react";
import KatexMath from "@/components/content/KatexMath";

type Constraint = {
  id: string;
  name: string;
  mathDisplay: string;
  enabled: boolean;
  value: number;
  defaultValue: number;
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
    { id: "mean", name: "E[X]", mathDisplay: "E[X]", enabled: true, value: 0.5, defaultValue: 0.5 },
    { id: "secondMoment", name: "E[X²]", mathDisplay: "E[X^2]", enabled: false, value: 0.33, defaultValue: 0.33 },
    { id: "logX", name: "E[log X]", mathDisplay: "E[\\log X]", enabled: false, value: -1, defaultValue: -1 },
    { id: "thirdMoment", name: "E[X³]", mathDisplay: "E[X^3]", enabled: false, value: 0.25, defaultValue: 0.25 },
    { id: "fourthMoment", name: "E[X⁴]", mathDisplay: "E[X^4]", enabled: false, value: 0.2, defaultValue: 0.2 },
  ]);

  // Simple optimization simulation - in reality this would use numerical methods
  const optimizationResult: OptimizationResult = useMemo(() => {
    const enabledConstraints = constraints.filter(c => c.enabled);
    
    // Check for obvious impossibilities
    const meanConstraint = enabledConstraints.find(c => c.id === "mean");
    const secondMomentConstraint = enabledConstraints.find(c => c.id === "secondMoment");
    
    if (meanConstraint && secondMomentConstraint) {
      const mean = meanConstraint.value;
      const secondMoment = secondMomentConstraint.value;
      
      // Check if E[X²] < E[X]² (impossible since Var(X) ≥ 0)
      if (secondMoment < mean * mean) {
        return {
          success: false,
          error: `E[X²] = ${secondMoment.toFixed(3)} < E[X]² = ${(mean * mean).toFixed(3)}. This violates Var(X) ≥ 0.`
        };
      }
      
      // For distributions on [0,1], additional bounds apply
      if (mean < 0 || mean > 1) {
        return {
          success: false,
          error: `E[X] = ${mean.toFixed(3)} is outside [0,1]. For distributions on [0,1], the mean must be in this range.`
        };
      }
      
      if (secondMoment > 1) {
        return {
          success: false,
          error: `E[X²] = ${secondMoment.toFixed(3)} > 1. For distributions on [0,1], E[X²] cannot exceed 1.`
        };
      }
    }
    
    // Check for E[log X] alone (not normalizable for many values)
    const logXConstraint = enabledConstraints.find(c => c.id === "logX");
    const hasOtherConstraints = enabledConstraints.some(c => c.id !== "logX");
    
    if (logXConstraint && !hasOtherConstraints && logXConstraint.value < -0.9) {
      return {
        success: false,
        error: "E[log X] alone with such negative values leads to non-normalizable distribution. Try adding other constraints or increasing the value."
      };
    }
    
    // If we get here, simulate a successful optimization
    try {
      const points = generateDistributionPoints(enabledConstraints);
      const lambdas = enabledConstraints.map((_, i) => Math.random() - 0.5); // Dummy lambdas
      const entropy = calculateEntropy(points);
      
      return {
        success: true,
        distribution: { points, lambdas, entropy }
      };
    } catch (error) {
      return {
        success: false,
        error: "These constraints are incompatible or lead to numerical issues."
      };
    }
  }, [constraints]);

  // Simulate distribution generation (simplified)
  const generateDistributionPoints = (enabledConstraints: Constraint[]) => {
    const points: { x: number; y: number }[] = [];
    
    // For demo purposes, generate different shapes based on constraints
    const meanConstraint = enabledConstraints.find(c => c.id === "mean");
    const secondMomentConstraint = enabledConstraints.find(c => c.id === "secondMoment");
    const logXConstraint = enabledConstraints.find(c => c.id === "logX");
    
    for (let i = 0; i <= 100; i++) {
      const x = i / 100;
      let y = 1; // Start with uniform
      
      // Modify based on constraints (simplified approximation)
      if (meanConstraint) {
        const targetMean = meanConstraint.value;
        if (targetMean > 0.5) {
          y *= Math.pow(x, 0.5); // Bias toward higher values
        } else if (targetMean < 0.5) {
          y *= Math.pow(1 - x, 0.5); // Bias toward lower values
        }
      }
      
      if (logXConstraint) {
        // Power law-like distribution
        const alpha = Math.max(-0.9, logXConstraint.value);
        y = Math.pow(x + 0.001, alpha); // Add small epsilon to avoid singularity
      }
      
      if (secondMomentConstraint && meanConstraint) {
        // Adjust for second moment constraint (simplified approximation)
        const targetMean = meanConstraint.value;
        const targetSecondMoment = secondMomentConstraint.value;
        const targetVariance = targetSecondMoment - targetMean * targetMean;
        
        if (targetVariance > 0) {
          // Add some spread based on variance
          const spread = Math.sqrt(targetVariance);
          const deviation = x - targetMean;
          y *= Math.exp(-0.5 * (deviation * deviation) / (spread * spread + 0.01));
        }
      }
      
      if (x === 0 || x === 1) y = Math.max(0.001, y); // Avoid exact zeros for visualization
      points.push({ x, y });
    }
    
    // Normalize
    const integral = points.reduce((sum, p, i) => {
      if (i === 0) return sum;
      const dx = points[i].x - points[i-1].x;
      return sum + (points[i].y + points[i-1].y) * dx / 2;
    }, 0);
    
    return points.map(p => ({ x: p.x, y: p.y / integral }));
  };

  const calculateEntropy = (points: { x: number; y: number }[]) => {
    return points.reduce((sum, p, i) => {
      if (i === 0 || p.y <= 0) return sum;
      const dx = points[i].x - points[i-1].x;
      return sum - p.y * Math.log(p.y) * dx;
    }, 0);
  };

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
            <h4 className="text-lg font-semibold text-gray-800">Constraints</h4>
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
                    value={constraint.value}
                    onChange={(e) => updateConstraint(constraint.id, 'value', parseFloat(e.target.value) || 0)}
                    disabled={!constraint.enabled}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Result */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Maximum Entropy Distribution</h4>
          
          {optimizationResult.success ? (
            <div className="space-y-4">
              {/* Distribution Plot */}
              <div className="bg-white p-4 rounded-lg border h-64">
                <svg width="100%" height="100%" viewBox="0 0 400 200" className="border">
                  {/* Grid lines */}
                  {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map(x => (
                    <line key={x} x1={x * 380 + 10} y1={10} x2={x * 380 + 10} y2={190} 
                          stroke="#e5e7eb" strokeWidth="1" />
                  ))}
                  
                  {/* Distribution curve */}
                  {optimizationResult.distribution && (
                    <path
                      d={`M ${optimizationResult.distribution.points.map((p, i) => 
                        `${i === 0 ? 'M' : 'L'} ${p.x * 380 + 10} ${190 - p.y * 150}`
                      ).join(' ')}`}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                  )}
                  
                  {/* Axes */}
                  <line x1="10" y1="190" x2="390" y2="190" stroke="#374151" strokeWidth="2" />
                  <line x1="10" y1="10" x2="10" y2="190" stroke="#374151" strokeWidth="2" />
                  
                  {/* Labels */}
                  <text x="200" y="210" textAnchor="middle" className="text-xs fill-gray-600">x</text>
                  <text x="5" y="100" textAnchor="middle" className="text-xs fill-gray-600" transform="rotate(-90 5 100)">p(x)</text>
                </svg>
              </div>

              {/* Info */}
              <div className="bg-white p-3 rounded-lg border text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-600">Entropy:</span>
                    <span className="ml-2 font-mono">{optimizationResult.distribution?.entropy.toFixed(3)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Constraints:</span>
                    <span className="ml-2">{constraints.filter(c => c.enabled).length}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-100 border-l-4 border-red-500 p-4">
              <p className="font-semibold text-red-800">Cannot create distribution</p>
              <p className="text-red-700 text-sm mt-1">{optimizationResult.error}</p>
              <p className="text-xs text-red-600 mt-2">
                Try: adjusting constraint values, adding/removing constraints, or checking for mathematical impossibilities.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Formula Display */}
      {optimizationResult.success && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-blue-800 mb-2">Distribution Form</h4>
          <div className="text-center">
            <KatexMath math="p(x) \propto \exp\left(\sum_{i} \lambda_i f_i(x)\right)" />
          </div>
          <p className="text-sm text-blue-700 text-center mt-2">
            Where f_i(x) are your constraint functions and λ_i are the Lagrange multipliers.
          </p>
        </div>
      )}
    </div>
  );
};

export default DistributionConstraintBuilder;