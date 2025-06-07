"use client";
import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { InlineMath, BlockMath } from "react-katex";

const EvidenceAccumulationSimulator = () => {
  // Parameters for the simulation
  const [trueHeadsProb, setTrueHeadsProb] = useState(0.25); // True probability of heads
  const [modelHeadsProb, setModelHeadsProb] = useState(0.5); // Model probability of heads
  // Removed prior odds state
  const [numFlips, setNumFlips] = useState(100); // Number of coin flips to simulate
  const [currentFlip, setCurrentFlip] = useState(0);
  const [simulationData, setSimulationData] = useState<{ flip: number; evidence: number; klAccumulated: number }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50); // Simulation speed (ms delay)
  const [showKLLine, setShowKLLine] = useState(true);

  // Calculate KL divergence between true and model distributions
  const calculateKL = (): number => {
    const p: [number, number] = [trueHeadsProb, 1 - trueHeadsProb];
    const q: [number, number] = [modelHeadsProb, 1 - modelHeadsProb];

    // Avoid division by zero or log of zero
    if (q[0] === 0 || q[1] === 0) {
      return Infinity;
    }

    const klHeads = p[0] * Math.log2(p[0] / q[0]);
    const klTails = p[1] * Math.log2(p[1] / q[1]);

    return klHeads + klTails;
  };

  const klDivergence: number = calculateKL();

  // Reset the simulation
  const resetSimulation = (): void => {
    setCurrentFlip(0);
    setSimulationData([
      {
        flip: 0,
        evidence: 0, // Start with neutral evidence (0 bits)
        klAccumulated: 0,
      },
    ]);
    setIsRunning(false);
  };

  // Start/pause the simulation
  const toggleSimulation = () => {
    if (currentFlip >= numFlips) {
      resetSimulation();
    }
    setIsRunning(!isRunning);
  };

  // Effect to run the simulation
  useEffect(() => {
    if (!isRunning || currentFlip >= numFlips) return;

    const timer = setTimeout(() => {
      // Simulate a coin flip based on the true probability
      const isHeads = Math.random() < trueHeadsProb;

      // Calculate evidence from this flip (log likelihood ratio)
      const evidenceFromFlip = isHeads
        ? Math.log2(trueHeadsProb / modelHeadsProb)
        : Math.log2((1 - trueHeadsProb) / (1 - modelHeadsProb));

      // Update the data with the new evidence
      setSimulationData((prevData) => {
        const lastEvidence = prevData[prevData.length - 1].evidence;
        const newEvidence = lastEvidence + evidenceFromFlip;
        const lastKL = prevData[prevData.length - 1].klAccumulated;

        return [
          ...prevData,
          {
            flip: currentFlip + 1,
            evidence: newEvidence,
            klAccumulated: lastKL + klDivergence,
          },
        ];
      });

      setCurrentFlip((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [isRunning, currentFlip, trueHeadsProb, modelHeadsProb, speed, numFlips, klDivergence]);

  // Initialize data on first render or when parameters change
  useEffect(() => {
    resetSimulation();
  }, [trueHeadsProb, modelHeadsProb]);

  const formatProbability = (value: number) => {
    return `${(value * 100).toFixed(0)}%`;
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-center">Evidence Accumulation Simulator</h4>

      <div className="">
        {/*<p className="">
          This simulator demonstrates how evidence accumulates when comparing two competing hypotheses about a coin. The
          blue line shows the actual accumulated evidence (in bits) favoring the true model, while the dashed red line
          shows the expected accumulation based on KL divergence.
        </p>*/}

        <div className="">
          {/*<div className="font-semibold mb-2">Model Parameters</div>*/}
          <div className="space-y-4">
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrueHeadsProb(parseFloat(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                disabled={isRunning}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModelHeadsProb(parseFloat(e.target.value))}
                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                disabled={isRunning}
              />
            </div>
          </div>

          {/* <p className="font-medium mb-1">Current Distributions:</p> */}
          {/*          <div className="mb-2">
            <span className="font-medium">
              True distribution (<InlineMath math="p" />
              ):
            </span>{" "}
            [Heads: {trueHeadsProb.toFixed(2)}, Tails: {(1 - trueHeadsProb).toFixed(2)}]
          </div>
          <div className="mb-2">
            <span className="font-medium">
              Model distribution (<InlineMath math="q" />
              ):
            </span>{" "}
            [Heads: {modelHeadsProb.toFixed(2)}, Tails: {(1 - modelHeadsProb).toFixed(2)}]
          </div>*/}
          <div>
            {/* <span className="font-medium">KL Divergence:</span> */}
            <div className="">
              <BlockMath
                math={`\\begin{align*}
                  D(p, q) &= ${trueHeadsProb.toFixed(2)}\\log_2\\left(\\frac{${trueHeadsProb.toFixed(
                    2,
                  )}}{${modelHeadsProb.toFixed(2)}}\\right) + ${(1 - trueHeadsProb).toFixed(2)}\\log_2\\left(\\frac{${(
                    1 - trueHeadsProb
                  ).toFixed(2)}}{${(1 - modelHeadsProb).toFixed(2)}}\\right) \\\\
                  &= ${klDivergence.toFixed(4)}\\text{ bits per flip}
                \\end{align*}`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div>
          {/*<div className="font-semibold mb-2">Simulation Controls</div>*/}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Flips: {numFlips}</label>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={numFlips}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumFlips(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isRunning}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Simulation Speed (faster ←→ slower)
              </label>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={speed}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpeed(parseInt(e.target.value))}
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex justify-start items-center">
              <button
                onClick={toggleSimulation}
                className={`px-4 py-2 rounded-md font-medium ${
                  isRunning ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"
                } text-white`}
              >
                {isRunning ? "Pause" : currentFlip >= numFlips ? "Reset & Start" : "Start"}
              </button>

              <button
                onClick={resetSimulation}
                className="px-4 py-2 rounded-md font-medium bg-gray-500 hover:bg-gray-600 text-white ml-4"
                disabled={!currentFlip}
              >
                Reset
              </button>

              {/*<div className="flex items-center ml-4">
                <input
                  type="checkbox"
                  id="showKL"
                  checked={showKLLine}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowKLLine(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showKL" className="ml-2 text-sm text-gray-700">
                  Show Expected (KL)
                </label>
              </div>*/}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between mb-4">
          <div>
            <p className="">
              Current Flip: {currentFlip} / {numFlips}
            </p>
            <p>
              Current Evidence:{" "}
              {simulationData.length > 0 ? simulationData[simulationData.length - 1].evidence.toFixed(2) : 0}{" "}
              <InlineMath math="\text{bits}" />
            </p>
          </div>
          <div>
            <p className="">
              Expected KL Divergence: {klDivergence.toFixed(4)} <InlineMath math="\text{bits/flip}" />
            </p>
            <p>
              Expected after {numFlips} flips: {(klDivergence * numFlips).toFixed(2)} <InlineMath math="\text{bits}" />
            </p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simulationData} margin={{ top: 5, right: 30, left: 20, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="flip"
                label={{ value: "Number of Coin Flips", position: "insideBottom", offset: -10 }}
                domain={[0, numFlips]}
              />
              <YAxis label={{ value: "Evidence (bits)", angle: -90 }} />
              <Tooltip formatter={(value: number) => `${value.toFixed(2)} bits`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="evidence"
                name="Accumulated Evidence"
                stroke="#2563eb"
                activeDot={{ r: 8 }}
                isAnimationActive={false}
              />
              {showKLLine && (
                <Line
                  type="monotone"
                  dataKey="klAccumulated"
                  name="Expected (KL Rate)"
                  stroke="#dc2626"
                  strokeDasharray="5 5"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Try yourself:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Check that as you keep flipping the coin many times, the accumulated evidence tends to grow at a rate equal
            to the KL divergence.
          </li>
          <li>
            Try very similar true/model probabilities, e.g. 50% vs 51%, to get some intuition about how long it takes
            until the law of large numbers kicks in.
          </li>
          <li>What happens if the true and model probability are the same?</li>
          <li>
            Consider two cases: the truth is 50%/50% and the model is 1%/99%, and the truth is 1%/99% and the model is
            50%/50%. Which case corresponds to higher KL divergence?
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EvidenceAccumulationSimulator;
