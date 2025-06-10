"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";

interface ViewStats {
  date: string;
  views: number;
}

export default function AdminPanel() {
  const [viewStats, setViewStats] = useState<ViewStats[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { isAdmin, logout } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      loadViewStats();
    }
  }, [isAdmin]);

  const loadViewStats = () => {
    try {
      const stored = localStorage.getItem("problens-views");
      if (stored) {
        const stats = JSON.parse(stored) as ViewStats[];
        // Sort by date descending and take last 14 days for better overview
        const recent = stats.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
        setViewStats(recent);
      }
    } catch (error) {
      console.error("Error loading view stats:", error);
    }
  };

  const handleLogout = () => {
    logout();
    setIsVisible(false);
  };

  if (!isAdmin) return null;

  return (
    <>
      {/* Admin Toggle Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Admin Panel"
        >
          ⚙️
        </button>
      </div>

      {/* Admin Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-72">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">Admin Panel</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          {/* Daily Views */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Daily Views (Last {viewStats.length} days)
              {viewStats.length > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  Total: {viewStats.reduce((sum, stat) => sum + stat.views, 0)}
                </span>
              )}
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {viewStats.length > 0 ? (
                viewStats.map((stat) => (
                  <div key={stat.date} className="flex justify-between text-xs">
                    <span className="text-gray-600">{stat.date}</span>
                    <span className="font-medium">{stat.views}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No view data available</p>
              )}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </>
  );
}