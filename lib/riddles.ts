// Centralized riddle configuration
// Change the name here and it updates both the introduction and solution sections

export const RIDDLES = {
  predictions: {
    emoji: "🔮",
    name: "How good are your predictions?",
    id: "predictions"
  },
  polling: {
    emoji: "🗳️", 
    name: "Why polling sucks",
    id: "polling"
  },
  statistics: {
    emoji: "🦶",
    name: "Average foot", 
    id: "statistics"
  },
  financial: {
    emoji: "📈",
    name: "S&P shape",
    id: "financial-mathematics" 
  },
  getrich: {
    emoji: "💰",
    name: "How to get rich",
    id: "get-rich"
  },
  llm: {
    emoji: "🧠",
    name: "LLM training",
    id: "deep-learning"
  },
  independence: {
    emoji: "🔗", 
    name: "Distance from independence",
    id: "information-theory"
  },
  xkcd: {
    emoji: "🤓",
    name: "Understanding XKCD jokes",
    id: "xkcd"
  },
  wikipedia: {
    emoji: "🌐",
    name: "How large is Wikipedia?",
    id: "wikipedia"
  },
  ml: {
    emoji: "🤯",
    name: "Machine Learning mess",
    id: "machine-learning"
  }
} as const;

export type RiddleKey = keyof typeof RIDDLES;