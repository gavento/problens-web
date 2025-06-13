"use client";

import React from "react";

interface ShannonCodeWidgetProps {
  title?: string;
}

export default function ShannonCodeWidget({ title = "Shannon Code Constructor" }: ShannonCodeWidgetProps) {
  return (
    <div className="shannon-code-widget bg-white border border-gray-200 rounded-lg p-6 my-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          🚧 Shannon Code Widget is temporarily disabled due to technical issues.
        </p>
        <p className="text-yellow-700 mt-2 text-sm">
          This widget will be restored once the JSX syntax errors are resolved.
        </p>
      </div>
    </div>
  );
}