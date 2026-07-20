import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../../domain/entities/User';
import { ApiAuthService } from '../../infrastructure/services/ApiAuthService';
import { useToast } from './ToastContext';

// Define context state schema
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (fullName: string, email: string, password: string, role: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use the real API-backed service
const authService = new ApiAuthService();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Restore active session on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Session restoration failed:', err);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const authenticatedUser = await authService.login(email, password);
      setUser(authenticatedUser);
      showToast('Welcome back!', 'success');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };



  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      showToast('You have been signed out.', 'info');
    } catch (err: any) {
      console.error('Logout failed:', err);
      showToast('Logout failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (fullName: string, email: string, password: string, role: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.signup(fullName, email, password, role);
      showToast('Account created successfully. Please login.', 'success');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, signup, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume authentication credentials
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed within an AuthProvider');
  }
  return context;
};
