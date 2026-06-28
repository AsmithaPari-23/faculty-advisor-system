import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://faculty-advisor-system.onrender.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync token with axios on boot
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
        }
      } catch (e) {
        console.error('Auth context initial loading error:', e);
        localStorage.removeItem('userInfo');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const userData = response.data;
      setUser(userData);
      localStorage.setItem('userInfo', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      return { success: true };
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check credentials.'
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (registerData) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/register', registerData);
      const userData = response.data;
      setUser(userData);
      localStorage.setItem('userInfo', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      return { success: true };
    } catch (error) {
      console.error('Register error in AuthContext:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
