// ThemeContext.js — Gestión de tema visual (Dark por defecto / Light opcional) para mobile.
// Persiste en SecureStore de Expo si está disponible.
// Alineado con el sistema de tokens centralizado de Web (theme.css) y WCAG AA.

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'theme_preference_mobile';

// Paletas de colores sincronizadas exactamente con theme.css
export const THEMES = {
  dark: {
    // Superficies
    bg: '#090d16',
    surface: '#161b22',
    card: '#161b22',
    inputBg: '#0d1117',
    disabledBg: '#21262d',
    headerBg: '#161b22',
    headerText: '#f0f6fc',

    // Bordes
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',
    borderDivider: 'rgba(255, 255, 255, 0.07)',

    // Textos
    text: '#f0f6fc',
    textMuted: '#8b949e',
    textSubtle: '#6e7681',
    textDisabled: '#484f58',
    textOnAccent: '#ffffff',

    // Acentos y Acciones
    accent: '#1f6feb',
    accentStrong: '#388bfd',
    accentSoft: 'rgba(56, 139, 253, 0.15)',
    success: '#238636',
    successStrong: '#2ea043',
    danger: '#da3633',
    dangerSoft: 'rgba(248, 81, 73, 0.15)',

    // Switch de tema
    switchTrack: 'rgba(22, 27, 34, 0.7)',
    switchBorder: 'rgba(255, 255, 255, 0.2)',
    switchThumb: '#21262d',

    // Badges de Estado (Fondos sólidos / semitransparentes en dark con bordes)
    badges: {
      activoBg: 'rgba(35, 134, 54, 0.2)',
      activoText: '#3fb950',
      activoBorder: 'rgba(46, 160, 67, 0.4)',

      inactivoBg: 'rgba(218, 54, 51, 0.2)',
      inactivoText: '#f85149',
      inactivoBorder: 'rgba(248, 81, 73, 0.4)',

      asignadoBg: 'rgba(31, 111, 235, 0.2)',
      asignadoText: '#58a6ff',
      asignadoBorder: 'rgba(56, 139, 253, 0.4)',

      retiradoBg: 'rgba(210, 153, 34, 0.18)',
      retiradoText: '#e3b341',
      retiradoBorder: 'rgba(210, 153, 34, 0.35)',

      entregadoBg: 'rgba(35, 134, 54, 0.2)',
      entregadoText: '#3fb950',
      entregadoBorder: 'rgba(46, 160, 67, 0.4)',

      canceladoBg: 'rgba(218, 54, 51, 0.2)',
      canceladoText: '#f85149',
      canceladoBorder: 'rgba(248, 81, 73, 0.4)',
    },
  },
  light: {
    // Superficies
    bg: '#EEF2F7',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    inputBg: '#FFFFFF',
    disabledBg: '#F1F5F9',
    headerBg: '#FFFFFF',
    headerText: '#0F172A',

    // Bordes
    border: '#D5DCE6',
    borderStrong: '#7B8BA1',
    borderDivider: '#E3E8EF',

    // Textos
    text: '#0F172A',
    textMuted: '#475569',
    textSubtle: '#64748B',
    textDisabled: '#94A3B8',
    textOnAccent: '#FFFFFF',

    // Acentos y Acciones
    accent: '#2563EB',
    accentStrong: '#1D4ED8',
    accentSoft: '#DBEAFE',
    success: '#15803D',
    successStrong: '#166534',
    danger: '#DC2626',
    dangerSoft: '#FEE2E2',

    // Switch de tema
    switchTrack: '#e2e8f0',
    switchBorder: '#64748b',
    switchThumb: '#ffffff',

    // Badges de Estado (Colores sólidos de alta legibilidad WCAG AA)
    badges: {
      activoBg: '#BBF7D0',
      activoText: '#14532D',
      activoBorder: '#4ADE80',

      inactivoBg: '#FECACA',
      inactivoText: '#7F1D1D',
      inactivoBorder: '#F87171',

      asignadoBg: '#BFDBFE',
      asignadoText: '#1E3A8A',
      asignadoBorder: '#60A5FA',

      retiradoBg: '#FDE68A',
      retiradoText: '#78350F',
      retiradoBorder: '#F59E0B',

      entregadoBg: '#BBF7D0',
      entregadoText: '#14532D',
      entregadoBorder: '#4ADE80',

      canceladoBg: '#FECACA',
      canceladoText: '#7F1D1D',
      canceladoBorder: '#F87171',
    },
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
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
}
