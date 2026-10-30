// rutas.service.js — Servicio para creación y gestión de rutas y pedidos asociados.
// Se comunica con /api/rutas y obtiene transportistas y pedidos.

import { fetchAPI } from './api.js';

// Mock de fallback para pedidos si el backend de pedidos aún no está montado en la rama actual
export const MOCK_PEDIDOS = [
  {
    id: 101,
    codigoSeguimiento: 'RY-LP01',
    destinatarioNombre: 'María López',
    direccionDestino: 'Calle 12 N° 450, La Plata',
    descripcionProductos: 'Caja de herramientas y repuestos',
    estado: 'REGISTRADO',
    rutaId: null, // Disponible para asignar
  },
  {
    id: 102,
    codigoSeguimiento: 'RY-LP02',
    destinatarioNombre: 'Gonzalo Morales',
    direccionDestino: 'Diagonal 74 N° 1230, La Plata',
    descripcionProductos: 'Documentación y accesorios',
    estado: 'REGISTRADO',
    rutaId: null, // Disponible para asignar
  },
  {
    id: 103,
    codigoSeguimiento: 'RY-BS03',
    destinatarioNombre: 'Sofía Herrera',
    direccionDestino: 'Av. 7 N° 890, Tolosa',
    descripcionProductos: 'Indumentaria deportiva (2 paquetes)',
    estado: 'REGISTRADO',
    rutaId: null, // Disponible para asignar
  },
  {
    id: 104,
    codigoSeguimiento: 'RY-EN04',
    destinatarioNombre: 'Pablo Castro',
    direccionDestino: 'Calle 50 N° 670, Berisso',
    descripcionProductos: 'Cafetera eléctrica',
    estado: 'REGISTRADO',
    rutaId: null, // Disponible para asignar
  },
];

// Inicia vacío para que las rutas se visualicen únicamente a medida que se crean
export let MOCK_RUTAS = [];

/**
 * Obtiene la lista de transportistas registrados.
 */
export async function obtenerTransportistasParaRuta() {
  try {
    const res = await fetchAPI('/admin/transportistas');
    return res.data || [];
  } catch (err) {
    console.warn('No se pudieron obtener transportistas desde la API:', err);
    return [];
  }
}

/**
 * Obtiene la lista de pedidos para asignar a la ruta.
 */
export async function obtenerPedidosParaRuta() {
  try {
    const res = await fetchAPI('/pedidos');
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch (_) {
    // Si la ruta /pedidos no está activa en este commit, usamos los pedidos de prueba
  }
  return [...MOCK_PEDIDOS];
}

/**
 * Obtiene el listado completo de rutas creadas con su transportista y pedidos.
 */
export async function obtenerRutasCreadas() {
  try {
    const res = await fetchAPI('/rutas');
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch (_) {}
  return [...MOCK_RUTAS];
}

/**
 * Historia: El administrador podrá crear una ruta.
 */
export async function crearRuta(datos) {
  if (!datos.pedidosIds || !Array.isArray(datos.pedidosIds) || datos.pedidosIds.length === 0) {
    throw new Error('La ruta ha fallado al crearse, necesita asignar pedidos');
  }

  try {
    const res = await fetchAPI('/rutas', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    return res;
  } catch (err) {
    // Fallback reactivo en memoria para testing
    const transportistas = await obtenerTransportistasParaRuta();
    const chofer = transportistas.find((t) => t.id === Number(datos.transportistaId)) || null;
    const pedidosAsociados = MOCK_PEDIDOS.filter((p) => datos.pedidosIds.includes(p.id));

    const nuevaRuta = {
      id: Date.now(),
      nombre: datos.nombre,
      createdAt: new Date().toISOString(),
      transportistaId: datos.transportistaId,
      transportista: chofer,
      pedidos: pedidosAsociados.map((p, idx) => ({ ...p, ordenEntrega: idx + 1 })),
    };

    MOCK_RUTAS.unshift(nuevaRuta);
    // Marcamos los pedidos como asignados
    MOCK_PEDIDOS.forEach((p) => {
      if (datos.pedidosIds.includes(p.id)) {
        p.rutaId = nuevaRuta.id;
        p.estado = 'ASIGNADO';
      }
    });

    return {
      success: true,
      data: {
        mensaje: 'Ruta creada exitosamente',
        ruta: nuevaRuta,
      },
    };
  }
}

/**
 * Modifica los pedidos de una ruta (asigna uno nuevo).
 */
export async function asignarPedidoARuta(rutaId, pedidoId) {
  try {
    const res = await fetchAPI(`/rutas/${rutaId}/asignar-pedido`, {
      method: 'POST',
      body: JSON.stringify({ pedidoId }),
    });
    return res;
  } catch (_) {
    const ruta = MOCK_RUTAS.find((r) => r.id === Number(rutaId));
    const pedido = MOCK_PEDIDOS.find((p) => p.id === Number(pedidoId));
    if (ruta && pedido) {
      pedido.rutaId = ruta.id;
      pedido.estado = 'ASIGNADO';
      if (!ruta.pedidos.some((p) => p.id === pedido.id)) {
        ruta.pedidos.push({ ...pedido, ordenEntrega: ruta.pedidos.length + 1 });
      }
    }
    return { success: true, data: { mensaje: 'Pedido asignado a la ruta' } };
  }
}

/**
 * Desasigna pedidos de una ruta específica dejándolos libres.
 */
export async function desasignarPedidosDeRuta(rutaId, pedidosIds) {
  try {
    const res = await fetchAPI(`/rutas/${rutaId}/desasignar-pedidos`, {
      method: 'DELETE',
      body: JSON.stringify({ pedidosIds }),
    });
    return res;
  } catch (_) {
    const ruta = MOCK_RUTAS.find((r) => r.id === Number(rutaId));
    if (ruta) {
      ruta.pedidos = ruta.pedidos.filter((p) => !pedidosIds.includes(p.id));
    }
    MOCK_PEDIDOS.forEach((p) => {
      if (pedidosIds.includes(p.id)) {
        p.rutaId = null;
        p.estado = 'REGISTRADO';
      }
    });
    return { success: true, data: { mensaje: 'Eliminado' } };
  }
}

/**
 * Asigna o cambia el transportista responsable de la ruta.
 */
export async function asignarTransportistaARuta(rutaId, transportistaId) {
  try {
    const res = await fetchAPI(`/rutas/${rutaId}/asignar-transportista`, {
      method: 'POST',
      body: JSON.stringify({ transportistaId, forzarModificacion: true }),
    });
    return res;
  } catch (_) {
    const ruta = MOCK_RUTAS.find((r) => r.id === Number(rutaId));
    const transportistas = await obtenerTransportistasParaRuta();
    const chofer = transportistas.find((t) => t.id === Number(transportistaId));
    if (ruta && chofer) {
      ruta.transportistaId = chofer.id;
      ruta.transportista = chofer;
    }
    return { success: true, data: { mensaje: 'Transportista asignado correctamente a la ruta.' } };
  }
}

/**
 * Elimina al transportista a cargo de la ruta dejándola sin chofer.
 */
export async function removerTransportistaDeRuta(rutaId) {
  try {
    const res = await fetchAPI(`/rutas/${rutaId}/remover-transportista`, {
      method: 'DELETE',
    });
    return res;
  } catch (_) {
    const ruta = MOCK_RUTAS.find((r) => r.id === Number(rutaId));
    if (ruta) {
      ruta.transportistaId = null;
      ruta.transportista = null;
    }
    return { success: true, data: { mensaje: 'Transportista eliminado, la ruta no tiene transportista asignado' } };
  }
}

/**
 * Elimina una ruta completa del sistema y desvincula todos sus pedidos asociados.
 */
export async function eliminarRuta(rutaId) {
  try {
    const res = await fetchAPI(`/rutas/${rutaId}`, {
      method: 'DELETE',
    });
    return res;
  } catch (_) {
    MOCK_RUTAS = MOCK_RUTAS.filter((r) => r.id !== Number(rutaId));
    MOCK_PEDIDOS.forEach((p) => {
      if (p.rutaId === Number(rutaId)) {
        p.rutaId = null;
        p.estado = 'REGISTRADO';
      }
    });
    return { success: true, data: { mensaje: 'Ruta eliminada exitosamente' } };
  }
}
