// ListaPedidosScreen.js — Pedidos asignados del día ordenados para la ruta.
// Endpoint: GET /api/mobile/pedidos
// Transiciones: ASIGNADO -> RETIRADO -> EN_CAMINO

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ListaPedidosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pedidos del Día</Text>
      {/* TODO: Implementar listado en Fase 2 (paso 5) */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});


