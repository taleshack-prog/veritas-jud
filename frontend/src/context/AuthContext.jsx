import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('@veritas:user');
    const token  = localStorage.getItem('@veritas:token');
    if (stored && token) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  async function login(email, password) {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('@veritas:token', data.token);
    localStorage.setItem('@veritas:user',  JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }

  async function register(name, email, password) {
    const { data } = await authAPI.register({ name, email, password });
    localStorage.setItem('@veritas:token', data.token);
    localStorage.setItem('@veritas:user',  JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem('@veritas:token');
    localStorage.removeItem('@veritas:user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
