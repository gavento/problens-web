"use client";

import React, { useState, useEffect } from 'react';

interface Snapshot {
  id: number;
  first_sentence: string;
  second_sentence: string;
  cut_position: number;
  context: string;
  target_letter: string;
  remaining: string;
}

interface GameState {
  snapshot: Snapshot | null;
  userGuesses: string[];
  attempts: number;
  completed: boolean;
  score: number;
}

interface LLMScore {
  model: string;
  avg_cross_entropy: number;
  avg_optimistic: number;
  median_cross_entropy: number;
  median_optimistic: number;
}

const LetterPredictionWidget: React.FC = () => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [llmScores, setLlmScores] = useState<Record<string, LLMScore>>({});
  const [gameStates, setGameStates] = useState<GameState[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load snapshots
        const snapshotResponse = await fetch('/problens-web/data/prediction_snapshots.json');
        const snapshotData = await snapshotResponse.json();
        setSnapshots(snapshotData.snapshots);

        // Try to load LLM scores (may not exist yet)
        try {
          const llmResponse = await fetch('/problens-web/data/llm_prediction_scores.json');
          const llmData = await llmResponse.json();
          setLlmScores(llmData.summary || {});
        } catch (e) {
          console.log('LLM scores not available yet');
          // Create mock data for testing
          setLlmScores({
            'gpt2': {
              model: 'gpt2',
              avg_cross_entropy: 6.5,
              avg_optimistic: 2.8,
              median_cross_entropy: 5.2,
              median_optimistic: 2.0
            },
            'distilgpt2': {
              model: 'distilgpt2',
              avg_cross_entropy: 7.2,
              avg_optimistic: 3.1,
              median_cross_entropy: 6.0,
              median_optimistic: 2.5
            }
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const startNewGame = () => {
    if (snapshots.length === 0) return;
    
    // Select random snapshot
    const randomSnapshot = snapshots[Math.floor(Math.random() * snapshots.length)];
    
    const newGame: GameState = {
      snapshot: randomSnapshot,
      userGuesses: [],
      attempts: 0,
      completed: false,
      score: 0
    };

    setGameStates([...gameStates, newGame]);
    setCurrentInput('');
  };

  const makeGuess = (gameIndex: number, letter: string) => {
    const game = gameStates[gameIndex];
    if (!game.snapshot || game.completed) return;

    const normalizedLetter = letter.toLowerCase();
    const normalizedTarget = game.snapshot.target_letter.toLowerCase();
    
    const newAttempts = game.attempts + 1;
    const newGuesses = [...game.userGuesses, normalizedLetter];
    
    if (normalizedLetter === normalizedTarget) {
      // Correct guess!
      const score = Math.log2(newAttempts);
      const updatedGame = {
        ...game,
        userGuesses: newGuesses,
        attempts: newAttempts,
        completed: true,
        score: score
      };
      
      const newGameStates = [...gameStates];
      newGameStates[gameIndex] = updatedGame;
      setGameStates(newGameStates);
    } else {
      // Wrong guess
      const updatedGame = {
        ...game,
        userGuesses: newGuesses,
        attempts: newAttempts
      };
      
      const newGameStates = [...gameStates];
      newGameStates[gameIndex] = updatedGame;
      setGameStates(newGameStates);
    }
    
    setCurrentInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, gameIndex: number) => {
    if (e.key === 'Enter' && currentInput.length === 1) {
      makeGuess(gameIndex, currentInput);
    }
  };

  const calculateUserAverage = () => {
    const completedGames = gameStates.filter(g => g.completed);
    if (completedGames.length === 0) return 0;
    return completedGames.reduce((sum, g) => sum + g.score, 0) / completedGames.length;
  };

  const getModelComparison = () => {
    const userAvg = calculateUserAverage();
    const comparisons = Object.entries(llmScores).map(([modelName, scores]) => ({
      model: modelName,
      userScore: userAvg,
      llmOptimistic: scores.avg_optimistic,
      difference: userAvg - scores.avg_optimistic,
      betterThan: userAvg < scores.avg_optimistic
    }));
    
    return comparisons.sort((a, b) => a.llmOptimistic - b.llmOptimistic);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="text-center">Loading prediction data...</div>
      </div>
    );
  }

  const currentGame = gameStates.length > 0 ? gameStates[gameStates.length - 1] : null;
  const completedGames = gameStates.filter(g => g.completed);
  const canShowResults = completedGames.length >= 5;

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-6 max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 text-center">
        Human vs LLM: Next Letter Prediction
      </h3>
      
      <p className="text-sm text-gray-600 text-center">
        Can you predict the next letter better than an AI? Try to guess the missing letter in these Wikipedia sentences.
      </p>

      {/* Game Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={startNewGame}
          disabled={snapshots.length === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {gameStates.length === 0 ? 'Start Game' : 'Next Sentence'}
        </button>
        
        {canShowResults && !showResults && (
          <button
            onClick={() => setShowResults(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Show Results
          </button>
        )}
      </div>

      {/* Current Game */}
      {currentGame && currentGame.snapshot && (
        <div className="bg-white p-4 rounded-lg border">
          <div className="space-y-4">
            {/* Context Display */}
            <div className="text-lg">
              <span className="text-gray-700">
                {currentGame.snapshot.first_sentence} {currentGame.snapshot.context}
              </span>
              <span className="bg-yellow-200 px-1 rounded">_</span>
              {currentGame.completed && (
                <>
                  <span className="bg-green-200 px-1 rounded font-semibold">
                    {currentGame.snapshot.target_letter}
                  </span>
                  <span className="text-gray-700">
                    {currentGame.snapshot.remaining}
                  </span>
                </>
              )}
            </div>

            {/* Game Input */}
            {!currentGame.completed && (
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value.slice(-1))}
                    onKeyPress={(e) => handleKeyPress(e, gameStates.length - 1)}
                    placeholder="Enter a letter"
                    className="w-16 px-2 py-1 border rounded text-center font-mono text-lg"
                    maxLength={1}
                  />
                  <button
                    onClick={() => makeGuess(gameStates.length - 1, currentInput)}
                    disabled={currentInput.length !== 1}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                  >
                    Guess
                  </button>
                </div>
                
                <div className="text-sm text-gray-600">
                  Attempts: {currentGame.attempts}
                  {currentGame.userGuesses.length > 0 && (
                    <span className="ml-4">
                      Previous guesses: {currentGame.userGuesses.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Game Result */}
            {currentGame.completed && (
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <div className="text-green-800">
                  ✓ Correct! You found '{currentGame.snapshot.target_letter}' in {currentGame.attempts} attempts.
                </div>
                <div className="text-sm text-green-700">
                  Your score: {currentGame.score.toFixed(2)} bits (log₂({currentGame.attempts}))
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress */}
      {gameStates.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-semibold mb-2">Progress</h4>
          <div className="text-sm text-gray-600">
            Games played: {gameStates.length} | Completed: {completedGames.length}
          </div>
          {completedGames.length > 0 && (
            <div className="text-sm text-gray-600">
              Average score: {calculateUserAverage().toFixed(2)} bits
            </div>
          )}
        </div>
      )}

      {/* Results Comparison */}
      {showResults && completedGames.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-semibold mb-4">Results: You vs AI Models</h4>
          
          <div className="mb-4">
            <div className="text-lg font-semibold text-blue-600">
              Your average score: {calculateUserAverage().toFixed(2)} bits
            </div>
            <div className="text-sm text-gray-600">
              (Lower is better - means fewer guesses needed on average)
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-medium">Comparison with Language Models:</h5>
            {getModelComparison().map((comp, index) => (
              <div 
                key={comp.model}
                className={`flex justify-between items-center p-2 rounded ${
                  comp.betterThan ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                <span className="font-mono">{comp.model}</span>
                <div className="text-right">
                  <div className="text-sm">
                    AI: {comp.llmOptimistic.toFixed(2)} bits
                  </div>
                  <div className={`text-xs ${comp.betterThan ? 'text-green-600' : 'text-red-600'}`}>
                    {comp.betterThan ? '✓ You win!' : '✗ AI wins'} 
                    (Δ {Math.abs(comp.difference).toFixed(2)})
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs text-gray-500">
            * AI scores use "optimistic ranking" - if the correct letter was the AI's k-th choice, score = log₂(k)
          </div>
        </div>
      )}
    </div>
  );
};

export default LetterPredictionWidget;