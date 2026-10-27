import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(null);
const TOKEN_KEY = 'auth_token_mobile';
const USER_KEY = 'auth_user_mobile';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarToken() {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);

        if (storedToken) {
          setToken(storedToken);
        }
        if (storedUser) {
          try {
            setUsuario(JSON.parse(storedUser));
          } catch {
            setUsuario(null);
          }
        }
      } catch (error) {
        console.error('Error al recuperar sesión persistida:', error);
      } finally {
        setCargando(false);
      }
    }
    cargarToken();
  }, []);

  const login = async (nuevoToken, datosUsuario) => {
    await SecureStore.setItemAsync(TOKEN_KEY, nuevoToken);
    if (datosUsuario) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(datosUsuario));
    }
    setToken(nuevoToken);
    setUsuario(datosUsuario);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUsuario(null);
  };

  const estaAutenticado = !!token;

  return (
    <AuthContext.Provider value={{ token, usuario, estaAutenticado, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
