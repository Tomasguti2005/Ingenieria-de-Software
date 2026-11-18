import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { obtenerPedidosAsignados } from '../services/pedidos.service';

export default function PedidosRetiradosScreen({ navigation }) {
  const { colors } = useTheme();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarPedidosRetirados = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const lista = await obtenerPedidosAsignados();
      setPedidos(lista.filter((p) => p.estado === 'RETIRADO' || p.estado === 'EN_CAMINO'));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los pedidos retirados.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarPedidosRetirados();
    }, [cargarPedidosRetirados])
  );

  const renderPedido = ({ item, index }) => {
    const enCamino = item.estado === 'EN_CAMINO';
    const pagoRegistrado = Boolean(item.urlComprobante);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: enCamino ? colors.accentStrong : colors.border,
            borderWidth: enCamino ? 1.5 : 1,
          },
        ]}
        onPress={() => navigation.navigate('DetalleEntrega', { pedido: item })}
        activeOpacity={0.82}
      >
        <View style={styles.cardHeader}>
          <View style={styles.paradaRow}>
            <Text style={[styles.parada, { color: colors.accentStrong }]}>
              Parada {index + 1}
            </Text>
            {enCamino && (
              <View style={[styles.activeTag, { backgroundColor: colors.accentStrong }]}>
                <Feather name="navigation" size={11} color="#FFFFFF" />
                <Text style={styles.activeTagText}>En camino</Text>
              </View>
            )}
          </View>

          {!enCamino && (
            <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.badgeText, { color: colors.textMuted }]}>
                Retirado
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.codigo, { color: colors.text }]}>{item.codigoSeguimiento}</Text>

        <Text style={[styles.label, { color: colors.textMuted }]}>Dirección de entrega</Text>
        <Text style={[styles.value, { color: colors.text }]}>{item.direccionDestino}</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Destinatario</Text>
            <Text style={[styles.value, { color: colors.text }]}>{item.destinatarioNombre}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Teléfono</Text>
            <Text style={[styles.value, { color: colors.text }]}>{item.destinatarioTelefono}</Text>
          </View>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.pagoStatus}>
            <Feather
              name={pagoRegistrado ? 'check-circle' : 'clock'}
              size={14}
              color={pagoRegistrado ? colors.successStrong : colors.textMuted}
            />
            <Text
              style={[
                styles.pagoStatusText,
                { color: pagoRegistrado ? colors.successStrong : colors.textMuted },
              ]}
            >
              {pagoRegistrado
                ? `Pago cargado (${item.metodoPagoCobrado})`
                : 'Comprobante pendiente'}
            </Text>
          </View>

          <View style={styles.manageAction}>
            <Text style={[styles.manageActionText, { color: colors.accentStrong }]}>
              Gestionar
            </Text>
            <Feather name="chevron-right" size={16} color={colors.accentStrong} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Pedidos en Reparto</Text>

      {cargando ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accentStrong} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.accentStrong }]}
            onPress={cargarPedidosRetirados}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : pedidos.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No tenés pedidos retirados pendientes de entrega.
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paradaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  parada: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activeTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  codigo: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    marginTop: 6,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  infoCol: {
    flex: 1,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pagoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pagoStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  manageAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  manageActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
