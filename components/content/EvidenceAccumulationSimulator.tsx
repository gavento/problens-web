"use client";
import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

const EvidenceAccumulationSimulator: React.FC = () => {
  // Parameters for the simulation
  const [trueHeadsProb, setTrueHeadsProb] = useState<number>(0.7);
  const [modelHeadsProb, setModelHeadsProb] = useState<number>(0.5);
  const [numFlips, setNumFlips] = useState<number>(100);
  const [currentFlip, setCurrentFlip] = useState<number>(0);
  const [simulationData, setSimulationData] = useState<{ flip: number; evidence: number; klAccumulated: number }[]>([
    { flip: 0, evidence: 0, klAccumulated: 0 },
  ]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  // Simulation speed is fixed now
  const [speed] = useState<number>(50);

  // Calculate KL divergence between true and model distributions
  const calculateKL = (): number => {
    const p: [number, number] = [trueHeadsProb, 1 - trueHeadsProb];
    const q: [number, number] = [modelHeadsProb, 1 - modelHeadsProb];

    if (q[0] === 0 || q[1] === 0) {
      return Infinity;
    }

    return p[0] * Math.log2(p[0] / q[0]) + p[1] * Math.log2(p[1] / q[1]);
  };

  const klDivergence = calculateKL();

  // Reset the simulation
  const resetSimulation = (): void => {
    setCurrentFlip(0);
    setSimulationData([{ flip: 0, evidence: 0, klAccumulated: 0 }]);
    setIsRunning(false);
  };

  // Start/pause the simulation
  const toggleSimulation = (): void => {
    if (currentFlip >= numFlips) {
      resetSimulation();
    }
    setIsRunning(!isRunning);
  };

  // Effect to run the simulation
  useEffect(() => {
    if (!isRunning || currentFlip >= numFlips) return;

    const timer = setTimeout(() => {
      const isHeads = Math.random() < trueHeadsProb;
      const evidenceFromFlip = isHeads
        ? Math.log2(trueHeadsProb / modelHeadsProb)
        : Math.log2((1 - trueHeadsProb) / (1 - modelHeadsProb));

      setSimulationData((prev) => {
        const last = prev[prev.length - 1];
        return [
          ...prev,
          {
            flip: currentFlip + 1,
            evidence: last.evidence + evidenceFromFlip,
            klAccumulated: last.klAccumulated + klDivergence,
          },
        ];
      });

      setCurrentFlip((f) => f + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [isRunning, currentFlip, trueHeadsProb, modelHeadsProb, speed, numFlips, klDivergence]);

  // Initialize data on parameter change
  useEffect(() => {
    resetSimulation();
  }, [trueHeadsProb, modelHeadsProb]);

  // Format probability for display
  const formatProbability = (v: number): string => `${(v * 100).toFixed(0)}%`;

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-center">Evidence Accumulation Simulator</h4>

      <p>
        This simulator demonstrates how evidence accumulates when comparing two competing hypotheses about a coin. The
        blue line shows the actual accumulated evidence (in bits) favoring the true model, while the dashed red line
        shows the expected accumulation based on KL divergence.
      </p>

      <div className="font-semibold mb-2">Model Parameters</div>
      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            True Heads Probability: {formatProbability(trueHeadsProb)}
          </label>
          <input
            type="range"
            min="0.01"
            max="0.99"
            step="0.01"
            value={trueHeadsProb}
            onChange={(e) => setTrueHeadsProb(parseFloat(e.target.value))}
            disabled={isRunning}
            className="w-full h-2 bg-blue-200 rounded-lg cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model Heads Probability: {formatProbability(modelHeadsProb)}
          </label>
          <input
            type="range"
            min="0.01"
            max="0.99"
            step="0.01"
            value={modelHeadsProb}
            onChange={(e) => setModelHeadsProb(parseFloat(e.target.value))}
            disabled={isRunning}
            className="w-full h-2 bg-green-200 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="font-semibold mb-2">Simulation Controls</div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Flips: {numFlips}</label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={numFlips}
              onChange={(e) => setNumFlips(parseInt(e.target.value, 10))}
              disabled={isRunning}
              className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer"
            />
          </div>
          <div className="flex space-x-4 items-center">
            <button
              onClick={toggleSimulation}
              className={`px-4 py-2 rounded-md font-medium ${isRunning ? "bg-yellow-500" : "bg-blue-500"} text-white`}
            >
              {isRunning ? "Pause" : currentFlip >= numFlips ? "Reset & Start" : "Start"}
            </button>
            <button
              onClick={resetSimulation}
              disabled={!currentFlip}
              className="px-4 py-2 rounded-md font-medium bg-gray-500 text-white"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between mb-4">
          <div>
            <p>
              Current Flip: {currentFlip} / {numFlips}
            </p>
            <p>
              Current Evidence: {simulationData[simulationData.length - 1].evidence.toFixed(2)}{" "}
              <InlineMath math="\text{bits}" />
            </p>
          </div>
          <div>
            <p>
              Expected KL Divergence: {klDivergence.toFixed(4)} <InlineMath math="\text{bits/flip}" />
            </p>
            <p>
              Expected after {numFlips} flips: {(klDivergence * numFlips).toFixed(2)} <InlineMath math="\text{bits}" />
            </p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simulationData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="flip"
                label={{ value: "Number of Coin Flips", position: "insideBottom", offset: -10 }}
                domain={[0, numFlips]}
              />
              <YAxis label={{ value: "Evidence (bits)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(value: any) =>
                  `${(value as number).toFixed(2)} ${React.createElement(InlineMath, {
                    math: "\\text{bits}",
                  })}`
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="evidence"
                name="Accumulated Evidence"
                stroke="#2563eb"
                activeDot={{ r: 8 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="klAccumulated"
                name="Expected (KL Rate)"
                stroke="#dc2626"
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Try yourself:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Check that as you flip the coin more times, the accumulated evidence tends to grow at a rate equal to the KL
            divergence.
          </li>
          <li>
            Try very similar true/model probabilities, e.g. $50%$ vs $51%$, to get some intuition about how long it
            takes until the law of large numbers kicks in.
          </li>
          <li>What happens if the true and model probability are the same?</li>
          <li>
            What happens if the truth is 50/50 and the model is 1/99? What happens in the opposite case? Try to guess in
            advance in which case KL is higher.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EvidenceAccumulationSimulator;
