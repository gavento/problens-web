"use client";
import React, { useState, useMemo } from "react";
import KatexMath from "@/components/content/KatexMath";
import ReactMarkdown from "react-markdown";

// Types -------------------------------------------------------

interface Point2D {
  x: number;
  y: number;
}
interface LabeledPoint2D extends Point2D {
  label: 0 | 1;
}

type Mode = "meanVariance" | "linearRegression" | "kMeans" | "logisticRegression";

// Default datasets -------------------------------------------

const defaultMeanVar = [-2, -1, 0, 1, 2, 3];
const defaultLinReg: Point2D[] = [
  { x: -3, y: -2 },
  { x: -2, y: -1 },
  { x: -1, y: -0.3 },
  { x: 0, y: 0.5 },
  { x: 1, y: 1.3 },
  { x: 2, y: 2 },
  { x: 3, y: 2.7 },
];
const defaultKMeans: Point2D[] = [
  { x: -2, y: -1 },
  { x: -1.5, y: -1.2 },
  { x: -2.2, y: -0.7 },
  { x: 2, y: 2 },
  { x: 1.5, y: 2.1 },
  { x: 2.3, y: 1.7 },
  { x: 0, y: -2 },
  { x: 0.3, y: -1.8 },
  { x: -0.4, y: -2.2 },
];
const defaultLogReg: LabeledPoint2D[] = [
  { x: -2, y: -2, label: 0 },
  { x: -1, y: -1.5, label: 0 },
  { x: -1.5, y: -2.5, label: 0 },
  { x: 2, y: 2, label: 1 },
  { x: 1.2, y: 2.5, label: 1 },
  { x: 2.5, y: 1.5, label: 1 },
];

// Helper math -------------------------------------------------

const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
const variance = (arr: number[]) => {
  const m = mean(arr);
  return arr.reduce((acc, v) => acc + (v - m) ** 2, 0) / (arr.length || 1);
};

const solveLinearRegression = (pts: Point2D[]) => {
  const n = pts.length;
  const sumX = pts.reduce((acc, p) => acc + p.x, 0);
  const sumY = pts.reduce((acc, p) => acc + p.y, 0);
  const sumXY = pts.reduce((acc, p) => acc + p.x * p.y, 0);
  const sumX2 = pts.reduce((acc, p) => acc + p.x * p.x, 0);
  const denom = n * sumX2 - sumX ** 2;
  if (denom === 0) return { a: 0, b: 0 };
  const a = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - a * sumX) / n;
  return { a, b };
};

const kMeans = (pts: Point2D[], k: number, iterations = 10) => {
  if (pts.length === 0) return { centroids: [], assignments: [] };
  // simple random init
  let centroids = pts.slice(0, k).map((p) => ({ ...p }));
  let assignments: number[] = [];
  for (let iter = 0; iter < iterations; iter++) {
    // assign
    assignments = pts.map((p) => {
      let best = 0,
        bestDist = Infinity;
      centroids.forEach((c, idx) => {
        const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = idx;
        }
      });
      return best;
    });
    // update centroids
    centroids = centroids.map((c, idx) => {
      const clusterPts = pts.filter((_, i) => assignments[i] === idx);
      if (clusterPts.length === 0) return c;
      return {
        x: mean(clusterPts.map((p) => p.x)),
        y: mean(clusterPts.map((p) => p.y)),
      };
    });
  }
  return { centroids, assignments };
};

// Simple logistic regression (2D) using gradient descent
const solveLogistic = (pts: LabeledPoint2D[], steps = 1000, lr = 0.1) => {
  let w = { x: 0, y: 0, b: 0 };
  const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
  for (let s = 0; s < steps; s++) {
    let gradX = 0,
      gradY = 0,
      gradB = 0;
    pts.forEach((p) => {
      const z = w.x * p.x + w.y * p.y + w.b;
      const pred = sigmoid(z);
      const error = pred - p.label;
      gradX += error * p.x;
      gradY += error * p.y;
      gradB += error;
    });
    const n = pts.length;
    w.x -= (lr * gradX) / n;
    w.y -= (lr * gradY) / n;
    w.b -= (lr * gradB) / n;
  }
  return w;
};

// Formulas & explanations (verbatim) --------------------------

const content = {
  meanVariance: {
    model: `p(x_1,\dots,x_n\mid \mu,\sigma^2) = \prod_{i=1}^n \frac{1}{\sqrt{2\pi\sigma^2}} e^{-\frac{(x_i-\mu)^2}{2\sigma^2}}`,
    loss: `\hat\mu = \arg\min_{\mu} \sum_{i=1}^n (x_i-\mu)^2`,
    explanation: `> **From the chapter:**\nFirst, we transform the general idea that mean and variance are important into a concrete probabilistic model. The maximum entropy principle suggests modeling the data as independent samples drawn from the Gaussian distribution. ...`,
  },
  linearRegression: {
    model: `p((x_1,y_1),\dots\mid a,b,\sigma^2) = \prod_{i=1}^n \frac{1}{\sqrt{2\pi\sigma^2}} e^{-\frac{(ax_i + b - y_i)^2}{2\sigma^2}}`,
    loss: `\hat a,\hat b = \arg\min_{a,b} \sum_{i=1}^n (ax_i + b - y_i)^2`,
    explanation: `> **From the chapter:**\nOnce we have a model, we apply the maximum likelihood principle ... (verbatim text omitted for brevity).`,
  },
  kMeans: {
    model: `p(x) = \frac{1}{k} \sum_{j=1}^k \mathcal N(x\mid \mu_j,\sigma^2 I)`,
    loss: `\arg\min_{\mu_1,\dots,\mu_k} \sum_{i=1}^n \min_j \|x_i-\mu_j\|^2`,
    explanation: `> **From the chapter:**\nWe factorize the joint distribution with cluster centers ...`,
  },
  logisticRegression: {
    model: `p(\text{red}|(x,y)) = \sigma(\lambda(\theta\cdot(x,y)+\delta))`,
    loss: `\arg\min_{\theta,\delta,\lambda} \sum_i \ell_i \log p_i + (1-\ell_i) \log(1-p_i)`,
    explanation: `> **From the chapter:**\nWe model the probability of class with the logistic function ...`,
  },
} as const;

// Main component ---------------------------------------------

const CANVAS_SIZE = 400;

export default function MLProblemExplorer() {
  const [mode, setMode] = useState<Mode>("meanVariance");
  const [points1D, setPoints1D] = useState<number[]>(defaultMeanVar);
  const [points2D, setPoints2D] = useState<Point2D[]>(defaultLinReg);
  const [kmeansPts, setKmeansPts] = useState<Point2D[]>(defaultKMeans);
  const [logPts, setLogPts] = useState<LabeledPoint2D[]>(defaultLogReg);
  const [k, setK] = useState(3);
  const [logAddLabel, setLogAddLabel] = useState<0 | 1>(0);

  // Solutions -------------------------------------------------
  const meanVarSolution = useMemo(() => {
    if (points1D.length === 0) return null;
    const m = mean(points1D);
    const v = variance(points1D);
    return { mean: m, sd: Math.sqrt(v) };
  }, [points1D]);

  const linRegSolution = useMemo(() => solveLinearRegression(points2D), [points2D]);

  const kmeansSolution = useMemo(() => kMeans(kmeansPts, k), [kmeansPts, k]);

  const logRegSolution = useMemo(() => solveLogistic(logPts), [logPts]);

  // Coordinate helpers
  const toCanvasX = (x: number) => ((x + 3) / 6) * CANVAS_SIZE;
  const toCanvasY = (y: number) => CANVAS_SIZE - ((y + 3) / 6) * CANVAS_SIZE;
  const fromCanvas = (cx: number, cy: number) => {
    const x = (cx / CANVAS_SIZE) * 6 - 3;
    const y = -((cy / CANVAS_SIZE) * 6 - 3);
    return { x, y };
  };

  // Click handler to add points
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    if (mode === "meanVariance") {
      const xVal = (cx / CANVAS_SIZE) * 6 - 3;
      setPoints1D([...points1D, xVal]);
    } else if (mode === "linearRegression") {
      const p = fromCanvas(cx, cy);
      setPoints2D([...points2D, p]);
    } else if (mode === "kMeans") {
      const p = fromCanvas(cx, cy);
      setKmeansPts([...kmeansPts, p]);
    } else if (mode === "logisticRegression") {
      const p = fromCanvas(cx, cy);
      setLogPts([...logPts, { ...p, label: logAddLabel }]);
    }
  };

  // Rendering helpers ----------------------------------------

  const renderPoints = () => {
    if (mode === "meanVariance") {
      return points1D.map((x, i) => <circle key={i} cx={toCanvasX(x)} cy={CANVAS_SIZE / 2} r={4} fill="#1e3a8a" />);
    }
    if (mode === "linearRegression") {
      return points2D.map((p, i) => <circle key={i} cx={toCanvasX(p.x)} cy={toCanvasY(p.y)} r={4} fill="#1e3a8a" />);
    }
    if (mode === "kMeans") {
      return kmeansPts.map((p, i) => {
        const cls = kmeansSolution.assignments[i];
        const colors = ["#ef4444", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"];
        return <circle key={i} cx={toCanvasX(p.x)} cy={toCanvasY(p.y)} r={4} fill={colors[cls % colors.length]} />;
      });
    }
    if (mode === "logisticRegression") {
      return logPts.map((p, i) => (
        <circle key={i} cx={toCanvasX(p.x)} cy={toCanvasY(p.y)} r={5} fill={p.label === 0 ? "#dc2626" : "#2563eb"} />
      ));
    }
  };

  const renderSolutionOverlay = () => {
    if (mode === "meanVariance" && meanVarSolution) {
      const cx = toCanvasX(meanVarSolution.mean);
      const sdPx = (meanVarSolution.sd / 6) * CANVAS_SIZE;
      return (
        <>
          <line x1={cx} y1={0} x2={cx} y2={CANVAS_SIZE} stroke="#f59e0b" strokeWidth={2} />
          <rect x={cx - sdPx} y={0} width={sdPx * 2} height={CANVAS_SIZE} fill="#fbbf24" opacity={0.2} />
        </>
      );
    }
    if (mode === "linearRegression" && linRegSolution) {
      const { a, b } = linRegSolution;
      const x1 = -3,
        x2 = 3;
      const y1 = a * x1 + b;
      const y2 = a * x2 + b;
      return (
        <line
          x1={toCanvasX(x1)}
          y1={toCanvasY(y1)}
          x2={toCanvasX(x2)}
          y2={toCanvasY(y2)}
          stroke="#10b981"
          strokeWidth={2}
        />
      );
    }
    if (mode === "kMeans") {
      return kmeansSolution.centroids.map((c, idx) => (
        <circle key={idx} cx={toCanvasX(c.x)} cy={toCanvasY(c.y)} r={6} fill="#000" />
      ));
    }
    if (mode === "logisticRegression") {
      const { x: wx, y: wy, b } = logRegSolution;
      // decision boundary wx*x + wy*y + b = 0 => y = -(wx*x + b)/wy
      const x1 = -3,
        x2 = 3;
      const y1 = -(wx * x1 + b) / wy;
      const y2 = -(wx * x2 + b) / wy;
      return (
        <line
          x1={toCanvasX(x1)}
          y1={toCanvasY(y1)}
          x2={toCanvasX(x2)}
          y2={toCanvasY(y2)}
          stroke="#000"
          strokeWidth={2}
        />
      );
    }
    return null;
  };

  // JSX -------------------------------------------------------

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
      {/* Mode selector */}
      <div className="flex justify-center space-x-2">
        <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} className="border p-1 rounded">
          <option value="meanVariance">Mean & Variance</option>
          <option value="linearRegression">Linear Regression</option>
          <option value="kMeans">k-Means</option>
          <option value="logisticRegression">Logistic Regression</option>
        </select>
        {mode === "kMeans" && (
          <input
            type="number"
            min={2}
            max={5}
            value={k}
            onChange={(e) => setK(parseInt(e.target.value) || 3)}
            className="w-16 border p-1 rounded"
          />
        )}
      </div>

      {/* Canvas */}
      <svg width={CANVAS_SIZE} height={CANVAS_SIZE} className="border bg-white mx-auto" onClick={handleCanvasClick}>
        {/* Axes */}
        <line x1={0} y1={CANVAS_SIZE / 2} x2={CANVAS_SIZE} y2={CANVAS_SIZE / 2} stroke="#e5e7eb" />
        <line x1={CANVAS_SIZE / 2} y1={0} x2={CANVAS_SIZE / 2} y2={CANVAS_SIZE} stroke="#e5e7eb" />

        {renderPoints()}
        {renderSolutionOverlay()}
      </svg>

      {/* Solve button */}
      <div className="flex justify-center space-x-2">
        {/* Solve */}
        <button
          onClick={() => {
            // trigger re-render by resetting state (solutions are memoized on points)
            if (mode === "meanVariance") setPoints1D([...points1D]);
            else if (mode === "linearRegression") setPoints2D([...points2D]);
            else if (mode === "kMeans") setKmeansPts([...kmeansPts]);
            else if (mode === "logisticRegression") setLogPts([...logPts]);
          }}
          className="mt-2 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Solve
        </button>

        {/* Reset */}
        <button
          onClick={() => {
            if (mode === "meanVariance") setPoints1D([]);
            else if (mode === "linearRegression") setPoints2D([]);
            else if (mode === "kMeans") setKmeansPts([]);
            else if (mode === "logisticRegression") setLogPts([]);
          }}
          className="mt-2 px-4 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          Reset
        </button>

        {/* Color toggle for logistic regression */}
        {mode === "logisticRegression" && (
          <button
            onClick={() => setLogAddLabel(logAddLabel === 0 ? 1 : 0)}
            className={`mt-2 px-4 py-1 rounded text-white ${logAddLabel === 0 ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            Add {logAddLabel === 0 ? "Red" : "Blue"}
          </button>
        )}
      </div>

      {/* Formulas */}
      <div className="space-y-3 text-sm">
        <div>
          <span className="font-semibold">Probabilistic model:</span>
          <KatexMath math={content[mode].model} displayMode={true} />
        </div>
        <div>
          <span className="font-semibold">Loss function:</span>
          <KatexMath math={content[mode].loss} displayMode={true} />
        </div>
      </div>

      {/* Explanation */}
      <div className="prose max-w-none bg-white p-4 rounded">
        <ReactMarkdown>{content[mode].explanation}</ReactMarkdown>
      </div>
    </div>
  );
}
