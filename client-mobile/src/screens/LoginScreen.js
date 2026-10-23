// LoginScreen.js — Pantalla de login de transportistas.
// Endpoint: POST /api/auth/mobile/login
// Rol permitido: REPARTIDOR (estado ACTIVO)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Repartos Ya - Repartidores</Text>
      {/* TODO: Implementar formulario de login en Fase 1 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
