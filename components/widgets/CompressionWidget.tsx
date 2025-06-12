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

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load text list configuration
        const listResponse = await fetch('/compression_experiments/texts/list.json');
        if (!listResponse.ok) throw new Error('Failed to load text list');
        const textConfigs = await listResponse.json();

        // Load compression results
        const resultsResponse = await fetch('/compression_experiments/compression_results.json');
        if (!resultsResponse.ok) throw new Error('Failed to load compression results');
        const compressionResults = await resultsResponse.json();

        // Load each text file and combine with results
        const samples: TextSample[] = [];
        
        for (const config of textConfigs) {
          try {
            const textResponse = await fetch(`/compression_experiments/texts/${config.filename}`);
            if (!textResponse.ok) continue;
            
            const text = await textResponse.text();
            const key = config.filename.replace(/\.[^/.]+$/, ""); // Remove extension
            const result = compressionResults[key];
            
            if (!result || result.error) continue;

            const sample: TextSample = {
              name: config.name,
              description: config.description,
              text: text.trim(),
              filename: config.filename,
              results: [
                {
                  algorithm: "Naive",
                  bits: result.naive_bits,
                  ratio: "1.00x",
                  generalDescription: "Store each character as 8 bits in memory",
                  specificDescription: `${text.length} characters stored without any compression`
                },
                {
                  algorithm: "Letter-wise (optimal)",
                  bits: result.letterwise_bits,
                  ratio: `${result.letterwise_ratio}x`,
                  generalDescription: "Use optimal codes based on individual character frequencies",
                  specificDescription: "Theoretical limit based on character entropy (ignores dependencies)"
                },
                {
                  algorithm: "ZIP (zlib)",
                  bits: result.zip_bits,
                  ratio: `${result.zip_ratio}x`,
                  generalDescription: "Dictionary-based compression finding repeated substrings",
                  specificDescription: "Standard ZIP compression using DEFLATE algorithm"
                },
                {
                  algorithm: "LLM (GPT-2)",
                  bits: result.gpt2_bits,
                  ratio: `${result.gpt2_ratio}x`,
                  generalDescription: "Use language model probabilities for next token prediction",
                  specificDescription: "Compression based on predictability from GPT-2 model"
                }
              ]
            };

            samples.push(sample);
          } catch (err) {
            console.warn(`Failed to load text file: ${config.filename}`);
          }
        }

        setTextSamples(samples);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatBits = (bits: number): string => {
    if (bits >= 8000) return `${(bits / 8000).toFixed(1)}KB`;
    return `${bits} bits`;
  };

  const getBarWidth = (bits: number, minBits: number, maxBits: number): number => {
    // Scale so that the best compression (minBits) gets 25% width and worst gets 100%
    const logBits = Math.log10(bits);
    const logMin = Math.log10(minBits);
    const logMax = Math.log10(maxBits);
    
    // Map to 25-100% range
    const normalized = (logBits - logMin) / (logMax - logMin);
    return 25 + (normalized * 75);
  };

  const getBarColor = (percent: number): string => {
    // Color based on position (0-100%)
    if (percent < 25) return "#22c55e"; // green
    if (percent < 50) return "#84cc16"; // lime
    if (percent < 75) return "#eab308"; // yellow
    if (percent < 90) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  const getCompressionRatioMarkers = (minBits: number, maxBits: number) => {
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
        const position = getBarWidth(targetBits, minBits, maxBits);
        
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
      <h3 className="text-lg font-semibold mb-4">Text Compression Explorer</h3>
      <p className="text-gray-600 mb-6">
        Explore how different compression algorithms perform on various types of text. 
        Click a sample to see compression results.
      </p>

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
              const markers = getCompressionRatioMarkers(minBits, maxBits);

              return (
                <>
                  {/* Color gradient axis */}
                  <div className="relative mb-6">
                    <div 
                      className="h-2 rounded-full relative"
                      style={{
                        background: 'linear-gradient(to right, #22c55e 0%, #22c55e 25%, #84cc16 50%, #eab308 75%, #f97316 90%, #ef4444 100%)'
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
                      <span>Better compression →</span>
                      <span>← Worse compression</span>
                    </div>
                  </div>

                  {/* Compression bars */}
                  <div className="space-y-3">
                    {selectedSample.results.map((result, index) => {
                      const width = getBarWidth(result.bits, minBits, maxBits);
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