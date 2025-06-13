"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import KatexMath from "@/components/content/KatexMath";

interface Coin {
  id: number;
  isHeads: boolean;
  x: number;
}

interface HeartRatePoint {
  time: number;
  surprise: number;
}

interface Props {
  initialP?: number;
  initialQ?: number;
  isPEditable?: boolean;
  isQEditable?: boolean;
  default_p?: number;
  default_q?: number;
  change_p?: boolean;
  change_q?: boolean;
}

export default function HeartRateWidget({
  initialP,
  initialQ,
  isPEditable,
  isQEditable,
  default_p = 0.5,
  default_q = 0.5,
  change_p = true,
  change_q = true,
}: Props) {
  const [p, setP] = useState(initialP ?? default_p);
  const [q, setQ] = useState(initialQ ?? default_q);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [nextCoinId, setNextCoinId] = useState(0);
  const [heartRateData, setHeartRateData] = useState<HeartRatePoint[]>([]);
  const [speed, setSpeed] = useState(50); // pixels per second
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  
  const COIN_SIZE = 60;
  const COIN_SPACING = 120; // Increased spacing since we only show 2 coins
  const CANVAS_WIDTH = 200; // Much smaller - fits only 2 coins
  const CANVAS_HEIGHT = 100;
  
  const GRAPH_HEIGHT = 200;
  const GRAPH_WIDTH = 400;
  const MAX_POINTS = 50; // Keep last 50 data points
  
  // Calculate cross-entropy (average surprise)
  const crossEntropy = p * Math.log2(1/q) + (1-p) * Math.log2(1/(1-q));
  
  // Initialize with some coins
  useEffect(() => {
    const initialCoins: Coin[] = [];
    for (let i = 0; i < 3; i++) {
      initialCoins.push({
        id: i,
        isHeads: Math.random() < p,
        x: CANVAS_WIDTH + i * COIN_SPACING,
      });
    }
    setCoins(initialCoins);
    setNextCoinId(3);
  }, [p]);

  const generateNewCoin = useCallback(() => {
    const isHeads = Math.random() < p;
    const newCoin: Coin = {
      id: nextCoinId,
      isHeads,
      x: CANVAS_WIDTH + COIN_SPACING,
    };
    
    // Add surprise value to heart rate data
    const surprise = isHeads ? Math.log2(1/q) : Math.log2(1/(1-q));
    setHeartRateData(prev => {
      const newData = [...prev, { time: timeRef.current, surprise }];
      return newData.slice(-MAX_POINTS); // Keep only last MAX_POINTS
    });
    
    setCoins(prev => [...prev, newCoin]);
    setNextCoinId(prev => prev + 1);
  }, [p, q, nextCoinId]);

  const animate = useCallback((timestamp: number) => {
    if (!isRunning) return;

    const deltaTime = timestamp - lastUpdateRef.current;
    if (deltaTime > 16) { // ~60fps
      const pixelsPerMs = speed / 1000; // pixels per millisecond
      
      setCoins(prev => {
        const updated = prev.map(coin => ({
          ...coin,
          x: coin.x - pixelsPerMs * deltaTime
        })).filter(coin => coin.x > -COIN_SIZE);
        
        return updated;
      });
      
      timeRef.current += deltaTime / 1000; // Convert to seconds
      lastUpdateRef.current = timestamp;
    }

    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isRunning, speed]);

  // Check if we need to generate a new coin
  useEffect(() => {
    if (!isRunning) return;
    
    const rightmostCoin = Math.max(...coins.map(c => c.x), -Infinity);
    if (rightmostCoin < CANVAS_WIDTH - COIN_SPACING/2) {
      generateNewCoin();
    }
  }, [coins, isRunning, generateNewCoin]);

  useEffect(() => {
    if (isRunning) {
      lastUpdateRef.current = performance.now();
      const startAnimation = () => {
        animationRef.current = requestAnimationFrame(animate);
      };
      startAnimation();
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, animate]);

  const startAnimation = () => {
    setIsRunning(true);
    timeRef.current = 0;
    setHeartRateData([]);
  };

  const stopAnimation = () => {
    setIsRunning(false);
  };

  const resetAnimation = () => {
    setIsRunning(false);
    setCoins([]);
    setHeartRateData([]);
    timeRef.current = 0;
    setNextCoinId(0);
    
    // Re-initialize
    const initialCoins: Coin[] = [];
    for (let i = 0; i < 3; i++) {
      initialCoins.push({
        id: i,
        isHeads: Math.random() < p,
        x: CANVAS_WIDTH + i * COIN_SPACING,
      });
    }
    setCoins(initialCoins);
    setNextCoinId(3);
  };

  return (
    <div className="heartrate-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
      <h3 className="text-lg font-semibold mb-4">Heart Rate Widget</h3>
      <p className="text-gray-600 mb-6">
        Watch coins flow and see the &quot;heartbeat&quot; of surprise values below.
      </p>

      {/* Parameter Controls */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            p(heads): {p.toFixed(2)} <span className="text-gray-500">(true probability of heads)</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={p}
            onChange={(e) => setP(parseFloat(e.target.value))}
            disabled={!change_p}
            className={`w-full ${!change_p ? 'opacity-50' : ''}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            q(heads): {q.toFixed(2)} <span className="text-gray-500">(model probability of heads)</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={q}
            onChange={(e) => setQ(parseFloat(e.target.value))}
            disabled={!change_q}
            className={`w-full ${!change_q ? 'opacity-50' : ''}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Speed: {speed} px/s <span className="text-gray-500">(coin movement speed)</span>
          </label>
          <input
            type="range"
            min="10"
            max="150"
            step="5"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Animation Controls */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={startAnimation}
          disabled={isRunning}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Start
        </button>
        <button
          onClick={stopAnimation}
          disabled={!isRunning}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Stop
        </button>
        <button
          onClick={resetAnimation}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </button>
      </div>

      {/* Coin Animation Canvas */}
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <div
          ref={canvasRef}
          className="relative overflow-hidden bg-white rounded border-2 border-gray-300"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            margin: '0 auto'
          }}
        >
          {coins.map(coin => (
            <div
              key={coin.id}
              className="absolute transition-none"
              style={{
                left: coin.x,
                top: (CANVAS_HEIGHT - COIN_SIZE) / 2,
                width: COIN_SIZE,
                height: COIN_SIZE,
              }}
            >
              {coin.isHeads ? (
                <img 
                  src="/images/cent_front_compressed.png" 
                  alt="Heads" 
                  className="w-full h-full"
                />
              ) : (
                <img 
                  src="/images/cent_back_compressed.png" 
                  alt="Tails" 
                  className="w-full h-full"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Heart Rate Graph */}
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="bg-white rounded border-2 border-gray-300 relative" 
             style={{ width: GRAPH_WIDTH, height: GRAPH_HEIGHT, margin: '0 auto' }}>
          
          <svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT} className="absolute inset-0">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Y-axis labels and lines */}
            {[0, 1, 2, 3, 4, 5].map(val => {
              const y = GRAPH_HEIGHT - (val / 5) * GRAPH_HEIGHT;
              return (
                <g key={val}>
                  <line x1={0} y1={y} x2={GRAPH_WIDTH} y2={y} stroke="#e0e0e0" strokeWidth="1"/>
                  <text x={5} y={y - 5} fontSize="12" fill="#666">{val}</text>
                </g>
              );
            })}
            
            {/* Cross-entropy constant line */}
            <line 
              x1={0} 
              y1={GRAPH_HEIGHT - (crossEntropy / 5) * GRAPH_HEIGHT} 
              x2={GRAPH_WIDTH} 
              y2={GRAPH_HEIGHT - (crossEntropy / 5) * GRAPH_HEIGHT}
              stroke="#ff6b6b" 
              strokeWidth="2" 
              strokeDasharray="5,5"
            />
            <text 
              x={GRAPH_WIDTH - 120} 
              y={GRAPH_HEIGHT - (crossEntropy / 5) * GRAPH_HEIGHT - 5} 
              fontSize="12" 
              fill="#ff6b6b"
            >
              Cross-entropy: {crossEntropy.toFixed(2)}
            </text>
            
            {/* Heart rate line - seismometer style */}
            {heartRateData.length > 1 && (() => {
              // For seismometer style: newest point is always at center (x = GRAPH_WIDTH/2)
              // Older points scroll to the left
              const centerX = GRAPH_WIDTH / 2;
              const pointSpacing = 8; // pixels between points
              
              const points = heartRateData.map((point, index) => {
                // Calculate x position: newest at center, older points to the left
                const pointsFromEnd = heartRateData.length - 1 - index;
                const x = centerX - (pointsFromEnd * pointSpacing);
                const y = GRAPH_HEIGHT - Math.min(point.surprise / 5, 1) * GRAPH_HEIGHT;
                return { x, y, visible: x >= 0 }; // Only show points that are still visible
              }).filter(point => point.visible);

              if (points.length < 2) return null;

              // Create smooth curve using quadratic bezier curves
              let pathData = `M ${points[0].x} ${points[0].y}`;
              
              for (let i = 1; i < points.length; i++) {
                const current = points[i];
                const previous = points[i - 1];
                
                if (i === points.length - 1) {
                  // Last point - straight line
                  pathData += ` L ${current.x} ${current.y}`;
                } else {
                  // Smooth curve to next point
                  const next = points[i + 1];
                  const controlX = (previous.x + current.x) / 2;
                  const controlY = (previous.y + current.y) / 2;
                  pathData += ` Q ${controlX} ${controlY} ${current.x} ${current.y}`;
                }
              }

              return (
                <path
                  d={pathData}
                  fill="none"
                  stroke="#4CAF50"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })()}
            
            {/* Current surprise markers - seismometer style */}
            {heartRateData.slice(-5).map((point, index, array) => {
              const centerX = GRAPH_WIDTH / 2;
              const pointSpacing = 8;
              const pointsFromEnd = array.length - 1 - index;
              const x = centerX - (pointsFromEnd * pointSpacing);
              const y = GRAPH_HEIGHT - Math.min(point.surprise / 5, 1) * GRAPH_HEIGHT;
              
              // Only show markers that are visible
              if (x < 0) return null;
              
              return (
                <circle
                  key={`${point.time}-${index}`}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#4CAF50"
                  opacity={index === array.length - 1 ? 1 : 0.6} // Highlight the newest point
                />
              );
            }).filter(Boolean)}
          </svg>
        </div>
        
        {/* Legend */}
        <div className="mt-3 text-sm text-gray-600 text-center">
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500"></div>
              <span>Surprise: <KatexMath math="\log_2(1/q)" /> for heads, <KatexMath math="\log_2(1/(1-q))" /> for tails</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-500 border-dashed border-t-2"></div>
              <span>Cross-entropy (average surprise)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}