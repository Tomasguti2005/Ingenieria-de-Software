// Servicio para comunicación con la API de Usuarios / Transportistas
// Convención CONTEXT.md: /api/usuarios con respuestas { success, data, error }

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Obtener la lista de transportistas (repartidores)
 */
export async function obtenerTransportistas() {
  try {
    const res = await fetch(`${API_URL}/usuarios?rol=REPARTIDOR`)
    if (!res.ok) {
      throw new Error(`Error en el servidor: ${res.statusText}`)
    }
    const data = await res.json()
    return data
  } catch (error) {
    console.warn('[usuarios.service] Backend no disponible, usando modo local:', error.message)
    throw error
  }
}

/**
 * Registrar un nuevo transportista
 * @param {Object} transportistaData
 */
export async function crearTransportista(transportistaData) {
  try {
    const res = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...transportistaData,
        rol: 'REPARTIDOR',
      }),
    })

    const resultado = await res.json()

    if (!res.ok || !resultado.success) {
      throw new Error(resultado.error || 'Error al crear el transportista en el servidor')
    }

    return resultado
  } catch (error) {
    console.warn('[usuarios.service] Petición fallida o backend no conectado:', error.message)
    throw error
  }
}

/**
 * Eliminar / dar de baja a un transportista
 * @param {number|string} id
 */
export async function eliminarTransportista(id) {
  try {
    const res = await fetch(`${API_URL}/usuarios/${id}`, {
      method: 'DELETE',
    })

    const resultado = await res.json()

    if (!res.ok || !resultado.success) {
      throw new Error(resultado.error || 'Error al eliminar el transportista en el servidor')
    }

    return resultado
  } catch (error) {
    console.warn('[usuarios.service] Petición fallida o backend no conectado:', error.message)
    throw error
  }
}

