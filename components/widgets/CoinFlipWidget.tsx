"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import KatexMath from "@/components/content/KatexMath";

// ====================================================================
// CROSS-ENTROPY WIDGET - FIXED & STABILIZED VERSION
// ====================================================================
//
// Main fixes applied:
// - Correct dynamic calculation of seismometer transition duration
// - SeismometerY vs tracePoints derived cleanly (no flicker)
// - animate() callback stable via useRef
// - activeCoinId managed via useRef
//
// EDUCATIONAL CONCEPT:
// - Shows how "surprise" varies when reality (p) differs from our model (q)
// - Visualizes cross-entropy: the average surprise when using model q to 
//   predict events with true distribution p
// - Demonstrates information theory concepts in an intuitive, dynamic way
//
// ====================================================================

interface Coin {
  id: number;
  isHeads: boolean;
  x: number;
}

interface Props {
  initialP?: number;
  initialQ?: number;
  change_p?: boolean;
  change_q?: boolean;
  default_p?: number;
  default_q?: number;
}

export default function CrossEntropyWidget({
  initialP,
  initialQ,
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
  
  // ====================================================================
  // CONSTANTS SECTION
  // ====================================================================
  
  // ===== WIDGET CONSTANTS =====
  const COIN_SIZE = 70;                    // Pixel size of coin images in top canvas
  const CANVAS_WIDTH = 200;                // Width of top coin animation canvas
  const CANVAS_HEIGHT = 100;               // Height of top coin animation canvas
  const GRAPH_HEIGHT = 200;                // Height of seismometer graph area
  const GRAPH_WIDTH = 400;                 // Width of seismometer graph area
  const COIN_SPACING = 100;                // Consistent spacing between coins (both visual and logical)
  const TRIGGER_POSITION = CANVAS_WIDTH / 3;   // Where seismometer sync happens
  const PAPER_SCROLL_SPEED = 30;           // Constant speed for seismometer trace scrolling (px/sec)
  
  // ====================================================================
  // SYNCHRONIZATION LOGIC EXPLANATION
  // ====================================================================
  // 
  // The widget maintains perfect synchronization between coin movement and seismometer:
  //
  // 1. COINS MOVE LEFT: Coins start off-screen right and move left at user-controlled speed
  // 2. TRIGGER DETECTION: When a coin reaches TRIGGER_POSITION, synchronization occurs
  // 3. SEISMOMETER TIMING: The seismometer should ALREADY BE at that coin's surprise value
  // 4. TRANSITION START: We immediately start transitioning to the NEXT coin's value
  // 5. PERFECT SYNC: By the time the next coin reaches trigger, seismometer is ready
  //
  // KEY INSIGHT: The seismometer is always one step ahead, transitioning TO the next
  // coin's value while the current coin crosses the trigger line.
  //
  // COIN SPACING AND TIMING:
  // - All coins are spaced COIN_SPACING pixels apart
  // - Seismometer synchronizes when coins reach TRIGGER_POSITION
  // ====================================================================
  
  // ====================================================================
  // DERIVED VALUES AND SPECIAL CASES
  // ====================================================================
  
  // Calculate cross-entropy (average surprise) - the theoretical average
  const crossEntropy = p * Math.log2(1/q) + (1-p) * Math.log2(1/(1-q));
  
  // Handle extreme probability values that would cause infinite surprise
  const isQExtreme = q === 0 || q === 1;
  const showInfiniteMessage = isQExtreme && !(p === 0 && q === 0);
  
  // ====================================================================
  // INITIALIZATION: SETUP INITIAL COINS
  // ====================================================================
  
  // Create initial coins when component mounts or when true probability (p) changes
  useEffect(() => {
    const initialCoins: Coin[] = [];
    
    // Create initial coins with consistent spacing
    // Start them further off-screen to give seismometer time to prepare
    const startX = CANVAS_WIDTH + COIN_SPACING;
    for (let i = 0; i < 4; i++) {  // Create 4 coins for smoother start
      initialCoins.push({
        id: i,
        isHeads: Math.random() < p,
        x: startX + i * COIN_SPACING,
      });
    }
    
    setCoins(initialCoins);
    setNextCoinId(4);
    
    // NOTE: This only runs when p changes, not when q changes
    // because coin outcomes are determined by p, not q
  }, [p]);

  // ====================================================================
  // COIN GENERATION: CREATE NEW COINS AS NEEDED
  // ====================================================================
  
  const generateNewCoin = useCallback((rightmostX: number) => {
    // Generate a new coin with random outcome based on true probability p
    const isHeads = Math.random() < p;
    const newCoin: Coin = {
      id: nextCoinId,                           // Unique identifier
      isHeads,                                  // Outcome based on true probability p
      x: rightmostX + COIN_SPACING,            // Place relative to rightmost coin with consistent spacing
    };
    
    setCoins(prev => [...prev, newCoin]);
    setNextCoinId(prev => prev + 1);
  }, [p, nextCoinId]);

  // ====================================================================
  // MAIN ANIMATION LOOP: THE HEART OF THE SYNCHRONIZATION
  // ====================================================================
  
  // Refs for animation state that don't trigger re-renders
  const activeTargetRef = useRef<number | null>(null);
  const seismometerYRef = useRef<number>(0);
  const targetYRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const transitionStartRef = useRef<number>(0);
  const transitionDurationRef = useRef<number>(0);

  const animate = useCallback((timestamp: number) => {
    if (!isRunning) return;

    const deltaTime = timestamp - lastUpdateRef.current;
    if (deltaTime > 16) { // Throttle to ~60fps for smooth animation
      
      // Convert user speed setting to animation units
      const pixelsPerMs = speed / 1000;        // User speed in pixels per millisecond  
      const deltaSeconds = deltaTime / 1000;   // Frame time in seconds
      
      // ================================================================
      // STEP 1: UPDATE COIN POSITIONS AND DETECT TRIGGERS
      // ================================================================
      
      setCoins(prev => {
        // Move all coins left and remove coins that have gone off-screen
        const updated = prev.map(coin => ({
          ...coin,
          x: coin.x - pixelsPerMs * deltaTime  // Move left based on user speed
        })).filter(coin => coin.x > -COIN_SIZE);  // Remove off-screen coins
        
        // ============================================================
        // STEP 2: CRITICAL SYNCHRONIZATION LOGIC
        // ============================================================
        // Check if any coin has reached the trigger position
        // This is where the magic happens - perfect synchronization!
        
        updated.forEach(coin => {
          if (coin.x <= TRIGGER_POSITION && coin.id !== activeTargetRef.current) {
            
            // 🎯 SYNCHRONIZATION MOMENT: This coin just hit the trigger!
            // At this exact moment, the seismometer should ALREADY BE
            // at this coin's surprise value due to previous transition
            
            // Calculate surprise value for this coin (cap extreme values at 7 for display)
            const currentSurprise = coin.isHeads 
              ? (q === 0 ? 7 : Math.log2(1/q))      // Surprise for heads
              : (q === 1 ? 7 : Math.log2(1/(1-q))); // Surprise for tails
            
            // Add visual marker at center line showing this coin's outcome
            const centerX = GRAPH_WIDTH / 2;
            const screenY = GRAPH_HEIGHT - Math.min(currentSurprise / 7, 1) * GRAPH_HEIGHT;
            setCoinMarkers(prev => [...prev, { 
              x: centerX,           // Always at center of seismometer
              y: screenY,           // At the surprise value height
              isHeads: coin.isHeads // Store coin type for image display
            }]);
            
            // ========================================================
            // STEP 3: START TRANSITION TO NEXT COIN
            // ========================================================
            // Now we need to start transitioning to the NEXT coin's value
            // so that by the time it reaches the trigger, we're ready
            
            const nextCoin = updated.find(c => c.x > coin.x);  // Find next coin to the right
            if (nextCoin) {
              // Calculate where seismometer should go for the next coin
              const nextSurprise = nextCoin.isHeads 
                ? (q === 0 ? 7 : Math.log2(1/q))
                : (q === 1 ? 7 : Math.log2(1/(1-q)));
              
              // Calculate transition duration based on consistent coin spacing
              const duration = COIN_SPACING / speed;          // Time = Distance / Speed
              
              // Start the transition to next coin's value
              startYRef.current = seismometerYRef.current;  // Where we are now
              targetYRef.current = nextSurprise;            // Where we need to be
              transitionStartRef.current = timeRef.current; // When transition started
              transitionDurationRef.current = duration;     // How long it should take
            }
            
            // Mark this coin as the active one (prevents retriggering)
            activeTargetRef.current = coin.id;
          }
        });
        
        return updated;
      });
      
      // ================================================================
      // STEP 4: UPDATE SEISMOMETER POSITION (SMOOTH TRANSITIONS)
      // ================================================================
      // The seismometer point moves smoothly between surprise values
      // using quadratic easing for natural acceleration/deceleration
      
      if (transitionDurationRef.current > 0) {
        // Calculate how far through the current transition we are
        const elapsed = timeRef.current - transitionStartRef.current;
        const progress = Math.min(1.0, elapsed / transitionDurationRef.current);  // 0 to 1
        
        // Apply smooth easing curve (slow start, fast middle, slow end)
        const easedProgress = progress * progress * (3 - 2 * progress); // smoothstep function
        
        // Calculate current seismometer Y position
        const newY = startYRef.current + (targetYRef.current - startYRef.current) * easedProgress;
        seismometerYRef.current = newY;
        setSeismometerY(newY);
        
        // Add this position to the seismometer trace (always at center X)
        const centerX = GRAPH_WIDTH / 2;
        const screenY = GRAPH_HEIGHT - Math.min(newY / 7, 1) * GRAPH_HEIGHT;
        setTracePoints(prev => [...prev, { x: centerX, y: screenY }]);
      }
      
      // ================================================================
      // STEP 5: SCROLL THE SEISMOMETER TRACE AND MARKERS
      // ================================================================
      // The "paper" moves left at constant speed, creating the seismometer effect
      
      // Update paper offset for reference (not directly used in rendering)
      setPaperOffset(prev => prev + PAPER_SCROLL_SPEED * deltaSeconds);
      
      // Scroll all trace points left and remove ones that have gone off-screen
      setTracePoints(prev => prev
        .map(point => ({ 
          ...point, 
          x: point.x - PAPER_SCROLL_SPEED * deltaSeconds    // Move left at constant speed
        }))
        .filter(point => point.x >= 0)                      // Remove off-screen points
      );
      
      // Scroll coin markers left and remove old ones (keep slightly longer for visibility)
      setCoinMarkers(prev => prev
        .map(marker => ({ 
          ...marker, 
          x: marker.x - PAPER_SCROLL_SPEED * deltaSeconds   // Move left at constant speed
        }))
        .filter(marker => marker.x >= -20)                  // Remove when well off-screen
      );
      
      // ================================================================
      // STEP 6: UPDATE TIMING REFERENCES
      // ================================================================
      
      timeRef.current += deltaSeconds;        // Track total elapsed time
      lastUpdateRef.current = timestamp;      // Remember this frame time
    }

    // Schedule next animation frame if still running
    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isRunning, speed, p, q]);

  // Check if we need to generate a new coin
  useEffect(() => {
    if (!isRunning) return;
    
    const rightmostCoin = Math.max(...coins.map(c => c.x), -Infinity);
    if (rightmostCoin < CANVAS_WIDTH) {
      generateNewCoin(rightmostCoin);
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
    // Clear any existing animation state
    timeRef.current = 0;
    seismometerYRef.current = 0;
    targetYRef.current = 0;
    startYRef.current = 0;
    transitionStartRef.current = 0;
    transitionDurationRef.current = 0;
    activeTargetRef.current = null;
    setSeismometerY(0);
    setTargetY(0);
    setTracePoints([]);
    setPaperOffset(0);
    setActiveCoinId(null);
    setCoinMarkers([]);
    
    // Find the first coin and start transitioning to its value
    const firstCoin = coins.find(c => c.x > TRIGGER_POSITION);
    if (firstCoin) {
      const firstSurprise = firstCoin.isHeads 
        ? (q === 0 ? 7 : Math.log2(1/q))
        : (q === 1 ? 7 : Math.log2(1/(1-q)));
      
      // Calculate time until first coin hits trigger
      const distanceToTrigger = firstCoin.x - TRIGGER_POSITION;
      const timeToTrigger = distanceToTrigger / speed;
      
      // Start transition to first coin's value
      startYRef.current = 0;
      targetYRef.current = firstSurprise;
      transitionStartRef.current = 0;
      transitionDurationRef.current = timeToTrigger;
    }
    
    setIsRunning(true);
  };

  const stopAnimation = () => {
    setIsRunning(false);
  };

  const resetAnimation = () => {
    setIsRunning(false);
    setCoins([]);
    seismometerYRef.current = 0;
    targetYRef.current = 0;
    startYRef.current = 0;
    transitionStartRef.current = 0;
    transitionDurationRef.current = 0;
    activeTargetRef.current = null;
    setSeismometerY(0);
    setTargetY(0);
    setTracePoints([]);
    setPaperOffset(0);
    setActiveCoinId(null);
    setCoinMarkers([]);
    timeRef.current = 0;
    setNextCoinId(0);
    
    // Re-initialize with consistent spacing
    const initialCoins: Coin[] = [];
    const startX = CANVAS_WIDTH + COIN_SPACING;
    for (let i = 0; i < 4; i++) {
      initialCoins.push({
        id: i,
        isHeads: Math.random() < p,
        x: startX + i * COIN_SPACING,
      });
    }
    setCoins(initialCoins);
    setNextCoinId(4);
  };

  return (
    <div className="crossentropy-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
      <h3 className="text-lg font-semibold mb-4">Cross-Entropy Widget</h3>

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
                  src="/problens-web/images/coin_heads_small.png" 
                  alt="Heads" 
                  className="w-full h-full"
                />
              ) : (
                <img 
                  src="/problens-web/images/coin_tail_small.png" 
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
                href={marker.isHeads ? "/problens-web/images/coin_heads_small.png" : "/problens-web/images/coin_tail_small.png"}
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