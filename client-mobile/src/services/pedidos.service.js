import { fetchAPI } from './api';

const USAR_MOCK_PEDIDOS = true;

const MOCK_PEDIDOS_ASIGNADOS = [
  {
    id: 902,
    codigoSeguimiento: 'PED-MOB-002',
    direccionOrigen: 'Depósito central, Calle 50 #123, La Plata',
    direccionDestino: 'Diagonal 74 #210, La Plata',
    destinatarioNombre: 'María López',
    destinatarioTelefono: '2219876543',
    descripcionProductos: 'Indumentaria deportiva',
    ordenEntrega: 2,
    estado: 'ASIGNADO',
  },
  {
    id: 901,
    codigoSeguimiento: 'PED-MOB-001',
    direccionOrigen: 'Depósito central, Calle 50 #123, La Plata',
    direccionDestino: 'Av. 7 #1220, La Plata',
    destinatarioNombre: 'Juan Pérez',
    destinatarioTelefono: '2214567890',
    descripcionProductos: 'Caja con insumos de librería',
    ordenEntrega: 1,
    estado: 'ASIGNADO',
  },
  {
    id: 903,
    codigoSeguimiento: 'PED-MOB-003',
    direccionOrigen: 'Centro de retiro norte, Av. 44 #850, La Plata',
    direccionDestino: 'Calle 13 #520, La Plata',
    destinatarioNombre: 'Roberto Fernández',
    destinatarioTelefono: '2213344556',
    descripcionProductos: 'Componentes electrónicos',
    ordenEntrega: 3,
    estado: 'ASIGNADO',
  },
];

function ordenarPedidos(pedidos) {
  const ordenes = pedidos.map((pedido) => pedido.ordenEntrega);
  if (
    ordenes.some((orden) => !Number.isInteger(orden) || orden < 1) ||
    new Set(ordenes).size !== ordenes.length
  ) {
    throw new Error('Los pedidos recibidos no tienen un orden de entrega válido.');
  }

  return [...pedidos].sort((a, b) => a.ordenEntrega - b.ordenEntrega);
}

export async function obtenerPedidosAsignados() {
  if (USAR_MOCK_PEDIDOS) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return ordenarPedidos(MOCK_PEDIDOS_ASIGNADOS);
  }

  const respuesta = await fetchAPI('/mobile/pedidos');

  if (respuesta.success !== true || !Array.isArray(respuesta.data)) {
    throw new Error('La respuesta de pedidos móviles no tiene un formato válido.');
  }

  return ordenarPedidos(respuesta.data);
}
