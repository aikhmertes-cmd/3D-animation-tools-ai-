import React, { createContext, useState, useContext, ReactNode } from 'react';

interface User {
  name: string;
  picture: string; // URL or data URI for the profile picture
}

interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Simulate a login
  const login = () => {
    setUser({
      name: 'Sal Admin',
      // Using a simple SVG as a placeholder avatar
      picture: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%234f46e5" /><text x="50" y="68" font-size="50" fill="white" text-anchor="middle" font-family="Arial, sans-serif">S</text></svg>`
    });
  };

  // Simulate a logout
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
