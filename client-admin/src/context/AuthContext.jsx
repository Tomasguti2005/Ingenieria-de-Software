import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Limpieza defensiva de cualquier residuo previo en localStorage
  if (typeof window !== 'undefined' && localStorage.getItem('token')) {
    localStorage.removeItem('token');
  }

  const [token, setToken] = useState(() => sessionStorage.getItem('token'));
  const [usuario, setUsuario] = useState(() => {
    try {
      const raw = sessionStorage.getItem('usuario');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = (nuevoToken, datosUsuario) => {
    sessionStorage.setItem('token', nuevoToken);
    if (datosUsuario) {
      sessionStorage.setItem('usuario', JSON.stringify(datosUsuario));
    }
    setToken(nuevoToken);
    setUsuario(datosUsuario);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
  };

  const estaAutenticado = !!token;

  return (
    <AuthContext.Provider value={{ token, usuario, estaAutenticado, login, logout }}>
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
