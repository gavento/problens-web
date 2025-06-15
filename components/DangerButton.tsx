"use client";

import React from 'react';
import { useDangerMode } from './providers/DangerModeProvider';
import * as Tooltip from '@radix-ui/react-tooltip';

export default function DangerButton() {
  const { isDangerMode, toggleDangerMode } = useDangerMode();

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            onClick={toggleDangerMode}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 border ${
              isDangerMode
                ? 'bg-red-500 text-white border-red-600 hover:bg-red-600'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
            aria-label="Toggle danger mode"
          >
            {isDangerMode ? '⚠️ Danger Mode ON' : '🔒 Danger Mode OFF'}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 bg-gray-900 text-white text-sm rounded-md px-3 py-2 max-w-xs"
            sideOffset={5}
          >
            {isDangerMode ? (
              <div>
                <strong>Danger Mode Active!</strong>
                <br />
                Showing bonus chapters and advanced content.
                <br />
                Click to hide advanced material.
              </div>
            ) : (
              <div>
                <strong>Enable Danger Mode</strong>
                <br />
                Reveals bonus riddles, chapters, and expand blocks. Use at your own risk!
              </div>
            )}
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}