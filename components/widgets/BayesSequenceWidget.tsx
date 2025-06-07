"use client";

import React, { useState, useMemo } from "react";

type Props = {
  title?: string;
};

type CoinFlip = 'H' | 'T';

const BayesSequenceWidget: React.FC<Props> = ({
  title = "Bayes Sequence Explorer"
}) => {
  const [sequence, setSequence] = useState<CoinFlip[]>(['H', 'T', 'T', 'H', 'T']);
  const [currentStep, setCurrentStep] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('HTTHT');
  
  // Fixed parameters for the coin example
  const priorFair = 2;
  const priorBiased = 1;
  const probHeadsFair = 0.5;
  const probHeadsBiased = 0.25;
  const probTailsFair = 0.5;
  const probTailsBiased = 0.75;

  const steps = useMemo(() => {
    const results = [];
    let oddsFair = priorFair;
    let oddsBiased = priorBiased;
    
    // Step 0: Prior
    results.push({
      step: 0,
      flip: null,
      likelihoodFair: null,
      likelihoodBiased: null,
      oddsFair,
      oddsBiased,
      probFair: (oddsFair / (oddsFair + oddsBiased)) * 100,
      probBiased: (oddsBiased / (oddsFair + oddsBiased)) * 100
    });

    // Each flip
    for (let i = 0; i < sequence.length; i++) {
      const flip = sequence[i];
      const likelihoodFair = flip === 'H' ? probHeadsFair : probTailsFair;
      const likelihoodBiased = flip === 'H' ? probHeadsBiased : probTailsBiased;
      
      oddsFair *= likelihoodFair;
      oddsBiased *= likelihoodBiased;
      
      results.push({
        step: i + 1,
        flip,
        likelihoodFair,
        likelihoodBiased,
        oddsFair,
        oddsBiased,
        probFair: (oddsFair / (oddsFair + oddsBiased)) * 100,
        probBiased: (oddsBiased / (oddsFair + oddsBiased)) * 100
      });
    }
    
    return results;
  }, [sequence]);

  const handleEdit = () => {
    if (isEditing) {
      // Parse the edit text
      const newSequence = editText.toUpperCase().split('').filter(c => c === 'H' || c === 'T') as CoinFlip[];
      if (newSequence.length > 0) {
        setSequence(newSequence);
        setCurrentStep(0);
      }
    } else {
      setEditText(sequence.join(''));
    }
    setIsEditing(!isEditing);
  };

  const handleStep = () => {
    if (currentStep < sequence.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
  };

  const handleCoinClick = (index: number) => {
    if (!isEditing) return;
    const newSequence = [...sequence];
    newSequence[index] = newSequence[index] === 'H' ? 'T' : 'H';
    setSequence(newSequence);
    setEditText(newSequence.join(''));
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-4 max-w-4xl mx-auto">
      {title && (
        <h3 className="text-lg font-semibold text-center text-gray-800">
          {title}
        </h3>
      )}

      <div className="bg-white rounded-lg p-6 space-y-4">
        {/* Sequence controls */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <span className="text-sm font-medium text-gray-700">Coin sequence:</span>
          
          {isEditing ? (
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded font-mono text-center"
              placeholder="HTTHT"
            />
          ) : (
            <div className="flex space-x-1">
              {sequence.map((flip, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 flex items-center justify-center rounded border-2 font-mono font-bold cursor-pointer ${
                    index < currentStep
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : index === currentStep
                      ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                  }`}
                  onClick={() => handleCoinClick(index)}
                >
                  {flip}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex space-x-2">
            <button
              onClick={handleEdit}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
            >
              {isEditing ? 'Save' : 'Edit'}
            </button>
            <button
              onClick={handleStep}
              disabled={currentStep >= sequence.length}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
            >
              Step
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="text-center text-sm text-gray-600 mb-4">
          Current step: {currentStep}/{sequence.length}
        </div>

        {/* Prior and flip rows */}
        <div className="bg-white rounded-lg p-4 space-y-2">
          {/* Prior row */}
          <div className="flex items-center py-2 px-3 rounded bg-blue-50 border border-blue-200">
            <span className="text-sm font-medium text-gray-700 w-12">Prior</span>
            <div className="flex-1 flex items-center justify-center space-x-2">
              <span className="font-mono text-sm font-bold">{priorFair}</span>
              <span className="text-gray-500">:</span>
              <span className="font-mono text-sm font-bold">{priorBiased}</span>
            </div>
          </div>
          
          {/* Flip rows */}
          {steps.slice(1, currentStep + 1).map((step, index) => (
            <div
              key={index}
              className={`flex items-center py-2 px-3 rounded ${
                index === currentStep - 1 ? 'bg-yellow-50 border border-yellow-300' : 'bg-gray-50'
              }`}
            >
              <span className="font-mono font-bold text-lg w-12 text-center">
                {step.flip}
              </span>
              <div className="flex-1 flex items-center justify-center space-x-2">
                <span className="font-mono text-sm">{step.likelihoodFair?.toFixed(2)}</span>
                <span className="text-gray-500">:</span>
                <span className="font-mono text-sm">{step.likelihoodBiased?.toFixed(2)}</span>
              </div>
            </div>
          ))}

          {/* Posterior section */}
          {currentStep > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-300 space-y-2">
              {/* Posterior odds */}
              <div className="flex items-center py-2 px-3 rounded bg-green-50">
                <span className="text-sm font-medium text-gray-700 w-12">Posterior</span>
                <div className="flex-1 flex items-center justify-center space-x-2">
                  <span className="font-mono text-sm font-bold text-blue-600">
                    {steps[currentStep]?.oddsFair.toFixed(3)}
                  </span>
                  <span className="text-gray-500">:</span>
                  <span className="font-mono text-sm font-bold text-blue-600">
                    {steps[currentStep]?.oddsBiased.toFixed(3)}
                  </span>
                </div>
              </div>
              
              {/* Probabilities */}
              <div className="flex items-center py-2 px-3 rounded bg-green-50">
                <span className="text-sm font-medium text-gray-700 w-12">Probability</span>
                <div className="flex-1 flex items-center justify-center space-x-2">
                  <span className="font-mono text-sm font-bold text-blue-600">
                    {steps[currentStep]?.probFair.toFixed(1)}%
                  </span>
                  <span className="text-gray-500">:</span>
                  <span className="font-mono text-sm font-bold text-blue-600">
                    {steps[currentStep]?.probBiased.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-gray-600">
        Step through the sequence to see how each coin flip updates the posterior probabilities.
        Click Edit to modify the sequence.
      </div>
    </div>
  );
};

export default BayesSequenceWidget;