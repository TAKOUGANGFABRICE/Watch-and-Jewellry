import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('farel_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('farel_access_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Sync profile on mount if token exists
  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('farel_access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await authService.getProfile();
      setUser(profile);
      localStorage.setItem('farel_user', JSON.stringify(profile));
    } catch (err) {
      console.warn("Failed to fetch current user profile:", err);
      // If unauthorized, token will be cleared by interceptor
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();

    const handleLogoutEvent = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('farel_auth_logout', handleLogoutEvent);
    return () => window.removeEventListener('farel_auth_logout', handleLogoutEvent);
  }, [refreshProfile]);

  const login = async (identifier, password) => {
    setIsLoading(true);
    try {
      const res = await authService.login(identifier, password);
      setUser(res.user);
      setAccessToken(res.tokens.access);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data) => {
    setIsLoading(true);
    try {
      const res = await authService.register(data);
      setUser(res.user);
      setAccessToken(res.tokens.access);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setAccessToken(null);
      setIsLoading(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('farel_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
