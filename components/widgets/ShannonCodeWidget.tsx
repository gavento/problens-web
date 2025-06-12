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

  // Build Shannon-Fano tree
  const tree = useMemo(() => {
    // Sort letters by frequency (descending)
    const sorted = Object.entries(normalizedFrequencies)
      .sort(([, a], [, b]) => b - a)
      .map(([letter, prob]) => ({ letter, probability: prob / 100 }));

    // Shannon-Fano algorithm
    function buildTree(items: { letter: string; probability: number }[]): TreeNode {
      if (items.length === 1) {
        return { letter: items[0].letter, probability: items[0].probability };
      }

      // Find split point that minimizes difference in probabilities
      const total = items.reduce((sum, item) => sum + item.probability, 0);
      let leftSum = 0;
      let bestSplit = 1;
      let bestDiff = Infinity;

      for (let i = 1; i < items.length; i++) {
        leftSum += items[i - 1].probability;
        const rightSum = total - leftSum;
        const diff = Math.abs(leftSum - rightSum);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestSplit = i;
        }
      }

      const leftItems = items.slice(0, bestSplit);
      const rightItems = items.slice(bestSplit);

      return {
        left: buildTree(leftItems),
        right: buildTree(rightItems),
        probability: total
      };
    }

    const root = buildTree(sorted);
    
    // Assign codes
    function assignCodes(node: TreeNode, code: string = ""): void {
      if (node.letter) {
        node.code = code;
      } else {
        if (node.left) assignCodes(node.left, code + "0");
        if (node.right) assignCodes(node.right, code + "1");
      }
    }
    
    assignCodes(root);
    return root;
  }, [normalizedFrequencies]);

  // Calculate tree layout
  const treeLayout = useMemo(() => {
    const width = 800;
    const height = 400;
    const nodeRadius = 20;
    const levelHeight = 60;

    function layoutTree(node: TreeNode, x: number, y: number, spread: number): void {
      node.x = x;
      node.y = y;

      if (node.left && node.right) {
        const leftSpread = spread * 0.6;
        const rightSpread = spread * 0.6;
        layoutTree(node.left, x - spread/2, y + levelHeight, leftSpread);
        layoutTree(node.right, x + spread/2, y + levelHeight, rightSpread);
      }
    }

    layoutTree(tree, width / 2, 40, width * 0.8);

    // Collect all nodes for rendering
    const nodes: TreeNode[] = [];
    function collectNodes(node: TreeNode) {
      nodes.push(node);
      if (node.left) collectNodes(node.left);
      if (node.right) collectNodes(node.right);
    }
    collectNodes(tree);

    return { nodes, width, height, nodeRadius };
  }, [tree]);

  const handleMouseDown = (letter: string) => {
    setIsDragging(letter);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const maxHeight = rect.height;
    const percentage = Math.max(0.01, Math.min(20, (1 - y / maxHeight) * 20));
    
    setFrequencies(prev => ({
      ...prev,
      [isDragging]: percentage
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  return (
    <div className="shannon-code-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
      <h3 className="text-lg font-semibold mb-4">Shannon-Fano Code Constructor</h3>
      <p className="text-gray-600 mb-6">
        Drag the bars to adjust letter probabilities. The binary tree below shows the 
        resulting Shannon-Fano code, which assigns shorter codes to more frequent letters.
      </p>

      {/* Letter frequency bars */}
      <div 
        className="relative select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="grid grid-cols-9 gap-2 mb-8">
          {Object.entries(normalizedFrequencies).map(([letter, freq]) => {
            const codeLength = tree.code?.length || Math.ceil(-Math.log2(freq / 100));
            const threshold = Math.pow(2, -Math.floor(-Math.log2(freq / 100)));
            
            return (
              <div key={letter} className="relative">
                <div className="h-32 bg-gray-100 rounded relative overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-blue-500 cursor-ns-resize hover:bg-blue-600 transition-colors"
                    style={{ height: `${freq * 5}%` }}
                    onMouseDown={() => handleMouseDown(letter)}
                  />
                  <div className="absolute inset-x-0 top-2 text-center">
                    <div className="font-mono font-bold">{letter}</div>
                  </div>
                </div>
                <div className="text-xs text-center mt-1 text-gray-600">
                  {freq.toFixed(2)}%
                  <br />
                  &lt; 1/2<sup>{codeLength}</sup>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shannon-Fano Tree Visualization */}
      <div className="mt-8">
        <h4 className="font-medium mb-4">Shannon-Fano Binary Tree</h4>
        <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
          <svg 
            width={treeLayout.width} 
            height={treeLayout.height}
            className="mx-auto"
          >
            {/* Draw edges */}
            {treeLayout.nodes.map((node, i) => {
              if (!node.left || !node.right || !node.x || !node.y || !node.left.x || !node.left.y || !node.right.x || !node.right.y) return null;
              
              const isRoot = node === tree;
              
              return (
                <g key={`edges-${i}`}>
                  {/* Left edge */}
                  <line
                    x1={node.x}
                    y1={node.y}
                    x2={node.left.x}
                    y2={node.left.y}
                    stroke="#666"
                    strokeWidth="2"
                  />
                  {isRoot && node.x && node.left.x && node.y && node.left.y && (
                    <text
                      x={(node.x + node.left.x) / 2 - 10}
                      y={(node.y + node.left.y) / 2}
                      fill="#666"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      0
                    </text>
                  )}
                  
                  {/* Right edge */}
                  <line
                    x1={node.x}
                    y1={node.y}
                    x2={node.right.x}
                    y2={node.right.y}
                    stroke="#666"
                    strokeWidth="2"
                  />
                  {isRoot && node.x && node.right.x && node.y && node.right.y && (
                    <text
                      x={(node.x + node.right.x) / 2 + 5}
                      y={(node.y + node.right.y) / 2}
                      fill="#666"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      1
                    </text>
                  )}
                </g>
              );
            })}
            
            {/* Draw nodes */}
            {treeLayout.nodes.map((node, i) => {
              if (!node.x || !node.y) return null;
              
              return (
                <g key={`node-${i}`}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.letter ? 16 : 8}
                    fill={node.letter ? "#3b82f6" : "#9ca3af"}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  {node.letter && (
                    <>
                      <text
                        x={node.x}
                        y={node.y + 5}
                        textAnchor="middle"
                        fill="white"
                        fontSize="14"
                        fontWeight="bold"
                      >
                        {node.letter}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 35}
                        textAnchor="middle"
                        fill="#666"
                        fontSize="11"
                        className="font-mono"
                      >
                        {node.code}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p className="mb-2">
          <strong>How it works:</strong> The Shannon-Fano algorithm recursively splits 
          letters into groups with approximately equal total probability, assigning 0 to 
          the left group and 1 to the right group.
        </p>
        <p>
          Letters with higher probabilities get shorter codes, achieving compression close 
          to the entropy limit: H = -Σ p(x) log₂ p(x)
        </p>
      </div>
    </div>
  );
}