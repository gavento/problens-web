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
  const [inputText, setInputText] = useState("hello world");
  const [compressionData, setCompressionData] = useState<CompressionResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = "https://vaclavrozhon-zip-compression-clustering.hf.space";

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
            fn_index: 7,  // Correct index from HF logs for GPT2 Compression
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
    if (!inputText.trim() || inputText.length > 50) {
      setError("Text must be between 1 and 50 characters");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep(0);
    setIsPlaying(false);

    try {
      const resultString = await callCompressionAPI(inputText.trim());
      const result: CompressionResult = JSON.parse(resultString);
      
      if (result.success) {
        setCompressionData(result);
        setError(null);
      } else {
        setError(result.error || "Compression failed");
        setCompressionData(null);
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
      
      <p className="text-sm text-gray-600 text-center">
        Watch how a language model can compress text by predicting the next token and encoding it with Shannon codes
      </p>

      {/* Input Section */}
      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text to compress (max 50 chars)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={50}
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
          {inputText.length}/50 characters
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
                <div className="font-mono">{compressionData.original_bits} bits</div>
              </div>
              <div>
                <span className="text-gray-600">Compressed:</span>
                <div className="font-mono">{compressionData.total_bits} bits</div>
              </div>
              <div>
                <span className="text-gray-600">Ratio:</span>
                <div className="font-mono">{compressionData.compression_ratio.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-600">Tokens:</span>
                <div className="font-mono">{compressionData.tokens.length}</div>
              </div>
            </div>
          </div>

          {/* Tokenization Display */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">Tokenization</h4>
            <div className="flex flex-wrap gap-1">
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

          {/* Current Step Visualization */}
          {currentStepData && (
            <div className="bg-white p-4 rounded-lg border space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">
                  Step {currentStep + 1}/{compressionData.steps.length}
                </h4>
                <div className="text-sm text-gray-600">
                  Total bits so far: {currentStepData.total_bits_so_far}
                </div>
              </div>

              {/* Current Token and Context */}
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Context + Current Token:</div>
                <div className="flex flex-wrap gap-1 items-center">
                  {currentStepData.context_tokens.map((token, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded text-sm font-mono bg-green-100 border border-green-300"
                    >
                      {token.replace(/ /g, '·')}
                    </span>
                  ))}
                  {currentStepData.context_tokens.length > 0 && (
                    <div className="mx-2 text-2xl text-blue-600">▼</div>
                  )}
                  <span className="px-2 py-1 rounded text-sm font-mono bg-blue-200 border border-blue-400 font-semibold">
                    {currentStepData.token.replace(/ /g, '·')}
                  </span>
                </div>
              </div>

              {/* Predictions */}
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Top 5 Predictions:</div>
                <div className="grid gap-2">
                  {currentStepData.top_predictions.map((pred, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center px-3 py-2 rounded text-sm ${
                        pred.token === currentStepData.token
                          ? 'bg-blue-100 border border-blue-300 font-semibold'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <span className="font-mono">
                        {pred.token.replace(/ /g, '·')}
                      </span>
                      <span className="font-mono">
                        {(pred.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shannon Code */}
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Actual Token Encoding:</div>
                <div className="bg-gray-100 p-3 rounded border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Probability:</span>
                      <div className="font-mono font-semibold">
                        {(currentStepData.actual_probability * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Shannon Code Length:</span>
                      <div className="font-mono font-semibold">
                        {currentStepData.shannon_code_length} bits
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-600">Code: </span>
                    <span className="font-mono font-semibold text-blue-600">
                      {"1".repeat(currentStepData.shannon_code_length)}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      (⌈-log₂({(currentStepData.actual_probability).toFixed(4)})⌉ = {currentStepData.shannon_code_length})
                    </span>
                  </div>
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