"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import KatexMath from "@/components/content/KatexMath";

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
  id: string;
  depth: number;
  position: number;
  x: number;
  y: number;
  letter?: string;
  code?: string;
  isCodeNode: boolean;
  isVisible: boolean;
  parent?: TreeNode;
  left?: TreeNode;
  right?: TreeNode;
}

export default function ShannonCodeWidget() {
  const [frequencies, setFrequencies] = useState<Record<string, number>>(DEFAULT_FREQUENCIES);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [codeAssignments, setCodeAssignments] = useState<CodeAssignment[]>([]);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const zoomedTreeContainerRef = useRef<HTMLDivElement>(null);

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

  // Calculate probabilities
  const probabilities = useMemo(() => {
    const probs: Record<string, number> = {};
    Object.entries(normalizedFrequencies).forEach(([letter, freq]) => {
      probs[letter] = freq / 100;
    });
    return probs;
  }, [normalizedFrequencies]);

  // Calculate entropy and average code length
  const entropy = useMemo(() => {
    return Object.values(probabilities).reduce((sum, p) => {
      if (p > 0) {
        return sum - p * Math.log2(p);
      }
      return sum;
    }, 0);
  }, [probabilities]);

  const averageCodeLength = useMemo(() => {
    return codeAssignments.reduce((sum, assignment) => {
      return sum + assignment.probability * assignment.codeLength;
    }, 0);
  }, [codeAssignments]);

  const assignShannonCodes = useCallback(() => {
    // Sort letters by probability (highest first)
    const sortedLetters = Object.entries(probabilities)
      .filter(([_, prob]) => prob > 0)
      .sort(([,a], [,b]) => b - a);

    const assignments: CodeAssignment[] = [];
    
    sortedLetters.forEach(([letter, probability]) => {
      // Find the smallest n such that 2^(-n) <= probability < 2^(-(n-1))
      const codeLength = Math.ceil(-Math.log2(probability));
      const roundedProb = Math.pow(2, -codeLength);
      
      assignments.push({
        letter,
        probability,
        codeLength,
        code: '', // Will be assigned later
        roundedProb
      });
    });

    // Assign binary codes
    let codeIndex = 0;
    assignments.forEach(assignment => {
      const binary = codeIndex.toString(2).padStart(assignment.codeLength, '0');
      assignment.code = binary;
      codeIndex += Math.pow(2, assignment.codeLength - assignment.codeLength);
    });

    // Actually assign unique codes by maintaining a running sum
    let runningSum = 0;
    assignments.forEach(assignment => {
      const codeValue = Math.floor(runningSum * Math.pow(2, assignment.codeLength));
      assignment.code = codeValue.toString(2).padStart(assignment.codeLength, '0');
      runningSum += assignment.roundedProb;
    });

    setCodeAssignments(assignments);
  }, [probabilities]);

  const buildTree = useCallback((assignments: CodeAssignment[]) => {
    if (assignments.length === 0) return null;

    // Create a map to store all nodes
    const nodeMap = new Map<string, TreeNode>();
    
    // Create leaf nodes for each letter
    assignments.forEach((assignment, index) => {
      const leafId = assignment.code;
      const leafNode: TreeNode = {
        id: leafId,
        depth: assignment.codeLength,
        position: index,
        x: 0,
        y: 0,
        letter: assignment.letter,
        code: assignment.code,
        isCodeNode: true,
        isVisible: true
      };
      nodeMap.set(leafId, leafNode);
    });

    // Build internal nodes by working backwards from leaves
    const allPrefixes = new Set<string>();
    assignments.forEach(assignment => {
      for (let i = 1; i < assignment.code.length; i++) {
        allPrefixes.add(assignment.code.substring(0, i));
      }
    });

    // Create internal nodes
    Array.from(allPrefixes).sort((a, b) => a.length - b.length).forEach(prefix => {
      if (!nodeMap.has(prefix)) {
        const internalNode: TreeNode = {
          id: prefix,
          depth: prefix.length,
          position: 0,
          x: 0,
          y: 0,
          isCodeNode: false,
          isVisible: true
        };
        nodeMap.set(prefix, internalNode);
      }
    });

    // Create root node
    if (!nodeMap.has('')) {
      const rootNode: TreeNode = {
        id: '',
        depth: 0,
        position: 0,
        x: 0,
        y: 0,
        isCodeNode: false,
        isVisible: true
      };
      nodeMap.set('', rootNode);
    }

    // Link parent-child relationships
    nodeMap.forEach(node => {
      if (node.id !== '') {
        const parentId = node.id.substring(0, node.id.length - 1);
        const parent = nodeMap.get(parentId);
        if (parent) {
          node.parent = parent;
          if (node.id.endsWith('0')) {
            parent.left = node;
          } else {
            parent.right = node;
          }
        }
      }
    });

    return nodeMap.get('') || null;
  }, []);

  const animateTreeConstruction = useCallback(async () => {
    if (codeAssignments.length === 0) return;
    
    setIsAnimating(true);
    setAnimationStep(0);

    // Build the complete tree first
    const completeTree = buildTree(codeAssignments);
    if (!completeTree) return;

    // Initially hide all nodes
    const hideAllNodes = (node: TreeNode) => {
      node.isVisible = false;
      if (node.left) hideAllNodes(node.left);
      if (node.right) hideAllNodes(node.right);
    };
    hideAllNodes(completeTree);

    // Show root first
    completeTree.isVisible = true;
    setTree({ ...completeTree });
    setAnimationStep(1);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Show nodes level by level
    const maxDepth = Math.max(...codeAssignments.map(a => a.codeLength));
    for (let depth = 1; depth <= maxDepth; depth++) {
      const showNodesAtDepth = (node: TreeNode) => {
        if (node.depth === depth) {
          node.isVisible = true;
        }
        if (node.left) showNodesAtDepth(node.left);
        if (node.right) showNodesAtDepth(node.right);
      };
      
      showNodesAtDepth(completeTree);
      setTree({ ...completeTree });
      setAnimationStep(depth + 1);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setIsAnimating(false);
  }, [codeAssignments, buildTree]);

  const computeShannonCode = useCallback(() => {
    assignShannonCodes();
    // Tree animation will start after codes are assigned
  }, [assignShannonCodes]);

  // Auto-animate tree construction after codes are assigned
  useEffect(() => {
    if (codeAssignments.length > 0 && !isAnimating) {
      const timer = setTimeout(() => {
        animateTreeConstruction();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [codeAssignments, isAnimating, animateTreeConstruction]);

  // Update tree structure and positions
  useEffect(() => {
    if (codeAssignments.length > 0) {
      const newTree = buildTree(codeAssignments);
      if (newTree) {
        // Calculate positions for tree layout
        const calculatePositions = (node: TreeNode, depth: number = 0, position: number = 0): number => {
          node.depth = depth;
          node.position = position;
          
          let leftWidth = 0;
          let rightWidth = 0;
          
          if (node.left) {
            leftWidth = calculatePositions(node.left, depth + 1, position);
          }
          if (node.right) {
            rightWidth = calculatePositions(node.right, depth + 1, position + leftWidth + 1);
          }
          
          // Position this node in the middle of its children
          if (node.left && node.right) {
            node.position = (node.left.position + node.right.position) / 2;
          } else if (node.left) {
            node.position = node.left.position;
          } else if (node.right) {
            node.position = node.right.position;
          } else {
            node.position = position;
          }
          
          return leftWidth + rightWidth + 1;
        };
        
        calculatePositions(newTree);
        
        // Convert to pixel coordinates
        const NODE_WIDTH = 120;
        const NODE_HEIGHT = 80;
        
        const setPixelPositions = (node: TreeNode) => {
          node.x = node.position * NODE_WIDTH + 200;
          node.y = node.depth * NODE_HEIGHT + 50;
          
          if (node.left) setPixelPositions(node.left);
          if (node.right) setPixelPositions(node.right);
        };
        
        setPixelPositions(newTree);
        setTree(newTree);
      }
    }
  }, [codeAssignments, buildTree]);

  const handleFrequencyChange = useCallback((letter: string, newFrequency: number) => {
    setFrequencies(prev => ({
      ...prev,
      [letter]: Math.max(0, Math.min(50, newFrequency))
    }));
  }, []);

  // Helper function to get all visible nodes
  const getAllVisibleNodes = useCallback((node: TreeNode | null): TreeNode[] => {
    if (!node) return [];
    const nodes: TreeNode[] = [];
    if (node.isVisible) {
      nodes.push(node);
    }
    if (node.left) {
      nodes.push(...getAllVisibleNodes(node.left));
    }
    if (node.right) {
      nodes.push(...getAllVisibleNodes(node.right));
    }
    return nodes;
  }, []);

  const allVisibleNodes = useMemo(() => {
    return getAllVisibleNodes(tree);
  }, [tree, getAllVisibleNodes]);

  // Calculate canvas dimensions based on visible nodes
  const canvasDimensions = useMemo(() => {
    if (allVisibleNodes.length === 0) {
      return { width: 800, height: 400 };
    }
    
    const minX = Math.min(...allVisibleNodes.map(node => node.x));
    const maxX = Math.max(...allVisibleNodes.map(node => node.x));
    const minY = Math.min(...allVisibleNodes.map(node => node.y));
    const maxY = Math.max(...allVisibleNodes.map(node => node.y));
    
    // Add some padding
    const padding = 50;
    const width = Math.max(2100, maxX - minX + padding * 2); // Increased minimum width to account for 500 unit offset
    const height = Math.max(600, maxY - minY + padding * 2);
    
    return { width: Math.ceil(width), height: Math.ceil(height) };
  }, [allVisibleNodes]);

  return (
    <>
      {/* Fullscreen zoom overlay */}
      {isZoomed && tree && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-2xl font-semibold text-gray-800">
                Shannon Code Tree Construction (Full View)
              </h4>
              <button
                onClick={() => setIsZoomed(false)}
                className="text-3xl hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-[70vh]" ref={zoomedTreeContainerRef}>
              <svg width={canvasDimensions.width} height={canvasDimensions.height} className="mx-auto">
                {/* Draw edges */}
                {allVisibleNodes.map(node => (
                  <g key={`edges-${node.id}`}>
                    {node.left && node.left.isVisible && (
                      <line
                        x1={node.x}
                        y1={node.y}
                        x2={node.left.x}
                        y2={node.left.y}
                        stroke="#666"
                        strokeWidth="1"
                      />
                    )}
                    {node.right && node.right.isVisible && (
                      <line
                        x1={node.x}
                        y1={node.y}
                        x2={node.right.x}
                        y2={node.right.y}
                        stroke="#666"
                        strokeWidth="1"
                      />
                    )}
                  </g>
                ))}
                
                {/* Draw nodes */}
                {allVisibleNodes.map(node => (
                  <g key={`node-${node.id}`}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="20"
                      fill={node.isCodeNode ? "#22c55e" : "#e5e7eb"}
                      stroke={node.isCodeNode ? "#16a34a" : "#9ca3af"}
                      strokeWidth="2"
                    />
                    {node.isCodeNode && node.letter && (
                      <text
                        x={node.x}
                        y={node.y + 5}
                        textAnchor="middle"
                        className="text-sm font-bold fill-white"
                      >
                        {node.letter}
                      </text>
                    )}
                    {node.code && (
                      <text
                        x={node.x}
                        y={node.y + 40}
                        textAnchor="middle"
                        className="text-xs fill-gray-600"
                        fontFamily="monospace"
                      >
                        {node.code}
                      </text>
                    )}
                    
                    {/* Edge labels for 0 and 1 */}
                    {node.left && node.left.isVisible && (
                      <text
                        x={(node.x + node.left.x) / 2 - 8}
                        y={(node.y + node.left.y) / 2}
                        textAnchor="middle"
                        className="text-xs fill-red-600 font-bold"
                      >
                        0
                      </text>
                    )}
                    {node.right && node.right.isVisible && (
                      <text
                        x={(node.x + node.right.x) / 2 + 8}
                        y={(node.y + node.right.y) / 2}
                        textAnchor="middle"
                        className="text-xs fill-blue-600 font-bold"
                      >
                        1
                      </text>
                    )}
                  </g>
                ))}

                {/* Show codes at leaf nodes */}
                {allVisibleNodes.filter(node => node.isCodeNode && node.code).map(node => (
                  <g key={`code-${node.id}`}>
                    <text
                      x={node.x}
                      y={node.y - 30}
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {node.code}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      )}

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
              <div className="bg-gray-100 h-32 rounded relative overflow-hidden border">
                <div 
                  className="bg-blue-500 absolute bottom-0 w-full transition-all duration-200 cursor-ns-resize"
                  style={{ height: `${(freq / 15) * 100}%` }}
                  onMouseDown={(e) => {
                    const startY = e.clientY;
                    const startFreq = freq;
                    
                    const handleMouseMove = (e: MouseEvent) => {
                      const deltaY = startY - e.clientY;
                      const newFreq = startFreq + (deltaY / 128) * 15;
                      handleFrequencyChange(letter, newFreq);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-600 to-blue-400"></div>
                </div>
              </div>
              <div className="text-center mt-2">
                <div className="font-mono font-bold text-lg">{letter}</div>
                <div className="text-sm text-gray-600">{freq.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={computeShannonCode}
          disabled={isAnimating}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isAnimating ? 'Constructing...' : 'Compute Shannon\'s Code'}
        </button>
        
        <button
          onClick={() => setFrequencies(DEFAULT_FREQUENCIES)}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Reset to English
        </button>
      </div>

      {/* Tree visualization */}
      {tree && allVisibleNodes.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Shannon Code Tree Construction</h4>
            <button
              onClick={() => setIsZoomed(true)}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              🔍 View Full Size
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96" ref={treeContainerRef}>
            <svg width={Math.min(canvasDimensions.width, 1000)} height={Math.min(canvasDimensions.height, 350)} className="mx-auto">
              {/* Draw edges */}
              {allVisibleNodes.map(node => (
                <g key={`edges-${node.id}`}>
                  {node.left && node.left.isVisible && (
                    <line
                      x1={node.x * 0.8}
                      y1={node.y * 0.8}
                      x2={node.left.x * 0.8}
                      y2={node.left.y * 0.8}
                      stroke="#666"
                      strokeWidth="1"
                    />
                  )}
                  {node.right && node.right.isVisible && (
                    <line
                      x1={node.x * 0.8}
                      y1={node.y * 0.8}
                      x2={node.right.x * 0.8}
                      y2={node.right.y * 0.8}
                      stroke="#666"
                      strokeWidth="1"
                    />
                  )}
                </g>
              ))}
              
              {/* Draw nodes */}
              {allVisibleNodes.map(node => (
                <g key={`node-${node.id}`}>
                  <circle
                    cx={node.x * 0.8}
                    cy={node.y * 0.8}
                    r="15"
                    fill={node.isCodeNode ? "#22c55e" : "#e5e7eb"}
                    stroke={node.isCodeNode ? "#16a34a" : "#9ca3af"}
                    strokeWidth="2"
                  />
                  {node.isCodeNode && node.letter && (
                    <text
                      x={node.x * 0.8}
                      y={node.y * 0.8 + 4}
                      textAnchor="middle"
                      className="text-xs font-bold fill-white"
                    >
                      {node.letter}
                    </text>
                  )}
                  
                  {/* Edge labels for 0 and 1 */}
                  {node.left && node.left.isVisible && (
                    <text
                      x={(node.x + node.left.x) * 0.8 / 2 - 6}
                      y={(node.y + node.left.y) * 0.8 / 2}
                      textAnchor="middle"
                      className="text-xs fill-red-600 font-bold"
                    >
                      0
                    </text>
                  )}
                  {node.right && node.right.isVisible && (
                    <text
                      x={(node.x + node.right.x) * 0.8 / 2 + 6}
                      y={(node.y + node.right.y) * 0.8 / 2}
                      textAnchor="middle"
                      className="text-xs fill-blue-600 font-bold"
                    >
                      1
                    </text>
                  )}
                </g>
              ))}

              {/* Show codes at leaf nodes */}
              {allVisibleNodes.filter(node => node.isCodeNode && node.code).map(node => (
                <g key={`code-${node.id}`}>
                  {node.code && (
                    <text
                      x={node.x * 0.8}
                      y={node.y * 0.8 - 20}
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {node.code}
                    </text>
                  )}
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
          <div className="bg-gray-50 rounded-lg p-4">
            {/* Fixed header outside scrollable area */}
            <div className="grid grid-cols-4 gap-4 text-sm font-semibold text-gray-700 mb-3 p-2 bg-gray-100 rounded">
              <div>Letter</div>
              <div>Probability</div>
              <div className="bg-white px-2 py-1 rounded shadow-sm">
                <KatexMath math="\text{Rounded to } 2^{-n}" />
              </div>
              <div>Code</div>
            </div>
            {/* Scrollable content area */}
            <div className="max-h-64 overflow-y-auto" ref={tableContainerRef}>
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
        </div>
      )}

      {/* Metrics Display */}
      {codeAssignments.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-semibold text-blue-800 mb-2">Entropy</h5>
            <div className="text-2xl font-bold text-blue-600">
              {entropy.toFixed(3)} bits
            </div>
            <div className="text-sm text-blue-700 mt-1">
              <KatexMath math="H = \sum p(x) \log_2 \frac{1}{p(x)}" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h5 className="font-semibold text-green-800 mb-2">Average Code Length</h5>
            <div className="text-2xl font-bold text-green-600">
              {averageCodeLength.toFixed(3)} bits
            </div>
            <div className="text-sm text-green-700 mt-1">
              <KatexMath math="L = \sum p(x) \times \text{length}(\text{code}(x))" />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}