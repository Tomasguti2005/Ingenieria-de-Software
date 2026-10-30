// rutas.service.js — Servicio para creación y gestión de rutas y pedidos asociados.
// Se comunica con /api/rutas y /api/rutaTransportista.

import { fetchAPI } from './api.js';
import { MOCK_TRANSPORTISTAS } from './transportistas.service.js';

// ─── MODO MOCK ────────────────────────────────────────────────────────────────
// En 'false' para llamar a los controladores reales del backend Express.
export const USAR_MOCK = false;

// Mock de fallback para pedidos si el backend de pedidos aún no está montado en la rama actual
export const MOCK_PEDIDOS = [
  {
    id: 101,
    codigoSeguimiento: 'RY-LP01',
    destinatarioNombre: 'María López',
    direccionDestino: 'Calle 12 N° 450, La Plata',
    descripcionProductos: 'Caja de herramientas y repuestos',
    estado: 'REGISTRADO',
    rutaId: null, // Sin ruta asignada
  },
  {
    id: 102,
    codigoSeguimiento: 'RY-LP02',
    destinatarioNombre: 'Gonzalo Morales',
    direccionDestino: 'Diagonal 74 N° 1230, La Plata',
    descripcionProductos: 'Documentación y accesorios',
    estado: 'REGISTRADO',
    rutaId: null, // Sin ruta asignada
  },
  {
    id: 103,
    codigoSeguimiento: 'RY-BS03',
    destinatarioNombre: 'Sofía Herrera',
    direccionDestino: 'Av. 7 N° 890, Tolosa',
    descripcionProductos: 'Indumentaria deportiva (2 paquetes)',
    estado: 'REGISTRADO',
    rutaId: null, // Sin ruta asignada
  },
  {
    id: 104,
    codigoSeguimiento: 'RY-EN04',
    destinatarioNombre: 'Pablo Castro',
    direccionDestino: 'Calle 50 N° 670, Berisso',
    descripcionProductos: 'Cafetera eléctrica',
    estado: 'REGISTRADO',
    rutaId: null, // Sin ruta asignada
  },
  {
    id: 105,
    codigoSeguimiento: 'RY-BA05',
    destinatarioNombre: 'Carlos Méndez',
    direccionDestino: 'Av. 51 N° 780, La Plata',
    descripcionProductos: 'Paquete de electrónica frágil',
    estado: 'ASIGNADO',
    rutaId: 999, // Ya asignado a otra ruta (demostración visual de bloqueo y etiqueta)
    rutaNombre: 'Ruta Zona Norte',
  },
];

// Lista de rutas creadas en memoria para modo mock
export let MOCK_RUTAS = [
  {
    id: 1,
    nombre: 'Ruta Casco Urbano Mañana',
    createdAt: '2024-05-10T10:00:00.000Z',
    transportistaId: 1,
    transportista: {
      id: 1,
      nombre: 'Lucas',
      apellido: 'Gómez',
      email: 'lucas.gomez@repartosya.com',
      telefono: '+54221456789',
      rol: 'REPARTIDOR',
      estado: 'ACTIVO',
      vehiculo: 'Moto Honda Wave',
    },
    pedidos: [
      {
        id: 101,
        codigoSeguimiento: 'RY-LP01',
        destinatarioNombre: 'María López',
        direccionDestino: 'Calle 12 N° 450, La Plata',
        descripcionProductos: 'Caja de herramientas y repuestos',
        estado: 'ASIGNADO',
        ordenEntrega: 1,
        rutaId: 1,
      },
    ],
  },
  {
    id: 2,
    nombre: 'Ruta Berisso y Ensenada',
    createdAt: '2024-05-11T14:30:00.000Z',
    transportistaId: null, // Ruta sin chofer para probar Escenario 1 y 3
    transportista: null,
    pedidos: [],
  },
];

/**
 * Obtiene la lista de transportistas registrados.
 */
export async function obtenerTransportistasParaRuta() {
  if (USAR_MOCK) {
    return [
      ...MOCK_TRANSPORTISTAS,
      {
        id: 7,
        nombre: 'Franco',
        apellido: 'Paz',
        email: 'franco.paz@repartosya.com',
        telefono: '+54221776655',
        rol: 'REPARTIDOR',
        estado: 'ACTIVO',
        vehiculo: null, // Caso de prueba: Activo pero Sin vehículo asignado
        createdAt: '2024-05-12T09:30:00.000Z',
      },
    ];
  }

  const res = await fetchAPI('/admin/transportistas');
  if (!Array.isArray(res.data)) {
    throw new Error('La respuesta de transportistas no tiene un formato válido.');
  }
  return res.data;
}

/**
 * Obtiene la lista de pedidos para asignar a la ruta.
 */
export async function obtenerPedidosParaRuta() {
  if (USAR_MOCK) {
    return [...MOCK_PEDIDOS];
  }

  const res = await fetchAPI('/pedidos');
  if (!Array.isArray(res.data)) {
    throw new Error('La respuesta de pedidos no tiene un formato válido.');
  }
  return res.data;
}

/**
 * Obtiene el listado completo de rutas creadas con su transportista y pedidos.
 */
export async function obtenerRutasCreadas() {
  if (USAR_MOCK) {
    return [...MOCK_RUTAS];
  }

  const res = await fetchAPI('/rutas');
  if (!Array.isArray(res.data)) {
    throw new Error('La respuesta de rutas no tiene un formato válido.');
  }
  return res.data;
}

/**
 * Historia: El administrador podrá crear una ruta.
 * Escenario 1: Éxito con pedidos y transportista válido -> "Ruta creada exitosamente"
 * Escenario 2: Fallo sin pedidos -> "La ruta ha fallado al crearse, necesita asignar pedidos"
 */
export async function crearRuta(datos) {
  if (!datos.pedidosIds || !Array.isArray(datos.pedidosIds) || datos.pedidosIds.length === 0) {
    throw new Error('La ruta ha fallado al crearse, necesita asignar pedidos');
  }

  if (USAR_MOCK) {
    const transportistas = await obtenerTransportistasParaRuta();
    const chofer = transportistas.find((t) => t.id === Number(datos.transportistaId)) || null;
    const pedidosAsociados = MOCK_PEDIDOS.filter((p) => datos.pedidosIds.includes(p.id));

    const nuevaRuta = {
      id: Date.now(),
      nombre: datos.nombre,
      createdAt: new Date().toISOString(),
      transportistaId: datos.transportistaId,
      transportista: chofer,
      pedidos: pedidosAsociados.map((p, idx) => ({ ...p, ordenEntrega: idx + 1, rutaId: Date.now() })),
    };

    MOCK_RUTAS.unshift(nuevaRuta);
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

  return fetchAPI('/rutas', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

/**
 * Asigna un pedido a una ruta registrada y disponible (Modificar Pedidos).
 * Escenario 1: Éxito -> "Pedido asignado a la ruta"
 * Escenario 2: Ruta no disponible -> "Ruta no disponible"
 * Escenario 3: Pedido ya asignado -> "Pedido ya asignado"
 */
export async function asignarPedidoARuta(rutaId, pedidoId) {
  if (USAR_MOCK) {
    const ruta = MOCK_RUTAS.find((r) => r.id === Number(rutaId));
    const pedido = MOCK_PEDIDOS.find((p) => p.id === Number(pedidoId));

    if (!ruta || !ruta.transportista || ruta.transportista.estado !== 'ACTIVO') {
      throw new Error('Ruta no disponible');
    }

    if (pedido && pedido.rutaId !== null && pedido.rutaId !== undefined) {
      throw new Error('Pedido ya asignado');
    }

    if (ruta && pedido) {
      pedido.rutaId = ruta.id;
      pedido.estado = 'ASIGNADO';
      if (!ruta.pedidos.some((p) => p.id === pedido.id)) {
        ruta.pedidos.push({ ...pedido, ordenEntrega: ruta.pedidos.length + 1 });
      }
    }
    return { success: true, data: { mensaje: 'Pedido asignado a la ruta' } };
  }

  return fetchAPI(`/rutas/${rutaId}/asignar-pedido`, {
    method: 'POST',
    body: JSON.stringify({ pedidoId }),
  });
}

/**
 * Desasigna pedidos de una ruta específica dejándolos libres (Modificar Pedidos).
 * Escenario 4: Eliminación de pedidos -> "Eliminado"
 */
export async function desasignarPedidosDeRuta(rutaId, pedidosIds) {
  if (USAR_MOCK) {
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

  return fetchAPI(`/rutas/${rutaId}/desasignar-pedidos`, {
    method: 'DELETE',
    body: JSON.stringify({ pedidosIds }),
  });
}

/**
 * Asigna o modifica el transportista de una ruta (Modificar Transportista).
 * Escenario 1 y 6: Asignación o modificación exitosa
 * Escenario 2: "Esta ruta ya tiene un transportista asignado"
 * Escenario 3: "Esta ruta no cuenta con pedidos asignados"
 * Escenario 4: "El transportista no tiene un vehículo asignado"
 * Escenario 5: "El transportista no se encuentra disponible"
 */
export async function asignarTransportistaARuta(rutaId, transportistaId, forzarModificacion = false) {
  if (USAR_MOCK) {
    const ruta = MOCK_RUTAS.find((r) => r.id === Number(rutaId));
    if (!ruta) throw new Error('La ruta especificada no existe.');

    // Escenario 3: Ruta sin pedidos asociados
    if (!ruta.pedidos || ruta.pedidos.length === 0) {
      throw new Error('Esta ruta no cuenta con pedidos asignados');
    }

    // Escenario 2: Ruta ya tiene chofer y no se forzó el reemplazo
    if (ruta.transportistaId && Number(ruta.transportistaId) !== Number(transportistaId) && !forzarModificacion) {
      throw new Error('Esta ruta ya tiene un transportista asignado');
    }

    const transportistas = await obtenerTransportistasParaRuta();
    const chofer = transportistas.find((t) => t.id === Number(transportistaId));
    if (!chofer) throw new Error('El transportista no existe.');

    // Escenario 5: Transportista no disponible
    if (chofer.estado !== 'ACTIVO') {
      throw new Error('El transportista no se encuentra disponible');
    }

    // Escenario 4: Transportista sin vehículo
    if (!chofer.vehiculo || String(chofer.vehiculo).trim() === '') {
      throw new Error('El transportista no tiene un vehículo asignado');
    }

    // Escenario 1 y 6: Asignación / Modificación exitosa
    ruta.transportistaId = chofer.id;
    ruta.transportista = chofer;

    return {
      success: true,
      data: {
        mensaje: 'El sistema asignó el transportista seleccionado a la ruta correctamente.',
        ruta,
      },
    };
  }

  return fetchAPI(`/rutas/${rutaId}/asignar-transportista`, {
    method: 'POST',
    body: JSON.stringify({ transportistaId: Number(transportistaId), forzarModificacion }),
  });
}

/**
 * Elimina al transportista a cargo de la ruta (Escenario 7).
 * Mensaje exacto: "Transportista eliminado, la ruta no tiene transportista asignado"
 */
export async function removerTransportistaDeRuta(rutaId) {
  if (USAR_MOCK) {
    const ruta = MOCK_RUTAS.find((r) => r.id === Number(rutaId));
    if (ruta) {
      ruta.transportistaId = null;
      ruta.transportista = null;
    }
    return {
      success: true,
      data: {
        mensaje: 'Transportista eliminado, la ruta no tiene transportista asignado',
      },
    };
  }

  return fetchAPI(`/rutas/${rutaId}/remover-transportista`, {
    method: 'DELETE',
  });
}

/**
 * Elimina una ruta completa del sistema y desvincula todos sus pedidos asociados.
 */
export async function eliminarRuta(rutaId) {
  if (USAR_MOCK) {
    MOCK_RUTAS = MOCK_RUTAS.filter((r) => r.id !== Number(rutaId));
    MOCK_PEDIDOS.forEach((p) => {
      if (p.rutaId === Number(rutaId)) {
        p.rutaId = null;
        p.estado = 'REGISTRADO';
      }
    });
    return { success: true, data: { mensaje: 'Ruta eliminada exitosamente' } };
  }

  return fetchAPI(`/rutas/${rutaId}`, {
    method: 'DELETE',
  });
}
