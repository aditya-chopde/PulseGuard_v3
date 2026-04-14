import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, LoginResponse } from '@/services/authService';

interface AuthContextType {
  isLoggedIn: boolean;
  role: 'patient' | 'doctor' | null;
  userName: string;
  user: any | null;
  isLoading: boolean;
  login: (email: string, password: string, role: 'patient' | 'doctor') => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'patient' | 'doctor' | null>(null);
  const [userName, setUserName] = useState('');
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('pulseguard_token');
    const storedUser = localStorage.getItem('pulseguard_user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setIsLoggedIn(true);
        setRole(parsedUser.role);
        setUserName(parsedUser.name);
        setUser(parsedUser);
      } catch (e) {
        // Invalid stored user
        localStorage.removeItem('pulseguard_token');
        localStorage.removeItem('pulseguard_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, selectedRole: 'patient' | 'doctor') => {
    const data = await authService.login(email, password, selectedRole);
    
    // Save to local storage
    localStorage.setItem('pulseguard_token', data.token);
    localStorage.setItem('pulseguard_user', JSON.stringify(data.user));

    setIsLoggedIn(true);
    setRole(data.user.role as 'patient' | 'doctor');
    setUserName(data.user.name);
    setUser(data.user);
  };

  const signup = async (data: any) => {
    const responseData = await authService.signup(data);
    
    // Save to local storage
    localStorage.setItem('pulseguard_token', responseData.token);
    localStorage.setItem('pulseguard_user', JSON.stringify(responseData.user));

    setIsLoggedIn(true);
    setRole(responseData.user.role as 'patient' | 'doctor');
    setUserName(responseData.user.name);
    setUser(responseData.user);
  };

  const logout = () => {
    localStorage.removeItem('pulseguard_token');
    localStorage.removeItem('pulseguard_user');
    
    setIsLoggedIn(false);
    setRole(null);
    setUserName('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, userName, user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
