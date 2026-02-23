import React, { createContext, useContext, useState } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Check local storage for persisted user on initialization
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('phishguard_user');
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
  });

  // No need for useEffect to load from localStorage anymore

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('phishguard_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('phishguard_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}