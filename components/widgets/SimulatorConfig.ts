// Shared configuration for Evidence Accumulation and Cross-Entropy simulators
export const CHART_CONFIG = {
  margins: { top: 5, right: 40, left: 30, bottom: 35 },
  height: {
    normal: "h-96",
    zoomed: "h-full",
  },
  colors: {
    evidence: "#2563eb", // blue
    trueP: "#2563eb", // blue (truth p)
    klExpected: "#dc2626", // red
    entropy: "#f97316", // orange
    modelQ: "#dc2626", // red (model q)
  },
  animation: {
    transitionDuration: 300,
    isAnimationActive: false,
  },
  controls: {
    defaultSpeed: 50,
    defaultNumFlips: 200,
    speedRange: { min: 10, max: 500, step: 10 },
    flipsRange: { min: 10, max: 500, step: 10 },
    probRange: { min: 0.01, max: 0.99, step: 0.01 },
  },
};

// Shared button styles
export const BUTTON_STYLES = {
  primary: {
    running: "bg-yellow-500 hover:bg-yellow-600",
    stopped: "bg-blue-500 hover:bg-blue-600",
  },
  secondary: "bg-gray-500 hover:bg-gray-600",
  zoom: "bg-blue-500 hover:bg-blue-600",
  base: "px-4 py-2 rounded-md font-medium text-white",
  small: "px-3 py-1 text-xs rounded font-medium text-white",
};

// Shared input styles
export const INPUT_STYLES = {
  rangeColors: {
    trueP: "bg-blue-200",
    modelQ: "bg-red-200",
    flips: "bg-gray-200",
    speed: "bg-purple-200",
  },
  base: "w-full h-2 rounded-lg appearance-none cursor-pointer",
};
