"use client";

import React, { useState, useEffect } from "react";
import * as HoverCard from "@radix-ui/react-hover-card";
import MiniCompressionChart from "./MiniCompressionChart";

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
  const [useFixedScale, setUseFixedScale] = useState(false);
  const [llmProgressionData, setLlmProgressionData] = useState<any>(null);

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
                  algorithm: "Naive (8 bits per letter)",
                  bits: result.naive_bits || naiveBits,
                  ratio: "1.00x",
                  generalDescription: "Store each character as 8 bits in memory",
                  specificDescription: `${textLength} characters stored without any compression`
                },
                {
                  algorithm: "Letter-wise optimal",
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
        
        // Load LLM progression data for tooltips
        try {
          const llmResponse = await fetch(`${basePath}/compression_experiments/llm_compression_summary.json`);
          if (llmResponse.ok) {
            const llmData = await llmResponse.json();
            setLlmProgressionData(llmData);
          }
        } catch (llmErr) {
          console.warn('Failed to load LLM progression data:', llmErr);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load compression data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load compression data');
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
    // For fixed scale, bars should correspond to their marker positions
    // Better compression (higher ratio) should have shorter bars (positioned further right on axis)
    const maxWidth = 90; // 1x gets longest bar
    const minWidth = 10; // Best compression gets shortest bar
    
    // Find which "power slot" this ratio falls into for consistent positioning
    const powers = [];
    let power = 1;
    while (power <= globalMaxRatio) {
      powers.push(power);
      power *= 2;
    }
    
    // Find the position of this ratio in the power sequence
    let powerIndex = 0;
    for (let i = 0; i < powers.length - 1; i++) {
      if (ratio >= powers[i] && ratio < powers[i + 1]) {
        // Interpolate between power positions
        const t = (ratio - powers[i]) / (powers[i + 1] - powers[i]);
        powerIndex = i + t;
        break;
      }
    }
    if (ratio >= powers[powers.length - 1]) {
      powerIndex = powers.length - 1;
    }
    
    // Convert power index to bar width (inverse relationship)
    const normalizedPosition = powerIndex / (powers.length - 1); // 0 to 1
    const width = maxWidth - normalizedPosition * (maxWidth - minWidth);
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
  const getFixedMarkers = (globalMaxRatio: number): { ratio: string; position: number }[] => {
    const markers: { ratio: string; position: number }[] = [];
    
    // Generate equidistant powers of 2 positions
    // We want 1x, 2x, 4x, 8x, etc. to be equally spaced on the axis
    const powers = [];
    let power = 1;
    while (power <= globalMaxRatio) {
      powers.push(power);
      power *= 2;
    }
    
    // Position markers with equal spacing
    powers.forEach((power, index) => {
      // Equal spacing across the 10%-90% range
      const position = 90 - (index / (powers.length - 1)) * 80; // Start from 90% (worst) to 10% (best)
      markers.push({ 
        ratio: power === 1 ? "1x" : `${power}x`, 
        position 
      });
    });
    
    return markers;
  };

  const getCompressionRatioMarkers = (minBits: number, maxBits: number, globalMaxRatio?: number) => {
    if (useFixedScale && globalMaxRatio !== undefined) {
      return getFixedMarkers(globalMaxRatio);
    } else {
      return getAdaptiveMarkers(minBits, maxBits);
    }
  };

  const getLLMChartData = (algorithm: string, filename: string) => {
    if (!llmProgressionData || !filename) return null;
    
    // Map algorithm names to model keys
    const algorithmToModel: { [key: string]: string } = {
      "LLM (GPT-2)": "gpt-2",
      "LLM (Llama 4)": "llama-4"
    };
    
    const modelKey = algorithmToModel[algorithm];
    if (!modelKey || !llmProgressionData[modelKey]) return null;
    
    // Find experiment by filename (remove extension)
    const fileKey = filename.replace(/\.[^/.]+$/, "");
    const experiment = llmProgressionData[modelKey][fileKey];
    
    if (!experiment || !experiment.dataPoints) return null;
    
    return {
      data: experiment.dataPoints,
      modelName: experiment.modelName,
      experimentName: experiment.name
    };
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
      <div className="compression-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
        <div className="text-center py-8">
          <div className="text-2xl mb-2">😔</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Sorry!</h3>
          <p className="text-gray-500">
            The compression data couldn&apos;t be loaded right now.
          </p>
        </div>
      </div>
    );
  }

  // Show sorry message if no text samples are available
  if (!loading && !error && textSamples.length === 0) {
    return (
      <div className="compression-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
        <div className="text-center py-8">
          <div className="text-2xl mb-2">😔</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Sorry!</h3>
          <p className="text-gray-500">
            No compression experiments are available to display.
          </p>
        </div>
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
            {useFixedScale ? 'Fixed Scale' : 'Adaptive Scale'}
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
              Total length: {selectedSample.text.length} characters
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
                              className="z-50 bg-white border border-gray-200 rounded-md shadow-lg p-4 max-w-lg"
                              sideOffset={5}
                            >
                              <div className="text-sm">
                                <div className="font-medium mb-2 text-gray-900">{result.algorithm} Algorithm</div>
                                <div className="mb-2 text-gray-700">
                                  <strong>How it works:</strong> {result.generalDescription}
                                </div>
                                <div className="text-gray-700 mb-3">
                                  <strong>For this text:</strong> {result.specificDescription}
                                </div>
                                
                                {/* Add mini compression chart for LLM algorithms */}
                                {result.algorithm.startsWith('LLM') && (() => {
                                  const chartData = getLLMChartData(result.algorithm, selectedSample?.filename || '');
                                  return chartData ? (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <div className="text-xs font-medium text-gray-700 mb-2">
                                        Compression progression through text:
                                      </div>
                                      <MiniCompressionChart 
                                        data={chartData.data}
                                        modelName={chartData.modelName}
                                        experimentName={chartData.experimentName}
                                        width={250}
                                        height={140}
                                      />
                                    </div>
                                  ) : null;
                                })()}
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