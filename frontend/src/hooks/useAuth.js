import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifica sessão salva ao abrir o app
  useEffect(() => {
    (async () => {
      try {
        const [token, stored] = await AsyncStorage.multiGet([
          '@veritas:token',
          '@veritas:user',
        ]);
        if (token[1] && stored[1]) {
          setUser(JSON.parse(stored[1]));
        }
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, []);

  async function login(email, password) {
    const { data } = await authAPI.login({ email, password });
    await AsyncStorage.multiSet([
      ['@veritas:token', data.token],
      ['@veritas:user',  JSON.stringify(data.user)],
    ]);
    setUser(data.user);
    return data;
  }

  async function register(name, email, password) {
    const { data } = await authAPI.register({ name, email, password });
    await AsyncStorage.multiSet([
      ['@veritas:token', data.token],
      ['@veritas:user',  JSON.stringify(data.user)],
    ]);
    setUser(data.user);
    return data;
  }

  async function logout() {
    await AsyncStorage.multiRemove(['@veritas:token', '@veritas:user']);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
