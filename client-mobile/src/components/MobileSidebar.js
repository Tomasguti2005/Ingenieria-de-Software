import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export default function MobileSidebar() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [abierto, setAbierto] = useState(false);
  const [pedidosAbierto, setPedidosAbierto] = useState(true);

  const irAVista = (nombreRuta) => {
    setAbierto(false);
    navigation.navigate(nombreRuta);
  };

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.triggerBtn,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => setAbierto(true)}
        activeOpacity={0.75}
        accessibilityLabel="Abrir menú de navegación"
      >
        <Feather name="menu" size={18} color={colors.text} />
      </TouchableOpacity>

      <Modal
        transparent
        animationType="fade"
        visible={abierto}
        onRequestClose={() => setAbierto(false)}
      >
        <TouchableWithoutFeedback onPress={() => setAbierto(false)}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.drawer,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {/* Header del Drawer */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                  <View style={styles.brand}>
                    <View style={[styles.brandBadge, { backgroundColor: colors.accentSoft }]}>
                      <Feather name="truck" size={16} color={colors.accentStrong} />
                    </View>
                    <View>
                      <Text style={[styles.brandTitle, { color: colors.text }]}>
                        Repartos Ya
                      </Text>
                      <Text style={[styles.brandSub, { color: colors.textMuted }]}>
                        Panel Repartidor
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.closeBtn, { borderColor: colors.border }]}
                    onPress={() => setAbierto(false)}
                  >
                    <Feather name="x" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Navegación */}
                <View style={styles.nav}>
                  <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                    MÓDULOS DEL SISTEMA
                  </Text>

                  {/* Sección desplegable: Pedidos */}
                  <TouchableOpacity
                    style={[
                      styles.navItem,
                      { backgroundColor: colors.accentSoft },
                    ]}
                    onPress={() => setPedidosAbierto((prev) => !prev)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.navItemLeft}>
                      <Feather name="package" size={17} color={colors.accentStrong} />
                      <Text style={[styles.navItemLabel, { color: colors.text }]}>
                        Pedidos
                      </Text>
                    </View>
                    <Feather
                      name={pedidosAbierto ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>

                  {pedidosAbierto && (
                    <View style={[styles.subMenu, { borderLeftColor: colors.border }]}>
                      <TouchableOpacity
                        style={styles.subMenuItem}
                        onPress={() => irAVista('ListaPedidos')}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.subDot, { backgroundColor: colors.accentStrong }]} />
                        <Text style={[styles.subMenuText, { color: colors.text }]}>
                          Asignados
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.subMenuItem}
                        onPress={() => irAVista('PedidosRetirados')}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.subDot, { backgroundColor: colors.successStrong }]} />
                        <Text style={[styles.subMenuText, { color: colors.text }]}>
                          Retirados
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  triggerBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flexDirection: 'row',
  },
  drawer: {
    width: 270,
    height: '100%',
    borderRightWidth: 1,
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  brandSub: {
    fontSize: 11,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    marginTop: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navItemLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  subMenu: {
    marginTop: 6,
    marginLeft: 18,
    paddingLeft: 12,
    borderLeftWidth: 1,
    gap: 4,
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  subDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  subMenuText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
