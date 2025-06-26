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

interface DeflateAnalysisData {
  metadata: {
    languages: string[];
    num_languages: number;
    analysis_type: string;
    dictionary_size: number;
    compression_strategy: string;
  };
  deflate_analysis: {
    languages: string[];
    distance_matrix: Record<string, Record<string, number>>;
    compression_benefits: Record<string, Record<string, number>>;
  };
}

const ProgrammingLanguageSimilarityWidget: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [klData, setKlData] = useState<AnalysisData | null>(null);
  const [deflateData, setDeflateData] = useState<DeflateAnalysisData | null>(null);
  const [dataMode, setDataMode] = useState<'kl' | 'deflate'>('kl');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDistanceDistribution, setShowDistanceDistribution] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  // Physics parameters with sliders
  const [maxKLDistance, setMaxKLDistance] = useState(0.3); // Maximum KL distance to show connections
  const [baseSpringDistance, setBaseSpringDistance] = useState(30);
  const [maxSpringDistance, setMaxSpringDistance] = useState(200);
  const [linkStrength, setLinkStrength] = useState(0.8);
  const [chargeStrength, setChargeStrength] = useState(-1000);
  const [collisionRadius, setCollisionRadius] = useState(5);

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
    'matlab': '#0076A8',
    
    // Esoteric languages
    'brainfuck': '#FF0000',
    'chef': '#8B4513',
    'apl': '#FFD700',
    'prolog': '#228B22',
    'fortran': '#4169E1',
    
    // Assembly/Systems
    'assembly': '#696969'
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
      
      // Load KL divergence data
      let klResponse;
      try {
        klResponse = await fetch('/data/programming_languages/compression_analysis_results.json');
        if (!klResponse.ok) {
          throw new Error('Dev path failed');
        }
      } catch {
        klResponse = await fetch('/problens-web/data/programming_languages/compression_analysis_results.json');
        if (!klResponse.ok) {
          throw new Error('Failed to fetch KL data');
        }
      }
      
      const klAnalysisData = await klResponse.json();
      setKlData(klAnalysisData);
      
      // Load DEFLATE compression data
      let deflateResponse;
      try {
        deflateResponse = await fetch('/data/programming_languages/deflate_compression_analysis.json');
        if (!deflateResponse.ok) {
          throw new Error('Dev path failed');
        }
      } catch {
        deflateResponse = await fetch('/problens-web/data/programming_languages/deflate_compression_analysis.json');
        if (!deflateResponse.ok) {
          throw new Error('Failed to fetch DEFLATE data');
        }
      }
      
      const deflateAnalysisData = await deflateResponse.json();
      setDeflateData(deflateAnalysisData);
      
    } catch (err) {
      setError('Failed to load analysis data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createVisualization = useCallback(() => {
    if (!svgRef.current) return;
    
    // Choose data based on mode
    let currentData: CompressionResults | null = null;
    if (dataMode === 'kl' && klData?.baseline) {
      currentData = klData.baseline;
    } else if (dataMode === 'deflate' && deflateData?.deflate_analysis) {
      // Convert DEFLATE data to same format
      currentData = {
        languages: deflateData.deflate_analysis.languages,
        distance_matrix: deflateData.deflate_analysis.distance_matrix,
        entropy_values: {} // DEFLATE doesn't have entropy values
      };
    }
    
    if (!currentData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Calculate responsive dimensions with consistent aspect ratio
    const parentContainer = svgRef.current.parentElement;
    if (!parentContainer) return;
    
    const aspectRatio = 16 / 10; // 1.6:1 aspect ratio (16:10)
    let width, height, scaleFactor;
    
    if (isFullscreen) {
      // Fullscreen: use most of viewport, maintaining aspect ratio
      const maxWidth = window.innerWidth - 40;
      const maxHeight = window.innerHeight - 120; // Leave space for header and controls
      
      // Use the constraining dimension to maintain aspect ratio
      if (maxWidth / aspectRatio <= maxHeight) {
        width = maxWidth;
        height = width / aspectRatio;
      } else {
        height = maxHeight;
        width = height * aspectRatio;
      }
      scaleFactor = width / 800; // Base scale on reference width of 800px
    } else {
      // Normal mode: use available width with same aspect ratio
      const containerRect = parentContainer.getBoundingClientRect();
      const availableWidth = Math.max(600, containerRect.width - 32);
      width = Math.min(800, availableWidth); // Max 800px in normal mode
      height = width / aspectRatio;
      scaleFactor = width / 800; // Same reference width
    }
    
    const margin = 40 * scaleFactor;
    const nodeRadius = 25 * scaleFactor;

    svg.attr("width", width).attr("height", height);

    const container = svg.append("g")
      .attr("transform", `translate(${margin}, ${margin})`);

    // Prepare nodes and links
    const nodes: LanguageNode[] = currentData.languages.map(lang => ({
      id: lang,
      size: currentData!.entropy_values?.[lang] || 1
    }));

    const links: LanguageLink[] = [];
    const allDistances = Object.values(currentData.distance_matrix).flatMap(row => Object.values(row));
    const maxDistance = Math.max(...allDistances);
    
    // Use percentile-based normalization instead of max normalization
    const sortedDistances = allDistances.filter(d => d > 0).sort((a, b) => a - b);
    const p90Distance = sortedDistances[Math.floor(sortedDistances.length * 0.9)]; // 90th percentile
    
    currentData.languages.forEach(lang1 => {
      currentData!.languages.forEach(lang2 => {
        if (lang1 !== lang2) {
          const rawKLDistance = currentData!.distance_matrix[lang1][lang2];
          
          // For KL data, subtract 0.05 to give closer pairs an advantage
          const adjustedKLDistance = dataMode === 'kl' 
            ? Math.max(0, rawKLDistance - 0.05)
            : rawKLDistance;
          
          // Only show connections for close pairs (small adjusted distances)
          if (adjustedKLDistance <= maxKLDistance) {
            // Normalize distance for spring calculations (0 = closest, 1 = furthest within threshold)
            const normalizedDistance = adjustedKLDistance / maxKLDistance;
            
            links.push({
              source: lang1,
              target: lang2,
              value: 1 - normalizedDistance, // Higher value = closer languages
              distance: rawKLDistance // Keep original distance for display
            });
          }
        }
      });
    });

    // Create force simulation optimized for close pairs
    const simulation = d3.forceSimulation<LanguageNode>(nodes)
      .force("link", d3.forceLink<LanguageNode, LanguageLink>(links)
        .id(d => d.id)
        .distance(d => {
          // Short spring distances for close languages, longer for distant ones
          // Scale distances proportionally to canvas size
          return (baseSpringDistance + (1 - d.value) * maxSpringDistance) * scaleFactor;
        })
        .strength(d => {
          // Exponential strength - very strong for similar pairs
          const exponentialSimilarity = Math.pow(d.value, 2); // Square for emphasis
          return exponentialSimilarity * linkStrength;
        }))
      .force("charge", d3.forceManyBody().strength(chargeStrength * scaleFactor)) // Scale repulsion force
      .force("center", d3.forceCenter((width - 2 * margin) / 2, (height - 2 * margin) / 2))
      .force("collision", d3.forceCollide().radius(nodeRadius + collisionRadius * scaleFactor))
      .force("boundary", () => {
        // Keep nodes within bounds
        nodes.forEach(node => {
          if (node.x !== undefined && node.y !== undefined) {
            node.x = Math.max(nodeRadius + 10, Math.min(width - 2 * margin - nodeRadius - 10, node.x));
            node.y = Math.max(nodeRadius + 10, Math.min(height - 2 * margin - nodeRadius - 10, node.y));
          }
        });
      });

    // Create links
    const link = container.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", d => {
        // Emphasize close pairs with much thicker edges
        const exponentialThickness = Math.pow(d.value, 1.5);
        return exponentialThickness * 8 * scaleFactor; // Scale edge thickness
      });

    // Create nodes
    const node = container.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => Math.min(nodeRadius, 8 + (d.size || 1) * 3))
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
      .attr("font-size", `${12 * scaleFactor}px`)
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

    node.call(drag as any);

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

  }, [klData, deflateData, dataMode, selectedNode, isFullscreen, maxKLDistance, baseSpringDistance, maxSpringDistance, linkStrength, chargeStrength, collisionRadius]);

  useEffect(() => {
    createVisualization();
  }, [createVisualization]);

  // Handle window resize in fullscreen mode
  useEffect(() => {
    if (!isFullscreen) return;

    const handleResize = () => {
      createVisualization();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen, createVisualization]);

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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getDistanceStatistics = () => {
    const currentDistanceMatrix = dataMode === 'kl' 
      ? klData?.baseline?.distance_matrix 
      : deflateData?.deflate_analysis?.distance_matrix;
      
    const languages = dataMode === 'kl'
      ? klData?.baseline?.languages
      : deflateData?.deflate_analysis?.languages;
      
    if (!currentDistanceMatrix || !languages) return null;
    
    const distances: number[] = [];
    
    // Collect all pairwise distances
    for (let i = 0; i < languages.length; i++) {
      for (let j = i + 1; j < languages.length; j++) {
        const lang1 = languages[i];
        const lang2 = languages[j];
        const distance = currentDistanceMatrix[lang1][lang2];
        distances.push(distance);
      }
    }
    
    distances.sort((a, b) => a - b);
    
    // Create focused histogram bins for 0.0-0.5 range with 0.05 bin width
    const focusMin = 0.0;
    const focusMax = 0.5;
    const binSize = 0.05;
    const numBins = Math.ceil((focusMax - focusMin) / binSize);
    
    const bins = Array(numBins).fill(0);
    const outOfRangeCount = distances.filter(d => d > focusMax).length;
    
    distances.forEach(d => {
      if (d >= focusMin && d <= focusMax) {
        const binIndex = Math.min(Math.floor((d - focusMin) / binSize), numBins - 1);
        bins[binIndex]++;
      }
    });
    
    const sortedDistances = distances.filter(d => d > 0).sort((a, b) => a - b);
    const p90Distance = sortedDistances[Math.floor(sortedDistances.length * 0.9)];
    
    return {
      distances,
      min: Math.min(...distances).toFixed(3),
      max: Math.max(...distances).toFixed(3),
      p90: p90Distance.toFixed(3),
      mean: (distances.reduce((a, b) => a + b, 0) / distances.length).toFixed(3),
      median: distances[Math.floor(distances.length / 2)].toFixed(3),
      bins,
      binSize,
      focusMin,
      focusMax,
      outOfRangeCount,
      numPairs: distances.length
    };
  };

  const containerClass = isFullscreen 
    ? "fixed inset-0 z-50 bg-white p-4 space-y-4 overflow-y-auto"
    : "p-4 sm:p-6 bg-gray-50 rounded-lg space-y-4 w-full mx-auto";

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">
          Programming Language Similarity Network
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setDataMode(dataMode === 'kl' ? 'deflate' : 'kl')}
            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
          >
            Mode: {dataMode === 'kl' ? 'KL Divergence' : 'DEFLATE Compression'}
          </button>
          <button
            onClick={() => setShowControls(!showControls)}
            className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm"
          >
            {showControls ? 'Hide Controls' : 'Show Controls'}
          </button>
          <button
            onClick={() => setShowDistanceDistribution(!showDistanceDistribution)}
            className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
          >
            {showDistanceDistribution ? 'Hide Debug' : 'Show Debug'}
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>
      
      <p className="text-center text-gray-600 text-sm">
        {dataMode === 'kl' 
          ? 'Languages clustered by KL divergence of character frequencies. Closer nodes and thicker edges indicate more similar character usage patterns.'
          : 'Languages clustered by DEFLATE dictionary compression. Closer nodes indicate better cross-compression using static dictionaries.'
        }
      </p>

      {/* Physics Controls Panel */}
      {showControls && (
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <h4 className="font-semibold mb-3">Physics Parameters</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Distance: {maxKLDistance.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={maxKLDistance}
                onChange={(e) => setMaxKLDistance(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500">Only show connections ≤ this distance</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Base Spring Distance: {baseSpringDistance}px
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={baseSpringDistance}
                onChange={(e) => setBaseSpringDistance(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500">Spring length for closest languages</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Max Spring Distance: {maxSpringDistance}px
              </label>
              <input
                type="range"
                min="100"
                max="500"
                step="25"
                value={maxSpringDistance}
                onChange={(e) => setMaxSpringDistance(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500">Spring length for furthest connected languages</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Link Strength: {linkStrength.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={linkStrength}
                onChange={(e) => setLinkStrength(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500">How strongly springs pull nodes together</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Charge Strength: {chargeStrength}
              </label>
              <input
                type="range"
                min="-2000"
                max="-50"
                step="50"
                value={chargeStrength}
                onChange={(e) => setChargeStrength(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500">Repulsion between all nodes (negative = repel)</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Collision Radius: {collisionRadius}px
              </label>
              <input
                type="range"
                min="0"
                max="30"
                step="2"
                value={collisionRadius}
                onChange={(e) => setCollisionRadius(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500">Extra spacing around nodes</div>
            </div>

          </div>
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setMaxKLDistance(0.3);
                setBaseSpringDistance(30);
                setMaxSpringDistance(200);
                setLinkStrength(0.8);
                setChargeStrength(-1000);
                setCollisionRadius(5);
              }}
              className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      {showDistanceDistribution && (() => {
        const stats = getDistanceStatistics();
        return stats ? (
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
            <h4 className="font-semibold mb-2">Distance Distribution Debug ({dataMode.toUpperCase()})</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
              <div><strong>Total pairs:</strong> {stats.numPairs}</div>
              <div><strong>Min:</strong> {stats.min}</div>
              <div><strong>Max:</strong> {stats.max}</div>
              <div><strong>90th percentile:</strong> {stats.p90}</div>
              <div><strong>Mean:</strong> {stats.mean}</div>
              <div><strong>Median:</strong> {stats.median}</div>
            </div>
            
            {/* Most similar language pairs */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-bold text-sm mb-2">Most similar language pairs:</div>
                <div className="text-xs space-y-1">
                  {(() => {
                    const currentDistanceMatrix = dataMode === 'kl' 
                      ? klData?.baseline?.distance_matrix 
                      : deflateData?.deflate_analysis?.distance_matrix;
                    const languages = dataMode === 'kl'
                      ? klData?.baseline?.languages
                      : deflateData?.deflate_analysis?.languages;
                      
                    if (!currentDistanceMatrix || !languages) return null;
                    
                    // Create pairs with distances and remove duplicates
                    const pairs: Array<{lang1: string, lang2: string, distance: number}> = [];
                    
                    for (let j = 0; j < languages.length; j++) {
                      for (let k = j + 1; k < languages.length; k++) {
                        const lang1 = languages[j];
                        const lang2 = languages[k];
                        const distance = currentDistanceMatrix[lang1][lang2];
                        pairs.push({lang1, lang2, distance});
                      }
                    }
                    
                    // Sort by distance and take first 10
                    const sortedPairs = pairs.sort((a, b) => a.distance - b.distance).slice(0, 10);
                    
                    return sortedPairs.map((pair, i) => (
                      <div key={`${pair.lang1}-${pair.lang2}`}>
                        {pair.lang1} ↔ {pair.lang2}: {pair.distance.toFixed(3)}
                        {dataMode === 'deflate' && deflateData && (
                          <span className="text-gray-500 ml-2">
                            ({(deflateData.deflate_analysis.compression_benefits[pair.lang1][pair.lang2] * 100).toFixed(1)}%, 
                            {(deflateData.deflate_analysis.compression_benefits[pair.lang2][pair.lang1] * 100).toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
              
              <div>
                <div className="font-bold text-sm mb-2">Most distant language pairs:</div>
                <div className="text-xs space-y-1">
                  {(() => {
                    const currentDistanceMatrix = dataMode === 'kl' 
                      ? klData?.baseline?.distance_matrix 
                      : deflateData?.deflate_analysis?.distance_matrix;
                    const languages = dataMode === 'kl'
                      ? klData?.baseline?.languages
                      : deflateData?.deflate_analysis?.languages;
                      
                    if (!currentDistanceMatrix || !languages) return null;
                    
                    // Create pairs with distances and remove duplicates
                    const pairs: Array<{lang1: string, lang2: string, distance: number}> = [];
                    
                    for (let j = 0; j < languages.length; j++) {
                      for (let k = j + 1; k < languages.length; k++) {
                        const lang1 = languages[j];
                        const lang2 = languages[k];
                        const distance = currentDistanceMatrix[lang1][lang2];
                        pairs.push({lang1, lang2, distance});
                      }
                    }
                    
                    // Sort by distance (descending) and take first 10
                    const sortedPairs = pairs.sort((a, b) => b.distance - a.distance).slice(0, 10);
                    
                    return sortedPairs.map((pair, i) => (
                      <div key={`${pair.lang1}-${pair.lang2}`}>
                        {pair.lang1} ↔ {pair.lang2}: {pair.distance.toFixed(3)}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* Visualization */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-hidden">
        <div className="w-full flex justify-center">
          <svg ref={svgRef}></svg>
        </div>
      </div>

      {/* Language info panel */}
      {(hoveredNode || selectedNode) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-lg mb-2">
            {hoveredNode || selectedNode}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">
                Closest Languages (by {dataMode === 'kl' ? 'KL distance' : 'DEFLATE compression'}):
              </h5>
              {(() => {
                const currentDistanceMatrix = dataMode === 'kl' 
                  ? klData?.baseline?.distance_matrix 
                  : deflateData?.deflate_analysis?.distance_matrix;
                  
                if (!currentDistanceMatrix || !currentDistanceMatrix[hoveredNode || selectedNode!]) {
                  return null;
                }
                
                return (
                  <div className="space-y-1">
                    {Object.entries(currentDistanceMatrix[hoveredNode || selectedNode!])
                      .filter(([lang]) => lang !== (hoveredNode || selectedNode))
                      .sort(([,a], [,b]) => a - b)
                      .slice(0, 5)
                      .map(([lang, distance]) => (
                        <div key={lang} className="flex justify-between items-center">
                          <span className="text-sm">{lang}</span>
                          <span className="text-xs text-gray-500">
                            {distance.toFixed(3)} {dataMode === 'kl' ? 'KL' : 'dist'}
                            {dataMode === 'deflate' && deflateData && (
                              <span className="ml-2">
                                ({(deflateData.deflate_analysis.compression_benefits[hoveredNode || selectedNode!][lang] * 100).toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                  </div>
                );
              })()}
            </div>
            
            {dataMode === 'kl' && klData?.baseline?.entropy_values && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Properties:</h5>
                <div className="text-sm space-y-1">
                  <div>Character Entropy: {klData.baseline.entropy_values[hoveredNode || selectedNode!]?.toFixed(3)} bits</div>
                </div>
              </div>
            )}
            
            {dataMode === 'deflate' && deflateData && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Compression Benefits:</h5>
                <div className="text-sm space-y-1">
                  <div>As dictionary for others: Average {
                    (Object.values(deflateData.deflate_analysis.compression_benefits[hoveredNode || selectedNode!])
                      .filter((_, i, arr) => Object.keys(deflateData.deflate_analysis.compression_benefits[hoveredNode || selectedNode!])[i] !== (hoveredNode || selectedNode))
                      .reduce((a, b) => a + b, 0) / 
                      (deflateData.deflate_analysis.languages.length - 1) * 100).toFixed(1)
                  }% improvement</div>
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
          {dataMode === 'kl' ? (
            <>
              <div>• <strong>Node size:</strong> Larger nodes have higher character entropy</div>
              <div>• <strong>Edge thickness:</strong> Thicker edges indicate smaller KL divergence (more similar)</div>
            </>
          ) : (
            <>
              <div>• <strong>Node size:</strong> All nodes same size (no entropy data for DEFLATE)</div>
              <div>• <strong>Edge thickness:</strong> Thicker edges indicate better compression benefit</div>
            </>
          )}
          <div>• <strong>Node color:</strong> Different colors represent language families</div>
          <div>• <strong>Distance:</strong> Closer nodes are more similar according to {dataMode === 'kl' ? 'character frequency' : 'compression'} analysis</div>
          <div>• <strong>Interaction:</strong> Hover over nodes to see connections, click to pin details</div>
        </div>
      </div>
    </div>
  );
};

export default ProgrammingLanguageSimilarityWidget;