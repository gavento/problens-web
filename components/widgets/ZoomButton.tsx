'use client';

import React from 'react';

export interface ZoomButtonProps {
  /** Type of zoom button */
  type: 'reset' | 'zoom-toggle' | 'zoom-in' | 'zoom-out';
  /** Current zoom state for toggle buttons */
  isZoomed?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Position the button on the right */
  className?: string;
}

export default function ZoomButton({ 
  type, 
  isZoomed = false, 
  onClick, 
  size = 'sm',
  className = ''
}: ZoomButtonProps) {
  
  const getButtonText = () => {
    switch (type) {
      case 'reset':
        return 'Reset All';
      case 'zoom-toggle':
        return isZoomed ? '🗗 Exit Fullscreen' : '🔍 Zoom';
      case 'zoom-in':
        return '🔍+ Zoom In';
      case 'zoom-out':
        return '🔍- Zoom Out';
      default:
        return 'Reset';
    }
  };

  const getButtonStyle = () => {
    const baseStyle = 'transition-colors rounded-md';
    
    if (type === 'reset') {
      return `${baseStyle} bg-blue-500 hover:bg-blue-600 text-white`;
    } else {
      return `${baseStyle} bg-gray-100 hover:bg-gray-200 text-gray-700`;
    }
  };

  const getSizeStyle = () => {
    return size === 'sm' 
      ? 'px-3 py-1 text-xs' 
      : 'px-4 py-2 text-sm';
  };

  const floatRightStyle = 'float-right mb-2';

  return (
    <button
      onClick={onClick}
      className={`${getButtonStyle()} ${getSizeStyle()} ${floatRightStyle} ${className}`}
    >
      {getButtonText()}
    </button>
  );
}