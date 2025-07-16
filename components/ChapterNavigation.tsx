import React from "react";
import Link from "next/link";
import { PARTS } from "@/lib/config";

interface ChapterNavigationProps {
  currentPath: string;
}

export default function ChapterNavigation({ currentPath }: ChapterNavigationProps) {
  // Get all chapters in order (excluding meta pages)
  const allChapters = PARTS.flatMap(part => 
    part.chapters.map(([title, path]) => ({ title, path }))
  );

  // Find current chapter index
  const currentIndex = allChapters.findIndex(ch => ch.path === currentPath);
  
  // If not found (meta page), don't show navigation
  if (currentIndex === -1) return null;

  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  return (
    <div className="mt-16 pt-8 border-t border-gray-200">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          {prevChapter && (
            <Link 
              href={`/${prevChapter.path}/`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <div className="text-left">
                <div className="text-sm text-gray-500">Previous</div>
                <div className="font-medium">{prevChapter.title}</div>
              </div>
            </Link>
          )}
        </div>
        
        <div className="flex-1 text-right">
          {nextChapter && (
            <Link 
              href={`/${nextChapter.path}/`}
              className="inline-flex items-center justify-end text-blue-600 hover:text-blue-800 transition-colors"
            >
              <div className="text-right">
                <div className="text-sm text-gray-500">Next</div>
                <div className="font-medium">{nextChapter.title}</div>
              </div>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}