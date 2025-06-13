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
  const [currentTime, setCurrentTime] = useState(0); // For smooth interpolation
  
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
  
  // Special cases for extreme q values
  const isQExtreme = q === 0 || q === 1;
  const showInfiniteMessage = isQExtreme && !(p === 0 && q === 0);
  
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
    
    // Calculate when this coin will reach the center for smooth timing
    const timeToCenter = (CANVAS_WIDTH / 2 + COIN_SPACING) / speed; // seconds to reach center
    const surpriseTime = timeRef.current + timeToCenter;
    
    // Add surprise value to heart rate data with future timestamp
    let surprise: number;
    if (isHeads) {
      surprise = q === 0 ? 7 : Math.log2(1/q); // Cap at 7 for visualization
    } else {
      surprise = q === 1 ? 7 : Math.log2(1/(1-q)); // Cap at 7 for visualization
    }
    setHeartRateData(prev => {
      const newData = [...prev, { time: surpriseTime, surprise }];
      return newData.slice(-MAX_POINTS); // Keep only last MAX_POINTS
    });
    
    setCoins(prev => [...prev, newCoin]);
    setNextCoinId(prev => prev + 1);
  }, [p, q, nextCoinId, speed]);

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
      setCurrentTime(timeRef.current);
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

      {/* Parameter Controls */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            p(heads): {p.toFixed(2)} <span className="text-gray-500">(true probability)</span>
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
            q(heads): {q.toFixed(2)} <span className="text-gray-500">(model probability)</span>
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
            Coin movement speed
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
            {[0, 1, 2, 3, 4, 5, 6, 7].map(val => {
              const y = GRAPH_HEIGHT - (val / 7) * GRAPH_HEIGHT;
              return (
                <g key={val}>
                  <line x1={0} y1={y} x2={GRAPH_WIDTH} y2={y} stroke="#e0e0e0" strokeWidth="1"/>
                  <text x={5} y={y - 5} fontSize="12" fill="#666">{val}</text>
                </g>
              );
            })}
            
            {/* Cross-entropy constant line or infinite message */}
            {showInfiniteMessage ? (
              <text 
                x={GRAPH_WIDTH / 2} 
                y={30} 
                fontSize="14" 
                fill="#ff6b6b"
                textAnchor="middle"
                fontWeight="bold"
              >
                {q === 0 ? "Infinite surprise on heads ⇒ infinite cross-entropy" : "Infinite surprise on tails ⇒ infinite cross-entropy"}
              </text>
            ) : (
              <>
                <line 
                  x1={0} 
                  y1={GRAPH_HEIGHT - (crossEntropy / 7) * GRAPH_HEIGHT} 
                  x2={GRAPH_WIDTH} 
                  y2={GRAPH_HEIGHT - (crossEntropy / 7) * GRAPH_HEIGHT}
                  stroke="#ff6b6b" 
                  strokeWidth="2" 
                  strokeDasharray="5,5"
                />
                <text 
                  x={GRAPH_WIDTH - 120} 
                  y={GRAPH_HEIGHT - (crossEntropy / 7) * GRAPH_HEIGHT - 5} 
                  fontSize="12" 
                  fill="#ff6b6b"
                >
                  Cross-entropy: {crossEntropy.toFixed(2)}
                </text>
              </>
            )}
            
            {/* Heart rate line - seismometer style with smooth real-time spline */}
            {heartRateData.length > 0 && (() => {
              const centerX = GRAPH_WIDTH / 2;
              const timeSpan = 10; // seconds visible on graph
              const pixelsPerSecond = GRAPH_WIDTH / timeSpan;
              
              // Filter points that should be visible based on current time
              const visiblePoints = heartRateData.filter(point => 
                point.time >= currentTime - timeSpan/2 && point.time <= currentTime + timeSpan/2
              );
              
              if (visiblePoints.length === 0) return null;
              
              // Create interpolated points for smooth real-time rendering
              const renderPoints: Array<{x: number, y: number, time: number}> = [];
              
              // Add points at regular time intervals for smooth interpolation
              const startTime = currentTime - timeSpan/2;
              const endTime = currentTime + timeSpan/2;
              const timeStep = 0.1; // seconds between interpolated points
              
              for (let t = startTime; t <= endTime; t += timeStep) {
                // Find surrounding data points for interpolation
                const beforePoint = visiblePoints.filter(p => p.time <= t).slice(-1)[0];
                const afterPoint = visiblePoints.find(p => p.time > t);
                
                let interpolatedSurprise: number;
                
                if (!beforePoint && !afterPoint) {
                  continue; // No data available
                } else if (!beforePoint) {
                  interpolatedSurprise = afterPoint!.surprise;
                } else if (!afterPoint) {
                  interpolatedSurprise = beforePoint.surprise;
                } else {
                  // Linear interpolation between points
                  const timeDiff = afterPoint.time - beforePoint.time;
                  const ratio = (t - beforePoint.time) / timeDiff;
                  interpolatedSurprise = beforePoint.surprise + ratio * (afterPoint.surprise - beforePoint.surprise);
                }
                
                // Convert to screen coordinates
                const x = centerX + (t - currentTime) * pixelsPerSecond;
                const y = GRAPH_HEIGHT - Math.min(interpolatedSurprise / 7, 1) * GRAPH_HEIGHT;
                
                // Only add points that are visible on screen
                if (x >= 0 && x <= GRAPH_WIDTH) {
                  renderPoints.push({ x, y, time: t });
                }
              }
              
              if (renderPoints.length < 2) return null;
              
              // Create smooth spline path using cubic bezier curves
              let pathData = `M ${renderPoints[0].x} ${renderPoints[0].y}`;
              
              for (let i = 1; i < renderPoints.length; i++) {
                const current = renderPoints[i];
                const previous = renderPoints[i - 1];
                
                if (i === 1) {
                  // First segment - start with smooth curve
                  const next = renderPoints[i + 1] || current;
                  const cp1x = previous.x + (current.x - previous.x) * 0.3;
                  const cp1y = previous.y;
                  const cp2x = current.x - (next.x - previous.x) * 0.3;
                  const cp2y = current.y;
                  pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${current.x} ${current.y}`;
                } else if (i === renderPoints.length - 1) {
                  // Last segment - end smoothly
                  const prev2 = renderPoints[i - 2] || previous;
                  const cp1x = previous.x + (current.x - prev2.x) * 0.3;
                  const cp1y = previous.y;
                  const cp2x = current.x - (current.x - previous.x) * 0.3;
                  const cp2y = current.y;
                  pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${current.x} ${current.y}`;
                } else {
                  // Middle segments - smooth interpolation
                  const next = renderPoints[i + 1];
                  const prev2 = renderPoints[i - 2] || previous;
                  const cp1x = previous.x + (current.x - prev2.x) * 0.3;
                  const cp1y = previous.y + (current.y - prev2.y) * 0.3;
                  const cp2x = current.x - (next.x - previous.x) * 0.3;
                  const cp2y = current.y - (next.y - previous.y) * 0.3;
                  pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${current.x} ${current.y}`;
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
            {heartRateData.filter(point => {
              const centerX = GRAPH_WIDTH / 2;
              const timeSpan = 10;
              const pixelsPerSecond = GRAPH_WIDTH / timeSpan;
              const x = centerX + (point.time - currentTime) * pixelsPerSecond;
              return x >= 0 && x <= GRAPH_WIDTH;
            }).map((point, index, array) => {
              const centerX = GRAPH_WIDTH / 2;
              const timeSpan = 10;
              const pixelsPerSecond = GRAPH_WIDTH / timeSpan;
              const x = centerX + (point.time - currentTime) * pixelsPerSecond;
              const y = GRAPH_HEIGHT - Math.min(point.surprise / 7, 1) * GRAPH_HEIGHT;
              
              // Highlight points that are close to current time
              const timeDiff = Math.abs(point.time - currentTime);
              const opacity = timeDiff < 1 ? 1 : Math.max(0.3, 1 - timeDiff / 5);
              
              return (
                <circle
                  key={`${point.time}-${index}`}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#4CAF50"
                  opacity={opacity}
                />
              );
            })}
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