import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { obtenerPedidosAsignados } from '../services/pedidos.service';

export default function ListaPedidosScreen() {
  const { colors } = useTheme();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const listaPedidos = await obtenerPedidosAsignados();
      setPedidos(listaPedidos);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tus pedidos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const renderPedido = ({ item, index }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.parada, { color: colors.accentStrong }]}>
          Parada {index + 1}
        </Text>
        {index === 0 && (
          <View style={[styles.nextBadge, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.nextBadgeText, { color: colors.accentStrong }]}>
              Próxima parada
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.codigo, { color: colors.text }]}>{item.codigoSeguimiento}</Text>

      <Text style={[styles.label, { color: colors.textMuted }]}>Dirección de entrega</Text>
      <Text style={[styles.value, { color: colors.text }]}>{item.direccionDestino}</Text>

      <View style={styles.detailsRow}>
        <View style={styles.detail}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Receptor</Text>
          <Text style={[styles.value, { color: colors.text }]}>{item.destinatarioNombre}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Teléfono</Text>
          <Text style={[styles.value, { color: colors.text }]}>{item.destinatarioTelefono}</Text>
        </View>
      </View>

      <Text style={[styles.label, { color: colors.textMuted }]}>Contenido</Text>
      <Text style={[styles.value, { color: colors.text }]}>{item.descripcionProductos}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Pedidos del Día</Text>

      {cargando ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.accentStrong} />
          <Text style={[styles.stateText, { color: colors.textMuted }]}>Cargando pedidos...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.accent }]}
            onPress={cargarPedidos}
            activeOpacity={0.8}
          >
            <Text style={[styles.retryText, { color: colors.textOnAccent }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : pedidos.length === 0 ? (
        <View style={styles.stateContainer}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No posees pedidos asignados para la jornada actual
          </Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPedido}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  parada: {
    fontSize: 13,
    fontWeight: '700',
  },
  nextBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  nextBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  codigo: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detail: {
    flex: 1,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 14,
  },
  stateText: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
