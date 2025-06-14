"use client";

import React, { useState, useEffect } from "react";
import * as HoverCard from "@radix-ui/react-hover-card";

interface CompressionResult {
  algorithm: string;
  bits: number;
  ratio: string;
  generalDescription: string;
  specificDescription: string;
}

interface TextSample {
  name: string;
  description: string;
  text: string;
  filename: string;
  results: CompressionResult[];
}

export default function CompressionWidget() {
  const [textSamples, setTextSamples] = useState<TextSample[]>([]);
  const [selectedSample, setSelectedSample] = useState<TextSample | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFixedScale, setUseFixedScale] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load text list configuration  
        const basePath = process.env.NODE_ENV === 'production' ? '/problens-web' : '';
        const listUrl = `${basePath}/compression_experiments/texts/list.json`;
        const listResponse = await fetch(listUrl);
        if (!listResponse.ok) throw new Error(`Failed to load text list: ${listResponse.status}`);
        const textConfigs = await listResponse.json();

        // Load compression results
        const resultsUrl = `${basePath}/compression_experiments/compression_results.json`;
        const resultsResponse = await fetch(resultsUrl);
        if (!resultsResponse.ok) throw new Error(`Failed to load compression results: ${resultsResponse.status}`);
        const compressionResults = await resultsResponse.json();

        // Load each text file and combine with results
        const samples: TextSample[] = [];
        
        for (const config of textConfigs) {
          try {
            const textUrl = `${basePath}/compression_experiments/texts/${config.filename}`;
            const textResponse = await fetch(textUrl);
            if (!textResponse.ok) continue;
            
            const text = await textResponse.text();
            const key = config.filename.replace(/\.[^/.]+$/, ""); // Remove extension
            const result = compressionResults[key] || {};
            
            // Default values if not in results
            const textLength = text.trim().length;
            const naiveBits = textLength * 8;
            
            const sample: TextSample = {
              name: config.name,
              description: config.description,
              text: text.trim(),
              filename: config.filename,
              results: [
                {
                  algorithm: "Naive",
                  bits: result.naive_bits || naiveBits,
                  ratio: "1.00x",
                  generalDescription: "Store each character as 8 bits in memory",
                  specificDescription: `${textLength} characters stored without any compression`
                },
                {
                  algorithm: "Letter-wise (optimal)",
                  bits: result.letterwise_bits || naiveBits,
                  ratio: result.letterwise_ratio ? `${result.letterwise_ratio}x` : "1.00x",
                  generalDescription: "Use optimal codes based on individual character frequencies",
                  specificDescription: "Theoretical limit based on character entropy (ignores dependencies)"
                },
                {
                  algorithm: "ZIP (zlib)",
                  bits: result.zip_bits || naiveBits,
                  ratio: result.zip_ratio ? `${result.zip_ratio}x` : "1.00x",
                  generalDescription: "Dictionary-based compression finding repeated substrings",
                  specificDescription: "Standard ZIP compression using DEFLATE algorithm"
                },
                {
                  algorithm: "LLM (GPT-2)",
                  bits: result.gpt2_bits || naiveBits,
                  ratio: result.gpt2_ratio ? `${result.gpt2_ratio}x` : "1.00x",
                  generalDescription: "Use language model probabilities for next token prediction",
                  specificDescription: "Compression based on predictability from GPT-2 model"
                },
                {
                  algorithm: "LLM (Llama 4)",
                  bits: result.llama_bits || naiveBits,
                  ratio: result.llama_ratio ? `${result.llama_ratio}x` : "1.00x",
                  generalDescription: "Advanced language model compression using Llama 4",
                  specificDescription: "State-of-the-art LLM compression performance"
                }
              ]
            };

            samples.push(sample);
          } catch (err) {
            // Silently continue if text file fails to load
          }
        }

        setTextSamples(samples);
        setLoading(false);
      } catch (err) {
        console.warn('Failed to load compression data, using fallback:', err);
        // Use fallback data when files are not available
        const fallbackSamples: TextSample[] = [
          {
            name: "English Text Sample",
            description: "Natural English prose",
            text: "In information theory, we study how to efficiently encode and transmit information. Cross-entropy measures the average number of bits needed to encode events from one distribution using a code optimized for another distribution. This fundamental concept helps us understand the limits of data compression and the efficiency of communication systems.",
            filename: "english_sample.txt",
            results: [
              {
                algorithm: "Naive",
                bits: 2776, // 347 chars * 8 bits
                ratio: "1.00x",
                generalDescription: "Store each character as 8 bits in memory",
                specificDescription: "347 characters stored without any compression"
              },
              {
                algorithm: "Letter-wise (optimal)",
                bits: 2776, // Same as naive for fallback
                ratio: "1.00x",
                generalDescription: "Use optimal codes based on individual character frequencies",
                specificDescription: "Theoretical limit based on character entropy (ignores dependencies)"
              },
              {
                algorithm: "ZIP (zlib)",
                bits: 2776, // Same as naive for fallback
                ratio: "1.00x",
                generalDescription: "Dictionary-based compression finding repeated substrings",
                specificDescription: "Standard ZIP compression using DEFLATE algorithm"
              },
              {
                algorithm: "LLM (GPT-2)",
                bits: 2776, // Same as naive for now (no GPT-2 data)
                ratio: "1.00x",
                generalDescription: "Use language model probabilities for next token prediction",
                specificDescription: "Compression based on predictability from GPT-2 model"
              },
              {
                algorithm: "LLM (Llama 4)",
                bits: 2776, // Same as naive for fallback
                ratio: "1.00x",
                generalDescription: "Advanced language model compression using Llama 4",
                specificDescription: "State-of-the-art LLM compression performance"
              }
            ]
          },
          {
            name: "Random Characters",
            description: "Pseudo-random character sequence",
            text: "xqz7mw8n3vj2kp9rl4bg6ht5yu1ic0oazsdf9ghj8kl7mnbqwert6yuio3pasdfg2hjkl9zxcv8bnm5qwer4tyui7opas1dfgh6jklz3xcvb2nm9qwer5tyui8opas4dfgh7jklz6xcvb3nm1qwer9tyui2opas5dfgh8jklz7xcvb4nm3qwer6tyui9opas1dfgh2jklz8xcvb5nm4qwer7tyui3opas6dfgh9jklz1xcvb",
            filename: "random_sample.txt",
            results: [
              {
                algorithm: "Naive",
                bits: 1920, // 240 chars * 8 bits
                ratio: "1.00x",
                generalDescription: "Store each character as 8 bits in memory",
                specificDescription: "240 characters stored without any compression"
              },
              {
                algorithm: "Letter-wise (optimal)",
                bits: 1920, // Same as naive for fallback
                ratio: "1.00x",
                generalDescription: "Use optimal codes based on individual character frequencies",
                specificDescription: "Random text has high entropy, little compression possible"
              },
              {
                algorithm: "ZIP (zlib)",
                bits: 1920, // Same as naive for fallback
                ratio: "1.00x",
                generalDescription: "Dictionary-based compression finding repeated substrings",
                specificDescription: "No patterns found in random text"
              },
              {
                algorithm: "LLM (GPT-2)",
                bits: 1920, // Same as naive for random text
                ratio: "1.00x",
                generalDescription: "Use language model probabilities for next token prediction",
                specificDescription: "Random text is unpredictable, no compression achieved"
              },
              {
                algorithm: "LLM (Llama 4)",
                bits: 1920, // Same as naive for fallback
                ratio: "1.00x",
                generalDescription: "Advanced language model compression using Llama 4",
                specificDescription: "Random text is unpredictable, no compression achieved"
              }
            ]
          }
        ];
        
        setTextSamples(fallbackSamples);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatBits = (bits: number): string => {
    if (bits >= 8000) return `${(bits / 8000).toFixed(1)}KB`;
    return `${bits} bits`;
  };

  // Adaptive scale (original)
  const getAdaptiveBarWidth = (bits: number, minBits: number, maxBits: number): number => {
    // Scale so that the best compression (minBits) gets 25% width and worst gets 100%
    const logBits = Math.log10(bits);
    const logMin = Math.log10(minBits);
    const logMax = Math.log10(maxBits);
    
    // Map to 25-100% range
    const normalized = (logBits - logMin) / (logMax - logMin);
    return 25 + (normalized * 75);
  };

  // Fixed scale - global maximum across all samples
  const getGlobalMaxRatio = (): number => {
    let maxRatio = 1;
    textSamples.forEach(sample => {
      sample.results.forEach(result => {
        const ratio = parseFloat(result.ratio.replace('x', ''));
        if (ratio > maxRatio) maxRatio = ratio;
      });
    });
    return maxRatio;
  };

  const getFixedBarWidth = (ratio: number, globalMaxRatio: number): number => {
    // Best compression (highest ratio) gets 10% of max width (90%)
    // Worst compression (1x) gets minimum width (10%)
    // Scale inversely: higher ratio = shorter bar
    const maxWidth = 90;
    const minWidth = 10;
    
    // Inverse scaling: 1x ratio gets maxWidth, globalMaxRatio gets minWidth
    const width = maxWidth - ((ratio - 1) / (globalMaxRatio - 1)) * (maxWidth - minWidth);
    return Math.max(minWidth, Math.min(maxWidth, width));
  };

  const getBarWidth = (bits: number, minBits: number, maxBits: number, ratio?: number, globalMaxRatio?: number): number => {
    if (useFixedScale && ratio !== undefined && globalMaxRatio !== undefined) {
      return getFixedBarWidth(ratio, globalMaxRatio);
    } else {
      return getAdaptiveBarWidth(bits, minBits, maxBits);
    }
  };

  const getBarColor = (percent: number): string => {
    // Color based on position (0-100%)
    if (percent < 25) return "#22c55e"; // green
    if (percent < 50) return "#84cc16"; // lime
    if (percent < 75) return "#eab308"; // yellow
    if (percent < 90) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  // Adaptive scale markers (original)
  const getAdaptiveMarkers = (minBits: number, maxBits: number) => {
    const markers = [];
    
    // Calculate the range of compression ratios
    const maxRatio = maxBits / minBits;
    
    // Generate smart markers based on the range
    let candidateRatios = [];
    
    if (maxRatio <= 3) {
      candidateRatios = [1.2, 1.5, 1.8, 2.0, 2.5, 3.0];
    } else if (maxRatio <= 10) {
      candidateRatios = [1.5, 2, 3, 4, 5, 6, 8, 10];
    } else if (maxRatio <= 50) {
      candidateRatios = [2, 5, 10, 15, 20, 30, 40, 50];
    } else if (maxRatio <= 200) {
      candidateRatios = [5, 10, 20, 50, 100, 150, 200];
    } else {
      candidateRatios = [10, 25, 50, 100, 200, 300, 500];
    }
    
    // Filter to only include ratios that fit in our range
    for (const ratio of candidateRatios) {
      const targetBits = maxBits / ratio;
      if (targetBits >= minBits * 0.9 && targetBits <= maxBits) {
        const position = getAdaptiveBarWidth(targetBits, minBits, maxBits);
        
        // Format the ratio nicely
        let label;
        if (ratio < 10 && ratio % 1 !== 0) {
          label = `${ratio.toFixed(1)}x`;
        } else {
          label = `${Math.round(ratio)}x`;
        }
        
        markers.push({ ratio: label, position });
      }
    }
    
    // Ensure we have 3-6 markers by adjusting if needed
    if (markers.length > 6) {
      const filtered = [];
      for (let i = 0; i < markers.length; i += Math.ceil(markers.length / 5)) {
        filtered.push(markers[i]);
      }
      return filtered;
    }
    
    return markers;
  };

  // Fixed scale markers - powers of 2
  const getFixedMarkers = (globalMaxRatio: number) => {
    const markers = [];
    
    // Generate powers of 2 up to the global maximum
    let power = 1;
    while (power <= globalMaxRatio) {
      if (power >= 2 || power === 1) { // Include 1x and powers of 2
        const position = getFixedBarWidth(power, globalMaxRatio);
        markers.push({ 
          ratio: power === 1 ? "1x" : `${power}x`, 
          position 
        });
      }
      power *= 2;
    }
    
    return markers;
  };

  const getCompressionRatioMarkers = (minBits: number, maxBits: number, globalMaxRatio?: number) => {
    if (useFixedScale && globalMaxRatio !== undefined) {
      return getFixedMarkers(globalMaxRatio);
    } else {
      return getAdaptiveMarkers(minBits, maxBits);
    }
  };

  if (loading) {
    return (
      <div className="compression-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="compression-widget bg-white border border-red-200 rounded-lg p-6 my-6">
        <h3 className="text-lg font-semibold mb-4 text-red-600">Error Loading Compression Data</h3>
        <p className="text-red-500">{error}</p>
        <p className="text-sm text-gray-600 mt-2">
          Make sure the compression experiments have been run and the results are available.
        </p>
      </div>
    );
  }

  return (
    <div className="compression-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Text Compression Explorer</h3>
          <p className="text-gray-600">
            Explore how different compression algorithms perform on various types of text. 
            Click a sample to see compression results.
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-gray-600">Scale:</span>
          <button
            onClick={() => setUseFixedScale(!useFixedScale)}
            className={`px-3 py-1 text-sm border rounded transition-colors ${
              useFixedScale 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {useFixedScale ? 'Fixed' : 'Adaptive'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {textSamples.map((sample, index) => (
          <button
            key={index}
            onClick={() => setSelectedSample(sample)}
            className={`p-4 text-left border rounded-lg transition-all ${
              selectedSample?.name === sample.name
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="font-medium">{sample.name}</div>
            <div className="text-sm text-gray-600 mt-1">{sample.description}</div>
            <div className="text-xs text-gray-500 mt-1">
              {sample.text.length} characters
            </div>
          </button>
        ))}
      </div>

      {selectedSample && (
        <div className="mt-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-2">Sample Text: {selectedSample.name}</h4>
            <div 
              className="text-sm font-mono bg-white p-3 rounded border overflow-y-auto break-all" 
              style={{ height: '8rem', lineHeight: '1.2rem', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
            >
              {selectedSample.text}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Total length: {selectedSample.text.length} characters • File: {selectedSample.filename}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-2">Compression Results:</h4>
            
            {(() => {
              const maxBits = Math.max(...selectedSample.results.map(r => r.bits));
              const minBits = Math.min(...selectedSample.results.map(r => r.bits));
              const globalMaxRatio = useFixedScale ? getGlobalMaxRatio() : undefined;
              const markers = getCompressionRatioMarkers(minBits, maxBits, globalMaxRatio);

              return (
                <>
                  {/* Color gradient axis */}
                  <div className="relative mb-6">
                    <div 
                      className="h-2 rounded-full relative"
                      style={{
                        background: useFixedScale 
                          ? 'linear-gradient(to right, #ef4444 0%, #f97316 20%, #eab308 40%, #84cc16 60%, #22c55e 80%, #22c55e 100%)'
                          : 'linear-gradient(to right, #22c55e 0%, #22c55e 25%, #84cc16 50%, #eab308 75%, #f97316 90%, #ef4444 100%)'
                      }}
                    >
                      {/* Compression ratio markers */}
                      {markers.map((marker, i) => (
                        <div
                          key={i}
                          className="absolute top-0 h-2 w-px bg-gray-600"
                          style={{ left: `${marker.position}%` }}
                        >
                          <span className="absolute -top-5 text-xs text-gray-600 transform -translate-x-1/2">
                            {marker.ratio}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      {useFixedScale ? (
                        <>
                          <span>← Worse compression</span>
                          <span>Better compression →</span>
                        </>
                      ) : (
                        <>
                          <span>Better compression →</span>
                          <span>← Worse compression</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Compression bars */}
                  <div className="space-y-3">
                    {selectedSample.results.map((result, index) => {
                      const ratio = parseFloat(result.ratio.replace('x', ''));
                      const width = getBarWidth(result.bits, minBits, maxBits, ratio, globalMaxRatio);
                      const color = getBarColor(width);
                      
                      return (
                        <HoverCard.Root key={index} openDelay={100} closeDelay={300}>
                          <HoverCard.Trigger asChild>
                            <div className="relative cursor-pointer">
                              <div 
                                className="relative h-12 rounded transition-all hover:opacity-90"
                                style={{ 
                                  width: `${width}%`,
                                  backgroundColor: color
                                }}
                              >
                                <div className="absolute inset-0 flex items-center px-3">
                                  <span className="text-white font-medium text-sm">
                                    {result.algorithm}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatBits(result.bits)} ({result.ratio})
                              </div>
                            </div>
                          </HoverCard.Trigger>
                          <HoverCard.Portal>
                            <HoverCard.Content 
                              className="z-50 bg-white border border-gray-200 rounded-md shadow-lg p-4 max-w-sm"
                              sideOffset={5}
                            >
                              <div className="text-sm">
                                <div className="font-medium mb-2 text-gray-900">{result.algorithm} Algorithm</div>
                                <div className="mb-2 text-gray-700">
                                  <strong>How it works:</strong> {result.generalDescription}
                                </div>
                                <div className="text-gray-700">
                                  <strong>For this text:</strong> {result.specificDescription}
                                </div>
                              </div>
                            </HoverCard.Content>
                          </HoverCard.Portal>
                        </HoverCard.Root>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-700">
              <strong>Hover over bars</strong> to see how each algorithm works. 
              Bar length shows compressed size on a logarithmic scale.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}