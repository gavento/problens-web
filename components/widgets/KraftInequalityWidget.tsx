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
  // Start with example codes: 0001 (depth 4, pos 1), 010 (depth 3, pos 2), 10 (depth 2, pos 2)
  const [codeNodes, setCodeNodes] = useState<Set<string>>(new Set(['4-1', '3-2', '2-2']));

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
    const levelHeight = 50;
    
    // Horizontal distance from parent to child at each level
    const x_diffs = [180, 80, 40, 20, 10]; // Distance in pixels for each level (first reduced by 10%)
    
    function setPositions(node: TreeNode, x: number, y: number, depth: number = 0) {
      node.x = x;
      node.y = y;
      
      if (node.left && node.right) {
        const xDiff = x_diffs[depth] || 5; // Use configured distance, fallback to 5 pixels
        setPositions(node.left, x - xDiff, y + levelHeight, depth + 1);
        setPositions(node.right, x + xDiff, y + levelHeight, depth + 1);
      }
    }
    
    // Start from a center position
    setPositions(tree, 0, 20, 0);
    
    // Calculate actual bounds of the tree
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    function findBounds(node: TreeNode) {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
      
      if (node.left) findBounds(node.left);
      if (node.right) findBounds(node.right);
    }
    
    findBounds(tree);
    
    // Center the tree by adjusting all positions
    const centerOffsetX = -(minX + maxX) / 2;
    function centerTree(node: TreeNode) {
      node.x += centerOffsetX;
      if (node.left) centerTree(node.left);
      if (node.right) centerTree(node.right);
    }
    centerTree(tree);
    
    // Recalculate bounds after centering
    minX = Infinity; maxX = -Infinity;
    findBounds(tree);
    
    // Add padding around the tree
    const padding = 24; // Padding for node radius plus margin
    const width = Math.ceil(maxX - minX + padding * 2);
    const height = Math.ceil(maxY - minY + padding * 2);
    
    // Final adjustment to position content in canvas
    function finalOffset(node: TreeNode) {
      node.x += padding - minX;
      node.y += padding - minY;
      if (node.left) finalOffset(node.left);
      if (node.right) finalOffset(node.right);
    }
    finalOffset(tree);
    
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
        // When adding a new code node, remove any existing code nodes that are descendants
        const [depth, pos] = nodeId.split('-').map(Number);
        
        // Remove all descendants of this node
        const nodesToRemove = new Set<string>();
        for (let d = depth + 1; d <= maxDepth; d++) {
          const startPos = pos * Math.pow(2, d - depth);
          const endPos = (pos + 1) * Math.pow(2, d - depth);
          
          for (let p = startPos; p < endPos; p++) {
            const descendantId = `${d}-${p}`;
            if (newSet.has(descendantId)) {
              nodesToRemove.add(descendantId);
            }
          }
        }
        
        // Remove all identified descendants
        nodesToRemove.forEach(id => newSet.delete(id));
        
        // Add the new code node
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, [nodeStates, maxDepth]);

  // Find all free leaves (nodes at max depth with no code)
  const findFreeLeaf = useCallback((codeNodes: Set<string>) => {
    // Look for free leaf at maxDepth
    for (let pos = 0; pos < Math.pow(2, maxDepth); pos++) {
      const leafId = `${maxDepth}-${pos}`;
      
      // Check if this leaf is free (no code and no ancestor has code)
      let isFree = true;
      let currentDepth = maxDepth;
      let currentPos = pos;
      
      while (currentDepth >= 0) {
        const nodeId = `${currentDepth}-${currentPos}`;
        if (codeNodes.has(nodeId)) {
          isFree = false;
          break;
        }
        currentDepth--;
        currentPos = Math.floor(currentPos / 2);
      }
      
      if (isFree) return leafId;
    }
    return null;
  }, []);

  // Check if a subtree has any codes
  const hasCodeInSubtree = useCallback((rootId: string, codeNodes: Set<string>): boolean => {
    const [depth, pos] = rootId.split('-').map(Number);
    
    // Check all nodes in this subtree
    for (let d = depth; d <= maxDepth; d++) {
      const startPos = pos * Math.pow(2, d - depth);
      const endPos = (pos + 1) * Math.pow(2, d - depth);
      
      for (let p = startPos; p < endPos; p++) {
        if (codeNodes.has(`${d}-${p}`)) return true;
      }
    }
    return false;
  }, []);

  // Find leftmost code in subtree
  const findLeftmostCode = useCallback((rootId: string, codeNodes: Set<string>): string | null => {
    const [depth, pos] = rootId.split('-').map(Number);
    
    // Search level by level, left to right
    for (let d = depth; d <= maxDepth; d++) {
      const startPos = pos * Math.pow(2, d - depth);
      const endPos = (pos + 1) * Math.pow(2, d - depth);
      
      for (let p = startPos; p < endPos; p++) {
        const nodeId = `${d}-${p}`;
        if (codeNodes.has(nodeId)) return nodeId;
      }
    }
    return null;
  }, []);

  const improveCode = useCallback(() => {
    setCodeNodes(prev => {
      const newSet = new Set(prev);
      
      // Find a free leaf
      const freeLeaf = findFreeLeaf(newSet);
      if (!freeLeaf) return prev; // No improvement possible
      
      const [leafDepth, leafPos] = freeLeaf.split('-').map(Number);
      
      // Go up from free leaf to find improvement opportunity
      let currentDepth = leafDepth;
      let currentPos = leafPos;
      
      while (currentDepth > 0) {
        const parentDepth = currentDepth - 1;
        const parentPos = Math.floor(currentPos / 2);
        const parentId = `${parentDepth}-${parentPos}`;
        
        // Find sibling
        const siblingPos = parentPos * 2 + (currentPos % 2 === 0 ? 1 : 0);
        const siblingId = `${currentDepth}-${siblingPos}`;
        
        // Check if sibling subtree has codes
        if (hasCodeInSubtree(siblingId, newSet)) {
          // Found improvement opportunity!
          
          if (newSet.has(siblingId)) {
            // Case 1: Sibling itself is a code - move it up to parent
            newSet.delete(siblingId);
            newSet.add(parentId);
            return newSet;
          } else {
            // Case 2: Sibling has codes deeper - move leftmost to our position
            const leftmostCode = findLeftmostCode(siblingId, newSet);
            if (leftmostCode) {
              newSet.delete(leftmostCode);
              newSet.add(`${currentDepth}-${currentPos}`);
              return newSet;
            }
          }
        }
        
        // Move up one level
        currentDepth = parentDepth;
        currentPos = parentPos;
      }
      
      return prev; // No improvement found
    });
  }, [findFreeLeaf, hasCodeInSubtree, findLeftmostCode]);

  const resetCodes = useCallback(() => {
    setCodeNodes(new Set());
  }, []);

  return (
    <div className="kraft-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
      <h3 className="text-lg font-semibold mb-4">Kraft&apos;s Inequality Explorer</h3>
      <p className="widget-explanation mb-6">
        Click nodes to make them code words. Use &quot;Improve Code&quot; to improve the code towards Kraft equality.
      </p>

      {/* Tree Visualization */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 overflow-auto">
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
      <div className="flex gap-4 mb-6 justify-center">
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
    </div>
  );
}