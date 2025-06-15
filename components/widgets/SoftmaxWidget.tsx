// components/widgets/SoftmaxWidget.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { InlineMath, BlockMath } from "react-katex";

type Props = {
  values: number[];
  title?: string;
  minLambda?: number;
  maxLambda?: number;
  initialLambda?: number;
};

const SoftmaxWidget: React.FC<Props> = ({
  values,
  title = "Softmax Distribution",
  minLambda = -3,
  maxLambda = 3,
  initialLambda = 0.5,
}) => {
  const [lambda, setLambda] = useState(initialLambda);
  const [containerWidth, setContainerWidth] = useState(400);

  useEffect(() => {
    const updateWidth = () => {
      setContainerWidth(Math.min(400, window.innerWidth - 80));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate softmax probabilities
  const probabilities = useMemo(() => {
    const exponentials = values.map((val) => Math.exp(lambda * val));
    const sum = exponentials.reduce((acc, exp) => acc + exp, 0);
    return exponentials.map((exp) => exp / sum);
  }, [values, lambda]);

  // Chart dimensions - responsive
  const chartWidth = containerWidth;
  const chartHeight = Math.min(300, chartWidth * 0.75);
  const margin = { top: 20, right: 20, bottom: 20, left: 40 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  // Calculate bar positions
  const barWidth = innerWidth / values.length;
  const maxScale = 1.0; // Fixed scale from 0 to 1
  const yScale = innerHeight / maxScale;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-lg space-y-4 max-w-3xl mx-auto">
      {title && <h3 className="text-lg sm:text-xl font-semibold text-center text-gray-800">{title}</h3>}

      {/* Values display */}
      <div className="text-center text-sm text-gray-600">
        for <strong>a</strong> = [{values.join(", ")}]
      </div>

      {/* SVG Chart */}
      <div className="bg-white p-4 rounded-lg border">
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="border border-gray-200 rounded">
          {/* Chart area background */}
          <rect
            x={margin.left}
            y={margin.top}
            width={innerWidth}
            height={innerHeight}
            fill="#f9fafb"
            stroke="#e5e7eb"
          />

          {/* Y-axis grid lines */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((tick) => {
            const y = margin.top + innerHeight - tick * yScale;
            return (
              <g key={tick}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + innerWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="2,2"
                />
                <text x={margin.left - 5} y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {probabilities.map((prob, i) => {
            const barHeight = prob * yScale;
            const x = margin.left + i * barWidth + barWidth * 0.1;
            const y = margin.top + innerHeight - barHeight;
            const width = barWidth * 0.8;

            return (
              <g key={i}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={barHeight}
                  fill={`hsl(${220 + i * 30}, 70%, ${50 + prob * 30}%)`}
                  stroke="#374151"
                  strokeWidth="1"
                />

                {/* Probability label on top of bar */}
                <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize="10" fill="#374151" fontWeight="bold">
                  {prob.toFixed(3)}
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={margin.left}
            y1={margin.top + innerHeight}
            x2={margin.left + innerWidth}
            y2={margin.top + innerHeight}
            stroke="#374151"
            strokeWidth="2"
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={margin.top + innerHeight}
            stroke="#374151"
            strokeWidth="2"
          />

          {/* Y-axis label */}
          <text
            x={15}
            y={margin.top + innerHeight / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#374151"
            transform={`rotate(-90, 15, ${margin.top + innerHeight / 2})`}
          >
            Probability
          </text>
        </svg>
      </div>

      {/* Formula display */}
      <div className="bg-blue-50 p-3 rounded text-center">
        <BlockMath
          math={`p_i = \\frac{\\exp(${lambda.toFixed(2)} \\cdot a_i)}{\\sum_j \\exp(${lambda.toFixed(2)} \\cdot a_j)}`}
        />
      </div>

      {/* Lambda slider */}
      <div className="bg-white rounded-lg p-4 space-y-3">
        <div className="text-center text-sm font-medium text-gray-700">
          <strong>Lambda</strong> (λ) = {lambda.toFixed(1)}
        </div>
        <div className="relative">
          <input
            type="range"
            min={minLambda}
            max={maxLambda}
            step={0.1}
            value={lambda}
            onChange={(e) => setLambda(Number(e.target.value))}
            className="w-full h-4 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, 
                #fecaca 0%, 
                #fef3c7 50%, 
                #d1fae5 100%)`,
              minHeight: '44px'
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{minLambda}</span>
            <span>0</span>
            <span>{maxLambda}</span>
          </div>
        </div>
        <div className="text-xs text-center text-gray-600">← argmin | uniform distribution | argmax →</div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg p-4">
        <h4 className="text-base font-semibold text-gray-800 mb-3">Statistics</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-gray-50 p-3 rounded text-center">
            <div className="font-semibold text-gray-700">Lambda (λ)</div>
            <div className="text-lg text-purple-600">{lambda.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded text-center">
            <div className="font-semibold text-gray-700">Max Probability</div>
            <div className="text-lg text-blue-600">{Math.max(...probabilities).toFixed(3)}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded text-center">
            <div className="font-semibold text-gray-700">Entropy</div>
            <div className="text-lg text-green-600">
              {(-probabilities.reduce((sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0), 0)).toFixed(3)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoftmaxWidget;
