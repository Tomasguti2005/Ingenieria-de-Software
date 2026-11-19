// SeguimientoPedidoScreen.js — Pantalla de seguimiento para el Cliente Final.
// Regla: La interfaz debe ser simple y acotada y no permitir ningún tipo de interacción.
//
// Criterios de Aceptación:
// Escenario 1: El cliente final hace clic en el enlace recibido y abre la página en su navegador/app.
//   El sistema valida el código del pedido y muestra de forma clara su estado actual (ej: "En camino"),
//   lista de productos e información básica del transportista.
// Escenario 2: El cliente ingresa a un enlace roto, expirado o que no corresponde a ningún pedido activo.
//   El sistema muestra una pantalla limpia con el mensaje de error:
//   "El enlace de seguimiento no es válido o el pedido ya no se encuentra disponible".

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { obtenerSeguimientoPedido } from '../services/pedidos.service';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SeguimientoPedidoScreen({ route }) {
  const { colors } = useTheme();

  // El código puede venir por parámetro de ruta (ej: deep linking o navegación)
  // Por defecto, si no se envió, usamos 'PED-MOB-001' para facilitar la prueba
  const codigo = route?.params?.codigo || 'PED-MOB-001';

  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorMensaje, setErrorMensaje] = useState(null);

  useEffect(() => {
    let montado = true;

    async function cargarSeguimiento() {
      setCargando(true);
      setErrorMensaje(null);
      try {
        const datos = await obtenerSeguimientoPedido(codigo);
        if (montado) {
          setPedido(datos);
        }
      } catch (err) {
        if (montado) {
          // ESCENARIO 2: Mensaje exacto requerido
          setErrorMensaje(
            err.message ||
              'El enlace de seguimiento no es válido'
          );
        }
      } finally {
        if (montado) {
          setCargando(false);
        }
      }
    }

    cargarSeguimiento();

    return () => {
      montado = false;
    };
  }, [codigo]);

  // Formato y estilos del badge según el estado
  function obtenerEstiloEstado(estado) {
    const est = String(estado || '').toUpperCase();
    switch (est) {
      case 'EN_CAMINO':
      case 'EN CAMINO':
        return {
          texto: 'En camino',
          bg: colors.badges?.asignadoBg || 'rgba(31, 111, 235, 0.2)',
          color: colors.badges?.asignadoText || '#58a6ff',
          border: colors.badges?.asignadoBorder || 'rgba(56, 139, 253, 0.4)',
          icono: 'truck',
        };
      case 'RETIRADO':
        return {
          texto: 'Retirado por transportista',
          bg: colors.badges?.retiradoBg || 'rgba(210, 153, 34, 0.18)',
          color: colors.badges?.retiradoText || '#e3b341',
          border: colors.badges?.retiradoBorder || 'rgba(210, 153, 34, 0.35)',
          icono: 'package',
        };
      case 'ENTREGADO':
        return {
          texto: 'Entregado',
          bg: colors.badges?.entregadoBg || 'rgba(35, 134, 54, 0.2)',
          color: colors.badges?.entregadoText || '#3fb950',
          border: colors.badges?.entregadoBorder || 'rgba(46, 160, 67, 0.4)',
          icono: 'check-circle',
        };
      case 'ASIGNADO':
        return {
          texto: 'Asignado a ruta',
          bg: colors.badges?.asignadoBg || 'rgba(31, 111, 235, 0.2)',
          color: colors.badges?.asignadoText || '#58a6ff',
          border: colors.badges?.asignadoBorder || 'rgba(56, 139, 253, 0.4)',
          icono: 'clock',
        };
      default:
        return {
          texto: estado || 'Registrado',
          bg: colors.surface,
          color: colors.text,
          border: colors.border,
          icono: 'info',
        };
    }
  }

  // ── ESTADO: CARGANDO ──
  if (cargando) {
    return (
      <SafeAreaView style={[styles.contenedor, { backgroundColor: colors.bg }]}>
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.textoCargando, { color: colors.textMuted }]}>
            Verificando estado del pedido...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── ESCENARIO 2: ENLACE ROTO, EXPIRADO O NO DISPONIBLE ──
  if (errorMensaje || !pedido) {
    return (
      <SafeAreaView style={[styles.contenedor, { backgroundColor: colors.bg }]}>
        <View style={styles.centrado}>
          <View style={[styles.iconoErrorWrap, { backgroundColor: colors.dangerSoft }]}>
            <Feather name="alert-circle" size={40} color={colors.danger} />
          </View>
          <Text style={[styles.tituloError, { color: colors.text }]}>
            Enlace no disponible
          </Text>
          <Text style={[styles.mensajeError, { color: colors.textMuted }]}>
            {errorMensaje ||
              'El enlace de seguimiento no es válido'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── ESCENARIO 1: PEDIDO VÁLIDO (SOLO LECTURA — SIN INTERACCIÓN) ──
  const estadoVisual = obtenerEstiloEstado(pedido.estado);
  const transportista = pedido.transportista || {};

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera Informativa */}
        <View style={styles.header}>
          <Text style={[styles.subtituloHeader, { color: colors.accent }]}>
            Repartos Ya • Seguimiento
          </Text>
          <Text style={[styles.codigoTitulo, { color: colors.text }]}>
            {pedido.codigoSeguimiento}
          </Text>
        </View>

        {/* 1. Estado Actual Destacado */}
        <View
          style={[
            styles.tarjetaEstado,
            {
              backgroundColor: estadoVisual.bg,
              borderColor: estadoVisual.border,
            },
          ]}
        >
          <Feather name={estadoVisual.icono} size={24} color={estadoVisual.color} />
          <View style={styles.estadoInfo}>
            <Text style={[styles.estadoEtiqueta, { color: colors.textMuted }]}>
              Estado actual del pedido
            </Text>
            <Text style={[styles.estadoTexto, { color: estadoVisual.color }]}>
              {estadoVisual.texto}
            </Text>
          </View>
        </View>

        {/* 2. Lista de Productos */}
        <View style={[styles.tarjeta, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.tarjetaHeader}>
            <Feather name="box" size={18} color={colors.accent} />
            <Text style={[styles.tarjetaTitulo, { color: colors.text }]}>
              Productos del paquete
            </Text>
          </View>
          <Text style={[styles.productosTexto, { color: colors.text }]}>
            {pedido.descripcionProductos || 'Detalle no especificado.'}
          </Text>
          {pedido.destinatarioNombre ? (
            <View style={styles.destinatarioFila}>
              <Text style={[styles.labelSutil, { color: colors.textSubtle }]}>Destinatario:</Text>
              <Text style={[styles.valorDestinatario, { color: colors.text }]}>
                {pedido.destinatarioNombre}
              </Text>
            </View>
          ) : null}
          {pedido.direccionDestino ? (
            <View style={styles.destinatarioFila}>
              <Text style={[styles.labelSutil, { color: colors.textSubtle }]}>Entrega en:</Text>
              <Text style={[styles.valorDestinatario, { color: colors.text }]}>
                {pedido.direccionDestino}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 3. Información Básica del Transportista */}
        <View style={[styles.tarjeta, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.tarjetaHeader}>
            <Ionicons name="person-circle-outline" size={20} color={colors.accent} />
            <Text style={[styles.tarjetaTitulo, { color: colors.text }]}>
              Transportista asignado
            </Text>
          </View>

          {transportista.nombre ? (
            <View style={styles.transportistaDetalle}>
              <View style={styles.datoFila}>
                <Feather name="user" size={15} color={colors.textMuted} />
                <Text style={[styles.datoTexto, { color: colors.text }]}>
                  {transportista.nombre} {transportista.apellido || ''}
                </Text>
              </View>

              {transportista.telefono ? (
                <View style={styles.datoFila}>
                  <Feather name="phone" size={15} color={colors.textMuted} />
                  <Text style={[styles.datoTexto, { color: colors.text }]}>
                    {transportista.telefono}
                  </Text>
                </View>
              ) : null}

              {transportista.vehiculo ? (
                <View style={styles.datoFila}>
                  <MaterialIcons name="directions-car" size={16} color={colors.textMuted} />
                  <Text style={[styles.datoTexto, { color: colors.text }]}>
                    {transportista.vehiculo}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={[styles.textoVacio, { color: colors.textMuted }]}>
              El pedido aún no tiene un transportista asignado.
            </Text>
          )}

          <Text style={[styles.leyendaInformativa, { color: colors.textSubtle }]}>
            Información de contacto y reconocimiento para el momento de la entrega.
          </Text>
        </View>

        {/* Nota de pie: Solo lectura sin interacción */}
        <Text style={[styles.footerNota, { color: colors.textSubtle }]}>
          Esta pantalla es solo informativa y se actualiza automáticamente.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  textoCargando: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  iconoErrorWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  tituloError: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  mensajeError: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  header: {
    marginBottom: 4,
  },
  subtituloHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  codigoTitulo: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tarjetaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  estadoInfo: {
    flex: 1,
  },
  estadoEtiqueta: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  estadoTexto: {
    fontSize: 17,
    fontWeight: '700',
  },
  tarjeta: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  tarjetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tarjetaTitulo: {
    fontSize: 15,
    fontWeight: '700',
  },
  productosTexto: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 12,
  },
  destinatarioFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  labelSutil: {
    fontSize: 12,
  },
  valorDestinatario: {
    fontSize: 12,
    fontWeight: '600',
  },
  transportistaDetalle: {
    gap: 8,
    marginBottom: 12,
  },
  datoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  datoTexto: {
    fontSize: 14,
    fontWeight: '500',
  },
  textoVacio: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  leyendaInformativa: {
    fontSize: 11.5,
    lineHeight: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
  },
  footerNota: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 8,
  },
});

