'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import ZoomButton from './ZoomButton';

const MandelbrotExplorer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({
    centerX: -0.5,
    centerY: 0,
    scale: 200
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [maxIterations, setMaxIterations] = useState(50);
  const [touchDistance, setTouchDistance] = useState<number | null>(null);

  // Calculate if a point is in the Mandelbrot set
  const mandelbrot = (x0: number, y0: number, maxIter: number) => {
    let x = 0;
    let y = 0;
    let iteration = 0;
    
    while (x * x + y * y <= 4 && iteration < maxIter) {
      const temp = x * x - y * y + x0;
      y = 2 * x * y + y0;
      x = temp;
      iteration++;
    }
    
    return iteration;
  };

  // Color mapping function
  const getColor = (iteration: number, maxIter: number) => {
    if (iteration === maxIter) {
      return { r: 0, g: 0, b: 0 }; // Black for points in the set
    }
    
    const hue = (iteration / maxIter) * 360;
    const saturation = 100;
    const lightness = 50;
    
    // HSL to RGB conversion
    const c = (1 - Math.abs(2 * lightness / 100 - 1)) * saturation / 100;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = lightness / 100 - c / 2;
    
    let r = 0, g = 0, b = 0;
    if (hue < 60) {
      r = c; g = x; b = 0;
    } else if (hue < 120) {
      r = x; g = c; b = 0;
    } else if (hue < 180) {
      r = 0; g = c; b = x;
    } else if (hue < 240) {
      r = 0; g = x; b = c;
    } else if (hue < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  };

  // Render the Mandelbrot set
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const x = (px - width / 2) / viewport.scale + viewport.centerX;
        const y = (py - height / 2) / viewport.scale + viewport.centerY;
        
        const iteration = mandelbrot(x, y, maxIterations);
        const color = getColor(iteration, maxIterations);
        
        const index = (py * width + px) * 4;
        data[index] = color.r;
        data[index + 1] = color.g;
        data[index + 2] = color.b;
        data[index + 3] = 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }, [viewport, maxIterations]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dx = (e.clientX - dragStart.x) / viewport.scale;
    const dy = (e.clientY - dragStart.y) / viewport.scale;
    
    setViewport(prev => ({
      ...prev,
      centerX: prev.centerX - dx,
      centerY: prev.centerY - dy
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // This is now handled by the container's wheel event listener
    // Keep this for fallback but it shouldn't be called
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate world coordinates of the clicked point
    const worldX = (mouseX - canvas.width / 2) / viewport.scale + viewport.centerX;
    const worldY = (mouseY - canvas.height / 2) / viewport.scale + viewport.centerY;
    
    // Zoom in by 2x at the clicked point
    const zoomFactor = 2;
    const newScale = viewport.scale * zoomFactor;
    
    setViewport({
      centerX: worldX,
      centerY: worldY,
      scale: newScale
    });
  };

  // Handle touch events for mobile
  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setTouchDistance(null);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      setTouchDistance(getTouchDistance(e.touches));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (e.touches.length === 1 && isDragging) {
      const dx = (e.touches[0].clientX - dragStart.x) / viewport.scale;
      const dy = (e.touches[0].clientY - dragStart.y) / viewport.scale;
      
      setViewport(prev => ({
        ...prev,
        centerX: prev.centerX - dx,
        centerY: prev.centerY - dy
      }));
      
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2 && touchDistance !== null) {
      const newDistance = getTouchDistance(e.touches);
      const scale = newDistance / touchDistance;
      
      // Get the midpoint between the two touches
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      const rect = canvas.getBoundingClientRect();
      const canvasX = midX - rect.left;
      const canvasY = midY - rect.top;
      
      // Calculate world coordinates of pinch center
      const worldX = (canvasX - canvas.width / 2) / viewport.scale + viewport.centerX;
      const worldY = (canvasY - canvas.height / 2) / viewport.scale + viewport.centerY;
      
      // Update scale
      const newScale = viewport.scale * scale;
      
      // Adjust center to keep pinch center fixed
      const newCenterX = worldX - (canvasX - canvas.width / 2) / newScale;
      const newCenterY = worldY - (canvasY - canvas.height / 2) / newScale;
      
      setViewport({
        centerX: newCenterX,
        centerY: newCenterY,
        scale: newScale
      });
      
      setTouchDistance(newDistance);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchDistance(null);
  };

  // Reset view
  const resetView = () => {
    setViewport({
      centerX: -0.5,
      centerY: 0,
      scale: 200
    });
  };

  // Render on viewport or iterations change
  useEffect(() => {
    render();
  }, [render]);

  // Handle canvas resize and wheel events
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const container = canvas.parentElement;
      if (!container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      render();
    };
    
    // Add passive wheel event listener to the container
    const handleContainerWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomFactor = e.deltaY < 0 ? 1.2 : 0.8;
      
      // Calculate world coordinates of mouse position
      const worldX = (mouseX - canvas.width / 2) / viewport.scale + viewport.centerX;
      const worldY = (mouseY - canvas.height / 2) / viewport.scale + viewport.centerY;
      
      // Update scale
      const newScale = viewport.scale * zoomFactor;
      
      // Adjust center to keep mouse position fixed
      const newCenterX = worldX - (mouseX - canvas.width / 2) / newScale;
      const newCenterY = worldY - (mouseY - canvas.height / 2) / newScale;
      
      setViewport({
        centerX: newCenterX,
        centerY: newCenterY,
        scale: newScale
      });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleContainerWheel, { passive: false });
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (container) {
        container.removeEventListener('wheel', handleContainerWheel);
      }
    };
  }, [render, viewport]);

  // Calculate viewport bounds
  const getViewportBounds = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      // Return default bounds when canvas isn't ready
      const defaultWidth = 800;
      const defaultHeight = 600;
      const left = viewport.centerX - defaultWidth / 2 / viewport.scale;
      const right = viewport.centerX + defaultWidth / 2 / viewport.scale;
      const top = viewport.centerY - defaultHeight / 2 / viewport.scale;
      const bottom = viewport.centerY + defaultHeight / 2 / viewport.scale;
      return { left, right, top, bottom };
    }
    
    const width = canvas.width;
    const height = canvas.height;
    
    const left = viewport.centerX - width / 2 / viewport.scale;
    const right = viewport.centerX + width / 2 / viewport.scale;
    const top = viewport.centerY - height / 2 / viewport.scale;
    const bottom = viewport.centerY + height / 2 / viewport.scale;
    
    return { left, right, top, bottom };
  };

  const bounds = getViewportBounds();
  
  // Format number with precision based on viewport size
  const formatCoord = (num: number) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) {
      // Use default viewport width when canvas isn't ready
      const defaultWidth = 800;
      const viewportWidth = defaultWidth / viewport.scale;
      const targetPrecision = viewportWidth * 0.01;
      let decimalPlaces = Math.max(0, Math.ceil(-Math.log10(targetPrecision)));
      decimalPlaces = Math.min(12, Math.max(0, decimalPlaces));
      return num.toFixed(decimalPlaces);
    }
    
    // Calculate the width of the viewport in complex plane units
    const viewportWidth = canvas.width / viewport.scale;
    
    // We want precision such that rounding error is about 10% of viewport width
    // This means the precision should show digits that represent about 1% of viewport
    const targetPrecision = viewportWidth * 0.01;
    
    // Calculate how many decimal places we need
    let decimalPlaces = Math.max(0, Math.ceil(-Math.log10(targetPrecision)));
    
    // Cap at reasonable limits
    decimalPlaces = Math.min(12, Math.max(0, decimalPlaces));
    
    return num.toFixed(decimalPlaces);
  };

  return (
    <div className="w-full space-y-4">
      <div 
        ref={containerRef}
        className="relative w-full h-96 md:h-[500px] border border-gray-300 rounded-lg overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="iterations" className="text-sm font-medium">
            Max Iterations:
          </label>
          <input
            id="iterations"
            type="range"
            min="50"
            max="2000"
            value={maxIterations}
            onChange={(e) => setMaxIterations(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm w-12">{maxIterations}</span>
        </div>
        
        <ZoomButton 
          type="reset" 
          onClick={resetView}
          size="md"
        />
        
        <div className="text-sm text-gray-600">
          Drag • Scroll to zoom • Double-click
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
          <div className="font-medium mb-4 text-center text-gray-700">Image Parameters</div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 border border-gray-300 bg-white p-4 rounded-lg">
              <div className="font-medium mb-3 text-center">Mandelbrot Set Formula</div>
              <div className="text-center space-y-2">
                <div>z₀ = 0, z<sub>n+1</sub> = z<sub>n</sub>² + c</div>
                <div>c ∈ M if |z<sub>n</sub>| remains bounded</div>
                <div className="text-sm text-gray-600">Max iterations: {maxIterations}</div>
              </div>
            </div>
            
            <div className="flex-1 border border-gray-300 bg-white p-4 rounded-lg">
              <div className="font-medium mb-3 text-center">Viewport Coordinates</div>
              <div className="font-mono text-sm space-y-1">
                <div>Left: {formatCoord(bounds.left)}</div>
                <div>Right: {formatCoord(bounds.right)}</div>
                <div>Top: {formatCoord(bounds.top)}</div>
                <div>Bottom: {formatCoord(bounds.bottom)}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-4">
          <div className="text-lg font-medium text-gray-700">
            ↑ Kolmogorov complexity of the picture ↑
          </div>
        </div>
      </div>
    </div>
  );
};

export default MandelbrotExplorer;