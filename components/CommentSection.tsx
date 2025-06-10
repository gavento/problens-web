"use client";

import React, { useState, useEffect } from "react";

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  page: string;
}

interface CommentSectionProps {
  pageId: string;
}

export default function CommentSection({ pageId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({ author: "", content: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Load comments from localStorage
  useEffect(() => {
    const loadComments = () => {
      try {
        const stored = localStorage.getItem("problens-comments");
        if (stored) {
          const allComments = JSON.parse(stored) as Comment[];
          const pageComments = allComments.filter(c => c.page === pageId);
          setComments(pageComments);
        }
      } catch (error) {
        console.error("Error loading comments:", error);
      }
    };
    
    loadComments();
    
    // Listen for storage changes from other tabs
    const handleStorageChange = () => loadComments();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [pageId]);

  const saveComment = (comment: Comment) => {
    try {
      const stored = localStorage.getItem("problens-comments");
      const allComments = stored ? JSON.parse(stored) as Comment[] : [];
      allComments.push(comment);
      localStorage.setItem("problens-comments", JSON.stringify(allComments));
      setComments(prev => [...prev, comment]);
    } catch (error) {
      console.error("Error saving comment:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.author.trim() || !newComment.content.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    const comment: Comment = {
      id: Date.now().toString(),
      author: newComment.author.trim(),
      content: newComment.content.trim(),
      timestamp: new Date().toISOString(),
      page: pageId
    };
    
    saveComment(comment);
    setNewComment({ author: "", content: "" });
    setIsSubmitting(false);
    setShowForm(false);
  };

  return (
    <div className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Comments {comments.length > 0 && (
            <span className="text-lg text-gray-500">({comments.length})</span>
          )}
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
          >
            Add Comment
          </button>
        )}
      </div>
      
      {/* Comment Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-4 rounded-lg">
          <div className="mb-4">
            <label htmlFor="author" className="block text-sm font-medium mb-2">
              Name (optional)
            </label>
            <input
              id="author"
              type="text"
              value={newComment.author}
              onChange={(e) => setNewComment(prev => ({ ...prev, author: e.target.value }))}
              placeholder="Anonymous"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={50}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Comment
            </label>
            <textarea
              id="content"
              value={newComment.content}
              onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share your thoughts..."
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              maxLength={1000}
              required
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !newComment.content.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setNewComment({ author: "", content: "" });
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 italic">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">
                  {comment.author || "Anonymous"}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}