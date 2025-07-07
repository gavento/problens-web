"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { InlineMath } from "react-katex";

const N = 16;
const DEFAULT_CANVAS_W = 600;
const CANVAS_H = 280;
const LINE_HEIGHT = CANVAS_H * 0.55;
const BASELINE_Y = CANVAS_H * 0.85;
// Use relative coordinates (0 to 1) for positioning
const MIN_X_RELATIVE = 0;
const MAX_X_RELATIVE = 1;

function gaussian(x: number, mu: number, sigma: number) {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma));
}

export default function GaussianFitWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(DEFAULT_CANVAS_W);
  
  // Responsive canvas width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 32; // padding
        setCanvasWidth(Math.min(DEFAULT_CANVAS_W, containerWidth));
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  // Initial positions: Gaussian with even larger spread and more outliers (in relative coordinates 0-1)
  const [linePositions, setLinePositions] = useState<number[]>(() => {
    // Generate positions with even larger spread and multiple outliers (relative coordinates)
    const positions = [
      0.25, 0.35, 0.65, 0.30, 0.70, 0.45, 0.28, 0.68,  // Wider main cluster around center
      0.75, 0.20, 0.60, 0.72, 0.22, 0.67, 0.78,         // More spread
      0.05  // Strong outlier near left edge
    ];
    // Ensure all positions are within bounds
    return positions.map(pos => Math.max(MIN_X_RELATIVE + 0.02, Math.min(MAX_X_RELATIVE - 0.02, pos)));
  });
  
  const [mode, setMode] = useState<"best" | "manual">("best");
  
  // mu,sigma state (manual) - in relative coordinates
  const [muSig, setMuSig] = useState<{ mu: number; sigma: number }>({ mu: 0.5, sigma: 0.2 });

  // recompute mle if mode=best (in relative coordinates)
  const { mu, sigma } = useMemo(() => {
    if (mode === "best") {
      const mean = linePositions.reduce((acc, pos) => acc + pos, 0) / N;
      const variance = linePositions.reduce((acc, pos) => acc + (pos - mean) ** 2, 0) / N;
      return { mu: mean, sigma: Math.sqrt(variance || 0.01) };
    }
    return muSig;
  }, [mode, linePositions, muSig]);

  // cross-entropy calculation
  const crossEntropy = useMemo(() => {
    // Empirical distribution: uniform over the 16 observations
    const p = 1 / N;
    
    // Gaussian evaluated at each line position
    let crossEnt = 0;
    for (const pos of linePositions) {
      const q = gaussian(pos, mu, sigma);
      if (q > 0) {
        crossEnt -= p * Math.log(q);
      }
    }
    
    return crossEnt;
  }, [linePositions, mu, sigma]);

  // drag handlers
  const onLineDrag = (idx: number, e: React.MouseEvent<SVGElement> | React.TouchEvent<SVGElement>) => {
    e.preventDefault();
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startPos = linePositions[idx];
    
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const deltaX = clientX - startX;
      const deltaPos = deltaX / canvasWidth; // Convert to relative coordinates
      const newPos = Math.max(MIN_X_RELATIVE + 0.02, Math.min(MAX_X_RELATIVE - 0.02, startPos + deltaPos));
      
      setLinePositions((positions) => {
        const next = [...positions];
        next[idx] = newPos;
        return next;
      });
    };
    
    const handleEnd = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  };

  // Format function for displaying values
  const formatValue = (value: number, decimals: number = 2) => value.toFixed(decimals);

  const handleModeChange = (m: "best" | "manual") => setMode(m);

  return (
    <div ref={containerRef} className="p-4 bg-gray-50 rounded-lg space-y-4 max-w-full">
      {/* Widget title */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Fitting data with a Gaussian</h3>
      </div>
      
      {/* toggle */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1">
          {[
            ["best", "Best fit"],
            ["manual", "Try different fits"],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => handleModeChange(val as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === val ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg width={canvasWidth} height={CANVAS_H + 40} className="bg-white border rounded-lg" style={{ minWidth: canvasWidth }}>
          {/* Horizontal baseline */}
          <line
            x1={0}
            y1={BASELINE_Y}
            x2={canvasWidth}
            y2={BASELINE_Y}
            stroke="#d1d5db"
            strokeWidth={2}
          />
          
          {/* Vertical lines representing data points */}
          {linePositions.map((pos, i) => {
            const x = pos * canvasWidth; // Convert from relative to pixel coordinates
            const topY = BASELINE_Y - LINE_HEIGHT;
            const bottomY = BASELINE_Y;
            
            return (
              <g key={i}>
                {/* Invisible hit area for easier dragging */}
                <rect
                  x={x - 10}
                  y={topY - 5}
                  width={20}
                  height={bottomY - topY + 10}
                  fill="transparent"
                  cursor="ew-resize"
                  onMouseDown={(e) => onLineDrag(i, e)}
                  onTouchStart={(e) => onLineDrag(i, e)}
                />
                {/* Main vertical line */}
                <line
                  x1={x}
                  y1={topY}
                  x2={x}
                  y2={bottomY}
                  stroke="#3b82f6"
                  strokeWidth={4}
                  cursor="ew-resize"
                  style={{ pointerEvents: 'none' }}
                />
                {/* Horizontal tick on top */}
                <line
                  x1={x - 12}
                  y1={topY}
                  x2={x + 12}
                  y2={topY}
                  stroke="#3b82f6"
                  strokeWidth={4}
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            );
          })}
          
          {/* gaussian curve */}
          <polyline
            fill="none"
            stroke="#ef4444"
            strokeWidth={3}
            opacity={0.9}
            points={Array.from({ length: canvasWidth }, (_, px) => {
              const xVal = px / canvasWidth; // Convert to relative coordinates
              const yVal = gaussian(xVal, mu, sigma);
              // Scale the gaussian to fit nicely, starting from baseline
              const maxGaussian = gaussian(mu, mu, sigma);
              const scaledY = (yVal / maxGaussian) * LINE_HEIGHT * 0.8;
              return `${px},${BASELINE_Y - scaledY}`;
            }).join(" ")}
          />
          
        </svg>
      </div>
      
      {/* Instruction text - less visible, directly below canvas */}
      <div className="text-center text-xs text-gray-400 mt-1">
        Drag bars left/right to change input distribution
      </div>
      
      {/* mu and sigma controls when manual mode */}
      {mode === "manual" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {/* mu control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mean (μ): {formatValue(mu)}
            </label>
            <input
              type="range"
              min={MIN_X_RELATIVE}
              max={MAX_X_RELATIVE}
              step="0.01"
              value={mu}
              onChange={(e) => setMuSig((s) => ({ ...s, mu: parseFloat(e.target.value) }))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-red-200"
            />
          </div>
          
          {/* sigma control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Standard Deviation (σ): {formatValue(sigma)}
            </label>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={sigma}
              onChange={(e) => setMuSig((s) => ({ ...s, sigma: parseFloat(e.target.value) }))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-orange-200"
            />
          </div>
        </div>
      )}
      
      {/* Horizontal divider */}
      <hr className="border-gray-300 my-4" />
      
      {/* Distribution legend */}
      <div className="flex justify-center gap-6 mb-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">
            <InlineMath math="p_{\text{empirical}}" />
          </span>
          <span className="text-blue-600 font-medium">: the empirical distribution</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-600">
            <InlineMath math="q_{\text{Gaussian}}" />
          </span>
          <span className="text-red-600 font-medium">: the model</span>
        </div>
      </div>
      
      {/* Cross-entropy display */}
      <div className="text-center">
        <span className="text-lg font-semibold">
          Cross-entropy score: <InlineMath math={`H(p_{\\text{empirical}}, q_{\\text{Gaussian}}) = ${crossEntropy.toFixed(3)}`} />
        </span>
      </div>
      
      
    </div>
  );
}