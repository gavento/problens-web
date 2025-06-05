"use client";

import React, { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useEquationContext } from "./EquationContext";

const default_macros: Record<string, string> = { "\\R": "\\mathbb{R}", "\\eps": "\\varepsilon" };

interface NumberedMathProps {
  math: string;
  displayMode?: boolean;
  throwOnError?: boolean;
  macros?: Record<string, string>;
  id?: string; // Optional ID for numbered equations
}

const NumberedMath: React.FC<NumberedMathProps> = ({
  math,
  displayMode = false,
  throwOnError = false,
  macros = default_macros,
  id,
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const { getEquationNumber } = useEquationContext();

  // Get equation number if ID is provided
  const equationNumber = id ? getEquationNumber(id) : null;

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, {
          throwOnError,
          displayMode,
          macros,
          trust: true,
        });
      } catch (error) {
        console.error("KaTeX render error:", error);
        if (containerRef.current) {
          if (error instanceof Error) {
            containerRef.current.textContent = `Error: ${error.message}`;
          } else {
            containerRef.current.textContent = `Error: An unknown error occurred`;
          }
        }
      }
    }
  }, [math, displayMode, throwOnError, macros]);

  // For numbered equations in display mode, use a flex layout
  if (id && displayMode && equationNumber) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        width: '100%',
        margin: '1rem 0'
      }}>
        <span ref={containerRef} style={{ flex: 1 }} />
        <span style={{ 
          fontSize: '1rem', 
          color: '#666',
          marginLeft: '2rem',
          fontFamily: 'inherit'
        }}>
          ({equationNumber})
        </span>
      </div>
    );
  }

  // For regular equations (inline or unnumbered), use the simple version
  return <span ref={containerRef} />;
};

export default NumberedMath;