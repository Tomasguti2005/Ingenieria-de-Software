import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import ListaPedidosScreen from '../screens/ListaPedidosScreen';
import DetalleEntregaScreen from '../screens/DetalleEntregaScreen';
import UserMenu from '../components/UserMenu';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { View } from 'react-native';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { estaAutenticado, cargando } = useAuth();
  const { colors, esOscuro } = useTheme();

  if (cargando) {
    return null; // O pantalla de splash
  }

  return (
    <NavigationContainer>
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
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="ListaPedidos"
              component={ListaPedidosScreen}
              options={{ title: 'Mis Repartos' }}
            />
            <Stack.Screen
              name="DetalleEntrega"
              component={DetalleEntregaScreen}
              options={{ title: 'Detalle de Entrega' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
