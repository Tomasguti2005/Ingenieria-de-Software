import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import ListaPedidosScreen from '../screens/ListaPedidosScreen';
import DetalleEntregaScreen from '../screens/DetalleEntregaScreen';
import UserMenu from '../components/UserMenu';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { estaAutenticado, cargando } = useAuth();

  if (cargando) {
    return null; // O pantalla de splash
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerBackTitle: 'Volver',
          headerRight: () => (estaAutenticado ? <UserMenu /> : null),
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
