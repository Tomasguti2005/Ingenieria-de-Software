// ThemeToggle.js — Switch animado nativo para client-mobile con iconos de Sol y Luna.

import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ style }) {
  const { tema, toggleTema, colors, esOscuro } = useTheme();

  // Animación del thumb: 0 para light (izquierda), 1 para dark (derecha)
  const animValue = useRef(new Animated.Value(esOscuro ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: esOscuro ? 1 : 0,
      damping: 18,
      stiffness: 160,
      useNativeDriver: true,
    }).start();
  }, [esOscuro]);

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 28],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleTema}
      style={[
        styles.track,
        {
          backgroundColor: colors.switchTrack,
          borderColor: colors.switchBorder,
        },
        style,
      ]}
      accessibilityRole="switch"
      accessibilityLabel={`Modo actual: ${esOscuro ? 'oscuro' : 'claro'}. Presioná para cambiar.`}
    >
      {/* Icono Sol (Izquierda) */}
      <View style={styles.iconContainer}>
        <Feather
          name="sun"
          size={12}
          color={!esOscuro ? '#b45309' : '#64748b'}
          style={{ opacity: !esOscuro ? 1 : 0.4 }}
        />
      </View>

      {/* Icono Luna (Derecha) */}
      <View style={styles.iconContainer}>
        <Feather
          name="moon"
          size={12}
          color={esOscuro ? '#58a6ff' : '#64748b'}
          style={{ opacity: esOscuro ? 1 : 0.4 }}
        />
      </View>

      {/* Perilla animada */}
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: colors.switchThumb,
            borderColor: colors.switchBorder,
            transform: [{ translateX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 56,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    position: 'relative',
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  thumb: {
    position: 'absolute',
    top: 3,
    left: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
});
