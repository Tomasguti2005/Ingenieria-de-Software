// ThemeContext.js — Gestión de tema visual (Dark por defecto / Light opcional) para mobile.
// Persiste en SecureStore de Expo si está disponible.

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'theme_preference_mobile';

// Paletas de colores
export const THEMES = {
  dark: {
    bg: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    borderStrong: '#64748b',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    inputBg: '#0f172a',
    accent: '#3b82f6',
    headerBg: '#1e293b',
    headerText: '#f8fafc',
    switchTrack: 'rgba(22, 27, 34, 0.7)',
    switchBorder: 'rgba(255, 255, 255, 0.2)',
    switchThumb: '#21262d',
  },
  light: {
    bg: '#f1f5f9',
    surface: '#ffffff',
    border: '#94a3b8',
    borderStrong: '#64748b',
    text: '#0f172a',
    textMuted: '#475569',
    inputBg: '#ffffff',
    accent: '#2563eb',
    headerBg: '#ffffff',
    headerText: '#0f172a',
    switchTrack: '#e2e8f0',
    switchBorder: '#64748b',
    switchThumb: '#ffffff',
  },
};

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState('dark');

  useEffect(() => {
    async function cargarPreferencia() {
      try {
        const guardado = await SecureStore.getItemAsync(STORAGE_KEY);
        if (guardado === 'light' || guardado === 'dark') {
          setTema(guardado);
        }
      } catch {
        // En entorno sin SecureStore fallback a 'dark'
      }
    }
    cargarPreferencia();
  }, []);

  const toggleTema = async () => {
    const nuevoTema = tema === 'dark' ? 'light' : 'dark';
    setTema(nuevoTema);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, nuevoTema);
    } catch {
      // Ignorar fallo de persistencia
    }
  };

  const colors = THEMES[tema];
  const esOscuro = tema === 'dark';

  return (
    <ThemeContext.Provider value={{ tema, toggleTema, colors, esOscuro }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
}
