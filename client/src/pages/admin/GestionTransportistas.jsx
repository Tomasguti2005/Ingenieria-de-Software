import { useState, useEffect } from 'react'
import {
  obtenerTransportistas,
  crearTransportista,
  eliminarTransportista,
} from '../../services/usuarios.service'
import './GestionTransportistas.css'

// Datos iniciales de prueba (usados como respaldo mientras el backend está en desarrollo)
const TRANSPORTISTAS_INICIALES = [
  {
    id: 1,
    nombre: 'Carlos',
    apellido: 'Benítez',
    email: 'carlos.benitez@repartosya.com',
    telefono: '221-555-0192',
    vehiculo: 'Moto Honda Wave 110',
    estado: 'ACTIVO',
    rol: 'REPARTIDOR',
  },
  {
    id: 2,
    nombre: 'Mariana',
    apellido: 'Gómez',
    email: 'mariana.gomez@repartosya.com',
    telefono: '221-555-0341',
    vehiculo: 'Furgón Peugeot Partner',
    estado: 'ACTIVO',
    rol: 'REPARTIDOR',
  },
]

export default function GestionTransportistas() {
  // Lista de transportistas
  const [transportistas, setTransportistas] = useState(TRANSPORTISTAS_INICIALES)

  // Estado del formulario de creación
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    vehiculo: '',
    password: '',
  })

  // Mensajes de alerta flotantes (éxito o error)
  const [alerta, setAlerta] = useState(null)

  // Filtro de búsqueda en la lista
  const [busqueda, setBusqueda] = useState('')

  // Estado para la ventana/modal de Eliminación de Transportista
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false)
  const [transportistaSeleccionadoId, setTransportistaSeleccionadoId] = useState('')

  // Intentar cargar transportistas reales desde la API al montar el componente
  useEffect(() => {
    let cancelado = false

    async function cargarDesdeServidor() {
      try {
        const respuesta = await obtenerTransportistas()
        if (!cancelado && respuesta && respuesta.data) {
          setTransportistas(respuesta.data)
        }
      } catch (_) {
        // Si el backend aún no está encendido, se mantiene TRANSPORTISTAS_INICIALES sin interrumpir la app
      }
    }

    cargarDesdeServidor()

    return () => {
      cancelado = true
    }
  }, [])

  // Auto-cierre de la alerta flotante a los 5 segundos
  useEffect(() => {
    if (!alerta) return
    const timer = setTimeout(() => {
      setAlerta(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [alerta])

  // Manejar cambios en el formulario de alta
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // ==========================================
  // HISTORIA 1: CREAR CUENTA DE TRANSPORTISTA
  // ==========================================
  const handleSubmitCrear = async (e) => {
    e.preventDefault()

    const emailNormalizado = formData.email.trim().toLowerCase()

    // 1. Campos obligatorios
    if (
      !formData.nombre.trim() ||
      !formData.apellido.trim() ||
      !formData.email.trim() ||
      !formData.telefono.trim() ||
      !formData.vehiculo.trim() ||
      !formData.password.trim()
    ) {
      setAlerta({
        tipo: 'error',
        mensaje: 'Por favor, completá todos los campos requeridos.',
      })
      return
    }

    // 2. Escenario 2: Registro rechazado por email duplicado
    const emailExiste = transportistas.some(
      (t) => t.email.toLowerCase() === emailNormalizado
    )

    if (emailExiste) {
      setAlerta({
        tipo: 'error',
        mensaje:
          'Operación no permitida: el correo electrónico ya pertenece a otro usuario registrado',
      })
      return
    }

    // 3. Escenario 3: Registro rechazado por contraseña débil
    // Estándar de seguridad: al menos 8 caracteres, al menos una letra y un número
    const tieneLargoMinimo = formData.password.length >= 8
    const tieneLetra = /[a-zA-Z]/.test(formData.password)
    const tieneNumero = /\d/.test(formData.password)

    if (!tieneLargoMinimo || !tieneLetra || !tieneNumero) {
      setAlerta({
        tipo: 'error',
        mensaje: 'La contraseña no cumple con los estándares de seguridad requeridos',
      })
      return
    }

    // 4. Escenario 1: Alta de cuenta exitosa
    const nuevoTransportista = {
      id: Date.now(),
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      email: emailNormalizado,
      telefono: formData.telefono.trim(),
      vehiculo: formData.vehiculo.trim(),
      password: formData.password,
      estado: 'ACTIVO',
      rol: 'REPARTIDOR',
    }

    // Intentar persistir en el backend mediante el servicio
    try {
      await crearTransportista(nuevoTransportista)
    } catch (_) {
      // Si el backend no está disponible, se almacena en el estado local
    }

    setTransportistas((prev) => [nuevoTransportista, ...prev])

    // Limpiar formulario y emitir mensaje oficial
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      vehiculo: '',
      password: '',
    })

    setAlerta({
      tipo: 'success',
      mensaje: 'El usuario transportista ha sido creado con éxito',
    })
  }

  // ==========================================
  // HISTORIA 2: ELIMINAR TRANSPORTISTA
  // ==========================================
  const handleAbrirEliminar = () => {
    setTransportistaSeleccionadoId('')
    setMostrarModalEliminar(true)
  }

  const handleCerrarEliminar = () => {
    setMostrarModalEliminar(false)
    setTransportistaSeleccionadoId('')
  }

  const handleConfirmarEliminacion = async () => {
    // Escenario 2: No se ha seleccionado al repartidor
    if (!transportistaSeleccionadoId) {
      setAlerta({
        tipo: 'error',
        mensaje: 'Debe seleccionar un transportista de la lista para proceder con la eliminación.',
      })
      return
    }

    try {
      const idNumerico = Number(transportistaSeleccionadoId)
      const existe = transportistas.some((t) => t.id === idNumerico)

      if (!existe) {
        throw new Error(`El transportista con ID ${transportistaSeleccionadoId} no fue encontrado en la base de datos.`)
      }

      // Intentar eliminar en el backend a través del servicio
      try {
        await eliminarTransportista(idNumerico)
      } catch (_) {
        // Si el backend no está disponible, procede con la eliminación local
      }

      // Escenario 1: Se elimina al repartidor de manera exitosa
      setTransportistas((prev) => prev.filter((t) => t.id !== idNumerico))

      setAlerta({
        tipo: 'success',
        mensaje: 'El transportista ha sido eliminado de forma correcta.',
      })

      handleCerrarEliminar()
    } catch (error) {
      // Escenario 3: Error al eliminar (almacenar en registro de errores del sistema)
      const logError = {
        fecha: new Date().toISOString(),
        origen: 'EliminarTransportista',
        error: error.message,
        idTransportistaIntentado: transportistaSeleccionadoId,
      }

      try {
        const erroresGuardados = JSON.parse(localStorage.getItem('sistema_errores') || '[]')
        erroresGuardados.push(logError)
        localStorage.setItem('sistema_errores', JSON.stringify(erroresGuardados))
      } catch (_) { }

      console.error('[SISTEMA / LOGS / ERRORES]:', logError)

      setAlerta({
        tipo: 'error',
        mensaje: 'Ocurrió un error al intentar eliminar el transportista. El error fue registrado en el sistema para su verificación.',
      })
    }
  }

  // Filtrado de la lista por término de búsqueda
  const transportistasFiltrados = transportistas.filter((t) => {
    const termino = busqueda.toLowerCase()
    return (
      t.nombre.toLowerCase().includes(termino) ||
      t.apellido.toLowerCase().includes(termino) ||
      t.vehiculo.toLowerCase().includes(termino) ||
      t.email.toLowerCase().includes(termino)
    )
  })

  return (
    <div className="gestion-layout">
      {/* Alerta flotante (Toast) */}
      {alerta && (
        <div className={`alert alert-${alerta.tipo}`} role="alert">
          <div className="alert-content">
            <span className="alert-icono">
              {alerta.tipo === 'success' ? '✓' : '⚠'}
            </span>
            <span className="alert-texto">{alerta.mensaje}</span>
          </div>
          <button
            type="button"
            className="alert-close"
            onClick={() => setAlerta(null)}
            title="Cerrar aviso"
          >
            &times;
          </button>
        </div>
      )}

      {/* Encabezado Principal */}
      <header className="gestion-header">
        <div className="header-textos">
          <h1>Repartos Ya — Panel de Administración</h1>
          <p>Gestión de Transportistas (Creación de cuentas y eliminación de personal)</p>
        </div>

        {/* Botón principal de la Historia de Usuario 2 */}
        <button
          type="button"
          className="btn-abrir-eliminar"
          onClick={handleAbrirEliminar}
        >
          🗑️ Eliminar transportista
        </button>
      </header>

      <div className="gestion-grid">
        {/* PANEL 1: Formulario para Crear Transportista */}
        <section className="panel">
          <h2 className="panel-title">
            <span>➕</span> Registrar Nuevo Transportista
          </h2>

          <form onSubmit={handleSubmitCrear} noValidate>
            <div className="form-group">
              <label htmlFor="nombre">Nombre *</label>
              <input
                id="nombre"
                type="text"
                name="nombre"
                placeholder="Ej. Martín"
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="apellido">Apellido *</label>
              <input
                id="apellido"
                type="text"
                name="apellido"
                placeholder="Ej. González"
                value={formData.apellido}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo Electrónico *</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="repartidor@repartosya.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono de Contacto *</label>
              <input
                id="telefono"
                type="tel"
                name="telefono"
                placeholder="Ej. 221-456-7890"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="vehiculo">Vehículo / Modelo *</label>
              <input
                id="vehiculo"
                type="text"
                name="vehiculo"
                placeholder="Ej. Moto Corven Triax 150 / Furgoneta"
                value={formData.vehiculo}
                onChange={handleChange}
              />
              <div className="form-hint">Dato necesario para asignación logística de paquetes.</div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña Temporal *</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Mínimo 8 caracteres (letras y números)"
                value={formData.password}
                onChange={handleChange}
              />
              <div className="form-hint">
                Debe contener al menos 8 caracteres e incluir letras y números.
              </div>
            </div>

            <button type="submit" className="btn-submit">
              Guardar transportista
            </button>
          </form>
        </section>

        {/* PANEL 2: Lista de Transportistas Registrados */}
        <section className="panel">
          <div className="lista-header">
            <h2 className="panel-title" style={{ margin: 0 }}>
              <span>🚚</span> Transportistas Registrados
            </h2>
            <span className="lista-contador">
              Total: {transportistas.length}
            </span>
          </div>

          <input
            type="search"
            className="buscador-input"
            placeholder="Buscar por nombre, vehículo o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <div className="transportistas-lista">
            {transportistasFiltrados.length === 0 ? (
              <div className="lista-vacia">
                No se encontraron transportistas registrados o que coincidan con la búsqueda.
              </div>
            ) : (
              transportistasFiltrados.map((t) => (
                <article key={t.id} className="transportista-card">
                  <div className="card-top">
                    <h3 className="transportista-nombre">
                      {t.nombre} {t.apellido}
                    </h3>
                    <span
                      className={`badge ${t.estado === 'ACTIVO' ? 'badge-activo' : 'badge-inactivo'
                        }`}
                    >
                      {t.estado}
                    </span>
                  </div>

                  <div className="transportista-datos">
                    <div className="dato-item">
                      <strong>Email:</strong> {t.email}
                    </div>
                    <div className="dato-item">
                      <strong>Teléfono:</strong> {t.telefono}
                    </div>
                    <div className="dato-item" style={{ gridColumn: '1 / -1' }}>
                      <strong>Vehículo:</strong> {t.vehiculo}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ============================================================ */}
      {/* VISTA / MODAL DE LA HISTORIA: ELIMINAR AL TRANSPORTISTA       */}
      {/* ============================================================ */}
      {mostrarModalEliminar && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-box modal-box-amplio">
            <div className="modal-header">
              <h3>🗑️ Eliminar al Transportista</h3>
              <p>
                Seleccioná de la lista al transportista que deseás dar de baja y presioná el botón de eliminar.
              </p>
            </div>

            {transportistas.length === 0 ? (
              <div className="lista-vacia">
                No hay transportistas cargados en el sistema para eliminar.
              </div>
            ) : (
              <div className="tabla-seleccion-contenedor">
                <table className="tabla-seleccion">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>Elegir</th>
                      <th>Nombre y Apellido</th>
                      <th>Vehículo</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transportistas.map((t) => {
                      const seleccionado = transportistaSeleccionadoId === String(t.id)
                      return (
                        <tr
                          key={t.id}
                          className={seleccionado ? 'fila-seleccionada' : ''}
                          onClick={() => setTransportistaSeleccionadoId(String(t.id))}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="radio"
                              name="transportistaSeleccion"
                              value={String(t.id)}
                              checked={seleccionado}
                              onChange={() => setTransportistaSeleccionadoId(String(t.id))}
                            />
                          </td>
                          <td>
                            <strong>
                              {t.nombre} {t.apellido}
                            </strong>
                          </td>
                          <td>{t.vehiculo}</td>
                          <td>{t.email}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-acciones">
              <button
                type="button"
                className="btn-cancelar"
                onClick={handleCerrarEliminar}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-confirmar-eliminar"
                onClick={handleConfirmarEliminacion}
              >
                Eliminar transportista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
