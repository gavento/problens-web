"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface Coin {
  id: number;
  isHeads: boolean;
  x: number;
}

interface Props {
  initialP?: number;
  initialQ?: number;
  isPEditable?: boolean;
  isQEditable?: boolean;
}

export default function CoinFlipWidget({
  initialP = 0.5,
  initialQ = 0.5,
  isPEditable = true,
  isQEditable = true,
}: Props) {
  const [p, setP] = useState(initialP);
  const [q, setQ] = useState(initialQ);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [nextCoinId, setNextCoinId] = useState(0);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  
  const COIN_SIZE = 60;
  const COIN_SPACING = 80;
  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 100;
  const SPEED = 50; // pixels per second
  
  // Initialize with some coins
  useEffect(() => {
    const initialCoins: Coin[] = [];
    for (let i = 0; i < 10; i++) {
      initialCoins.push({
        id: i,
        isHeads: Math.random() < initialP,
        x: CANVAS_WIDTH + i * COIN_SPACING,
      });
    }
    setCoins(initialCoins);
    setNextCoinId(10);
  }, []);
  
  const addNewCoin = useCallback(() => {
    const newCoin: Coin = {
      id: nextCoinId,
      isHeads: Math.random() < p,
      x: coins.length > 0 ? Math.max(...coins.map(c => c.x)) + COIN_SPACING : CANVAS_WIDTH,
    };
    setCoins(prev => [...prev, newCoin]);
    setNextCoinId(prev => prev + 1);
  }, [p, coins, nextCoinId]);
  
  const animate = useCallback((timestamp: number) => {
    if (!lastUpdateRef.current) lastUpdateRef.current = timestamp;
    const deltaTime = (timestamp - lastUpdateRef.current) / 1000;
    lastUpdateRef.current = timestamp;
    
    setCoins(prevCoins => {
      // Move all coins to the left
      const movedCoins = prevCoins.map(coin => ({
        ...coin,
        x: coin.x - SPEED * deltaTime,
      }));
      
      // Remove coins that are too far left
      const filteredCoins = movedCoins.filter(coin => coin.x > -COIN_SIZE * 2);
      
      // Add new coin if needed
      if (filteredCoins.length === 0 || 
          filteredCoins[filteredCoins.length - 1].x < CANVAS_WIDTH - COIN_SPACING) {
        const newCoin: Coin = {
          id: nextCoinId,
          isHeads: Math.random() < p,
          x: filteredCoins.length > 0 
            ? filteredCoins[filteredCoins.length - 1].x + COIN_SPACING 
            : CANVAS_WIDTH,
        };
        setNextCoinId(prev => prev + 1);
        return [...filteredCoins, newCoin];
      }
      
      return filteredCoins;
    });
    
    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isRunning, p, SPEED, nextCoinId]);
  
  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, animate]);
  
  const handlePChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 1) {
      setP(value);
    }
  };
  
  const handleQChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 1) {
      setQ(value);
    }
  };
  
  return (
    <div className="coin-flip-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
      <h3 className="text-lg font-semibold mb-4">Coin Flip Stream</h3>
      
      {/* Controls */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">p(heads):</label>
          <input
            type="number"
            value={p}
            onChange={handlePChange}
            disabled={!isPEditable}
            step="0.1"
            min="0"
            max="1"
            className={`w-20 px-2 py-1 border rounded ${
              isPEditable 
                ? 'border-gray-300 bg-white' 
                : 'border-gray-200 bg-gray-100 cursor-not-allowed'
            }`}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">q(heads):</label>
          <input
            type="number"
            value={q}
            onChange={handleQChange}
            disabled={!isQEditable}
            step="0.1"
            min="0"
            max="1"
            className={`w-20 px-2 py-1 border rounded ${
              isQEditable 
                ? 'border-gray-300 bg-white' 
                : 'border-gray-200 bg-gray-100 cursor-not-allowed'
            }`}
          />
        </div>
        
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-4 py-1 rounded font-medium transition-colors ${
            isRunning 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isRunning ? 'Stop' : 'Start'}
        </button>
      </div>
      
      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="relative bg-gray-50 border border-gray-300 rounded overflow-hidden"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        {coins.map(coin => (
          <div
            key={coin.id}
            className="absolute transition-none"
            style={{
              left: `${coin.x}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              width: COIN_SIZE,
              height: COIN_SIZE,
            }}
          >
            {coin.isHeads ? (
              <img 
                src="/components/widgets/img/cent_front.png" 
                alt="Heads" 
                className="w-full h-full"
              />
            ) : (
              <img 
                src="/components/widgets/img/cent_back.png" 
                alt="Tails" 
                className="w-full h-full"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}