"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

interface WikipediaNode extends d3.SimulationNodeDatum {
  id: string;
  category: 'president' | 'country';
  displayName: string;
  size?: number;
}

interface WikipediaLink extends d3.SimulationLinkDatum<WikipediaNode> {
  source: string | WikipediaNode;
  target: string | WikipediaNode;
  value: number;
  distance: number;
}

interface WikipediaResults {
  languages: string[];
  distance_matrix: Record<string, Record<string, number>>;
  entropy_values?: Record<string, number>;
  compression_benefits?: Record<string, Record<string, number>>;
  categories: Record<string, string>;
}

interface WikipediaAnalysisData {
  metadata: {
    total_items: number;
    presidents: number;
    countries: number;
    analysis_types: string[];
  };
  kl_analysis: {
    baseline: WikipediaResults;
  };
  deflate_analysis: WikipediaResults;
}

const WikipediaContentSimilarityWidget: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<WikipediaAnalysisData | null>(null);
  const [dataMode, setDataMode] = useState<'kl' | 'deflate'>('kl');
  const [analysisMode, setAnalysisMode] = useState<'unified' | 'president' | 'country'>('unified');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  // Physics parameters
  const [maxDistance, setMaxDistance] = useState(0.4);
  const [baseSpringDistance, setBaseSpringDistance] = useState(40);
  const [maxSpringDistance, setMaxSpringDistance] = useState(250);
  const [linkStrength, setLinkStrength] = useState(0.6);
  const [chargeStrength, setChargeStrength] = useState(-800);
  const [collisionRadius, setCollisionRadius] = useState(8);

  // Color mappings
  const presidentColors: Record<string, string> = {
    'president_washington': '#1E3A8A', // Deep blue
    'president_jefferson': '#7C2D12', // Brown
    'president_lincoln': '#991B1B', // Dark red
    'president_roosevelt': '#166534', // Dark green
    'president_kennedy': '#7C3AED', // Purple
  };

  const countryColors: Record<string, string> = {
    'country_france': '#3B82F6', // Blue
    'country_japan': '#EF4444', // Red
    'country_brazil': '#10B981', // Green
    'country_germany': '#F59E0B', // Yellow
    'country_australia': '#8B5CF6', // Violet
  };

  const getNodeColor = (nodeId: string, category: string): string => {
    if (category === 'president') {
      return presidentColors[nodeId] || '#374151';
    } else {
      return countryColors[nodeId] || '#6B7280';
    }
  };

  const getDisplayName = (nodeId: string): string => {
    const nameMap: Record<string, string> = {
      'president_washington': 'Washington',
      'president_jefferson': 'Jefferson',
      'president_lincoln': 'Lincoln',
      'president_roosevelt': 'Roosevelt',
      'president_kennedy': 'Kennedy',
      'country_france': 'France',
      'country_japan': 'Japan',
      'country_brazil': 'Brazil',
      'country_germany': 'Germany',
      'country_australia': 'Australia'
    };
    return nameMap[nodeId] || nodeId;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      try {
        response = await fetch('/data/wikipedia_analysis.json');
        if (!response.ok) {
          throw new Error('Dev path failed');
        }
      } catch {
        response = await fetch('/problens-web/data/wikipedia_analysis.json');
        if (!response.ok) {
          throw new Error('Failed to fetch Wikipedia analysis data');
        }
      }
      
      const analysisData = await response.json();
      setData(analysisData);
      
    } catch (err) {
      setError('Failed to load Wikipedia analysis data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createVisualization = useCallback(() => {
    if (!data || !svgRef.current) return;
    
    // Choose data based on mode
    const currentData = dataMode === 'kl' ? data.kl_analysis.baseline : data.deflate_analysis;
    if (!currentData) return;

    // Filter data based on analysis mode
    let filteredItems = currentData.languages;
    if (analysisMode === 'president') {
      filteredItems = currentData.languages.filter(item => 
        currentData.categories[item] === 'president'
      );
    } else if (analysisMode === 'country') {
      filteredItems = currentData.languages.filter(item => 
        currentData.categories[item] === 'country'
      );
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Calculate responsive dimensions
    const parentContainer = svgRef.current.parentElement;
    if (!parentContainer) return;
    
    const aspectRatio = 16 / 10;
    let width, height, scaleFactor;
    
    if (isFullscreen) {
      const maxWidth = window.innerWidth - 40;
      const maxHeight = window.innerHeight - 120;
      
      if (maxWidth / aspectRatio <= maxHeight) {
        width = maxWidth;
        height = width / aspectRatio;
      } else {
        height = maxHeight;
        width = height * aspectRatio;
      }
      scaleFactor = width / 1000;
    } else {
      const containerRect = parentContainer.getBoundingClientRect();
      const availableWidth = Math.max(700, containerRect.width - 32);
      width = Math.min(1000, availableWidth);
      height = width / aspectRatio;
      scaleFactor = width / 1000;
    }
    
    const margin = 50 * scaleFactor;
    const nodeRadius = 30 * scaleFactor;

    svg.attr("width", width).attr("height", height);

    const container = svg.append("g")
      .attr("transform", `translate(${margin}, ${margin})`);

    // Prepare nodes
    const nodes: WikipediaNode[] = filteredItems.map(itemId => ({
      id: itemId,
      category: currentData.categories[itemId] as 'president' | 'country',
      displayName: getDisplayName(itemId),
      size: currentData.entropy_values?.[itemId] || 1
    }));

    // Prepare links
    const links: WikipediaLink[] = [];
    
    filteredItems.forEach(item1 => {
      filteredItems.forEach(item2 => {
        if (item1 !== item2) {
          const rawDistance = currentData.distance_matrix[item1][item2];
          
          // Adjust distance threshold based on data mode
          const adjustedDistance = dataMode === 'kl' 
            ? Math.max(0, rawDistance - 0.05)
            : rawDistance;
          
          if (adjustedDistance <= maxDistance) {
            const normalizedDistance = adjustedDistance / maxDistance;
            
            links.push({
              source: item1,
              target: item2,
              value: 1 - normalizedDistance,
              distance: rawDistance
            });
          }
        }
      });
    });

    // Create force simulation
    const simulation = d3.forceSimulation<WikipediaNode>(nodes)
      .force("link", d3.forceLink<WikipediaNode, WikipediaLink>(links)
        .id(d => d.id)
        .distance(d => (baseSpringDistance + (1 - d.value) * maxSpringDistance) * scaleFactor)
        .strength(d => Math.pow(d.value, 2) * linkStrength))
      .force("charge", d3.forceManyBody().strength(chargeStrength * scaleFactor))
      .force("center", d3.forceCenter((width - 2 * margin) / 2, (height - 2 * margin) / 2))
      .force("collision", d3.forceCollide().radius(nodeRadius + collisionRadius * scaleFactor))
      .force("boundary", () => {
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
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.pow(d.value, 1.5) * 6 * scaleFactor);

    // Create nodes
    const node = container.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => {
        const baseSize = d.category === 'country' ? nodeRadius * 1.2 : nodeRadius;
        return Math.min(baseSize, 15 + (d.size || 1) * 4);
      })
      .attr("fill", d => getNodeColor(d.id, d.category))
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .style("cursor", "pointer");

    // Add labels
    const labels = container.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text(d => d.displayName)
      .attr("font-size", `${11 * scaleFactor}px`)
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .attr("fill", "#333")
      .style("pointer-events", "none");

    // Add interactivity
    node
      .on("mouseover", (event, d) => {
        setHoveredNode(d.id);
        
        const connectedNodes = new Set([d.id]);
        links.forEach(link => {
          if (link.source === d.id) connectedNodes.add(link.target as string);
          if (link.target === d.id) connectedNodes.add(link.source as string);
        });

        node.style("opacity", n => connectedNodes.has(n.id) ? 1 : 0.3);
        link.style("opacity", l => 
          (l.source as WikipediaNode).id === d.id || (l.target as WikipediaNode).id === d.id ? 0.8 : 0.1
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
    const drag = d3.drag<SVGCircleElement, WikipediaNode>()
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
        .attr("x1", d => (d.source as WikipediaNode).x!)
        .attr("y1", d => (d.source as WikipediaNode).y!)
        .attr("x2", d => (d.target as WikipediaNode).x!)
        .attr("y2", d => (d.target as WikipediaNode).y!);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);

      labels
        .attr("x", d => d.x!)
        .attr("y", d => d.y!);
    });

  }, [data, dataMode, analysisMode, selectedNode, isFullscreen, maxDistance, baseSpringDistance, maxSpringDistance, linkStrength, chargeStrength, collisionRadius]);

  useEffect(() => {
    createVisualization();
  }, [createVisualization]);

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
        <div className="text-gray-600">Loading Wikipedia analysis...</div>
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

  const containerClass = isFullscreen 
    ? "fixed inset-0 z-50 bg-white p-4 space-y-4 overflow-y-auto"
    : "p-4 sm:p-6 bg-gray-50 rounded-lg space-y-4 w-full mx-auto";

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">
          Wikipedia Content Similarity Network
        </h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setDataMode(dataMode === 'kl' ? 'deflate' : 'kl')}
            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
          >
            {dataMode === 'kl' ? 'KL Divergence' : 'DEFLATE'}
          </button>
          <button
            onClick={() => setAnalysisMode(analysisMode === 'unified' ? 'president' : analysisMode === 'president' ? 'country' : 'unified')}
            className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm"
          >
            {analysisMode === 'unified' ? 'All Content' : analysisMode === 'president' ? 'Presidents' : 'Countries'}
          </button>
          <button
            onClick={() => setShowControls(!showControls)}
            className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-sm"
          >
            {showControls ? 'Hide' : 'Show'} Controls
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>
      
      <p className="text-center text-gray-600 text-sm">
        {dataMode === 'kl' 
          ? `Wikipedia content clustered by KL divergence of character frequencies.${analysisMode === 'unified' ? ' US Presidents vs. Countries comparison.' : ''}`
          : `Wikipedia content clustered by DEFLATE dictionary compression effectiveness.${analysisMode === 'unified' ? ' Cross-topic similarity analysis.' : ''}`
        }
      </p>

      {data && (
        <div className="text-center text-sm text-gray-500">
          {analysisMode === 'unified' 
            ? `Showing: ${data.metadata.presidents} US presidents, ${data.metadata.countries} countries`
            : analysisMode === 'president' 
              ? `Showing: ${data.metadata.presidents} US presidents only`
              : `Showing: ${data.metadata.countries} countries only`
          }
        </div>
      )}

      {/* Physics Controls Panel */}
      {showControls && (
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
          <h4 className="font-semibold mb-3">Physics Parameters</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Distance: {maxDistance.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={maxDistance}
                onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500">Only show connections ≤ this distance</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Base Spring: {baseSpringDistance}px
              </label>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={baseSpringDistance}
                onChange={(e) => setBaseSpringDistance(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Max Spring: {maxSpringDistance}px
              </label>
              <input
                type="range"
                min="150"
                max="400"
                step="25"
                value={maxSpringDistance}
                onChange={(e) => setMaxSpringDistance(parseInt(e.target.value))}
                className="w-full"
              />
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
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Charge: {chargeStrength}
              </label>
              <input
                type="range"
                min="-1500"
                max="-200"
                step="50"
                value={chargeStrength}
                onChange={(e) => setChargeStrength(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Collision: {collisionRadius}px
              </label>
              <input
                type="range"
                min="2"
                max="20"
                step="2"
                value={collisionRadius}
                onChange={(e) => setCollisionRadius(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

          </div>
        </div>
      )}

      {/* Visualization */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-hidden">
        <div className="w-full flex justify-center">
          <svg ref={svgRef}></svg>
        </div>
      </div>

      {/* Info panel */}
      {(hoveredNode || selectedNode) && data && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-lg mb-2">
            {getDisplayName(hoveredNode || selectedNode!)}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({data.kl_analysis.baseline.categories[hoveredNode || selectedNode!]})
            </span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">
                Most Similar Content ({dataMode === 'kl' ? 'KL distance' : 'DEFLATE'}):
              </h5>
              {(() => {
                const currentDistanceMatrix = dataMode === 'kl' 
                  ? data.kl_analysis.baseline.distance_matrix 
                  : data.deflate_analysis.distance_matrix;
                  
                if (!currentDistanceMatrix || !currentDistanceMatrix[hoveredNode || selectedNode!]) {
                  return null;
                }
                
                return (
                  <div className="space-y-1">
                    {Object.entries(currentDistanceMatrix[hoveredNode || selectedNode!])
                      .filter(([itemId]) => itemId !== (hoveredNode || selectedNode))
                      .sort(([,a], [,b]) => a - b)
                      .slice(0, 5)
                      .map(([itemId, distance]) => (
                        <div key={itemId} className="flex justify-between items-center">
                          <span className="text-sm">{getDisplayName(itemId)}</span>
                          <span className="text-xs text-gray-500">
                            {distance.toFixed(3)}
                          </span>
                        </div>
                      ))}
                  </div>
                );
              })()}
            </div>
            
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Properties:</h5>
              <div className="text-sm space-y-1">
                {dataMode === 'kl' && data.kl_analysis.baseline.entropy_values && (
                  <div>Entropy: {data.kl_analysis.baseline.entropy_values[hoveredNode || selectedNode!]?.toFixed(3)} bits</div>
                )}
                {dataMode === 'deflate' && data.deflate_analysis.compression_benefits && (
                  <div>Avg compression benefit: {
                    (Object.values(data.deflate_analysis.compression_benefits[hoveredNode || selectedNode!])
                      .filter((_, i, arr) => Object.keys(data.deflate_analysis.compression_benefits[hoveredNode || selectedNode!])[i] !== (hoveredNode || selectedNode))
                      .reduce((a, b) => a + b, 0) / 
                      (Object.keys(data.deflate_analysis.compression_benefits).length - 1) * 100).toFixed(1)
                  }%</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-semibold mb-2">Legend</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <div>• <strong>Circle size:</strong> Character entropy (larger = more diverse)</div>
            <div>• <strong>Edge thickness:</strong> Content similarity strength</div>
            <div>• <strong>US Presidents:</strong> Historical figures and political content</div>
          </div>
          <div>
            <div>• <strong>Countries:</strong> Geographic and cultural information</div>
            <div>• <strong>Distance:</strong> Closer nodes = more similar content</div>
            <div>• <strong>Cross-topic links:</strong> Show president/country relationships</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WikipediaContentSimilarityWidget;