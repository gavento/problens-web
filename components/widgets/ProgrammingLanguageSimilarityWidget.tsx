"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

interface LanguageNode extends d3.SimulationNodeDatum {
  id: string;
  group?: number;
  size?: number;
}

interface LanguageLink extends d3.SimulationLinkDatum<LanguageNode> {
  source: string | LanguageNode;
  target: string | LanguageNode;
  value: number;
  distance: number;
}

interface CompressionResults {
  languages: string[];
  distance_matrix: Record<string, Record<string, number>>;
  entropy_values?: Record<string, number>;
}

interface AnalysisData {
  metadata: {
    languages: string[];
    num_languages: number;
  };
  baseline?: CompressionResults;
  zstd?: CompressionResults;
  gzip?: CompressionResults;
}

const ProgrammingLanguageSimilarityWidget: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'baseline' | 'zstd' | 'gzip'>('baseline');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Language family color mapping
  const languageColors: Record<string, string> = {
    // C-family
    'c': '#A8CC8C',
    'cpp': '#9C033A',
    'java': '#ED8B00',
    'javascript': '#F7DF1E',
    'typescript': '#3178C6',
    'csharp': '#512BD4',
    'go': '#00ADD8',
    'rust': '#000000',
    'swift': '#F05138',
    'kotlin': '#0095D5',
    'dart': '#0175C2',
    
    // Functional
    'haskell': '#5E5086',
    'lisp': '#3FB68B',
    'scheme': '#9F1D20',
    'ocaml': '#EC6813',
    'fsharp': '#378BBA',
    'clojure': '#5881D8',
    'erlang': '#A90533',
    'elixir': '#6E4A7E',
    'scala': '#DC322F',
    
    // Scripting
    'python': '#3776AB',
    'ruby': '#CC342D',
    'perl': '#39457E',
    'php': '#777BB4',
    'lua': '#2C2D72',
    'r': '#276DC3',
    
    // Other
    'julia': '#9558B2',
    'matlab': '#0076A8'
  };

  const getLanguageColor = (lang: string): string => {
    return languageColors[lang.toLowerCase()] || '#666666';
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, use mock data. In production, this would load from the analysis results
      const mockData: AnalysisData = {
        metadata: {
          languages: ['python', 'java', 'javascript', 'c', 'cpp', 'go', 'rust', 'haskell', 'lisp'],
          num_languages: 9
        },
        baseline: {
          languages: ['python', 'java', 'javascript', 'c', 'cpp', 'go', 'rust', 'haskell', 'lisp'],
          distance_matrix: {
            'python': {'python': 0, 'java': 0.8, 'javascript': 0.7, 'c': 0.9, 'cpp': 0.85, 'go': 0.75, 'rust': 0.8, 'haskell': 0.95, 'lisp': 0.9},
            'java': {'python': 0.8, 'java': 0, 'javascript': 0.7, 'c': 0.6, 'cpp': 0.5, 'go': 0.6, 'rust': 0.65, 'haskell': 0.9, 'lisp': 0.85},
            'javascript': {'python': 0.7, 'java': 0.7, 'javascript': 0, 'c': 0.8, 'cpp': 0.75, 'go': 0.65, 'rust': 0.7, 'haskell': 0.85, 'lisp': 0.8},
            'c': {'python': 0.9, 'java': 0.6, 'javascript': 0.8, 'c': 0, 'cpp': 0.3, 'go': 0.5, 'rust': 0.6, 'haskell': 0.95, 'lisp': 0.9},
            'cpp': {'python': 0.85, 'java': 0.5, 'javascript': 0.75, 'c': 0.3, 'cpp': 0, 'go': 0.55, 'rust': 0.5, 'haskell': 0.9, 'lisp': 0.85},
            'go': {'python': 0.75, 'java': 0.6, 'javascript': 0.65, 'c': 0.5, 'cpp': 0.55, 'go': 0, 'rust': 0.4, 'haskell': 0.8, 'lisp': 0.75},
            'rust': {'python': 0.8, 'java': 0.65, 'javascript': 0.7, 'c': 0.6, 'cpp': 0.5, 'go': 0.4, 'rust': 0, 'haskell': 0.75, 'lisp': 0.7},
            'haskell': {'python': 0.95, 'java': 0.9, 'javascript': 0.85, 'c': 0.95, 'cpp': 0.9, 'go': 0.8, 'rust': 0.75, 'haskell': 0, 'lisp': 0.4},
            'lisp': {'python': 0.9, 'java': 0.85, 'javascript': 0.8, 'c': 0.9, 'cpp': 0.85, 'go': 0.75, 'rust': 0.7, 'haskell': 0.4, 'lisp': 0}
          },
          entropy_values: {
            'python': 4.2, 'java': 4.5, 'javascript': 4.3, 'c': 4.1, 'cpp': 4.4, 'go': 4.0, 'rust': 4.3, 'haskell': 4.8, 'lisp': 4.6
          }
        }
      };
      
      // Copy baseline to other methods with slight variations
      mockData.zstd = JSON.parse(JSON.stringify(mockData.baseline));
      mockData.gzip = JSON.parse(JSON.stringify(mockData.baseline));
      
      setData(mockData);
    } catch (err) {
      setError('Failed to load compression analysis data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createVisualization = useCallback(() => {
    if (!data || !svgRef.current) return;

    const currentData = data[selectedMethod];
    if (!currentData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;
    const margin = 40;

    svg.attr("width", width).attr("height", height);

    const container = svg.append("g")
      .attr("transform", `translate(${margin}, ${margin})`);

    // Prepare nodes and links
    const nodes: LanguageNode[] = currentData.languages.map(lang => ({
      id: lang,
      size: currentData.entropy_values?.[lang] || 1
    }));

    const links: LanguageLink[] = [];
    const maxDistance = Math.max(...Object.values(currentData.distance_matrix).flatMap(row => Object.values(row)));
    
    currentData.languages.forEach(lang1 => {
      currentData.languages.forEach(lang2 => {
        if (lang1 !== lang2) {
          const distance = currentData.distance_matrix[lang1][lang2];
          const similarity = 1 - (distance / maxDistance); // Convert distance to similarity
          
          if (similarity > 0.3) { // Only show stronger connections
            links.push({
              source: lang1,
              target: lang2,
              value: similarity,
              distance: distance
            });
          }
        }
      });
    });

    // Create force simulation
    const simulation = d3.forceSimulation<LanguageNode>(nodes)
      .force("link", d3.forceLink<LanguageNode, LanguageLink>(links)
        .id(d => d.id)
        .distance(d => 50 + (1 - d.value) * 150)
        .strength(d => d.value * 0.5))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter((width - 2 * margin) / 2, (height - 2 * margin) / 2))
      .force("collision", d3.forceCollide().radius(25));

    // Create links
    const link = container.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.value) * 4);

    // Create nodes
    const node = container.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => 8 + (d.size || 1) * 3)
      .attr("fill", d => getLanguageColor(d.id))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

    // Add labels
    const labels = container.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text(d => d.id)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .attr("fill", "#333")
      .style("pointer-events", "none");

    // Add interactivity
    node
      .on("mouseover", (event, d) => {
        setHoveredNode(d.id);
        
        // Highlight connected nodes
        const connectedNodes = new Set([d.id]);
        links.forEach(link => {
          if (link.source === d.id) connectedNodes.add(link.target as string);
          if (link.target === d.id) connectedNodes.add(link.source as string);
        });

        node.style("opacity", n => connectedNodes.has(n.id) ? 1 : 0.3);
        link.style("opacity", l => 
          (l.source as LanguageNode).id === d.id || (l.target as LanguageNode).id === d.id ? 0.8 : 0.1
        );
        labels.style("opacity", n => connectedNodes.has(n.id) ? 1 : 0.3);
      })
      .on("mouseout", () => {
        setHoveredNode(null);
        node.style("opacity", 1);
        link.style("opacity", 0.6);
        labels.style("opacity", 1);
      })
      .on("click", (event, d) => {
        setSelectedNode(selectedNode === d.id ? null : d.id);
      });

    // Add drag behavior
    const drag = d3.drag<SVGCircleElement, LanguageNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as LanguageNode).x!)
        .attr("y1", d => (d.source as LanguageNode).y!)
        .attr("x2", d => (d.target as LanguageNode).x!)
        .attr("y2", d => (d.target as LanguageNode).y!);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);

      labels
        .attr("x", d => d.x!)
        .attr("y", d => d.y!);
    });

  }, [data, selectedMethod, selectedNode]);

  useEffect(() => {
    createVisualization();
  }, [createVisualization]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading compression analysis...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const currentData = data?.[selectedMethod];

  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-lg space-y-4 max-w-6xl mx-auto">
      <h3 className="text-xl font-semibold text-center text-gray-800">
        Programming Language Similarity Network
      </h3>
      
      <p className="text-center text-gray-600 text-sm">
        Languages clustered by compression-based similarity. 
        Closer nodes and thicker edges indicate higher similarity.
      </p>

      {/* Method selector */}
      <div className="flex justify-center gap-2">
        {(['baseline', 'zstd', 'gzip'] as const).map((method) => (
          <button
            key={method}
            onClick={() => setSelectedMethod(method)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              selectedMethod === method
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {method === 'baseline' ? 'Character Freq + KL' : method.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Visualization */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex justify-center">
        <svg ref={svgRef}></svg>
      </div>

      {/* Language info panel */}
      {(hoveredNode || selectedNode) && currentData && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-lg mb-2">
            {hoveredNode || selectedNode}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Most Similar Languages:</h5>
              {currentData.distance_matrix[hoveredNode || selectedNode!] && (
                <div className="space-y-1">
                  {Object.entries(currentData.distance_matrix[hoveredNode || selectedNode!])
                    .filter(([lang]) => lang !== (hoveredNode || selectedNode))
                    .sort(([,a], [,b]) => a - b)
                    .slice(0, 5)
                    .map(([lang, distance]) => (
                      <div key={lang} className="flex justify-between items-center">
                        <span className="text-sm">{lang}</span>
                        <span className="text-xs text-gray-500">
                          {(1 - distance).toFixed(3)} similarity
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            {currentData.entropy_values && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Properties:</h5>
                <div className="text-sm space-y-1">
                  <div>Character Entropy: {currentData.entropy_values[hoveredNode || selectedNode!]?.toFixed(3)} bits</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-semibold mb-2">How to Read This Visualization</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div>• <strong>Node size:</strong> Larger nodes have higher character entropy</div>
          <div>• <strong>Edge thickness:</strong> Thicker edges indicate higher compression similarity</div>
          <div>• <strong>Node color:</strong> Different colors represent language families</div>
          <div>• <strong>Distance:</strong> Closer nodes are more similar according to compression analysis</div>
          <div>• <strong>Interaction:</strong> Hover over nodes to see connections, click to pin details</div>
        </div>
      </div>
    </div>
  );
};

export default ProgrammingLanguageSimilarityWidget;