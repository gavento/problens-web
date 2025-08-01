"use client";
import React, { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, LabelList, DefaultTooltipContent, TooltipProps } from "recharts";
import { InlineMath, BlockMath } from "react-katex";
import { CHART_CONFIG, BUTTON_STYLES, INPUT_STYLES } from "./SimulatorConfig";

interface SimulationDataPoint {
  flip: number;
  logP: number;
  logQ: number;
  entropyRate: number;
  crossentropyRate: number;
}

const CrossEntropySimulator: React.FC = () => {
  // Parameters for the simulation
  const [trueHeadsProb, setTrueHeadsProb] = useState(0.20);
  const [modelHeadsProb, setModelHeadsProb] = useState(0.80);
  const [numFlips, setNumFlips] = useState(CHART_CONFIG.controls.defaultNumFlips);
  const [currentFlip, setCurrentFlip] = useState(0);
  const [simulationData, setSimulationData] = useState<SimulationDataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(CHART_CONFIG.controls.defaultSpeed);
  const [isZoomed, setIsZoomed] = useState(false);

  // Calculate entropy H(P)
  const entropy = useMemo(() => {
    const p = trueHeadsProb;
    if (p === 0 || p === 1) return 0;
    return -p * Math.log2(p) - (1-p) * Math.log2(1-p);
  }, [trueHeadsProb]);

  // Calculate cross-entropy H(P,Q)
  const crossentropy = useMemo(() => {
    const p = trueHeadsProb;
    const q = modelHeadsProb;
    if (q === 0 || q === 1) return Infinity;
    return -p * Math.log2(q) - (1-p) * Math.log2(1-q);
  }, [trueHeadsProb, modelHeadsProb]);

  // Create theoretical line data
  const theoreticalData = useMemo(() => {
    const data = [];
    for (let i = 0; i <= numFlips; i += Math.max(1, Math.floor(numFlips / 50))) {
      data.push({
        flip: i,
        entropyRate: i * entropy,
        crossentropyRate: i * crossentropy,
      });
    }
    return data;
  }, [numFlips, entropy, crossentropy]);

  // Calculate Y-axis domain
  const yAxisDomain = useMemo(() => {
    return [0, 'dataMax'] as [number, string];
  }, []);

  // Reset the simulation
  const resetSimulation = (): void => {
    setCurrentFlip(0);
    const initialData: SimulationDataPoint = {
      flip: 0,
      logP: 0,
      logQ: 0,
      entropyRate: 0,
      crossentropyRate: 0,
    };
    
    setSimulationData([initialData]);
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

      // Calculate surprisal from this flip
      const surprisalP = isHeads ? -Math.log2(trueHeadsProb) : -Math.log2(1-trueHeadsProb);
      const surprisalQ = isHeads ? -Math.log2(modelHeadsProb) : -Math.log2(1-modelHeadsProb);

      // Update the data with the new values
      setSimulationData((prevData) => {
        const lastData = prevData[prevData.length - 1];
        const nextFlip = currentFlip + 1;

        const newDataPoint: SimulationDataPoint = {
          flip: nextFlip,
          logP: lastData.logP + surprisalP,
          logQ: lastData.logQ + surprisalQ,
          entropyRate: nextFlip * entropy,
          crossentropyRate: nextFlip * crossentropy,
        };

        return [...prevData, newDataPoint];
      });

      setCurrentFlip((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [isRunning, currentFlip, trueHeadsProb, modelHeadsProb, speed, numFlips, entropy, crossentropy]);

  // Initialize data on first render or when parameters change
  useEffect(() => {
    resetSimulation();
  }, [trueHeadsProb, modelHeadsProb, numFlips, entropy, crossentropy]);

  const formatProbability = (value: number) => {
    return `${(value * 100).toFixed(0)}%`;
  };

  // Combine simulation data with theoretical lines
  const chartData = useMemo(() => {
    // If simulation hasn't started, show only theoretical lines
    if (currentFlip === 0 && !isRunning) {
      return theoreticalData;
    }
    // Otherwise, show only the actual simulation data (which already includes theoretical values)
    return simulationData;
  }, [simulationData, theoreticalData, currentFlip, isRunning]);

  // Create arrow data for Recharts Lines
  const arrowData = useMemo(() => {
    const referenceFlip = (isRunning || currentFlip > 0) ? currentFlip : numFlips;
    
    // Apply left offset for entropy/KL, keep cross-entropy at reference position
    const leftOffset = referenceFlip * 0.10; // Always 10% to the left for entropy/KL
    
    // Calculate Y values at the offset positions (where arrows will actually be drawn)
    const leftFlip = referenceFlip - leftOffset;
    const rightFlip = referenceFlip; // Cross-entropy stays at reference position
    
    // Two-point arrays for the vertical arrows
    const arrowEntropyData = [
      { flip: leftFlip, y: 0 },
      { flip: leftFlip, y: leftFlip * entropy },
    ];

    const arrowCrossData = [
      { flip: rightFlip, y: 0 },
      { flip: rightFlip, y: rightFlip * crossentropy },
    ];

    // KL is the difference between cross-entropy and entropy at the left position
    const arrowKLData = [
      { flip: leftFlip, y: leftFlip * entropy },
      { flip: leftFlip, y: leftFlip * crossentropy },
    ];

    return {
      entropy: arrowEntropyData,
      crossentropy: arrowCrossData,
      kl: arrowKLData
    };
  }, [currentFlip, numFlips, entropy, crossentropy, isRunning]);

  // Create label positions at arrow midpoints
  const labelPositions = useMemo(() => {
    const F = (isRunning || currentFlip > 0) ? currentFlip : numFlips;
    const leftOffset = F * 0.10; // Same offset as used for arrows
    const leftFlip = F - leftOffset;
    
    // Calculate Y positions based on actual arrow coordinates
    const leftFlipEntropy = leftFlip * entropy;
    const leftFlipCrossentropy = leftFlip * crossentropy;
    const FEntropy = F * entropy;
    const FCrossentropy = F * crossentropy;

    return {
      entropy: {
        flip: leftFlip,  // Account for left shift
        y: 0.5 * leftFlipEntropy,    // halfway up the entropy arrow (from 0 to leftFlip*entropy)
        text: "Entropy"
      },
      cross: {
        flip: F,  // Cross-entropy stays at reference position
        y: 0.5 * FCrossentropy,   // halfway up the cross-entropy arrow (from 0 to F*crossentropy)
        text: "Cross-entropy"
      },
      kl: {
        flip: leftFlip,  // Account for left shift
        y: leftFlipEntropy + 0.5 * (leftFlipCrossentropy - leftFlipEntropy),  // halfway between entropy and crossentropy at leftFlip
        text: "KL divergence"
      }
    };
  }, [currentFlip, numFlips, entropy, crossentropy, isRunning]);

  // Custom tooltip to show only the 4 main series and follow cursor
  const CustomTooltip = (props: TooltipProps<number, string>) => {
    const { active, payload, label } = props;
    if (!active || !payload) return null;

    // Keep only the four "real" series
    const mainKeys = [
      "logP",
      "logQ", 
      "entropyRate",
      "crossentropyRate",
    ];
    const filtered = payload.filter((p) => mainKeys.includes(p.dataKey as string));

    // Hand back to the default renderer, but with our slimmed-down payload
    return (
      <DefaultTooltipContent
        {...props}
        payload={filtered}
        labelFormatter={(lbl) => `Flip # ${lbl}`}
        formatter={(value: number) => `${value.toFixed(2)} bits`}
      />
    );
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-center mb-4">Cross-Entropy Simulator</h4>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              True Heads Probability (P): {formatProbability(trueHeadsProb)}
            </label>
            <input
              type="range"
              min="0.01"
              max="0.99"
              step="0.01"
              value={trueHeadsProb}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrueHeadsProb(parseFloat(e.target.value))}
              className={`${INPUT_STYLES.base} ${INPUT_STYLES.rangeColors.trueP}`}
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Heads Probability (Q): {formatProbability(modelHeadsProb)}
            </label>
            <input
              type="range"
              min="0.01"
              max="0.99"
              step="0.01"
              value={modelHeadsProb}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModelHeadsProb(parseFloat(e.target.value))}
              className={`${INPUT_STYLES.base} ${INPUT_STYLES.rangeColors.modelQ}`}
              disabled={isRunning}
            />
          </div>
        </div>

        <div className="text-center">
          <div className="inline-block">
            <BlockMath
              math={`\\begin{align*}
                H(P) &= ${entropy.toFixed(3)}\\text{ bits/flip} \\\\
                H(P,Q) &= ${crossentropy.toFixed(3)}\\text{ bits/flip}
              \\end{align*}`}
            />
          </div>
        </div>
      </div>

      <div className="my-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Flips: {numFlips}</label>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={numFlips}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumFlips(parseInt(e.target.value))}
                className={`${INPUT_STYLES.base} ${INPUT_STYLES.rangeColors.flips}`}
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
                className={`${INPUT_STYLES.base} ${INPUT_STYLES.rangeColors.speed}`}
              />
            </div>
          </div>

          <div className="flex justify-center items-center gap-4">
            <button
              onClick={toggleSimulation}
              className={`${BUTTON_STYLES.base} ${
                isRunning ? BUTTON_STYLES.primary.running : BUTTON_STYLES.primary.stopped
              }`}
            >
              {isRunning ? "Pause" : currentFlip >= numFlips ? "Reset & Start" : "Start"}
            </button>

            <button
              onClick={resetSimulation}
              className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.secondary}`}
              disabled={!currentFlip}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg">
        <div className={isZoomed ? 'fixed inset-0 z-50 bg-white p-8' : 'relative'}>
          <div className={`${isZoomed ? CHART_CONFIG.height.zoomed : CHART_CONFIG.height.normal} transition-all duration-${CHART_CONFIG.animation.transitionDuration} relative`}>
            <div className="mb-2">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors z-50"
                >
                  {isZoomed ? '🔍- Zoom Out' : '🔍+ Zoom In'}
                </button>
              </div>
              {isZoomed && (
                <div className="flex items-center space-x-2 mb-2">
                  <button
                    onClick={toggleSimulation}
                    className={`px-3 py-1 text-xs rounded font-medium ${
                      isRunning ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"
                    } text-white`}
                  >
                    {isRunning ? "Pause" : currentFlip >= numFlips ? "Reset & Start" : "Start"}
                  </button>
                  <button
                    onClick={resetSimulation}
                    className="px-3 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded"
                    disabled={!currentFlip}
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData} 
                margin={{ ...CHART_CONFIG.margins, left: 50, right: 60 }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                    fill="#333"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" />
                  </marker>
                  <marker
                    id="arrowtail"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                    fill="#333"
                  >
                    <path d="M 10 0 L 0 5 L 10 10 z" />
                  </marker>
                </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="flip"
              label={{ value: "Number of Coin Flips", position: "insideBottom", offset: -10 }}
              domain={[0, isRunning || currentFlip > 0 ? 'dataMax' : numFlips]}
              type="number"
            />
            <YAxis 
              label={{ value: "Accumulated Surprisal (bits)", angle: -90, position: "insideLeft", style: { textAnchor: 'middle' } }} 
              domain={yAxisDomain}
              tickFormatter={(value) => Math.round(value).toString()}
            />
            <Tooltip 
              content={<CustomTooltip />}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            
            {/* Accumulated surprisal using true distribution P */}
            {(isRunning || currentFlip > 0) && (
              <Line
                type="monotone"
                dataKey="logP"
                name="Using True P"
                stroke={CHART_CONFIG.colors.trueP}
                strokeWidth={2}
                dot={false}
                isAnimationActive={CHART_CONFIG.animation.isAnimationActive}
              />
            )}
            
            {/* Accumulated surprisal using model Q */}
            {(isRunning || currentFlip > 0) && (
              <Line
                type="monotone"
                dataKey="logQ"
                name="Using Model Q"
                stroke={CHART_CONFIG.colors.modelQ}
                strokeWidth={2}
                dot={false}
                isAnimationActive={CHART_CONFIG.animation.isAnimationActive}
              />
            )}
            
            {/* Theoretical entropy rate (dashed) */}
            <Line
              type="monotone"
              dataKey="entropyRate"
              name="Entropy Rate H(P)"
              stroke={CHART_CONFIG.colors.entropy}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={CHART_CONFIG.animation.isAnimationActive}
            />
            
            {/* Theoretical cross-entropy rate (dashed) */}
            <Line
              type="monotone"
              dataKey="crossentropyRate"
              name="Cross-entropy Rate H(P,Q)"
              stroke={CHART_CONFIG.colors.klExpected}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={CHART_CONFIG.animation.isAnimationActive}
            />

            {/* Arrow Lines using Recharts coordinate system */}
            {/* Entropy arrow (0 to orange line) */}
            <Line
              data={arrowData.entropy}
              dataKey="y"
              stroke={CHART_CONFIG.colors.entropy}
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
              strokeLinecap="round"
              markerStart="url(#arrowtail)"
              markerEnd="url(#arrowhead)"
              legendType="none"
              activeDot={false}
              connectNulls={false}
            />

            {/* Cross-entropy arrow (0 to red line) */}
            <Line
              data={arrowData.crossentropy}
              dataKey="y"
              stroke={CHART_CONFIG.colors.klExpected}
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
              strokeLinecap="round"
              markerStart="url(#arrowtail)"
              markerEnd="url(#arrowhead)"
              legendType="none"
              activeDot={false}
              connectNulls={false}
            />

            {/* KL divergence arrow (orange to red line) */}
            <Line
              data={arrowData.kl}
              dataKey="y"
              stroke="#2563eb"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
              strokeDasharray="3 3"
              markerStart="url(#arrowtail)"
              markerEnd="url(#arrowhead)"
              legendType="none"
              activeDot={false}
              connectNulls={false}
            />

            {/* Arrow labels using Recharts coordinate system */}
            {/* Entropy label */}
            <Line
              data={[ labelPositions.entropy ]}
              dataKey="y"
              stroke="transparent"
              dot={false}
              isAnimationActive={false}
              label={({ x, y }) => {
                const text = labelPositions.entropy.text;
                const textWidth = text.length * 7; // Approximate 7px per character for 12px bold font
                const rectWidth = textWidth + 8; // Add padding
                const rectHeight = 16;
                return (
                  <g>
                    <rect
                      x={x - rectWidth/2}
                      y={y - rectHeight/2}
                      width={rectWidth}
                      height={rectHeight}
                      fill="white"
                      stroke="#ccc"
                      strokeWidth={1}
                      rx={3}
                    />
                    <text
                      x={x}
                      y={y}
                      fill={CHART_CONFIG.colors.entropy}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      style={{ fontSize: 12, fontWeight: 'bold' }}
                    >
                      {text}
                    </text>
                  </g>
                );
              }}
              legendType="none"
            />

            {/* Cross-entropy label */}
            <Line
              data={[ labelPositions.cross ]}
              dataKey="y"
              stroke="transparent"
              dot={false}
              isAnimationActive={false}
              label={({ x, y }) => {
                const text = labelPositions.cross.text;
                const textWidth = text.length * 7; // Approximate 7px per character for 12px bold font
                const rectWidth = textWidth + 8; // Add padding
                const rectHeight = 16;
                return (
                  <g>
                    <rect
                      x={x - rectWidth/2}
                      y={y - rectHeight/2}
                      width={rectWidth}
                      height={rectHeight}
                      fill="white"
                      stroke="#ccc"
                      strokeWidth={1}
                      rx={3}
                    />
                    <text
                      x={x}
                      y={y}
                      fill={CHART_CONFIG.colors.klExpected}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      style={{ fontSize: 12, fontWeight: 'bold' }}
                    >
                      {text}
                    </text>
                  </g>
                );
              }}
              legendType="none"
            />

            {/* KL divergence label */}
            <Line
              data={[ labelPositions.kl ]}
              dataKey="y"
              stroke="transparent"
              dot={false}
              isAnimationActive={false}
              label={({ x, y }) => {
                const text = labelPositions.kl.text;
                const textWidth = text.length * 7; // Approximate 7px per character for 12px bold font
                const rectWidth = textWidth + 8; // Add padding
                const rectHeight = 16;
                return (
                  <g>
                    <rect
                      x={x - rectWidth/2}
                      y={y - rectHeight/2}
                      width={rectWidth}
                      height={rectHeight}
                      fill="white"
                      stroke="#ccc"
                      strokeWidth={1}
                      rx={3}
                    />
                    <text
                      x={x}
                      y={y}
                      fill="#2563eb"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      style={{ fontSize: 12, fontWeight: 'bold' }}
                    >
                      {text}
                    </text>
                  </g>
                );
              }}
              legendType="none"
            />

              </LineChart>
            </ResponsiveContainer>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default CrossEntropySimulator;