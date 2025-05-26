import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import { loginUser } from '@/services/users/authService';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  // Kiểm tra token hợp lệ khi khởi động
  useEffect(() => {
    const validateSession = async () => {
      if (token && !isAuthenticated) {
        try {
        } catch (error) {
          clearAuth();
        }
      }
    };

    validateSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await loginUser({ email, password });
      const typedData = data as { token: string; user: any };
      if (typedData.token && typedData.user) {
        setAuth(typedData.user, typedData.token);
        return;
      }
      throw new Error('Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      clearAuth();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);