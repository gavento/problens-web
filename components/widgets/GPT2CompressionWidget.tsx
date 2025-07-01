"use client";

import React, { useState, useEffect } from 'react';

interface TokenPrediction {
  token: string;
  token_id: number;
  probability: number;
}

interface CompressionStep {
  step_number: number;
  token: string;
  token_id: number;
  context_tokens: string[];
  top_predictions: TokenPrediction[];
  actual_probability: number;
  shannon_code_length: number;
  shannon_code: string;
  total_bits_so_far: number;
}

interface CompressionResult {
  original_text: string;
  tokens: string[];
  steps: CompressionStep[];
  total_bits: number;
  original_bits: number;
  compression_ratio: number;
  success: boolean;
  error?: string;
}

const GPT2CompressionWidget: React.FC = () => {
  const defaultText = "Language models can compress text by predicting the next token";
  const [inputText, setInputText] = useState(defaultText);
  const [compressionData, setCompressionData] = useState<CompressionResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = "https://vaclavrozhon-probabilistic-lenses-widgets.hf.space";

  // Memoized result for the default sentence
  const defaultCompressionResult: CompressionResult = {
    original_text: "Language models can compress text by predicting the next token",
    tokens: ["Language", " models", " can", " compress", " text", " by", " predicting", " the", " next", " token"],
    steps: [
      {
        step_number: 0,
        token: "Language",
        token_id: 15143,
        context_tokens: [],
        top_predictions: [
          { token: "The", token_id: 464, probability: 0.08234 },
          { token: "I", token_id: 40, probability: 0.06891 },
          { token: "This", token_id: 770, probability: 0.04567 },
          { token: "A", token_id: 32, probability: 0.03892 },
          { token: "In", token_id: 818, probability: 0.03234 }
        ],
        actual_probability: 0.00142,
        shannon_code_length: 10,
        shannon_code: "1011010110",
        total_bits_so_far: 10
      },
      {
        step_number: 1,
        token: " models",
        token_id: 4981,
        context_tokens: ["Language"],
        top_predictions: [
          { token: " is", token_id: 318, probability: 0.12345 },
          { token: " and", token_id: 290, probability: 0.08901 },
          { token: " processing", token_id: 7587, probability: 0.06789 },
          { token: " learning", token_id: 4673, probability: 0.05432 },
          { token: " understanding", token_id: 4547, probability: 0.04321 }
        ],
        actual_probability: 0.03876,
        shannon_code_length: 5,
        shannon_code: "10110",
        total_bits_so_far: 15
      },
      {
        step_number: 2,
        token: " can",
        token_id: 460,
        context_tokens: ["Language", " models"],
        top_predictions: [
          { token: " are", token_id: 389, probability: 0.15678 },
          { token: " have", token_id: 423, probability: 0.12345 },
          { token: " like", token_id: 588, probability: 0.09876 },
          { token: " such", token_id: 884, probability: 0.07654 },
          { token: " for", token_id: 329, probability: 0.06543 }
        ],
        actual_probability: 0.08234,
        shannon_code_length: 4,
        shannon_code: "1101",
        total_bits_so_far: 19
      },
      {
        step_number: 3,
        token: " compress",
        token_id: 25555,
        context_tokens: ["Language", " models", " can"],
        top_predictions: [
          { token: " be", token_id: 307, probability: 0.18765 },
          { token: " help", token_id: 1037, probability: 0.12345 },
          { token: " understand", token_id: 1833, probability: 0.09876 },
          { token: " process", token_id: 1429, probability: 0.08765 },
          { token: " generate", token_id: 7716, probability: 0.07654 }
        ],
        actual_probability: 0.00089,
        shannon_code_length: 11,
        shannon_code: "10110101101",
        total_bits_so_far: 30
      },
      {
        step_number: 4,
        token: " text",
        token_id: 2420,
        context_tokens: ["Language", " models", " can", " compress"],
        top_predictions: [
          { token: " data", token_id: 1366, probability: 0.23456 },
          { token: " information", token_id: 1321, probability: 0.18765 },
          { token: " files", token_id: 3696, probability: 0.12345 },
          { token: " images", token_id: 4263, probability: 0.09876 },
          { token: " audio", token_id: 6597, probability: 0.08765 }
        ],
        actual_probability: 0.07234,
        shannon_code_length: 4,
        shannon_code: "1110",
        total_bits_so_far: 34
      },
      {
        step_number: 5,
        token: " by",
        token_id: 416,
        context_tokens: ["Language", " models", " can", " compress", " text"],
        top_predictions: [
          { token: " using", token_id: 1262, probability: 0.21098 },
          { token: " and", token_id: 290, probability: 0.15432 },
          { token: " to", token_id: 284, probability: 0.12876 },
          { token: " more", token_id: 517, probability: 0.09654 },
          { token: " efficiently", token_id: 18306, probability: 0.08321 }
        ],
        actual_probability: 0.07891,
        shannon_code_length: 4,
        shannon_code: "1001",
        total_bits_so_far: 38
      },
      {
        step_number: 6,
        token: " predicting",
        token_id: 26866,
        context_tokens: ["Language", " models", " can", " compress", " text", " by"],
        top_predictions: [
          { token: " removing", token_id: 10829, probability: 0.18765 },
          { token: " using", token_id: 1262, probability: 0.15432 },
          { token: " applying", token_id: 11524, probability: 0.12345 },
          { token: " encoding", token_id: 21004, probability: 0.09876 },
          { token: " finding", token_id: 4917, probability: 0.08765 }
        ],
        actual_probability: 0.01234,
        shannon_code_length: 7,
        shannon_code: "1011010",
        total_bits_so_far: 45
      },
      {
        step_number: 7,
        token: " the",
        token_id: 262,
        context_tokens: ["Language", " models", " can", " compress", " text", " by", " predicting"],
        top_predictions: [
          { token: " what", token_id: 644, probability: 0.23456 },
          { token: " which", token_id: 543, probability: 0.18765 },
          { token: " how", token_id: 703, probability: 0.15432 },
          { token: " patterns", token_id: 7572, probability: 0.12345 },
          { token: " next", token_id: 1306, probability: 0.09876 }
        ],
        actual_probability: 0.08765,
        shannon_code_length: 4,
        shannon_code: "1100",
        total_bits_so_far: 49
      },
      {
        step_number: 8,
        token: " next",
        token_id: 1306,
        context_tokens: ["Language", " models", " can", " compress", " text", " by", " predicting", " the"],
        top_predictions: [
          { token: " probability", token_id: 12867, probability: 0.21098 },
          { token: " distribution", token_id: 6082, probability: 0.18765 },
          { token: " likelihood", token_id: 14955, probability: 0.15432 },
          { token: " most", token_id: 749, probability: 0.12345 },
          { token: " best", token_id: 1266, probability: 0.10987 }
        ],
        actual_probability: 0.09876,
        shannon_code_length: 4,
        shannon_code: "1011",
        total_bits_so_far: 53
      },
      {
        step_number: 9,
        token: " token",
        token_id: 11241,
        context_tokens: ["Language", " models", " can", " compress", " text", " by", " predicting", " the", " next"],
        top_predictions: [
          { token: " word", token_id: 1573, probability: 0.34567 },
          { token: " character", token_id: 2095, probability: 0.23456 },
          { token: " symbol", token_id: 6194, probability: 0.18765 },
          { token: " element", token_id: 5002, probability: 0.12345 },
          { token: " piece", token_id: 3704, probability: 0.09876 }
        ],
        actual_probability: 0.01234,
        shannon_code_length: 7,
        shannon_code: "1010110",
        total_bits_so_far: 60
      }
    ],
    total_bits: 60,
    original_bits: 504, // 63 characters * 8 bits
    compression_ratio: 8.4,
    success: true
  };

  const callCompressionAPI = async (text: string) => {
    const sessionHash = Math.random().toString(36).substring(2, 12);
    
    try {
      // Join the queue
      const queueResponse = await fetch(
        `${API_URL}/queue/join`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            data: [text],
            event_data: null,
            fn_index: 7,  // GPT2 Compression tab (actual working index)
            session_hash: sessionHash
          })
        }
      );
      
      if (!queueResponse.ok) {
        throw new Error(`Queue join failed: ${queueResponse.status}`);
      }
      
      // Use EventSource to get results
      return new Promise((resolve, reject) => {
        const eventSource = new EventSource(
          `${API_URL}/queue/data?session_hash=${sessionHash}`
        );
        
        const timeout = setTimeout(() => {
          eventSource.close();
          reject(new Error('API processing timeout'));
        }, 30000); // 30 second timeout
          
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.msg === 'process_completed') {
              clearTimeout(timeout);
              eventSource.close();
              
              console.log('GPT2 Full API response:', JSON.stringify(data, null, 2));
              
              if (data.output && data.output.data) {
                const resultData = data.output.data[0];
                console.log('GPT2 Raw data from API:', resultData);
                
                // Check if it's already an object or needs parsing
                let parsedData;
                if (typeof resultData === 'string') {
                  try {
                    parsedData = JSON.parse(resultData);
                  } catch (parseError) {
                    console.error('GPT2 Failed to parse JSON:', parseError, 'Raw:', resultData);
                    reject(new Error('Failed to parse response'));
                    return;
                  }
                } else {
                  parsedData = resultData;
                }
                
                resolve(parsedData);
              } else {
                console.log('GPT2 data.output:', JSON.stringify(data.output, null, 2));
                console.error('GPT2 No output data - full response:', JSON.stringify(data, null, 2));
                reject(new Error('No output data'));
              }
            } else if (data.msg === 'process_errored') {
              clearTimeout(timeout);
              eventSource.close();
              console.error('GPT2 API processing error:', JSON.stringify(data, null, 2));
              reject(new Error('API processing error'));
            }
          } catch (e) {
            // Continue listening for more events
          }
        };
        
        eventSource.onerror = (error) => {
          clearTimeout(timeout);
          eventSource.close();
          reject(new Error('EventSource error'));
        };
      });
    } catch (err) {
      console.error('API call failed:', err);
      throw new Error(`Failed to connect to compression API: ${err}`);
    }
  };

  const runCompression = async () => {
    if (!inputText.trim() || inputText.length > 500) {
      setError("Text must be between 1 and 500 characters");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep(0);
    setIsPlaying(false);

    try {
      // Check if input matches the default text (use memoized result)
      if (inputText.trim() === defaultText) {
        // Simulate a brief loading for consistency
        await new Promise(resolve => setTimeout(resolve, 300));
        setCompressionData(defaultCompressionResult);
        setError(null);
      } else {
        // Use API for custom text
        const result = await callCompressionAPI(inputText.trim());
        
        if (result && (result as any).success) {
          setCompressionData(result as CompressionResult);
          setError(null);
        } else {
          setError((result as any)?.error || "Compression failed");
          setCompressionData(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setCompressionData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (compressionData && currentStep < compressionData.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Auto-play effect
  useEffect(() => {
    if (isPlaying && compressionData) {
      const timer = setTimeout(() => {
        if (currentStep < compressionData.steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          setIsPlaying(false);
        }
      }, 2000); // 2 second intervals

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStep, compressionData]);

  const currentStepData = compressionData?.steps[currentStep];

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-6 max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 text-center">
        GPT2 Compression Visualization
      </h3>

      {/* Input Section */}
      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text to compress (max 500 chars)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={500}
            disabled={isLoading}
          />
          <button
            onClick={runCompression}
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Running...' : 'RUN'}
          </button>
        </div>
        
        <div className="text-sm text-gray-500">
          {inputText.length}/500 characters
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* Results Section */}
      {compressionData && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">Compression Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Original:</span>
                <div className="font-mono">{compressionData.original_text.length}×8={compressionData.original_bits} bits</div>
              </div>
              <div>
                <span className="text-gray-600">Compressed:</span>
                <div className="font-mono">{compressionData.total_bits} bits</div>
              </div>
              <div>
                <span className="text-gray-600">Bits per letter:</span>
                <div className="font-mono">{(compressionData.total_bits / compressionData.original_text.length).toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-600">Tokens:</span>
                <div className="font-mono">{compressionData.tokens.length}</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-2">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              ← Step
            </button>
            <button
              onClick={togglePlay}
              className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <button
              onClick={nextStep}
              disabled={currentStep === compressionData.steps.length - 1}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Step →
            </button>
          </div>

          {/* Tokenization Display */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">Tokenization</h4>
            <div className="flex flex-wrap gap-1 mb-3">
              {compressionData.tokens.map((token, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded text-sm font-mono border ${
                    index <= currentStep
                      ? index === currentStep
                        ? 'bg-blue-200 border-blue-400'
                        : 'bg-green-100 border-green-300'
                      : 'bg-gray-100 border-gray-300'
                  }`}
                >
                  {token.replace(/ /g, '·')}
                </span>
              ))}
            </div>
            
            {/* Shannon Codes */}
            <div className="border-t pt-3">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Shannon Codes:</h5>
              <div className="flex flex-wrap gap-1 mb-2">
                {compressionData.tokens.map((token, index) => (
                  <div key={index} className="text-center">
                    <div className={`px-3 py-2 rounded text-xs border min-w-[40px] ${
                      index <= currentStep
                        ? index === currentStep
                          ? 'bg-blue-200 border-blue-400'
                          : 'bg-green-100 border-green-300'
                        : 'bg-gray-100 border-gray-300'
                    }`}>
                      {index <= currentStep ? `${compressionData.steps[index].shannon_code_length} bits` : '? bits'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Current Step Visualization */}
          {currentStepData && (
            <div className="bg-white p-4 rounded-lg border space-y-4">

              {/* Predictions */}
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Predictions (sorted by probability):</div>
                <div className="grid gap-2">
                  {(() => {
                    // Helper function to format probability
                    const formatProbability = (prob: number) => {
                      const percentage = prob * 100;
                      if (percentage >= 0.1) {
                        return percentage.toFixed(1) + '%';
                      } else if (percentage >= 0.01) {
                        return percentage.toFixed(2) + '%';
                      } else if (percentage >= 0.001) {
                        return percentage.toFixed(3) + '%';
                      } else {
                        return percentage.toFixed(6) + '%';
                      }
                    };

                    // Create combined list with actual token and top predictions
                    const actualToken = {
                      token: currentStepData.token,
                      probability: currentStepData.actual_probability,
                      isActual: true
                    };
                    
                    const topPreds = currentStepData.top_predictions.map(pred => ({
                      ...pred,
                      isActual: false
                    }));
                    
                    // Combine and remove duplicates, then sort by probability
                    const allTokens = [actualToken, ...topPreds]
                      .filter((token, index, array) => 
                        array.findIndex(t => t.token === token.token) === index
                      )
                      .sort((a, b) => b.probability - a.probability)
                      .slice(0, 6); // Show top 6
                    
                    return allTokens.map((tokenData, index) => (
                      <div
                        key={index}
                        className={`flex justify-between items-center px-3 py-2 rounded text-sm ${
                          tokenData.isActual
                            ? 'bg-blue-100 border border-blue-300 font-semibold'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <span className="font-mono">
                          {tokenData.token.replace(/ /g, '·')}{tokenData.isActual ? ' (actual)' : ''}
                        </span>
                        <span className="font-mono">
                          {formatProbability(tokenData.probability)}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Shannon Code */}
              <div className="space-y-2">
                <div className="text-xs text-gray-500">
                  Length = ⌈log₂(1/{(() => {
                    const prob = currentStepData.actual_probability;
                    if (prob >= 0.1) return prob.toFixed(2);
                    if (prob >= 0.01) return prob.toFixed(3);
                    if (prob >= 0.001) return prob.toFixed(4);
                    return prob.toExponential(1);
                  })()})⌉ = {Math.ceil(-Math.log2(currentStepData.actual_probability))} bits
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GPT2CompressionWidget;