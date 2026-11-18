import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import ListaPedidosScreen from '../screens/ListaPedidosScreen';
import PedidosRetiradosScreen from '../screens/PedidosRetiradosScreen';
import DetalleEntregaScreen from '../screens/DetalleEntregaScreen';
import MobileSidebar from '../components/MobileSidebar';
import SeguimientoPedidoScreen from '../screens/SeguimientoPedidoScreen';
import UserMenu from '../components/UserMenu';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { View } from 'react-native';

const Stack = createNativeStackNavigator();

// Configuración de enlaces profundos para que al abrir el link del pedido
// (ej: repartosya://seguimiento/PED-MOB-001 o /seguimiento/:codigo) abra la pantalla
const linking = {
  prefixes: ['repartosya://', 'http://localhost:8081', 'http://localhost:19006'],
  config: {
    screens: {
      Login: 'login',
      SeguimientoPedido: 'seguimiento/:codigo',
      ListaPedidos: 'pedidos',
      DetalleEntrega: 'entrega/:id',
    },
  },
};

export default function AppNavigator() {
  const { estaAutenticado, cargando } = useAuth();
  const { colors, esOscuro } = useTheme();

  if (cargando) {
    return null; // O pantalla de splash
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerBackTitle: 'Volver',
          headerStyle: {
            backgroundColor: colors.headerBg,
          },
          headerTintColor: colors.headerText,
          headerTitleStyle: {
            fontWeight: '600',
            color: colors.headerText,
          },
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <ThemeToggle />
              {estaAutenticado && <UserMenu />}
            </View>
          ),
        }}
      >
        {!estaAutenticado ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SeguimientoPedido"
              component={SeguimientoPedidoScreen}
              options={{ title: 'Seguimiento de Pedido' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="ListaPedidos"
              component={ListaPedidosScreen}
              options={{
                title: 'Pedidos Asignados',
                headerBackVisible: false,
                headerLeft: () => <MobileSidebar />,
              }}
            />
            <Stack.Screen
              name="PedidosRetirados"
              component={PedidosRetiradosScreen}
              options={{
                title: 'Pedidos Retirados',
                headerBackVisible: false,
                headerLeft: () => <MobileSidebar />,
              }}
            />
            <Stack.Screen
              name="DetalleEntrega"
              component={DetalleEntregaScreen}
              options={{ title: 'Detalle de Entrega' }}
            />
            <Stack.Screen
              name="SeguimientoPedido"
              component={SeguimientoPedidoScreen}
              options={{ title: 'Seguimiento de Pedido' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
