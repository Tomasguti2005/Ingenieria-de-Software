import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useAuth } from '../context/AuthContext';

export default function UserMenu() {
  const { usuario, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalLogoutVisible, setModalLogoutVisible] = useState(false);

  const nombreUsuario = usuario?.nombre
    ? `${usuario.nombre} ${usuario.apellido || ''}`.trim()
    : 'Repartidor';

  const handleCerrarMenu = () => {
    setMenuAbierto(false);
  };

  const handlePresionarLogout = () => {
    setMenuAbierto(false);
    setModalLogoutVisible(true);
  };

  const handleCancelarLogout = () => {
    setModalLogoutVisible(false);
  };

  const handleConfirmarLogout = () => {
    setModalLogoutVisible(false);
    logout();
  };

  return (
    <View>
      {/* Botón trigger en el header */}
      <TouchableOpacity
        style={styles.headerUserBtn}
        onPress={() => setMenuAbierto((prev) => !prev)}
        activeOpacity={0.7}
      >
        <View style={styles.headerAvatarBadge}>
          <Feather name="user" size={14} color="#0f172a" />
        </View>
        <Text style={styles.headerUserName} numberOfLines={1}>
          {usuario?.nombre || 'Perfil'}
        </Text>
        <Feather
          name={menuAbierto ? 'chevron-up' : 'chevron-down'}
          size={14}
          color="#64748b"
        />
      </TouchableOpacity>

      {/* Menú Desplegable Flotante */}
      {menuAbierto && (
        <Modal
          transparent
          animationType="fade"
          visible={menuAbierto}
          onRequestClose={handleCerrarMenu}
        >
          <TouchableWithoutFeedback onPress={handleCerrarMenu}>
            <View style={styles.dropdownBackdrop}>
              <TouchableWithoutFeedback>
                <View style={styles.dropdownMenu}>
                  {/* Encabezado del Menú */}
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownUserName}>{nombreUsuario}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>REPARTIDOR</Text>
                    </View>
                    <Text style={styles.dropdownUserEmail}>
                      {usuario?.email || 'repartidor@repartosya.com'}
                    </Text>
                  </View>

                  <View style={styles.dropdownDivider} />

                  {/* Opción: Configuración (deshabilitada/sin acción) */}
                  <TouchableOpacity
                    style={[styles.dropdownItem, styles.dropdownItemDisabled]}
                    disabled
                  >
                    <Feather name="settings" size={17} color="#94a3b8" />
                    <Text style={[styles.dropdownItemText, styles.textDisabled]}>
                      Configuración
                    </Text>
                  </TouchableOpacity>

                  {/* Opción: Mi Perfil (deshabilitada/sin acción) */}
                  <TouchableOpacity
                    style={[styles.dropdownItem, styles.dropdownItemDisabled]}
                    disabled
                  >
                    <Feather name="user" size={17} color="#94a3b8" />
                    <Text style={[styles.dropdownItemText, styles.textDisabled]}>
                      Mi Perfil
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.dropdownDivider} />

                  {/* Opción: Cerrar Sesión */}
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={handlePresionarLogout}
                  >
                    <Feather name="log-out" size={17} color="#ef4444" />
                    <Text style={[styles.dropdownItemText, styles.textDanger]}>
                      Cerrar sesión
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Modal de Confirmación de Cierre de Sesión */}
      <Modal
        transparent
        animationType="fade"
        visible={modalLogoutVisible}
        onRequestClose={handleCancelarLogout}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Seguro que desea cerrar sesión?</Text>
            <Text style={styles.modalDescription}>
              Se cerrará tu sesión actual y deberás volver a ingresar tus credenciales para acceder a tus repartos.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancelar]}
                onPress={handleCancelarLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBtnTextCancelar}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnAceptar]}
                onPress={handleConfirmarLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBtnTextAceptar}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Botón de Usuario en Header ──
  headerUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 6,
    gap: 6,
  },
  headerAvatarBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    maxWidth: 90,
  },

  // ── Dropdown Flotante ──
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 230,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dropdownHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
    letterSpacing: 0.5,
  },
  dropdownUserEmail: {
    fontSize: 11.5,
    color: '#64748b',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 10,
  },
  dropdownItemDisabled: {
    opacity: 0.6,
  },
  dropdownItemText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#334155',
  },
  textDisabled: {
    color: '#94a3b8',
  },
  textDanger: {
    color: '#ef4444',
    fontWeight: '600',
  },

  // ── Modal de Confirmación ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancelar: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalBtnTextCancelar: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
  },
  modalBtnAceptar: {
    backgroundColor: '#ef4444',
  },
  modalBtnTextAceptar: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#ffffff',
  },
});
