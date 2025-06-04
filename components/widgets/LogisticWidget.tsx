import React, { useState, useMemo } from "react";
import { BlockMath } from "react-katex";

type Props = {
  title?: string;
  minLambda?: number;
  maxLambda?: number;
  initialLambda?: number;
  xMin?: number;
  xMax?: number;
};

const LogisticWidget: React.FC<Props> = ({
  title = "Logistic Function",
  minLambda = -3,
  maxLambda = 3,
  initialLambda = 1,
  xMin = -5,
  xMax = 5,
}) => {
  const [lambda, setLambda] = useState(initialLambda);

  // Calculate logistic function values
  const logisticData = useMemo(() => {
    const numPoints = 200;
    const step = (xMax - xMin) / numPoints;
    const points: { x: number; y: number }[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const x = xMin + i * step;
      const y = Math.exp(lambda * x) / (1 + Math.exp(lambda * x));
      points.push({ x, y });
    }

    return points;
  }, [lambda, xMin, xMax]);

  // Chart dimensions
  const chartWidth = 500;
  const chartHeight = 300;
  const margin = { top: 20, right: 40, bottom: 40, left: 50 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  // Scaling functions
  const xScale = (x: number) => margin.left + ((x - xMin) / (xMax - xMin)) * innerWidth;
  const yScale = (y: number) => margin.top + innerHeight - y * innerHeight;

  // Create SVG path for the curve
  const pathData = logisticData
    .map((point, i) => `${i === 0 ? "M" : "L"} ${xScale(point.x)} ${yScale(point.y)}`)
    .join(" ");

  // Generate grid lines for x-axis
  const xTicks = [];
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    xTicks.push(x);
  }

  // Generate grid lines for y-axis
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4 max-w-3xl mx-auto">
      {title && <h3 className="text-lg font-semibold text-center text-gray-800">{title}</h3>}

      {/* SVG Chart */}
      <div className="flex justify-center">
        <svg width={chartWidth} height={chartHeight} className="border rounded bg-white">
          {/* Chart area background */}
          <rect
            x={margin.left}
            y={margin.top}
            width={innerWidth}
            height={innerHeight}
            fill="#f9fafb"
            stroke="#e5e7eb"
          />

          {/* X-axis grid lines */}
          {xTicks.map((tick) => (
            <g key={`x-${tick}`}>
              <line
                x1={xScale(tick)}
                y1={margin.top}
                x2={xScale(tick)}
                y2={margin.top + innerHeight}
                stroke="#e5e7eb"
                strokeDasharray="2,2"
              />
              <text x={xScale(tick)} y={margin.top + innerHeight + 15} textAnchor="middle" fontSize="12" fill="#6b7280">
                {tick}
              </text>
            </g>
          ))}

          {/* Y-axis grid lines */}
          {yTicks.map((tick) => (
            <g key={`y-${tick}`}>
              <line
                x1={margin.left}
                y1={yScale(tick)}
                x2={margin.left + innerWidth}
                y2={yScale(tick)}
                stroke="#e5e7eb"
                strokeDasharray="2,2"
              />
              <text x={margin.left - 10} y={yScale(tick) + 4} textAnchor="end" fontSize="12" fill="#6b7280">
                {tick.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Main axes */}
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

          {/* Center lines (x=0, y=0.5) */}
          <line
            x1={xScale(0)}
            y1={margin.top}
            x2={xScale(0)}
            y2={margin.top + innerHeight}
            stroke="#9CA3AF"
            strokeWidth="1"
          />
          <line
            x1={margin.left}
            y1={yScale(0.5)}
            x2={margin.left + innerWidth}
            y2={yScale(0.5)}
            stroke="#9CA3AF"
            strokeWidth="1"
          />

          {/* The logistic curve */}
          <path
            d={pathData}
            fill="none"
            stroke="#2563EB"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Axis labels */}
          <text
            x={margin.left + innerWidth / 2}
            y={chartHeight - 5}
            textAnchor="middle"
            fontSize="14"
            fill="#374151"
            fontWeight="bold"
          >
            x
          </text>
          <text
            x={15}
            y={margin.top + innerHeight / 2}
            textAnchor="middle"
            fontSize="14"
            fill="#374151"
            fontWeight="bold"
            transform={`rotate(-90, 15, ${margin.top + innerHeight / 2})`}
          >
            p(x)
          </text>
        </svg>
      </div>

      {/* Lambda slider */}
      <div className="space-y-2">
        <div className="text-center text-sm text-gray-700">
          <strong>Lambda</strong> (λ)
        </div>
        <div className="relative">
          <input
            type="range"
            min={minLambda}
            max={maxLambda}
            step={0.1}
            value={lambda}
            onChange={(e) => setLambda(Number(e.target.value))}
            className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, 
                #fecaca 0%, 
                #fef3c7 50%, 
                #d1fae5 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{minLambda}</span>
            <span>0</span>
            <span>{maxLambda}</span>
          </div>
        </div>
        <div className="text-xs text-center text-gray-600">← flipped & steep | flat at 0 | steep →</div>
      </div>

      {/* Formula display */}
      <div className="bg-blue-50 p-3 rounded text-center">
        <BlockMath math={`p(x) = \\frac{e^{${lambda.toFixed(2)} \\cdot x}}{1 + e^{${lambda.toFixed(2)} \\cdot x}}`} />
      </div>
    </div>
  );
};

export default LogisticWidget;
