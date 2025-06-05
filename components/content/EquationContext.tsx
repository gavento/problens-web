"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface EquationContextType {
  getEquationNumber: (id: string) => number;
  getAllEquations: () => Record<string, number>;
}

const EquationContext = createContext<EquationContextType | null>(null);

interface EquationProviderProps {
  children: ReactNode;
}

export function EquationProvider({ children }: EquationProviderProps) {
  const [equations, setEquations] = useState<Record<string, number>>({});
  const [nextNumber, setNextNumber] = useState(1);

  const getEquationNumber = useCallback((id: string) => {
    if (equations[id]) {
      return equations[id];
    }
    
    // Assign new number to this equation
    const number = nextNumber;
    setEquations(prev => ({ ...prev, [id]: number }));
    setNextNumber(prev => prev + 1);
    return number;
  }, [equations, nextNumber]);

  const getAllEquations = useCallback(() => equations, [equations]);

  return (
    <EquationContext.Provider value={{ getEquationNumber, getAllEquations }}>
      {children}
    </EquationContext.Provider>
  );
}

export function useEquationContext() {
  const context = useContext(EquationContext);
  if (!context) {
    throw new Error("useEquationContext must be used within an EquationProvider");
  }
  return context;
}