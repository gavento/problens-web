'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from '../Page.module.css';

interface ArrayElement {
  index: number;
  weight: number;
}

const NoisyBinarySearchWidget: React.FC = () => {
  const ARRAY_SIZE = 15;
  const COMPARISON_SUCCESS_PROB = 2/3;
  
  const [targetIndex, setTargetIndex] = useState(8);
  const [elements, setElements] = useState<ArrayElement[]>(() => 
    Array.from({ length: ARRAY_SIZE }, (_, i) => ({
      index: i + 1,
      weight: 1 / ARRAY_SIZE
    }))
  );
  const [currentMiddle, setCurrentMiddle] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stepMode, setStepMode] = useState(true);
  const [found, setFound] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<string | null>(null);
  const [stepCount, setStepCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetAlgorithm = () => {
    setElements(Array.from({ length: ARRAY_SIZE }, (_, i) => ({
      index: i + 1,
      weight: 1 / ARRAY_SIZE
    })));
    setCurrentMiddle(null);
    setFound(false);
    setComparisonResult(null);
    setStepCount(0);
    setIsRunning(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const findMiddleElement = (elems: ArrayElement[]): number => {
    let cumulativeWeight = 0;
    for (let i = 0; i < elems.length; i++) {
      cumulativeWeight += elems[i].weight;
      if (cumulativeWeight >= 0.5) {
        return i;
      }
    }
    return Math.floor(elems.length / 2);
  };

  const performStep = () => {
    if (found) return;

    const middleIdx = findMiddleElement(elements);
    const middleElement = elements[middleIdx];
    setCurrentMiddle(middleIdx);
    setStepCount(prev => prev + 1);

    if (middleElement.index === targetIndex) {
      setFound(true);
      setComparisonResult(`Found at position ${middleElement.index}!`);
      setIsRunning(false);
      return;
    }

    const isCorrectComparison = Math.random() < COMPARISON_SUCCESS_PROB;
    const actualComparison = middleElement.index < targetIndex;
    const reportedComparison = isCorrectComparison ? actualComparison : !actualComparison;

    if (reportedComparison) {
      setComparisonResult(`${middleElement.index} < ${targetIndex} (${isCorrectComparison ? 'correct' : 'noisy!'})`);
    } else {
      setComparisonResult(`${middleElement.index} > ${targetIndex} (${isCorrectComparison ? 'correct' : 'noisy!'})`);
    }

    const newElements = elements.map((elem, idx) => {
      const shouldBoost = reportedComparison ? idx > middleIdx : idx < middleIdx;
      return {
        ...elem,
        weight: shouldBoost ? elem.weight * 2 : elem.weight
      };
    });

    const totalWeight = newElements.reduce((sum, elem) => sum + elem.weight, 0);
    const normalizedElements = newElements.map(elem => ({
      ...elem,
      weight: elem.weight / totalWeight
    }));

    setElements(normalizedElements);
  };

  useEffect(() => {
    const runContinuous = () => {
      if (!isRunning || found) return;
      
      performStep();
      
      if (!found) {
        timeoutRef.current = setTimeout(runContinuous, 800);
      }
    };

    if (isRunning && !stepMode && !found) {
      runContinuous();
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isRunning, stepMode, found, elements]);

  const handleRunToggle = () => {
    if (stepMode) {
      performStep();
    } else {
      setIsRunning(!isRunning);
    }
  };

  const maxWeight = Math.max(...elements.map(e => e.weight));
  const BAR_MAX_HEIGHT = 200;

  return (
    <div className={styles.widget}>
      <h3>Noisy Binary Search Visualization</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Target element: 
          <input
            type="number"
            min="1"
            max={ARRAY_SIZE}
            value={targetIndex}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val >= 1 && val <= ARRAY_SIZE) {
                setTargetIndex(val);
                resetAlgorithm();
              }
            }}
            style={{ marginLeft: '10px', width: '60px' }}
          />
        </label>
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        justifyContent: 'center',
        marginBottom: '20px',
        height: `${BAR_MAX_HEIGHT + 50}px`,
        position: 'relative'
      }}>
        {elements.map((elem, idx) => {
          const height = (elem.weight / maxWeight) * BAR_MAX_HEIGHT;
          const isMiddle = idx === currentMiddle;
          const isTarget = elem.index === targetIndex;
          const isFound = found && isTarget;
          
          return (
            <div
              key={elem.index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0 5px',
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: `${height}px`,
                  backgroundColor: isFound ? '#4CAF50' : isMiddle ? '#FF9800' : isTarget ? '#2196F3' : '#9E9E9E',
                  transition: 'all 0.3s ease',
                  borderRadius: '2px',
                  position: 'relative'
                }}
              >
                {isMiddle && !found && (
                  <div style={{
                    position: 'absolute',
                    top: '-25px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '20px'
                  }}>
                    ↓
                  </div>
                )}
              </div>
              <div style={{ 
                marginTop: '5px', 
                fontSize: '12px',
                fontWeight: isTarget ? 'bold' : 'normal'
              }}>
                {elem.index}
              </div>
              <div style={{ 
                fontSize: '10px', 
                color: '#666',
                marginTop: '2px'
              }}>
                {(elem.weight * 100).toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>

      {comparisonResult && (
        <div style={{ 
          marginBottom: '15px', 
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          color: found ? '#4CAF50' : '#333'
        }}>
          {comparisonResult}
        </div>
      )}

      <div style={{ marginBottom: '15px', textAlign: 'center' }}>
        Steps: {stepCount}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}>
        <label>
          <input
            type="radio"
            checked={stepMode}
            onChange={() => {
              setStepMode(true);
              setIsRunning(false);
            }}
          />
          Step by step
        </label>
        <label>
          <input
            type="radio"
            checked={!stepMode}
            onChange={() => setStepMode(false)}
          />
          Continuous
        </label>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={handleRunToggle}
          disabled={found}
          style={{
            padding: '8px 16px',
            backgroundColor: found ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: found ? 'default' : 'pointer'
          }}
        >
          {stepMode ? 'Next Step' : (isRunning ? 'Pause' : 'Run')}
        </button>
        <button
          onClick={resetAlgorithm}
          style={{
            padding: '8px 16px',
            backgroundColor: '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Legend:</strong></p>
        <p>• Gray bars: Array elements with their weights</p>
        <p>• Blue bar: Target element</p>
        <p>• Orange bar: Currently comparing</p>
        <p>• Green bar: Found!</p>
      </div>
    </div>
  );
};

export default NoisyBinarySearchWidget;