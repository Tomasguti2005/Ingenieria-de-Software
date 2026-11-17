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

// ─── SEGUIMIENTO PÚBLICO DE PEDIDOS (CLIENTE FINAL) ───────────────────────────
const MOCK_SEGUIMIENTO_PEDIDOS = [
  {
    codigoSeguimiento: 'PED-MOB-001',
    estado: 'EN_CAMINO',
    descripcionProductos: 'Caja con insumos de librería (3x Cuadernos A4, 2x Lapiceras)',
    direccionDestino: 'Av. 7 #1220, La Plata',
    destinatarioNombre: 'Juan Pérez',
    transportista: {
      nombre: 'Lucas',
      apellido: 'Gómez',
      telefono: '+54 221 456-7890',
      vehiculo: 'Moto Honda Wave (Patente A123BCD)',
    },
    fechaActualizacion: new Date().toISOString(),
  },
  {
    codigoSeguimiento: 'PED-MOB-002',
    estado: 'ASIGNADO',
    descripcionProductos: 'Indumentaria deportiva (Zapatillas Running talle 42)',
    direccionDestino: 'Diagonal 74 #210, La Plata',
    destinatarioNombre: 'María López',
    transportista: {
      nombre: 'Matías',
      apellido: 'Fernández',
      telefono: '+54 221 654-3210',
      vehiculo: 'Camioneta Renault Kangoo (Patente AF 456 CD)',
    },
    fechaActualizacion: new Date().toISOString(),
  },
  {
    codigoSeguimiento: 'PED-MOB-003',
    estado: 'ENTREGADO',
    descripcionProductos: 'Componentes electrónicos (Placa Arduino, Sensores)',
    direccionDestino: 'Calle 13 #520, La Plata',
    destinatarioNombre: 'Roberto Fernández',
    transportista: {
      nombre: 'Agustina',
      apellido: 'Álvarez',
      telefono: '+54 221 987-6543',
      vehiculo: 'Auto Chevrolet Onix (Patente AD 789 EF)',
    },
    fechaActualizacion: new Date().toISOString(),
  },
];

/**
 * Consulta el estado de un pedido para el "Cliente final".
 * Escenario 1: Código válido -> Devuelve estado, productos y datos básicos del transportista.
 * Escenario 2: Código inválido, roto o inexistente -> Lanza error con el mensaje de aceptación exacto:
 * "El enlace de seguimiento no es válido o el pedido ya no se encuentra disponible"
 * @param {string} codigo - Código único de seguimiento
 * @returns {Promise<object>}
 */
export async function obtenerSeguimientoPedido(codigo) {
  const codigoLimpio = String(codigo || '').trim().toUpperCase();

  if (!codigoLimpio) {
    throw new Error('El enlace de seguimiento no es válido o el pedido ya no se encuentra disponible');
  }

  if (USAR_MOCK_PEDIDOS) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const pedido = MOCK_SEGUIMIENTO_PEDIDOS.find(
      (p) => p.codigoSeguimiento.toUpperCase() === codigoLimpio
    );

    if (!pedido) {
      throw new Error('El enlace de seguimiento no es válido o el pedido ya no se encuentra disponible');
    }

    return pedido;
  }

  try {
    const respuesta = await fetchAPI(`/tracking/${encodeURIComponent(codigoLimpio)}`);
    if (!respuesta || !respuesta.data) {
      throw new Error('El enlace de seguimiento no es válido o el pedido ya no se encuentra disponible');
    }
    return respuesta.data;
  } catch (_) {
    throw new Error('El enlace de seguimiento no es válido o el pedido ya no se encuentra disponible');
  }
}
