"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";

// English letter frequencies (approximate percentages)
const DEFAULT_FREQUENCIES: Record<string, number> = {
  E: 12.70, T: 9.06, A: 8.17, O: 7.51, I: 6.97, N: 6.75, S: 6.33, H: 6.09,
  R: 5.99, D: 4.25, L: 4.03, C: 2.78, U: 2.76, M: 2.41, W: 2.36, F: 2.23,
  G: 2.02, Y: 1.97, P: 1.93, B: 1.29, V: 0.98, K: 0.77, J: 0.15, X: 0.15,
  Q: 0.10, Z: 0.07
};

interface CodeAssignment {
  letter: string;
  probability: number;
  codeLength: number;
  code: string;
  roundedProb: number;
}

interface TreeNode {
  letter?: string;
  code?: string;
  x: number;
  y: number;
}

export default function ShannonCodeWidget() {
  const [frequencies, setFrequencies] = useState<Record<string, number>>(DEFAULT_FREQUENCIES);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [codeAssignments, setCodeAssignments] = useState<CodeAssignment[]>([]);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);

  // Normalize frequencies to sum to 100
  const normalizedFrequencies = useMemo(() => {
    const sum = Object.values(frequencies).reduce((a, b) => a + b, 0);
    if (sum === 0) return frequencies;
    
    const normalized: Record<string, number> = {};
    Object.entries(frequencies).forEach(([letter, freq]) => {
      normalized[letter] = (freq / sum) * 100;
    });
    return normalized;
  }, [frequencies]);

  // Generate Shannon code assignments without animation
  const generateCodeAssignments = useCallback(() => {
    // Sort letters by frequency (descending)
    const sorted = Object.entries(normalizedFrequencies)
      .sort(([, a], [, b]) => b - a)
      .map(([letter, freq]) => ({ letter, probability: freq / 100 }));

    const assignments: CodeAssignment[] = [];
    
    // Step 1: Determine code lengths by rounding probabilities down to powers of 2
    for (const { letter, probability } of sorted) {
      if (probability <= 0) continue;
      
      const codeLength = Math.max(1, Math.ceil(-Math.log2(probability)));
      const roundedProb = Math.pow(2, -codeLength);
      
      assignments.push({
        letter,
        probability,
        codeLength,
        code: '', // Will be assigned in step 2
        roundedProb
      });
    }

    // Step 2: Greedily assign binary codes left-to-right
    let currentPrefix = 0;
    for (const assignment of assignments) {
      assignment.code = currentPrefix.toString(2).padStart(assignment.codeLength, '0');
      currentPrefix += 1;
    }

    return assignments;
  }, [normalizedFrequencies]);

  // Animation logic
  const startAnimation = useCallback(() => {
    const assignments = generateCodeAssignments();
    setCodeAssignments([]);
    setTreeNodes([]);
    setAnimationStep(0);
    setIsAnimating(true);
    
    // Animate table rows
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < assignments.length) {
        setCodeAssignments(prev => [...prev, assignments[currentStep]]);
        
        // Add tree node
        const assignment = assignments[currentStep];
        const treeWidth = 600;
        const nodeSpacing = Math.min(60, treeWidth / assignments.length);
        const x = 50 + currentStep * nodeSpacing;
        const y = 80;
        
        setTreeNodes(prev => [...prev, {
          letter: assignment.letter,
          code: assignment.code,
          x,
          y
        }]);
        
        currentStep++;
      } else {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 300);
  }, [generateCodeAssignments]);

  // Dragging logic
  const handleMouseDown = useCallback((letter: string, e: React.MouseEvent) => {
    if (isAnimating) return;
    
    const container = e.currentTarget.closest('.frequency-bars-container') as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const y = moveEvent.clientY - containerRect.top;
      const maxHeight = 128; // Height of the bar container
      const percentage = Math.max(0.1, Math.min(30, (1 - y / maxHeight) * 20));
      
      setFrequencies(prev => ({
        ...prev,
        [letter]: percentage
      }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isAnimating]);

  // Calculate metrics from current assignments
  const { entropy, averageCodeLength } = useMemo(() => {
    if (codeAssignments.length === 0) return { entropy: 0, averageCodeLength: 0 };
    
    let entropy = 0;
    let averageCodeLength = 0;
    
    for (const assignment of codeAssignments) {
      if (assignment.probability > 0) {
        entropy -= assignment.probability * Math.log2(assignment.probability);
        averageCodeLength += assignment.probability * assignment.codeLength;
      }
    }
    
    return { entropy, averageCodeLength };
  }, [codeAssignments]);

  return (
    <div className="shannon-code-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
      <h3 className="text-lg font-semibold mb-4">Shannon Code Constructor</h3>
      <p className="text-gray-600 mb-6">
        Drag the bars to adjust letter probabilities. Click &quot;Compute Shannon&apos;s Code&quot; to see 
        the animated construction of the code and tree.
      </p>

      {/* Letter frequency bars */}
      <div className="relative select-none frequency-bars-container">
        <div className="grid grid-cols-9 gap-2 mb-8">
          {Object.entries(normalizedFrequencies).map(([letter, freq]) => (
            <div key={letter} className="relative">
              <div className="h-32 bg-gray-100 rounded relative overflow-hidden">
                <div
                  className={`absolute bottom-0 left-0 right-0 bg-blue-500 transition-colors ${
                    isAnimating ? 'cursor-not-allowed' : 'cursor-ns-resize hover:bg-blue-600'
                  }`}
                  style={{ height: `${freq * 5}%` }}
                  onMouseDown={(e) => handleMouseDown(letter, e)}
                />
                <div className="absolute inset-x-0 top-2 text-center">
                  <div className="font-mono font-bold">{letter}</div>
                </div>
              </div>
              <div className="text-xs text-center mt-1 text-gray-600">
                {freq.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compute Button */}
      <div className="text-center mb-6">
        <button
          onClick={startAnimation}
          disabled={isAnimating}
          className={`px-6 py-3 rounded-lg font-semibold ${
            isAnimating 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isAnimating ? 'Computing...' : 'Compute Shannon\'s Code'}
        </button>
      </div>

      {/* Tree Visualization */}
      {treeNodes.length > 0 && (
        <div className="mt-6 mb-6">
          <h4 className="font-medium mb-4">Shannon Code Tree (Left-to-Right Assignment)</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <svg width="600" height="120" className="mx-auto">
              {treeNodes.map((node, i) => (
                <g key={i}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="20"
                    fill="#3b82f6"
                    stroke="#1d4ed8"
                    strokeWidth="2"
                  />
                  <text
                    x={node.x}
                    y={node.y - 2}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {node.letter}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + 35}
                    textAnchor="middle"
                    fill="#374151"
                    fontSize="10"
                    className="font-mono"
                  >
                    {node.code}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* Shannon Code Assignment Table */}
      {codeAssignments.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-4">Shannon Code Assignments</h4>
          <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
            <div className="grid grid-cols-4 gap-4 text-sm font-semibold text-gray-700 mb-3 sticky top-0 bg-gray-50">
              <div>Letter</div>
              <div>Probability</div>
              <div>Rounded to 2⁻ⁿ</div>
              <div>Code</div>
            </div>
            {codeAssignments.map((assignment, i) => (
              <div key={assignment.letter} className={`grid grid-cols-4 gap-4 text-sm py-2 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-100'} rounded mb-1`}>
                <div className="font-mono font-bold text-blue-600">{assignment.letter}</div>
                <div>{(assignment.probability * 100).toFixed(2)}%</div>
                <div>1/2<sup>{assignment.codeLength}</sup> = {(assignment.roundedProb * 100).toFixed(1)}%</div>
                <div className="font-mono text-green-600 font-bold">{assignment.code}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Display */}
      {codeAssignments.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-semibold text-blue-800 mb-2">Entropy (Information Content)</h5>
            <div className="text-2xl font-bold text-blue-600">
              {entropy.toFixed(3)} bits
            </div>
            <div className="text-sm text-blue-700 mt-1">
              H = -Σ p(x) log₂ p(x)
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h5 className="font-semibold text-green-800 mb-2">Average Code Length</h5>
            <div className="text-2xl font-bold text-green-600">
              {averageCodeLength.toFixed(3)} bits
            </div>
            <div className="text-sm text-green-700 mt-1">
              L = Σ p(x) × length(code(x))
            </div>
          </div>
        </div>
      )}
    </div>
  );
}