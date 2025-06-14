"use client";

import React, { useState, useEffect } from "react";


interface DataPoint {
  characterPosition: number;
  progressPercent: number;
  bitsPerChar: number;
}

interface ProcessedExperiment {
  name: string;
  filename: string;
  description: string;
  totalChars: number;
  dataPoints: DataPoint[];
  averageBitsPerChar: number;
}

interface ModelData {
  modelName: string;
  experiments: ProcessedExperiment[];
}

export default function LLMCompressionProgressionWidget() {
  const [modelData, setModelData] = useState<ModelData[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const basePath = process.env.NODE_ENV === 'production' ? '/problens-web' : '';
        
        // Load preprocessed LLM summary data
        const summaryResponse = await fetch(`${basePath}/compression_experiments/llm_compression_summary.json`);
        
        if (!summaryResponse.ok) {
          throw new Error(`Failed to load LLM summary data: ${summaryResponse.status}`);
        }
        
        const summaryData = await summaryResponse.json();
        
        // Convert summary data to our expected format
        const processedData: ModelData[] = [
          {
            modelName: "GPT-2",
            experiments: Object.values(summaryData["gpt-2"]).map((exp: any) => ({
              name: exp.name,
              filename: exp.filename,
              description: exp.description,
              totalChars: exp.totalChars,
              dataPoints: exp.dataPoints,
              averageBitsPerChar: exp.averageBitsPerChar
            }))
          },
          {
            modelName: "Llama 4", 
            experiments: Object.values(summaryData["llama-4"]).map((exp: any) => ({
              name: exp.name,
              filename: exp.filename,
              description: exp.description,
              totalChars: exp.totalChars,
              dataPoints: exp.dataPoints,
              averageBitsPerChar: exp.averageBitsPerChar
            }))
          }
        ];
        
        setModelData(processedData);
        
        // Set default selection to first experiment
        if (processedData[0]?.experiments.length > 0) {
          setSelectedExperiment(processedData[0].experiments[0].filename);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading LLM data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    loadData();
  }, []);


  const getSelectedExperimentData = () => {
    if (!selectedExperiment) return null;
    
    return modelData.map(model => ({
      modelName: model.modelName,
      experiment: model.experiments.find(exp => exp.filename === selectedExperiment)
    })).filter(item => item.experiment);
  };

  const createSVGPath = (dataPoints: DataPoint[], maxBits: number, width: number, height: number) => {
    if (dataPoints.length === 0) return "";
    
    const xScale = width / 100; // 0-100% progress
    const yScale = height / maxBits; // 0 to maxBits
    
    let path = `M ${dataPoints[0].progressPercent * xScale} ${height - (dataPoints[0].bitsPerChar * yScale)}`;
    
    for (let i = 1; i < dataPoints.length; i++) {
      const x = dataPoints[i].progressPercent * xScale;
      const y = height - (dataPoints[i].bitsPerChar * yScale);
      path += ` L ${x} ${y}`;
    }
    
    return path;
  };

  if (loading) {
    return (
      <div className="llm-progression-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="llm-progression-widget bg-white border border-red-200 rounded-lg p-6 my-6">
        <h3 className="text-lg font-semibold mb-4 text-red-600">Error Loading LLM Data</h3>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const selectedData = getSelectedExperimentData();
  const availableExperiments = modelData[0]?.experiments || [];

  return (
    <div className="llm-progression-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">LLM Compression Progression</h3>
        <p className="text-gray-600 mb-4">
          Shows how compression efficiency (bits per character) changes as models process text from beginning to end.
          Data is smoothed using a rolling average over 1% of the text.
        </p>
        
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Text Sample:</label>
          <select
            value={selectedExperiment}
            onChange={(e) => setSelectedExperiment(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableExperiments.map(exp => (
              <option key={exp.filename} value={exp.filename}>
                {exp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedData && selectedData.length > 0 && (
        <div className="space-y-6">
          {selectedData.map(({ modelName, experiment }, index) => {
            if (!experiment) return null;
            
            const maxBits = Math.max(...experiment.dataPoints.map(p => p.bitsPerChar));
            const minBits = Math.min(...experiment.dataPoints.map(p => p.bitsPerChar));
            const chartWidth = 1200; // viewBox width - increased for wider chart
            const chartHeight = 200;
            const margin = { top: 20, right: 30, bottom: 40, left: 50 };
            const innerWidth = chartWidth - margin.left - margin.right;
            const innerHeight = chartHeight - margin.top - margin.bottom;
            
            // Create nice y-axis ticks
            const yTicks = [];
            const tickCount = 5;
            for (let i = 0; i <= tickCount; i++) {
              yTicks.push(minBits + (maxBits - minBits) * (i / tickCount));
            }
            
            return (
              <div key={modelName} className="border border-gray-200 rounded-lg p-4 pb-2">
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-900">{modelName}</h4>
                  <p className="text-sm text-gray-600">
                    {experiment.description} • {experiment.totalChars.toLocaleString()} characters • 
                    Average: {experiment.averageBitsPerChar.toFixed(3)} bits/char
                  </p>
                </div>
                
                <div className="w-full -mx-2">
                  <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="block">
                    {/* Chart background */}
                    <rect 
                      x={margin.left} 
                      y={margin.top} 
                      width={innerWidth} 
                      height={innerHeight} 
                      fill="#f9fafb" 
                      stroke="#e5e7eb"
                    />
                    
                    {/* Grid lines */}
                    {yTicks.map((tick, i) => {
                      const y = margin.top + innerHeight - ((tick - minBits) / (maxBits - minBits)) * innerHeight;
                      return (
                        <g key={i}>
                          <line
                            x1={margin.left}
                            y1={y}
                            x2={margin.left + innerWidth}
                            y2={y}
                            stroke="#e5e7eb"
                            strokeDasharray="2,2"
                          />
                          <text
                            x={margin.left - 10}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="12"
                            fill="#6b7280"
                          >
                            {tick.toFixed(2)}
                          </text>
                        </g>
                      );
                    })}
                    
                    {/* X-axis ticks */}
                    {[0, 25, 50, 75, 100].map(percent => {
                      const x = margin.left + (percent / 100) * innerWidth;
                      return (
                        <g key={percent}>
                          <line
                            x1={x}
                            y1={margin.top + innerHeight}
                            x2={x}
                            y2={margin.top + innerHeight + 5}
                            stroke="#6b7280"
                          />
                          <text
                            x={x}
                            y={margin.top + innerHeight + 20}
                            textAnchor="middle"
                            fontSize="12"
                            fill="#6b7280"
                          >
                            {percent}%
                          </text>
                        </g>
                      );
                    })}
                    
                    {/* Data line */}
                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                      <path
                        d={createSVGPath(experiment.dataPoints, maxBits - minBits, innerWidth, innerHeight)}
                        fill="none"
                        stroke={index === 0 ? "#3b82f6" : "#ef4444"}
                        strokeWidth="2"
                        transform={`translate(0, ${-(minBits / (maxBits - minBits)) * innerHeight})`}
                      />
                    </g>
                    
                    {/* Axis labels */}
                    <text
                      x={chartWidth / 2}
                      y={chartHeight - 5}
                      textAnchor="middle"
                      fontSize="14"
                      fill="#374151"
                      fontWeight="500"
                    >
                      Progress through text (%)
                    </text>
                    <text
                      x={15}
                      y={chartHeight / 2}
                      textAnchor="middle"
                      fontSize="14"
                      fill="#374151"
                      fontWeight="500"
                      transform={`rotate(-90, 15, ${chartHeight / 2})`}
                    >
                      Bits per character
                    </text>
                  </svg>
                </div>
              </div>
            );
          })}
          
          <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded">
            <strong>Interpretation:</strong> Lower values indicate better compression. 
            The smoothed line shows how model confidence/compression efficiency changes as context builds up through the text.
            Flat lines suggest consistent predictability, while varying lines indicate changing text structure or complexity.
          </div>
        </div>
      )}
    </div>
  );
}