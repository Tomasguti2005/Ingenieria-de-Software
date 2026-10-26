// ListaPedidosScreen.js — Pedidos asignados del día ordenados para la ruta.
// Endpoint: GET /api/mobile/pedidos
// Transiciones: ASIGNADO -> RETIRADO -> EN_CAMINO

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ListaPedidosScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Pedidos del Día</Text>
      {/* TODO: Implementar listado en Fase 2 (paso 5) */}
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


