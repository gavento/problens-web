"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = () => {
      const adminStatus = localStorage.getItem("problens-admin") === "true" ||
                         sessionStorage.getItem("problens-admin") === "true";
      setIsAdmin(adminStatus);
    };

    checkAuth();

    // Listen for storage changes (for logout from other tabs)
    const handleStorageChange = () => checkAuth();
    window.addEventListener("storage", handleStorageChange);
    
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = () => {
    localStorage.setItem("problens-admin", "true");
    sessionStorage.setItem("problens-admin", "true");
    setIsAdmin(true);
  };

  const logout = () => {
    localStorage.removeItem("problens-admin");
    sessionStorage.removeItem("problens-admin");
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}