// ThemeContext.jsx — Gestión de tema visual (Dark por defecto / Light opcional).
// Persiste en localStorage si el usuario lo conmuta explícitamente.

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Modo inicial: 'dark' por defecto salvo que el usuario haya guardado 'light'
  const [tema, setTema] = useState(() => {
    try {
      const guardado = localStorage.getItem('theme_preference');
      return guardado === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('theme_preference', tema);
    } catch {
      // localStorage no disponible
    }

    if (tema === 'light') {
      document.documentElement.classList.add('theme-light');
      document.body.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
      document.body.classList.remove('theme-light');
    }
  }, [tema]);

  function toggleTema() {
    setTema((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  return (
    <ThemeContext.Provider value={{ tema, toggleTema, esOscuro: tema === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
}
