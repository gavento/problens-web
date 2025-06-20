"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DangerModeContextType {
  isDangerMode: boolean;
  toggleDangerMode: () => void;
  isHydrated: boolean;
}

const DangerModeContext = createContext<DangerModeContextType | undefined>(undefined);

export function DangerModeProvider({ children }: { children: React.ReactNode }) {
  const [isDangerMode, setIsDangerMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dangerMode');
    if (saved === 'true') {
      setIsDangerMode(true);
    }
    setIsHydrated(true);
  }, []);

  const toggleDangerMode = () => {
    const newState = !isDangerMode;
    setIsDangerMode(newState);
    localStorage.setItem('dangerMode', newState.toString());
  };

  return (
    <DangerModeContext.Provider value={{ isDangerMode, toggleDangerMode, isHydrated }}>
      {children}
    </DangerModeContext.Provider>
  );
}

export function useDangerMode() {
  const context = useContext(DangerModeContext);
  if (context === undefined) {
    throw new Error('useDangerMode must be used within a DangerModeProvider');
  }
  return context;
}