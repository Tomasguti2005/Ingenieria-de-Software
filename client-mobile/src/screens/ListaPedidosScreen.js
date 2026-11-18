import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import {
  iniciarViaje,
  obtenerPedidosAsignados,
} from '../services/pedidos.service';

const MENSAJE_RUTA_INICIADA =
  'No es posible modificar el estado de retiro: la ruta de reparto ya se encuentra iniciada';
const MENSAJE_PEDIDO_RETIRADO = 'Un pedido retirado no puede desmarcarse.';

export default function ListaPedidosScreen({ navigation }) {
  const { colors } = useTheme();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [seleccionadosIds, setSeleccionadosIds] = useState([]);
  const [iniciandoViaje, setIniciandoViaje] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      cargarPedidos();
    }, [cargarPedidos])
  );

  const pedidosAsignados = pedidos.filter((pedido) => pedido.estado === 'ASIGNADO');

  const seccionesRutas = Object.values(pedidosAsignados.reduce((grupos, pedido) => {
    const clave = String(pedido.rutaId);
    if (!grupos[clave]) {
      grupos[clave] = {
        key: clave,
        rutaId: pedido.rutaId,
        title: pedido.rutaNombre,
        data: [],
      };
    }
    grupos[clave].data.push(pedido);
    return grupos;
  }, {}));

  const alternarSeleccion = (pedidoId) => {
    setSeleccionadosIds((prev) =>
      prev.includes(pedidoId)
        ? prev.filter((id) => id !== pedidoId)
        : [...prev, pedidoId]
    );
  };

  const confirmarInicioViaje = async () => {
    if (seleccionadosIds.length === 0) return;
    setIniciandoViaje(true);
    try {
      const listaActualizada = await iniciarViaje(seleccionadosIds);
      setPedidos(listaActualizada);
      setSeleccionadosIds([]);
      navigation.navigate('PedidosRetirados');
    } catch (err) {
      Alert.alert('No se pudo iniciar el viaje', err.message || 'Ocurrió un error al confirmar los retiros.');
    } finally {
      setIniciandoViaje(false);
    }
  };

  const handleEmpezarViaje = () => {
    if (seleccionadosIds.length === 0 || iniciandoViaje) return;
    Alert.alert(
      'Empezar viaje',
      `¿Confirmás que retiraste ${seleccionadosIds.length} pedido(s)? Una vez confirmados no podrán desmarcarse.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: confirmarInicioViaje },
      ]
    );
  };

  const renderEncabezadoRuta = ({ section }) => {
    const rutaIniciada = section.data.some((pedido) => pedido.estado === 'EN_CAMINO');
    const retirados = section.data.filter(
      (pedido) => pedido.estado === 'RETIRADO' || pedido.estado === 'EN_CAMINO'
    ).length;

    return (
      <View style={[styles.loadSummary, { borderColor: colors.border }]}>
        <Text style={[styles.routeTitle, { color: colors.text }]}>{section.title}</Text>
        <Text style={[styles.summaryText, { color: colors.text }]}>
          {retirados} de {section.data.length} pedidos retirados
        </Text>
        <Text style={[styles.routeText, { color: colors.textMuted }]}>
          Estado de la ruta: {rutaIniciada ? 'En camino' : 'Asignado'}
        </Text>
      </View>
    );
  };

  const renderPedido = ({ item, index }) => {
    const pedidoRetirado = item.estado === 'RETIRADO' || item.estado === 'EN_CAMINO';
    const seleccionadoLocal = seleccionadosIds.includes(item.id);
    const marcado = pedidoRetirado || seleccionadoLocal;
    const rutaIniciada = pedidos.some(
      (pedido) => pedido.rutaId === item.rutaId && pedido.estado === 'EN_CAMINO'
    );
    const bloqueado = pedidoRetirado;
    const estadoLabel = item.estado === 'EN_CAMINO'
      ? 'En camino'
      : item.estado === 'RETIRADO' ? 'Retirado' : 'Asignado';

    return (
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
                borderColor: marcado ? colors.successStrong : colors.textMuted,
                backgroundColor: marcado ? colors.successStrong : 'transparent',
              },
            ]}
            onPress={() => {
              if (bloqueado) {
                Alert.alert(
                  'Acción no permitida',
                  rutaIniciada ? MENSAJE_RUTA_INICIADA : MENSAJE_PEDIDO_RETIRADO
                );
                return;
              }
              alternarSeleccion(item.id);
            }}
            disabled={iniciandoViaje}
            accessibilityRole="checkbox"
            accessibilityLabel={`${item.codigoSeguimiento}, ${estadoLabel}`}
            accessibilityState={{
              checked: marcado,
              disabled: iniciandoViaje,
            }}
          >
            {marcado && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <View style={styles.orderHeadingText}>
            <Text style={[styles.codigo, { color: colors.text }]}>{item.codigoSeguimiento}</Text>
            <Text style={[styles.orderStatus, { color: pedidoRetirado ? colors.successStrong : colors.textMuted }]}>
              {estadoLabel}
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
  };

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
            Aún no se te asignaron pedidos para la jornada actual.
          </Text>
        </View>
      ) : pedidosAsignados.length === 0 ? (
        <View style={styles.stateContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Todos los pedidos del día ya fueron retirados.
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.accentStrong }]}
            onPress={() => navigation.navigate('PedidosRetirados')}
            activeOpacity={0.8}
          >
            <Text style={[styles.retryText, { color: '#FFFFFF' }]}>
              Ver pedidos retirados
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={seccionesRutas}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPedido}
          renderSectionHeader={renderEncabezadoRuta}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      {seleccionadosIds.length > 0 && (
        <TouchableOpacity
          style={[styles.fabEmpezarViaje, { backgroundColor: colors.accentStrong }]}
          onPress={handleEmpezarViaje}
          disabled={iniciandoViaje}
          activeOpacity={0.85}
        >
          {iniciandoViaje ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.fabEmpezarViajeText}>Empezar viaje →</Text>
          )}
        </TouchableOpacity>
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
  loadSummary: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    marginBottom: 12,
    paddingBottom: 10,
  },
  routeTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  routeText: {
    fontSize: 12,
    marginTop: 4,
  },
  fabEmpezarViaje: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabEmpezarViajeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
