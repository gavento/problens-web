"use client";
import React, { useState, useMemo } from "react";
import { InlineMath } from "react-katex";
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

const defaultMeanVar = [-1.9, -1.2, -0.4, 0.3, 1.1, 1.8];
const defaultLinReg: Point2D[] = [
  { x: -3, y: -2.8 },
  { x: -2, y: -1.4 },
  { x: -1, y: -0.6 },
  { x: 0, y: 0.3 },
  { x: 1, y: 1.8 },
  { x: 2, y: 2.4 },
  { x: 3, y: 3.1 },
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
    model: `p(x_1,\\ldots,x_n\\mid \\mu,\\sigma^2) = \\prod_{i=1}^n \\frac{1}{\\sqrt{2\\pi\\sigma^2}} e^{-\\frac{(x_i-\\mu)^2}{2\\sigma^2}}`,
    loss: `\\hat{\\mu} = \\arg\\min_{\\mu} \\sum_{i = 1}^n (x_i-\\mu)^2`,
    explanation: `Our [basic statistics riddle](00-introduction/statistics) posed the following: Given a set of numbers $X_1, \dots, X_n$, how do we estimate their mean and variance?

We've already approached this riddle from various angles; now, let's combine our insights.

First, we transform the general idea that mean and variance are important into a concrete probabilistic model. The [maximum entropy principle](04-max_entropy) suggests modeling the data as independent samples drawn from [the gaussian distribution](04-max_entropy#normal).

Once we have a set of possible models—all Gaussian distributions—we can select the best one using [the maximum likelihood principle](03-minimizing#mle).

We want to find $\hat\mu, \hat\sigma^2$ that maximizes
$\hat\mu, \hat\sigma^2 = \argmin_{\mu, \sigma^2} \prod_{i = 1}^N \frac{1}{\sqrt{2\pi\sigma^2}} e^{-\frac{(X_i-\mu)^2}{2\sigma^2}}$

It's typically easier to write down the logarithm of the likelihood function, i.e., the log-likelihood. This is not too surprising since [we understand](03-minimizing#mle) that maximizing log-likelihood is a synonym to minimizing KL divergence. If we make the problem simpler for us and consider only the estimation of the mean $\mu$, the equation simplifies like this:

$\hat\mu = \argmin_{\mu} \sum_{i = 1}^N (X_i-\mu)^2$

In this specific case, the optimization problem has a closed-form solution $\hat\mu = \frac{1}{N} \cdot \sum_{i = 1}^N X_i$ (and the formula for $\hat\sigma^2$ is analogous). Notice that while our formulas themselves don't explicitly mention probabilities, probabilities are essential for understanding the underlying mechanics.

What I want to emphasize is how our only initial assumption about the data was simply, "we have a bunch of numbers, and we care about their mean and variance." The rest flowed automatically from our understanding of KL divergence.`,
  },
  linearRegression: {
    model: `p((x_1,y_1),\\ldots\\mid a,b,\\sigma^2) = \\prod_{i=1}^n \\frac{1}{\\sqrt{2\\pi\\sigma^2}} e^{-\\frac{(a x_i + b - y_i)^2}{2\\sigma^2}}`,
    loss: `\\hat{a},\\hat{b} = \\arg\\min_{a,b} \\sum_{i=1}^n (a x_i + b - y_i)^2`,
    explanation: `Suppose we are given a list of pairs $(x_1, y_1), \dots, (x_n, y_n)$. We believe the data exhibits a roughly linear dependency, meaning there exist some constants $a,b$ such that $y_i \approx a\cdot x_i + b$. Our objective is to determine $a$ and $b$.

Let's transform this into a concrete probabilistic model. We'll model the data by assuming $y_i$ originates from the distribution $a\cdot x_i + b + \text{noise}$.

The noise is generated from a real-valued distribution. How do we choose it? The uniform distribution doesn't normalize over real numbers, making it unsuitable; the same applies to the exponential distribution. The next logical choice is the **Gaussian distribution** $N(\mu, \sigma^2)$, so let's select that. This introduces a slight complication as we now have two new parameters, $\mu, \sigma^2$, in our model $y_i \sim a\cdot x_i + b + N(\mu, \sigma^2)$, even though we primarily care about $a$ and $b$.

But this is fine. First, we can assume $\mu = 0$, because otherwise, we could replace $N(\mu, \sigma^2)$ with $N(0, \sigma^2)$ and $b$ with $b + \mu$ to achieve the same data model. We'll address $\sigma$ in a moment.

Let's proceed with our recipe and apply the maximum likelihood principle. We write down the likelihood of our data given our model:

$P((x_1, y_1), \dots, (x_n, y_n) | a, b, \sigma^2, x_1, \dots, x_n) = \prod_{i = 1}^n \frac{1}{\sqrt{2\pi\sigma^2}} e^{-\frac{(ax_i + b - y_i)^2}{2\sigma^2}}$

As usual, it's simpler to consider the log-likelihood (or cross-entropy):

$\log P(\text{data} | \text{parameters}) = -\frac{n}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2} \sum_{i=1}^n (a\cdot x_i + b - y_i)^2$

This expression appears rather complex, but we notice that for any fixed value of $\sigma^2$, the optimization problem for $a,b$ reduces to minimizing:

$\hat{a}, \hat{b} = \argmin_{a,b} \sum_{i=1}^n (a\cdot x_i + b - y_i)^2$

Therefore, we can effectively disregard the added parameter $\sigma^2$ and simply optimize above expression, which is the classical [least-squares loss function](https://en.wikipedia.org/wiki/Ordinary_least_squares) for linear regression. Notice how the square in the loss function emerged directly from our maximum entropy assumption of Gaussian noise.`,
  },
  kMeans: {
    model: `p(x) = \\frac{1}{k} \\sum_{j=1}^k \\mathcal{N}(x\\mid \\mu_j,\\sigma^2 I)`,
    loss: `\\arg\\min_{\\mu_1,\\ldots,\\mu_k} \\sum_{i=1}^n \\min_j \\|x_i-\\mu_j\\|^2`,
    explanation: `We are given a set of points $x_1, \dots, x_n$ on, say, a 2D plane. Our objective is to group them into $k$ clusters.

Let's transform this into a probabilistic model. We'll use $\mu_1, \dots, \mu_k$ to represent the centers of these clusters. The significance of these points is that if a point $x_i$ belongs to cluster $j$, then its Euclidean distance $||x_i - \mu_j||$ should be small.

As before, we can employ the maximum entropy distribution to construct a concrete model. Since the exponential function doesn't normalize, we will use the Normal distribution:

$p(x | \mu_j) \propto e^{-\frac{||x-\mu_j||^2}{2\sigma^2}}$

The notation $p(x | \mu_j)$ signifies that this is our model for points originating from the $j$-th cluster. However, we desire a complete probabilistic model $p(x)$. We can achieve this by assigning a prior probability to how likely each cluster is. The maximum entropy prior is the uniform distribution, so we will choose:

$p(x) = \frac{1}{k} \sum_{j = 1}^k p(x | \mu_j)$

We now have a probabilistic model that generates data $x$ from a distribution $p$. It's parameterized by $k+1$ values: $\mu_1, \dots, \mu_k$, and $\sigma^2$. We will use maximum likelihood to determine these parameters. The principle dictates that we should maximize the following log-likelihood:

$\argmax_{\substack{\mu_1, \dots, \mu_k \\ \sigma^2}} -n \log \left( k\sqrt{2\pi\sigma^2}\right) + \sum_{i = 1}^n  \log \sum_{j = 1}^k e^{-\frac{||x_i-\mu_j||^2}{2\sigma^2}}$

Optimizing this expression corresponds to an algorithm known as [soft $k$-means](https://en.wikipedia.org/wiki/Fuzzy_clustering). The term "soft" indicates that the parameter $\sigma$ allows us to output a probability distribution for each point $x$, indicating its likelihood of belonging to each cluster.

In practice, people typically don't care that much about probabilistic assignment in $k$-means; knowing the closest cluster is usually sufficient. This corresponds to considering the limit as $\sigma \rightarrow 0$. In this limit, the messy expression above simplifies quite elegantly. Specifically, we can replace the summation $\sum_{j = 1}^k e^{-\frac{||x_i-\mu_j||^2}{2\sigma^2}}$ with $\max_{j = 1}^k e^{-\frac{||x_i-\mu_j||^2}{2\sigma^2}}$ because all terms in the sum, except the largest one, become negligible as $\sigma \rightarrow 0$. The expression then simplifies to:

$\argmin_{\substack{\mu_1, \dots, \mu_k}} \sum_{i = 1}^n \min_{j = 1}^k ||x_i-\mu_j||^2$

The problem of finding $\mu_1, \dots, \mu_k$ that minimize this expression is called [$k$-means](https://en.wikipedia.org/wiki/K-means_clustering).`,
  },
  logisticRegression: {
    model: `p(\\text{red}|(x,y)) = \\sigma(\\lambda(\\theta\\cdot(x,y)+\\delta))`,
    loss: `\\arg\\min_{\\theta,\\delta,\\lambda} \\sum_i \\ell_i \\log p_i + (1-\\ell_i) \\log(1-p_i)`,
    explanation: `This time, we're presented with red and blue points on a plane, and our goal is to find the optimal line that separates them. Ideally, all red points would be on one side and all blue points on the other, but this isn't always achievable. In such cases, how do we determine the "best" separating line?

It will be easier to represent the line not as $y = ax+b$, but using its normal vector $\theta$ (orthogonal to the line) and the distance $\delta$ of the origin from the line.

Given a point $(x, y)$, the crucial quantity is its distance from our line. This can be calculated using the dot product as $\theta \cdot (x, y) + \delta$.

Now, employing the maximum entropy principle, we construct a probabilistic model that transforms this distance into a probability of color. We utilize the [logistic function](04-max_entropy). That is, our model states:
$p(\textrm{red} | (x, y)) = \sigma\left( \lambda (\theta \cdot (x, y) + \delta) \right)$
where $\sigma$ is the logistic function $\sigma(x) = e^x / (1+e^x)$. Naturally, we also have $p(\textrm{blue} | (x, y)) = 1 - p(\textrm{red} | (x, y))$.

The constant $\lambda$ is a new parameter that the max-entropy principle compels us to add to our probabilistic model. Fortunately, it's quite a useful parameter—it quantifies our confidence in the classification. This is convenient because if we want to classify a new point in the future, we can not only assign it a red/blue color based on which side of the line it falls, but also use the equation above to compute how certain we are about our classification.

Once we have a model, we can apply the maximum likelihood principle to find its parameters. This principle instructs us to find $a,b,\lambda$ that minimize the following log-likelihood:

$\argmin_{\theta, \delta, \lambda} \sum_{i = 1}^n \ell_i \log \sigma(\lambda (\theta \cdot (x_i,y_i) + \delta)) + (1-\ell_i) \log (1-\sigma(\lambda (\theta \cdot (x_i,y_i) + \delta)))$

where $\ell_i$ is an indicator variable (i.e., $\ell_i \in \{0,1\}$) denoting whether the point $(x_i,y_i)$ is red. This problem, known as [logistic regression](https://en.wikipedia.org/wiki/Logistic_regression), is hard to solve exactly (NP-hard in particular), but gradient descent typically works well.`,
  },
} as const;

// Main component ---------------------------------------------

const CANVAS_SIZE = 400;

interface MLProblemExplorerProps {
  showExplanations?: boolean;
}

export default function MLProblemExplorer({ showExplanations = true }: MLProblemExplorerProps) {
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
      const { mean: m, sd } = meanVarSolution;
      const cx = toCanvasX(m);
      const axisY = CANVAS_SIZE / 2;
      const sdPx = (sd / 6) * CANVAS_SIZE;
      const arrowY = axisY - 25;
      const startX = cx - sdPx;
      const endX = cx + sdPx;
      return (
        <>
          {/* mean marker */}
          <line x1={cx} y1={axisY - 6} x2={cx} y2={axisY + 6} stroke="#f59e0b" strokeWidth={3} />
          <text x={cx + 4} y={axisY - 8} fontSize="12" fill="#f59e0b">
            {`μ=${m.toFixed(2)}`}
          </text>

          {/* sigma indicator */}
          <line x1={startX} y1={arrowY} x2={endX} y2={arrowY} stroke="#f59e0b" strokeWidth={2} />
          {/* endpoints */}
          <line x1={startX} y1={arrowY - 4} x2={startX} y2={arrowY + 4} stroke="#f59e0b" strokeWidth={2} />
          <line x1={endX} y1={arrowY - 4} x2={endX} y2={arrowY + 4} stroke="#f59e0b" strokeWidth={2} />
          <text x={(startX + endX) / 2} y={arrowY - 4} fontSize="12" textAnchor="middle" fill="#f59e0b">
            {`σ=${sd.toFixed(2)}`}
          </text>
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
        <>
          <line
            x1={toCanvasX(x1)}
            y1={toCanvasY(y1)}
            x2={toCanvasX(x2)}
            y2={toCanvasY(y2)}
            stroke="#10b981"
            strokeWidth={2}
          />
          <text x={5} y={15} fontSize="12" fill="#10b981">
            {`y = ${a.toFixed(2)} x + ${b.toFixed(2)}`}
          </text>
        </>
      );
    }
    if (mode === "kMeans") {
      return kmeansSolution.centroids.map((c, idx) => (
        <g key={idx}>
          <circle cx={toCanvasX(c.x)} cy={toCanvasY(c.y)} r={6} fill="#000" />
          <text x={toCanvasX(c.x) + 8} y={toCanvasY(c.y) - 4} fontSize="12" fill="#000">
            {`μ_${idx + 1}=[${c.x.toFixed(1)},${c.y.toFixed(1)}]`}
          </text>
        </g>
      ));
    }
    if (mode === "logisticRegression") {
      const { x: wx, y: wy, b } = logRegSolution;
      // decision boundary wx*x + wy*y + b = 0 => y = -(wx*x + b)/wy
      const x1 = -3,
        x2 = 3;
      const y1 = -(wx * x1 + b) / wy;
      const y2 = -(wx * x2 + b) / wy;

      // convert to lambda, theta, delta form
      const lambda = Math.sqrt(wx * wx + wy * wy);
      const thetaX = wx / (lambda || 1);
      const thetaY = wy / (lambda || 1);
      const delta = b / (lambda || 1);

      return (
        <>
          <line
            x1={toCanvasX(x1)}
            y1={toCanvasY(y1)}
            x2={toCanvasX(x2)}
            y2={toCanvasY(y2)}
            stroke="#000"
            strokeWidth={2}
          />
          <text x={5} y={CANVAS_SIZE - 5} fontSize="12" fill="#000">
            {`λ=${lambda.toFixed(2)}  θ=(${thetaX.toFixed(2)},${thetaY.toFixed(2)})  δ=${delta.toFixed(2)}`}
          </text>
        </>
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

        {/* k selector for k-means */}
        {mode === "kMeans" && (
          <input
            type="number"
            min={2}
            max={5}
            value={k}
            onChange={(e) => setK(parseInt(e.target.value) || 3)}
            className="mt-2 w-16 border p-1 rounded"
          />
        )}

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
          <div className="math-display-large">
            <InlineMath math={content[mode].model} />
          </div>
        </div>
        <div>
          <span className="font-semibold">Loss function:</span>
          <div className="math-display-large">
            <InlineMath math={content[mode].loss} />
          </div>
        </div>
      </div>

      {/* Explanation */}
      {showExplanations && (
        <div className="prose max-w-none bg-white p-4 rounded">
          <ReactMarkdown>{content[mode].explanation}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
