"use client";

import React from "react";
import MLProblemExplorer from "./MLProblemExplorer";

interface MLProblemExplorerSimpleProps {
  [key: string]: any;
}

export default function MLProblemExplorerSimple(props: MLProblemExplorerSimpleProps) {
  return <MLProblemExplorer {...props} showExplanations={false} />;
}
