// DetalleEntregaScreen.js — Cierre de entrega con comprobante y método de pago.
// Transición: EN_CAMINO -> ENTREGADO (requiere metodoPagoCobrado + urlComprobante)
// Transición: EN_CAMINO -> FALLIDO (requiere motivoFallo)
// Captura foto con expo-image-picker y envía multipart/form-data

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function DetalleEntregaScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Detalle de Entrega</Text>
      {/* TODO: Implementar en Fase 2 (paso 6) */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});
