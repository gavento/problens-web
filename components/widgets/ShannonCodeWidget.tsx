"use client";

import React, { useState, useEffect, useMemo } from "react";

// English letter frequencies (approximate percentages)
const DEFAULT_FREQUENCIES: Record<string, number> = {
  E: 12.70, T: 9.06, A: 8.17, O: 7.51, I: 6.97, N: 6.75, S: 6.33, H: 6.09,
  R: 5.99, D: 4.25, L: 4.03, C: 2.78, U: 2.76, M: 2.41, W: 2.36, F: 2.23,
  G: 2.02, Y: 1.97, P: 1.93, B: 1.29, V: 0.98, K: 0.77, J: 0.15, X: 0.15,
  Q: 0.10, Z: 0.07
};

interface TreeNode {
  left?: TreeNode;
  right?: TreeNode;
  letter?: string;
  probability: number;
  x?: number;
  y?: number;
  code?: string;
}

export default function ShannonCodeWidget() {
  const [frequencies, setFrequencies] = useState<Record<string, number>>(DEFAULT_FREQUENCIES);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  // Normalize frequencies to sum to 100
  const normalizedFrequencies = useMemo(() => {
    const sum = Object.values(frequencies).reduce((a, b) => a + b, 0);
    const normalized: Record<string, number> = {};
    Object.entries(frequencies).forEach(([letter, freq]) => {
      normalized[letter] = (freq / sum) * 100;
    });
    return normalized;
  }, [frequencies]);

  // Build Shannon code and calculate metrics
  const { codeAssignments, entropy, averageCodeLength } = useMemo(() => {
    // Sort letters by frequency (descending)
    const sorted = Object.entries(normalizedFrequencies)
      .sort(([, a], [, b]) => b - a)
      .map(([letter, freq]) => ({ letter, probability: freq / 100 }));

    // Shannon's coding algorithm
    const codeAssignments: { letter: string; probability: number; codeLength: number; code: string; roundedProb: number }[] = [];
    
    // Step 1: Determine code lengths by rounding probabilities down to powers of 2
    for (const { letter, probability } of sorted) {
      if (probability <= 0) continue;
      
      // Find the largest power of 2 that is ≤ probability
      // If probability = 0.127, then 1/8 = 0.125 ≤ 0.127 < 1/4 = 0.25, so code length = 3
      const codeLength = Math.max(1, Math.ceil(-Math.log2(probability)));
      const roundedProb = Math.pow(2, -codeLength);
      
      codeAssignments.push({
        letter,
        probability,
        codeLength,
        code: '', // Will be assigned in step 2
        roundedProb
      });
    }

    // Step 2: Greedily assign binary codes left-to-right
    // We assign codes by maintaining a "current position" in the binary tree
    let currentPrefix = 0;
    for (const assignment of codeAssignments) {
      // Convert current prefix to binary string of the required length
      assignment.code = currentPrefix.toString(2).padStart(assignment.codeLength, '0');
      
      // Move to next available prefix: add the "width" of this code block
      // A code of length L occupies 2^(maxLength - L) leaf positions
      // Since we're working greedily, we just move by 1 in the prefix space
      currentPrefix += 1;
    }

    // Calculate entropy: H = -Σ p(x) * log₂(p(x))
    let entropy = 0;
    for (const { probability } of codeAssignments) {
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    }

    // Calculate average code length: Σ p(x) * length(code(x))
    let averageCodeLength = 0;
    for (const { probability, codeLength } of codeAssignments) {
      averageCodeLength += probability * codeLength;
    }

    return { codeAssignments, entropy, averageCodeLength };
  }, [normalizedFrequencies]);

  // Calculate display layout for Shannon codes
  const displayLayout = useMemo(() => {
    const width = Math.max(600, codeAssignments.length * 100);
    const height = 200;
    
    return { width, height, codeAssignments };
  }, [codeAssignments]);

  const handleMouseDown = (letter: string, e: React.MouseEvent) => {
    setIsDragging(letter);
    
    // Get the container element for calculating relative positions
    const container = e.currentTarget.closest('.frequency-bars-container') as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const y = moveEvent.clientY - containerRect.top;
      const maxHeight = containerRect.height;
      const percentage = Math.max(0.01, Math.min(20, (1 - y / maxHeight) * 20));
      
      setFrequencies(prev => ({
        ...prev,
        [letter]: percentage
      }));
    };
    
    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="shannon-code-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
      <h3 className="text-lg font-semibold mb-4">Shannon Code Constructor</h3>
      <p className="text-gray-600 mb-6">
        Drag the bars to adjust letter probabilities. Shannon&apos;s method rounds each probability 
        down to a power of 2, then assigns codes greedily left-to-right.
      </p>

      {/* Letter frequency bars */}
      <div className="relative select-none frequency-bars-container">
        <div className="grid grid-cols-9 gap-2 mb-8">
          {Object.entries(normalizedFrequencies).map(([letter, freq]) => {
            const assignment = codeAssignments.find(a => a.letter === letter);
            const codeLength = assignment?.codeLength || Math.ceil(-Math.log2(freq / 100));
            const roundedProb = assignment?.roundedProb || Math.pow(2, -codeLength);
            
            return (
              <div key={letter} className="relative">
                <div className="h-32 bg-gray-100 rounded relative overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-blue-500 cursor-ns-resize hover:bg-blue-600 transition-colors"
                    style={{ height: `${freq * 5}%` }}
                    onMouseDown={(e) => handleMouseDown(letter, e)}
                  />
                  <div className="absolute inset-x-0 top-2 text-center">
                    <div className="font-mono font-bold">{letter}</div>
                  </div>
                </div>
                <div className="text-xs text-center mt-1 text-gray-600">
                  {freq.toFixed(1)}%
                  <br />
                  → 1/2<sup>{codeLength}</sup> = {(roundedProb * 100).toFixed(1)}%
                  <br />
                  <span className="font-mono text-green-600">{assignment?.code || '...'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shannon Code Assignment Table */}
      <div className="mt-8">
        <h4 className="font-medium mb-4">Shannon Code Assignments</h4>
        <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
          <div className="grid grid-cols-4 gap-4 text-sm font-semibold text-gray-700 mb-3">
            <div>Letter</div>
            <div>Probability</div>
            <div>Rounded to 2⁻ⁿ</div>
            <div>Code</div>
          </div>
          {codeAssignments.map((assignment, i) => (
            <div key={assignment.letter} className={`grid grid-cols-4 gap-4 text-sm py-2 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-100'} rounded`}>
              <div className="font-mono font-bold text-blue-600">{assignment.letter}</div>
              <div>{(assignment.probability * 100).toFixed(2)}%</div>
              <div>1/2<sup>{assignment.codeLength}</sup> = {(assignment.roundedProb * 100).toFixed(1)}%</div>
              <div className="font-mono text-green-600 font-bold">{assignment.code}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics Display */}
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

      {/* Efficiency Display */}
      <div className="mt-4 bg-gray-50 rounded-lg p-4">
        <div className="text-center">
          <span className="text-gray-700">Compression Efficiency: </span>
          <span className="font-bold text-purple-600">
            {((entropy / averageCodeLength) * 100).toFixed(1)}%
          </span>
          <span className="text-gray-600 text-sm ml-2">
            (Optimal would be {((entropy / entropy) * 100).toFixed(0)}%)
          </span>
        </div>
        <div className="text-xs text-gray-600 text-center mt-2">
          Shannon&apos;s method achieves at most H(p) + 1 bits per symbol (vs optimal H(p))
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p className="mb-2">
          <strong>How Shannon&apos;s method works:</strong> 
          1) Round each probability down to nearest power of 2: 1/2ⁿ
          2) Assign code length n to that symbol
          3) Assign actual binary codes greedily from left to right
        </p>
        <p>
          This method is simple but suboptimal when probabilities aren&apos;t exact powers of 2.
          The &quot;rounding down&quot; step causes inefficiency compared to Huffman coding.
        </p>
      </div>
    </div>
  );
}