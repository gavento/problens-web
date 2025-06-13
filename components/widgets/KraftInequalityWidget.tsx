"use client";

import React, { useState, useMemo, useCallback } from "react";

interface TreeNode {
  id: string;
  x: number;
  y: number;
  depth: number;
  isCode: boolean;
  isDisabled: boolean;
  parent?: TreeNode;
  left?: TreeNode;
  right?: TreeNode;
}

export default function KraftInequalityWidget() {
  const maxDepth = 4;
  const [codeNodes, setCodeNodes] = useState<Set<string>>(new Set());

  // Build complete binary tree
  const tree = useMemo(() => {
    const nodes = new Map<string, TreeNode>();
    
    // Create all nodes
    for (let depth = 0; depth <= maxDepth; depth++) {
      for (let pos = 0; pos < Math.pow(2, depth); pos++) {
        const id = `${depth}-${pos}`;
        nodes.set(id, {
          id,
          x: 0, // Will be set later
          y: 0, // Will be set later
          depth,
          isCode: false,
          isDisabled: false
        });
      }
    }
    
    // Set up parent-child relationships
    for (let depth = 0; depth < maxDepth; depth++) {
      for (let pos = 0; pos < Math.pow(2, depth); pos++) {
        const nodeId = `${depth}-${pos}`;
        const leftChildId = `${depth + 1}-${pos * 2}`;
        const rightChildId = `${depth + 1}-${pos * 2 + 1}`;
        
        const node = nodes.get(nodeId)!;
        const leftChild = nodes.get(leftChildId);
        const rightChild = nodes.get(rightChildId);
        
        if (leftChild) {
          node.left = leftChild;
          leftChild.parent = node;
        }
        if (rightChild) {
          node.right = rightChild;
          rightChild.parent = node;
        }
      }
    }
    
    return nodes.get('0-0')!;
  }, []);

  // Layout tree positions
  const layoutTree = useMemo(() => {
    const width = 600;
    const height = 300;
    const levelHeight = 50;
    
    function setPositions(node: TreeNode, x: number, y: number, spread: number) {
      node.x = x;
      node.y = y;
      
      if (node.left && node.right) {
        setPositions(node.left, x - spread/2, y + levelHeight, spread * 0.6);
        setPositions(node.right, x + spread/2, y + levelHeight, spread * 0.6);
      }
    }
    
    setPositions(tree, width / 2, 30, width * 0.8);
    
    return { width, height };
  }, [tree]);

  // Update node states based on code selections
  const nodeStates = useMemo(() => {
    const states = new Map<string, { isCode: boolean; isDisabled: boolean }>();
    
    function traverse(node: TreeNode) {
      const isCode = codeNodes.has(node.id);
      let isDisabled = false;
      
      // Check if any ancestor is a code node
      let current = node.parent;
      while (current) {
        if (codeNodes.has(current.id)) {
          isDisabled = true;
          break;
        }
        current = current.parent;
      }
      
      states.set(node.id, { isCode, isDisabled });
      
      if (node.left) traverse(node.left);
      if (node.right) traverse(node.right);
    }
    
    traverse(tree);
    return states;
  }, [tree, codeNodes]);

  // Calculate Kraft sum
  const kraftSum = useMemo(() => {
    let sum = 0;
    for (const nodeId of codeNodes) {
      const depth = parseInt(nodeId.split('-')[0]);
      sum += Math.pow(2, -depth);
    }
    return sum;
  }, [codeNodes]);

  // Collect all nodes for rendering
  const allNodes = useMemo(() => {
    const nodes: TreeNode[] = [];
    function collect(node: TreeNode) {
      nodes.push(node);
      if (node.left) collect(node.left);
      if (node.right) collect(node.right);
    }
    collect(tree);
    return nodes;
  }, [tree]);

  const handleNodeClick = useCallback((nodeId: string) => {
    const state = nodeStates.get(nodeId);
    if (state?.isDisabled) return;
    
    setCodeNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, [nodeStates]);

  const improveCode = useCallback(() => {
    setCodeNodes(prev => {
      const newSet = new Set<string>();
      
      // Get code nodes sorted by position (left to right, top to bottom)
      const codeNodesList = Array.from(prev).sort((a, b) => {
        const [depthA, posA] = a.split('-').map(Number);
        const [depthB, posB] = b.split('-').map(Number);
        if (depthA !== depthB) return depthA - depthB;
        return posA - posB;
      });
      
      for (const nodeId of codeNodesList) {
        const [depth, pos] = nodeId.split('-').map(Number);
        
        // Try to move to parent if parent is not already a code and not disabled
        if (depth > 0) {
          const parentDepth = depth - 1;
          const parentPos = Math.floor(pos / 2);
          const parentId = `${parentDepth}-${parentPos}`;
          
          // Check if parent is available (not already a code node in our new set)
          if (!newSet.has(parentId)) {
            // Check if moving to parent would conflict with sibling
            const siblingPos = parentPos * 2 + (pos % 2 === 0 ? 1 : 0);
            const siblingId = `${depth}-${siblingPos}`;
            
            if (!prev.has(siblingId)) {
              // Safe to move to parent
              newSet.add(parentId);
              continue;
            }
          }
        }
        
        // Can't improve, keep the original
        newSet.add(nodeId);
      }
      
      return newSet;
    });
  }, []);

  const resetCodes = useCallback(() => {
    setCodeNodes(new Set());
  }, []);

  return (
    <div className="kraft-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
      <h3 className="text-lg font-semibold mb-4">Kraft&apos;s Inequality Explorer</h3>
      <p className="text-gray-600 mb-6">
        Click nodes to make them code words. Code nodes are shown in blue with thick borders.
        Nodes below code words are disabled (greyed out). Use &quot;Improve Code&quot; to move codes up when possible.
      </p>

      {/* Tree Visualization */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <svg width={layoutTree.width} height={layoutTree.height} className="mx-auto">
          {/* Draw edges */}
          {allNodes.map(node => (
            <g key={`edges-${node.id}`}>
              {node.left && (
                <line
                  x1={node.x}
                  y1={node.y}
                  x2={node.left.x}
                  y2={node.left.y}
                  stroke="#666"
                  strokeWidth="1"
                />
              )}
              {node.right && (
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
          {allNodes.map(node => {
            const state = nodeStates.get(node.id);
            const isCode = state?.isCode || false;
            const isDisabled = state?.isDisabled || false;
            
            return (
              <g key={`node-${node.id}`}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="12"
                  fill={isDisabled ? "#e5e7eb" : isCode ? "#3b82f6" : "#f3f4f6"}
                  stroke={isCode ? "#1d4ed8" : "#9ca3af"}
                  strokeWidth={isCode ? "3" : "1"}
                  className={isDisabled ? "cursor-not-allowed" : "cursor-pointer hover:stroke-blue-500"}
                  onClick={() => handleNodeClick(node.id)}
                />
                {isCode && (
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {node.depth}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={improveCode}
          disabled={codeNodes.size === 0}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Improve Code
        </button>
        <button
          onClick={resetCodes}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </button>
      </div>

      {/* Kraft Sum Display */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="text-center">
          <div className="text-sm text-blue-700 mb-2">Kraft Sum:</div>
          <div className="text-2xl font-bold text-blue-600 mb-2">
            Σ 2<sup>-ℓᵢ</sup> = {kraftSum.toFixed(4)}
          </div>
          <div className="text-sm text-blue-700">
            {kraftSum <= 1 ? (
              <span className="text-green-600 font-semibold">
                ✓ Satisfies Kraft&apos;s inequality (≤ 1)
              </span>
            ) : (
              <span className="text-red-600 font-semibold">
                ✗ Violates Kraft&apos;s inequality (&gt; 1)
              </span>
            )}
          </div>
          {codeNodes.size > 0 && (
            <div className="text-xs text-blue-600 mt-2">
              Code lengths: {Array.from(codeNodes).sort().map(id => {
                const depth = parseInt(id.split('-')[0]);
                return depth;
              }).join(', ')}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p className="mb-2">
          <strong>Kraft&apos;s Inequality:</strong> For any prefix-free binary code with lengths ℓ₁, ℓ₂, ..., ℓₖ,
          the sum Σ 2<sup>-ℓᵢ</sup> ≤ 1.
        </p>
        <p>
          The &quot;Improve Code&quot; button moves code words up the tree when possible, 
          reducing their lengths and improving the code efficiency while maintaining the Kraft bound.
        </p>
      </div>
    </div>
  );
}