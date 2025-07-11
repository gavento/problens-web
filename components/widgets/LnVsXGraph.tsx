import React from "react";

interface LnVsXGraphProps {
  width?: number;
  height?: number;
  strokeLn?: string;
  strokeX?: string;
}

/**
 * Tiny SVG chart comparing y = ln(1+x) (blue) and y = x (red) on [0,1].
 * Designed for use inside tooltips; keep it lightweight (no external libs).
 */
const LnVsXGraph: React.FC<LnVsXGraphProps> = ({
  width = 120,
  height = 80,
  strokeLn = "#2563eb", // blue-600
  strokeX = "#dc2626", // red-600
}) => {
  // Precompute polylines
  const MIN = -2;
  const MAX = 4;
  const RANGE = MAX - MIN; // 6 units

  const PAD = 16; // extra room for tick labels
  const chartW = width - PAD * 2;
  const chartH = height - PAD * 2;

  const buildPoints = (fn: (x: number) => number, skipUndefined = false) => {
    const pts: string[] = [];
    for (let i = 0; i <= 300; i++) {
      const x = MIN + (i / 300) * RANGE;
      const y = fn(x);
      if (skipUndefined && (isNaN(y) || !isFinite(y))) {
        continue;
      }
      const sx = (PAD + ((x - MIN) / RANGE) * chartW).toFixed(2);
      const sy = (PAD + (chartH - ((y - MIN) / RANGE) * chartH)).toFixed(2);
      pts.push(`${sx},${sy}`);
    }
    return pts.join(" ");
  };

  const lnPoints = buildPoints((x: number) => Math.log(1 + x), true);
  const xPoints = buildPoints((x: number) => x);

  // Curve label positions (choose x=2.5, well inside chart)
  const labelChartX = 2.5;
  const labelXPos = PAD + ((labelChartX - MIN) / RANGE) * chartW;

  // y positions on each curve
  const lnY = Math.log(1 + labelChartX);
  const lnYPos = PAD + (chartH - ((lnY - MIN) / RANGE) * chartH) + 6;
  const xYPos = PAD + (chartH - ((labelChartX - MIN) / RANGE) * chartH) - 6;

  // Horizontal shifts so labels don't overlap axes
  const blueLabelX = labelXPos + 16; // further right
  const redLabelX = labelXPos - 30; // further left for red label

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Graph of ln(1+x) and x on [0,1]"
    >
      {/* Axes */}
      {/* x-axis (y=0) */}
      {(() => {
        const yZero = PAD + (chartH - ((0 - MIN) / RANGE) * chartH);
        return <line x1={PAD} y1={yZero} x2={PAD + chartW} y2={yZero} stroke="#888" strokeWidth="1" />;
      })()}
      {/* y-axis (x=0) */}
      {(() => {
        const xZero = PAD + ((0 - MIN) / RANGE) * chartW;
        return <line x1={xZero} y1={PAD + chartH} x2={xZero} y2={PAD} stroke="#888" strokeWidth="1" />;
      })()}

      {/* ln(1+x) */}
      <polyline points={lnPoints} fill="none" stroke={strokeLn} strokeWidth="2" />

      {/* y = x */}
      <polyline points={xPoints} fill="none" stroke={strokeX} strokeWidth="2" />

      {/* Axis ticks and labels 0..4 */}
      {Array.from({ length: 7 }, (_, idx) => {
        const xVal = MIN + idx;
        const xPos = PAD + ((xVal - MIN) / RANGE) * chartW;
        return (
          <g key={`x-tick-${idx}`}>
            <line x1={xPos} y1={PAD + chartH} x2={xPos} y2={PAD + chartH + 4} stroke="#666" strokeWidth="1" />
            <text x={xPos} y={PAD + chartH + 12} fontSize="8" textAnchor="middle" fill="#444">
              {xVal}
            </text>
          </g>
        );
      })}

      {Array.from({ length: 7 }, (_, idx) => {
        const yVal = MIN + idx;
        const yPos = PAD + chartH - ((yVal - MIN) / RANGE) * chartH;
        return (
          <g key={`y-tick-${idx}`}>
            <line x1={PAD - 4} y1={yPos} x2={PAD} y2={yPos} stroke="#666" strokeWidth="1" />
            <text x={PAD - 6} y={yPos + 3} fontSize="8" textAnchor="end" fill="#444">
              {yVal}
            </text>
          </g>
        );
      })}

      {/* Axis labels */}
      <text x={PAD + chartW + 6} y={PAD + chartH + 10} fontSize="8" textAnchor="end" fill="#444">
        x
      </text>
      <text x={PAD - 8} y={PAD - 6} fontSize="8" textAnchor="end" fill="#444">
        y
      </text>

      {/* Curve labels */}
      <text x={blueLabelX} y={lnYPos + 2} fontSize="8" fill={strokeLn} textAnchor="start">
        ln(1+x)
      </text>
      <text x={redLabelX} y={xYPos} fontSize="8" fill={strokeX} textAnchor="start">
        y = x
      </text>
    </svg>
  );
};

export default LnVsXGraph;
