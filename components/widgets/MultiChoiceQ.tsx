"use client";
import React, { useState } from "react";

interface MCQProps {
  children: React.ReactNode;
  options: Record<string, React.ReactNode>;
  correct: string;
  explanation?: React.ReactNode;
}

const MultiChoiceQ = ({ children, options, correct, explanation }: MCQProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleSelectAnswer = (id: string) => {
    setSelectedAnswer(id);
    setIsAnswered(true);
  };

  const isCorrect = selectedAnswer === correct;

  return (
    <div className="my-6 p-4 bg-gray-50 rounded-lg">
      {/* Question */}
      <div className="mb-3 font-medium">{children}</div>

      {/* Answer Options */}
      <div className="mb-4 space-y-2">
        {Object.entries(options).map(([id, content]) => (
          <button
            key={id}
            onClick={() => handleSelectAnswer(id)}
            disabled={isAnswered}
            className={`w-full text-left p-3 rounded-md border transition-colors ${
              isAnswered
                ? id === correct
                  ? "bg-green-100 border-green-500"
                  : id === selectedAnswer
                  ? "bg-red-100 border-red-500"
                  : "bg-white border-gray-300"
                : "bg-white border-gray-300 hover:bg-gray-100"
            }`}
          >
            <span className="font-medium mr-2">{id}.</span>
            <span>{content}</span>
          </button>
        ))}
      </div>

      {/* Feedback after answering */}
      {isAnswered && (
        <div className="mt-3">
          <div className={`p-3 rounded-md ${isCorrect ? "bg-green-100" : "bg-red-100"}`}>
            <div className="font-medium mb-1">
              {isCorrect ? (
                "Correct!"
              ) : (
                <>
                  Incorrect - the right answer was:
                  <span className="font-medium ml-1">
                    {correct}. {options[correct]}
                  </span>
                </>
              )}
            </div>
            {explanation && <div className="text-sm mt-2">{explanation}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiChoiceQ;
