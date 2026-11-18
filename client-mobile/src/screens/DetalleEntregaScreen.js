import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import {
  cargarPagoPedido,
  confirmarEntregaPedido,
  reportarPedidoFallido,
} from '../services/pedidos.service';

const METODOS_PAGO = [
  { key: 'EFECTIVO', label: 'Efectivo', icon: 'dollar-sign' },
  { key: 'TRANSFERENCIA', label: 'Transferencia', icon: 'credit-card' },
  { key: 'OTRO', label: 'Otro', icon: 'more-horizontal' },
];

export default function DetalleEntregaScreen({ route, navigation }) {
  const { colors } = useTheme();
  const pedidoInicial = route?.params?.pedido || {};

  const [pedido, setPedido] = useState(pedidoInicial);
  const [metodoPago, setMetodoPago] = useState(
    pedidoInicial.metodoPagoCobrado || 'EFECTIVO'
  );
  const [monto, setMonto] = useState(
    pedidoInicial.montoCobrado !== null && pedidoInicial.montoCobrado !== undefined
      ? String(pedidoInicial.montoCobrado)
      : ''
  );
  const [imagenComprobante, setImagenComprobante] = useState(null);
  const [guardandoPago, setGuardandoPago] = useState(false);
  const [finalizandoEntrega, setFinalizandoEntrega] = useState(false);

  // Modal de entrega fallida
  const [modalFalloVisible, setModalFalloVisible] = useState(false);
  const [motivoFallo, setMotivoFallo] = useState('');
  const [guardandoFallo, setGuardandoFallo] = useState(false);

  const pagoCargado = Boolean(pedido.urlComprobante);
  const enCamino = pedido.estado === 'EN_CAMINO';

  const seleccionarImagen = async (usarCamara) => {
    try {
      const permiso = usarCamara
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          'Permiso requerido',
          usarCamara
            ? 'Necesitamos acceso a la cámara para fotografiar el comprobante.'
            : 'Necesitamos acceso a tu galería para adjuntar el comprobante.'
        );
        return;
      }

      const resultado = usarCamara
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.4,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.4,
            base64: true,
          });

      if (!resultado.canceled && resultado.assets && resultado.assets.length > 0) {
        const asset = resultado.assets[0];
        const mimeType = asset.mimeType || 'image/jpeg';
        setImagenComprobante({
          uri: asset.uri,
          dataUrl: asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri,
          fileName: asset.fileName || `comprobante-${pedido.id}.jpg`,
          mimeType,
        });
      }
    } catch (err) {
      Alert.alert('Error al adjuntar imagen', err.message || 'Intentalo de nuevo.');
    }
  };

  const handleGuardarPago = async () => {
    if (!imagenComprobante && !pedido.urlComprobante) {
      Alert.alert('Comprobante faltante', 'Adjuntá una foto del comprobante de pago.');
      return;
    }

    const montoLimpio = monto.trim().replace(',', '.');
    if (montoLimpio === '' || Number.isNaN(Number(montoLimpio)) || Number(montoLimpio) < 0) {
      Alert.alert('Monto inválido', 'Ingresá un monto cobrado válido (mayor o igual a 0).');
      return;
    }

    setGuardandoPago(true);
    try {
      const actualizado = await cargarPagoPedido(pedido.id, {
        uri: imagenComprobante?.dataUrl || imagenComprobante?.uri || pedido.urlComprobante,
        fileName: imagenComprobante?.fileName,
        metodoPagoCobrado: metodoPago,
        montoCobrado: Number(montoLimpio),
      });
      setPedido((prev) => ({
        ...prev,
        ...actualizado,
        urlComprobante: actualizado?.urlComprobante || prev.urlComprobante || imagenComprobante?.uri,
        metodoPagoCobrado: metodoPago,
        montoCobrado: Number(montoLimpio),
      }));
      Alert.alert('Pago registrado', 'El comprobante de pago se guardó correctamente.');
    } catch (err) {
      Alert.alert('No se pudo cargar el pago', err.message);
    } finally {
      setGuardandoPago(false);
    }
  };

  const handleFinalizarEntrega = async () => {
    if (!pagoCargado) {
      Alert.alert(
        'Falta registrar el pago',
        'Primero debés guardar el comprobante y el monto de pago antes de finalizar la entrega.'
      );
      return;
    }

    setFinalizandoEntrega(true);
    try {
      await confirmarEntregaPedido(pedido.id);
      Alert.alert(
        '¡Entrega completada!',
        'El pedido fue marcado como entregado y el siguiente pedido pasó a "En camino".',
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('No se pudo finalizar la entrega', err.message);
    } finally {
      setFinalizandoEntrega(false);
    }
  };

  const handleConfirmarFallo = async () => {
    if (!motivoFallo.trim()) {
      Alert.alert('Motivo obligatorio', 'Ingresá el motivo por el cual no se pudo entregar el pedido.');
      return;
    }

    setGuardandoFallo(true);
    try {
      await reportarPedidoFallido(pedido.id, motivoFallo.trim());
      setModalFalloVisible(false);
      Alert.alert(
        'Entrega marcada como fallida',
        'Se registró el motivo del fallo y el siguiente pedido de la ruta pasó a "En camino".',
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('No se pudo reportar el fallo', err.message);
    } finally {
      setGuardandoFallo(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Tarjeta 1: Resumen del Pedido */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.codigo, { color: colors.text }]}>
            {pedido.codigoSeguimiento}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: enCamino ? colors.accentStrong : colors.accentSoft,
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: enCamino ? '#FFFFFF' : colors.accentStrong },
              ]}
            >
              {enCamino ? 'En camino' : 'Retirado'}
            </Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Dirección de entrega</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>{pedido.direccionDestino}</Text>
        </View>

        <View style={styles.rowGrid}>
          <View style={styles.col}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Destinatario</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>{pedido.destinatarioNombre}</Text>
          </View>
          <View style={styles.col}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Teléfono</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>{pedido.destinatarioTelefono}</Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Contenido</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>{pedido.descripcionProductos}</Text>
        </View>

        {Boolean(pedido.notas) && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Notas</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>{pedido.notas}</Text>
          </View>
        )}
      </View>

      {/* Tarjeta 2: Cargar Comprobante de Pago */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Feather name="file-text" size={17} color={colors.accentStrong} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Comprobante de Pago
          </Text>
          {pagoCargado && (
            <View style={[styles.paidBadge, { backgroundColor: colors.accentSoft }]}>
              <Feather name="check" size={12} color={colors.successStrong} />
              <Text style={[styles.paidBadgeText, { color: colors.successStrong }]}>
                Registrado
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Método de pago</Text>
        <View style={styles.methodRow}>
          {METODOS_PAGO.map((m) => {
            const activo = metodoPago === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.methodChip,
                  {
                    borderColor: activo ? colors.accentStrong : colors.border,
                    backgroundColor: activo ? colors.accentSoft : 'transparent',
                  },
                ]}
                onPress={() => setMetodoPago(m.key)}
                activeOpacity={0.8}
              >
                <Feather
                  name={m.icon}
                  size={13}
                  color={activo ? colors.accentStrong : colors.textMuted}
                />
                <Text
                  style={[
                    styles.methodChipText,
                    { color: activo ? colors.accentStrong : colors.text },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Monto cobrado ($)</Text>
        <TextInput
          style={[
            styles.textInput,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.bg,
            },
          ]}
          value={monto}
          onChangeText={setMonto}
          placeholder="Ej: 4500"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
        />

        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
          Foto del comprobante
        </Text>
        <View style={styles.photoActionsRow}>
          <TouchableOpacity
            style={[styles.photoBtn, { borderColor: colors.border, backgroundColor: colors.bg }]}
            onPress={() => seleccionarImagen(true)}
            activeOpacity={0.8}
          >
            <Feather name="camera" size={16} color={colors.accentStrong} />
            <Text style={[styles.photoBtnText, { color: colors.text }]}>Tomar foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.photoBtn, { borderColor: colors.border, backgroundColor: colors.bg }]}
            onPress={() => seleccionarImagen(false)}
            activeOpacity={0.8}
          >
            <Feather name="image" size={16} color={colors.accentStrong} />
            <Text style={[styles.photoBtnText, { color: colors.text }]}>Galería</Text>
          </TouchableOpacity>
        </View>

        {imagenComprobante?.uri && (
          <View style={styles.previewBox}>
            <Image source={{ uri: imagenComprobante.uri }} style={styles.previewImage} />
          </View>
        )}

        <TouchableOpacity
          style={[styles.savePagoBtn, { backgroundColor: colors.accentStrong }]}
          onPress={handleGuardarPago}
          disabled={guardandoPago}
          activeOpacity={0.85}
        >
          {guardandoPago ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="upload-cloud" size={16} color="#FFFFFF" />
              <Text style={styles.savePagoBtnText}>
                {pagoCargado ? 'Actualizar comprobante' : 'Guardar comprobante'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Tarjeta 3: Acciones de Cierre de Entrega */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
          Resolución de la Entrega
        </Text>

        <TouchableOpacity
          style={[
            styles.finishBtn,
            {
              backgroundColor: pagoCargado ? colors.successStrong : colors.border,
              opacity: finalizandoEntrega ? 0.7 : 1,
            },
          ]}
          onPress={handleFinalizarEntrega}
          disabled={finalizandoEntrega}
          activeOpacity={0.85}
        >
          {finalizandoEntrega ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="check-circle" size={17} color="#FFFFFF" />
              <Text style={styles.finishBtnText}>Finalizar entrega</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.failBtn, { borderColor: colors.danger }]}
          onPress={() => setModalFalloVisible(true)}
          activeOpacity={0.8}
        >
          <Feather name="alert-triangle" size={16} color={colors.danger} />
          <Text style={[styles.failBtnText, { color: colors.danger }]}>
            Marcar entrega como fallida
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal Desplegable: Reportar Entrega Fallida */}
      <Modal
        transparent
        animationType="fade"
        visible={modalFalloVisible}
        onRequestClose={() => setModalFalloVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalFalloVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Reportar Entrega Fallida
                  </Text>
                  <TouchableOpacity onPress={() => setModalFalloVisible(false)}>
                    <Feather name="x" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                  Indicá el motivo por el cual no se pudo concretar la entrega del pedido{' '}
                  <Text style={{ fontWeight: '700', color: colors.text }}>
                    {pedido.codigoSeguimiento}
                  </Text>
                  :
                </Text>

                <TextInput
                  style={[
                    styles.motivoInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.bg,
                    },
                  ]}
                  value={motivoFallo}
                  onChangeText={setMotivoFallo}
                  placeholder="Ej: Domicilio cerrado, nadie respondió al timbre..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                    onPress={() => setModalFalloVisible(false)}
                    disabled={guardandoFallo}
                  >
                    <Text style={[styles.modalCancelText, { color: colors.text }]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalConfirmBtn, { backgroundColor: colors.danger }]}
                    onPress={handleConfirmarFallo}
                    disabled={guardandoFallo}
                  >
                    {guardandoFallo ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalConfirmText}>Confirmar fallo</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codigo: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fieldGroup: {
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  rowGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  col: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  methodChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 8,
  },
  methodChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderWidth: 1,
    borderRadius: 8,
  },
  photoBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewBox: {
    marginTop: 12,
    borderRadius: 10,
    overflow: 'hidden',
    height: 160,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  savePagoBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  savePagoBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
    marginBottom: 10,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  failBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  failBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  motivoInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 90,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
