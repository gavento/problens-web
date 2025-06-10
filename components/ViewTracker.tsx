"use client";

import { useEffect } from "react";

export default function ViewTracker() {
  useEffect(() => {
    const trackView = () => {
      try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const stored = localStorage.getItem("problens-views");
        let viewStats = [];

        if (stored) {
          viewStats = JSON.parse(stored);
        }

        // Find today's entry
        const todayIndex = viewStats.findIndex((stat: any) => stat.date === today);
        
        if (todayIndex >= 0) {
          // Increment today's count
          viewStats[todayIndex].views += 1;
        } else {
          // Add new entry for today
          viewStats.push({ date: today, views: 1 });
        }

        // Keep only last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
        
        viewStats = viewStats.filter((stat: any) => stat.date >= cutoffDate);

        localStorage.setItem("problens-views", JSON.stringify(viewStats));
      } catch (error) {
        console.error("Error tracking view:", error);
      }
    };

    // Track view on mount
    trackView();
  }, []);

  return null; // This component doesn't render anything
}