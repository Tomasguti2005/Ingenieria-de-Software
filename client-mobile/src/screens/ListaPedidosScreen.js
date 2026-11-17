import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { obtenerPedidosAsignados } from '../services/pedidos.service';

const MENSAJE_RUTA_INICIADA =
  'No es posible modificar el estado de retiro: la ruta de reparto ya se encuentra iniciada';

export default function ListaPedidosScreen() {
  const { colors } = useTheme();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [estadoRuta, setEstadoRuta] = useState('ASIGNADO');

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const listaPedidos = await obtenerPedidosAsignados();
      setPedidos(listaPedidos.map((pedido) => ({
        ...pedido,
        estado: pedido.estado || 'ASIGNADO',
      })));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tus pedidos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const pedidosRetirados = pedidos.filter((pedido) => pedido.estado === 'RETIRADO').length;
  const rutaIniciada = estadoRuta === 'EN_CAMINO';

  const alternarRetiro = (pedidoId) => {
    const pedido = pedidos.find((item) => item.id === pedidoId);
    if (!pedido) {
      return;
    }

    if (rutaIniciada && pedido.estado === 'RETIRADO') {
      Alert.alert('Acción no permitida', MENSAJE_RUTA_INICIADA);
      return;
    }

    const seCompletaCarga =
      pedido.estado === 'ASIGNADO' &&
      pedidos.every((item) => item.id === pedidoId || item.estado === 'RETIRADO');

    setPedidos((actuales) =>
      actuales.map((item) => (
        item.id === pedidoId
          ? { ...item, estado: item.estado === 'RETIRADO' ? 'ASIGNADO' : 'RETIRADO' }
          : item
      ))
    );

    if (seCompletaCarga) {
      Alert.alert('Carga total completada con éxito');
    }
  };

  const reiniciarDemo = () => {
    setPedidos((actuales) => actuales.map((pedido) => ({ ...pedido, estado: 'ASIGNADO' })));
    setEstadoRuta('ASIGNADO');
  };

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

      <View style={styles.orderHeading}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              borderColor: item.estado === 'RETIRADO' ? colors.successStrong : colors.textMuted,
              backgroundColor: item.estado === 'RETIRADO' ? colors.successStrong : 'transparent',
            },
          ]}
          onPress={() => alternarRetiro(item.id)}
          accessibilityRole="checkbox"
          accessibilityLabel={`${item.codigoSeguimiento}, ${item.estado === 'RETIRADO' ? 'Retirado' : 'Asignado'}`}
          accessibilityState={{ checked: item.estado === 'RETIRADO' }}
        >
          {item.estado === 'RETIRADO' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <View style={styles.orderHeadingText}>
          <Text style={[styles.codigo, { color: colors.text }]}>{item.codigoSeguimiento}</Text>
          <Text style={[styles.orderStatus, { color: item.estado === 'RETIRADO' ? colors.successStrong : colors.textMuted }]}>
            {item.estado === 'RETIRADO' ? 'Retirado' : 'Asignado'}
          </Text>
        </View>
      </View>

      <Text style={[styles.label, { color: colors.textMuted }]}>Dirección de origen</Text>
      <Text style={[styles.value, { color: colors.text }]}>{item.direccionOrigen}</Text>
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
      <View style={[styles.demoNotice, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
        <Text style={[styles.demoNoticeText, { color: colors.text }]}>
          Modo demostración: los cambios de retiro son locales y no se guardan en la base de datos.
        </Text>
      </View>

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
        <>
          <View style={[styles.loadSummary, { borderColor: colors.border }]}>
            <Text style={[styles.summaryText, { color: colors.text }]}>
              {pedidosRetirados} de {pedidos.length} pedidos retirados
            </Text>
            <Text style={[styles.routeText, { color: colors.textMuted }]}>
              Estado de la ruta: {rutaIniciada ? 'En camino' : 'Asignado'}
            </Text>
            <View style={styles.demoActions}>
              {!rutaIniciada && (
                <TouchableOpacity
                  style={[styles.demoButton, { borderColor: colors.border }]}
                  onPress={() => setEstadoRuta('EN_CAMINO')}
                  accessibilityRole="button"
                  accessibilityLabel="Simular inicio del recorrido"
                >
                  <Text style={[styles.demoButtonText, { color: colors.text }]}>
                    Simular inicio del recorrido
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.resetButton}
                onPress={reiniciarDemo}
                accessibilityRole="button"
                accessibilityLabel="Reiniciar demostración"
              >
                <Text style={[styles.resetButtonText, { color: colors.accentStrong }]}>
                  Reiniciar demo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <FlatList
            data={pedidos}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderPedido}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
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
  demoNotice: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    padding: 10,
  },
  demoNoticeText: {
    fontSize: 12,
    lineHeight: 18,
  },
  loadSummary: {
    borderBottomWidth: 1,
    marginBottom: 12,
    paddingBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  routeText: {
    fontSize: 12,
    marginTop: 4,
  },
  demoActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  demoButton: {
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  demoButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resetButton: {
    padding: 7,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
  },
  orderHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    marginRight: 10,
    width: 24,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 19,
  },
  orderHeadingText: {
    flex: 1,
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
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
