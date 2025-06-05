"use client";

import React from "react";
import { useEquationContext } from "./EquationContext";

interface EquationRefProps {
  id: string;
  format?: "number" | "full"; // "(1)" vs "Equation (1)"
}

const EquationRef: React.FC<EquationRefProps> = ({ id, format = "number" }) => {
  const { getAllEquations } = useEquationContext();
  const equations = getAllEquations();
  const number = equations[id];

  if (!number) {
    // Equation hasn't been registered yet - this might happen during SSR or if equation comes later in document
    return <span style={{ color: 'red' }}>[Eq. {id}?]</span>;
  }

  if (format === "full") {
    return <span>Equation ({number})</span>;
  }

  return <span>({number})</span>;
};

export default EquationRef;