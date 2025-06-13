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
  const [speed, setSpeed] = useState(50); // pixels per second
  
  // Seismometer state
  const [seismometerY, setSeismometerY] = useState(0); // Current Y position of the point
  const [targetY, setTargetY] = useState(0); // Target Y position
  const [transitionStart, setTransitionStart] = useState(0); // When transition started
  const [transitionDuration, setTransitionDuration] = useState(0); // How long transition should take
  const [startY, setStartY] = useState(0); // Y position when transition started
  const [activeCoinId, setActiveCoinId] = useState<number | null>(null); // Which coin we're targeting
  const [tracePoints, setTracePoints] = useState<Array<{x: number, y: number}>>([]);
  const [paperOffset, setPaperOffset] = useState(0); // How far the "paper" has scrolled
  const [coinMarkers, setCoinMarkers] = useState<Array<{x: number, y: number, isHeads: boolean}>>([]);
  
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
  const TRIGGER_POSITION = CANVAS_WIDTH / 3; // When seismometer should reach target
  const PAPER_SCROLL_SPEED = 30; // Constant pixels per second for paper movement
  
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
    
    setCoins(prev => [...prev, newCoin]);
    setNextCoinId(prev => prev + 1);
  }, [p, nextCoinId]);

  const animate = useCallback((timestamp: number) => {
    if (!isRunning) return;

    const deltaTime = timestamp - lastUpdateRef.current;
    if (deltaTime > 16) { // ~60fps
      const pixelsPerMs = speed / 1000; // pixels per millisecond
      const deltaSeconds = deltaTime / 1000;
      
      // Update coin positions
      setCoins(prev => {
        const updated = prev.map(coin => ({
          ...coin,
          x: coin.x - pixelsPerMs * deltaTime
        })).filter(coin => coin.x > -COIN_SIZE);
        
        // Check if any coin reached the trigger position and should become the new target
        updated.forEach(coin => {
          if (coin.x <= TRIGGER_POSITION && coin.id !== activeCoinId) {
            // This coin just reached the trigger position
            // The seismometer should already be at this coin's target value
            // Now we need to start transitioning to the NEXT coin's target
            
            // Add marker for the current coin (seismometer should be at its value now)
            const currentSurprise = coin.isHeads 
              ? (q === 0 ? 7 : Math.log2(1/q))
              : (q === 1 ? 7 : Math.log2(1/(1-q)));
            
            const centerX = GRAPH_WIDTH / 2;
            const screenY = GRAPH_HEIGHT - Math.min(currentSurprise / 7, 1) * GRAPH_HEIGHT;
            setCoinMarkers(prev => [...prev, { 
              x: centerX, 
              y: screenY, 
              isHeads: coin.isHeads 
            }]);
            
            // Find the next coin to start transitioning to
            const nextCoin = updated.find(c => c.x > coin.x);
            if (nextCoin) {
              const nextSurprise = nextCoin.isHeads 
                ? (q === 0 ? 7 : Math.log2(1/q))
                : (q === 1 ? 7 : Math.log2(1/(1-q)));
              
              // Calculate transition duration: time for next coin to reach trigger
              const nextCoinDistance = COIN_SPACING; // Distance between coins
              const duration = nextCoinDistance / speed; // seconds
              
              // Start new transition to NEXT coin
              setStartY(seismometerY);
              setTargetY(nextSurprise);
              setTransitionStart(timeRef.current);
              setTransitionDuration(duration);
            }
            
            setActiveCoinId(coin.id);
          }
        });
        
        return updated;
      });
      
      // Update seismometer position with quadratic easing
      if (transitionDuration > 0) {
        const elapsed = timeRef.current - transitionStart;
        const progress = Math.min(1.0, elapsed / transitionDuration);
        const easedProgress = progress * progress * (3 - 2 * progress); // smoothstep
        const newY = startY + (targetY - startY) * easedProgress;
        setSeismometerY(newY);
        
        // Add point to trace (at fixed center position)
        const centerX = GRAPH_WIDTH / 2;
        const screenY = GRAPH_HEIGHT - Math.min(newY / 7, 1) * GRAPH_HEIGHT;
        setTracePoints(prev => [...prev, { x: centerX, y: screenY }]);
      }
      
      // Update paper offset (constant speed)
      setPaperOffset(prev => prev + PAPER_SCROLL_SPEED * deltaSeconds);
      
      // Scroll trace points left and remove old ones
      setTracePoints(prev => prev
        .map(point => ({ ...point, x: point.x - PAPER_SCROLL_SPEED * deltaSeconds }))
        .filter(point => point.x >= 0)
      );
      
      // Scroll coin markers left and remove old ones
      setCoinMarkers(prev => prev
        .map(marker => ({ ...marker, x: marker.x - PAPER_SCROLL_SPEED * deltaSeconds }))
        .filter(marker => marker.x >= -20)
      );
      
      timeRef.current += deltaSeconds;
      lastUpdateRef.current = timestamp;
    }

    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isRunning, speed, seismometerY, targetY, startY, transitionStart, transitionDuration, activeCoinId, p, q]);

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
    setSeismometerY(0);
    setTargetY(0);
    setTracePoints([]);
    setPaperOffset(0);
    setActiveCoinId(null);
    setCoinMarkers([]);
  };

  const stopAnimation = () => {
    setIsRunning(false);
  };

  const resetAnimation = () => {
    setIsRunning(false);
    setCoins([]);
    setSeismometerY(0);
    setTargetY(0);
    setTracePoints([]);
    setPaperOffset(0);
    setActiveCoinId(null);
    setCoinMarkers([]);
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
      <h3 className="text-lg font-semibold mb-4">Heart Rate Seismometer</h3>

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
          {/* Trigger position indicator */}
          <div
            className="absolute bg-red-300 opacity-50"
            style={{
              left: TRIGGER_POSITION,
              top: 0,
              width: 2,
              height: CANVAS_HEIGHT,
            }}
          />
          
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
                  src="/problens-web/cent_front_transparent.png" 
                  alt="Heads" 
                  className="w-full h-full"
                />
              ) : (
                <img 
                  src="/problens-web/cent_back_transparent.png" 
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
            
            {/* Center vertical line */}
            <line 
              x1={GRAPH_WIDTH / 2} 
              y1={0} 
              x2={GRAPH_WIDTH / 2} 
              y2={GRAPH_HEIGHT}
              stroke="#ccc" 
              strokeWidth="1" 
              strokeDasharray="2,2"
            />
            
            {/* Seismometer trace */}
            {tracePoints.length > 1 && (
              <path
                d={`M ${tracePoints[0].x} ${tracePoints[0].y} ${tracePoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`}
                fill="none"
                stroke="#4CAF50"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            
            {/* Current seismometer point */}
            <circle
              cx={GRAPH_WIDTH / 2}
              cy={GRAPH_HEIGHT - Math.min(seismometerY / 7, 1) * GRAPH_HEIGHT}
              r="4"
              fill="#4CAF50"
              stroke="#fff"
              strokeWidth="2"
            />
            
            {/* Coin markers on the curve */}
            {coinMarkers.map((marker, index) => (
              <image
                key={`coin-${index}`}
                x={marker.x - 8}
                y={marker.y - 8}
                width="16"
                height="16"
                href={marker.isHeads ? "/problens-web/cent_front_transparent.png" : "/problens-web/cent_back_transparent.png"}
                opacity="0.8"
              />
            ))}
          </svg>
        </div>
        
        {/* Legend */}
        <div className="mt-3 text-sm text-gray-600 text-center">
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500"></div>
              <span>Surprise: <KatexMath math="\log_2\left(\frac{1}{q}\right)" /> for heads, <KatexMath math="\log_2\left(\frac{1}{1-q}\right)" /> for tails</span>
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