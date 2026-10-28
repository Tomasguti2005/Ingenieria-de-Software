// TransportistasPage.jsx — Listado y gestión de transportistas (admin).
// Ruta: /admin/transportistas
// Inspiración de diseño: Linear / Vercel (Minimalist Dark Dashboard).
// Cero emojis, uso exclusivo de iconos vectoriales SVG limpios.

import { useState, useEffect, useMemo } from 'react';
import {
  obtenerTransportistas,
  crearTransportista,
  eliminarTransportista,
} from '../../../services/transportistas.service.js';
import './TransportistasPage.css';

export default function TransportistasPage() {
  const [transportistas, setTransportistas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados de filtros y ordenamiento
  const [busqueda, setBusqueda] = useState('');
  const [criterioOrden, setCriterioOrden] = useState('alfabetico'); // 'alfabetico' | 'antiguedad'
  const [direccionOrden, setDireccionOrden] = useState('asc');       // 'asc' | 'desc'
  const [filtroEstado, setFiltroEstado] = useState('TODOS');         // 'TODOS' | 'ACTIVO' | 'INACTIVO'

  // Modo de prueba para simular base sin datos
  const [simularBaseVacia, setSimularBaseVacia] = useState(false);

  // ─── Estados para Historias de Usuario ──────────────────────────────────────
  // 1. Alertas de feedback flotantes (Toast)
  const [alerta, setAlerta] = useState(null);

  // 2. Modal: Crear Transportista
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [formDataCrear, setFormDataCrear] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    vehiculo: '',
    password: '',
  });

  // 3. Modal: Eliminar Transportista
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [transportistaSeleccionadoId, setTransportistaSeleccionadoId] = useState('');

  // Auto-cierre de alertas a los 5 segundos
  useEffect(() => {
    if (!alerta) return;
    const timer = setTimeout(() => {
      setAlerta(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [alerta]);

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      try {
        const data = await obtenerTransportistas();
        setTransportistas(data);
      } catch (err) {
        console.error('Error al cargar transportistas:', err);
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  const listaBase = simularBaseVacia ? [] : transportistas;

  // Filtrado y ordenamiento en tiempo real
  const transportistasFiltrados = useMemo(() => {
    let resultado = [...listaBase];

    // 1. Filtro por término de búsqueda (nombre, apellido, email, teléfono)
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      resultado = resultado.filter((t) => {
        const nombreCompleto = `${t.nombre} ${t.apellido}`.toLowerCase();
        const email = (t.email || '').toLowerCase();
        const telefono = (t.telefono || '').toLowerCase();
        return nombreCompleto.includes(q) || email.includes(q) || telefono.includes(q);
      });
    }

    // 2. Filtro por estado
    if (filtroEstado !== 'TODOS') {
      resultado = resultado.filter((t) => t.estado === filtroEstado);
    }

    // 3. Ordenamiento
    resultado.sort((a, b) => {
      if (criterioOrden === 'alfabetico') {
        const nomA = `${a.nombre} ${a.apellido}`.toLowerCase();
        const nomB = `${b.nombre} ${b.apellido}`.toLowerCase();
        const comp = nomA.localeCompare(nomB);
        return direccionOrden === 'asc' ? comp : -comp;
      }

      if (criterioOrden === 'antiguedad') {
        const fechaA = new Date(a.createdAt).getTime();
        const fechaB = new Date(b.createdAt).getTime();
        return direccionOrden === 'asc' ? fechaA - fechaB : fechaB - fechaA;
      }

      return 0;
    });

    return resultado;
  }, [listaBase, busqueda, criterioOrden, direccionOrden, filtroEstado]);

  function handleCambioCriterio(nuevoCriterio) {
    setCriterioOrden(nuevoCriterio);
    setDireccionOrden('asc');
  }

  function handleInvertirOrden() {
    setDireccionOrden((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }

  function handleResetFiltros() {
    setBusqueda('');
    setCriterioOrden('alfabetico');
    setDireccionOrden('asc');
    setFiltroEstado('TODOS');
  }

  function formatearFecha(fechaStr) {
    if (!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const etiquetaDireccion = useMemo(() => {
    if (criterioOrden === 'alfabetico') {
      return direccionOrden === 'asc' ? 'A → Z' : 'Z → A';
    }
    return direccionOrden === 'asc' ? 'Más antiguos' : 'Más recientes';
  }, [criterioOrden, direccionOrden]);

  const hayFiltrosActivos =
    busqueda.trim() !== '' ||
    filtroEstado !== 'TODOS' ||
    criterioOrden !== 'alfabetico' ||
    direccionOrden !== 'asc';

  // ─── Manejo de Formularios y Modales ────────────────────────────────────────

  // Manejo de cambios en el formulario de alta
  function handleChangeCrear(e) {
    const { name, value } = e.target;
    setFormDataCrear((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // ==========================================
  // HISTORIA 1: CREAR CUENTA DE TRANSPORTISTA
  // ==========================================
  async function handleSubmitCrear(e) {
    e.preventDefault();

    const emailNormalizado = formDataCrear.email.trim().toLowerCase();

    // 1. Campos obligatorios
    if (
      !formDataCrear.nombre.trim() ||
      !formDataCrear.apellido.trim() ||
      !formDataCrear.email.trim() ||
      !formDataCrear.telefono.trim() ||
      !formDataCrear.vehiculo.trim() ||
      !formDataCrear.password.trim()
    ) {
      setAlerta({
        tipo: 'error',
        mensaje: 'Por favor, completá todos los campos requeridos.',
      });
      return;
    }

    // 2. Escenario 2: Registro rechazado por email duplicado
    const emailExiste = transportistas.some(
      (t) => t.email.toLowerCase() === emailNormalizado
    );

    if (emailExiste) {
      setAlerta({
        tipo: 'error',
        mensaje:
          'Operación no permitida: el correo electrónico ya pertenece a otro usuario registrado',
      });
      return;
    }

    // 3. Escenario 3: Registro rechazado por contraseña débil
    // Estándar de seguridad: al menos 8 caracteres, al menos una letra y un número
    const tieneLargoMinimo = formDataCrear.password.length >= 8;
    const tieneLetra = /[a-zA-Z]/.test(formDataCrear.password);
    const tieneNumero = /\d/.test(formDataCrear.password);

    if (!tieneLargoMinimo || !tieneLetra || !tieneNumero) {
      setAlerta({
        tipo: 'error',
        mensaje: 'La contraseña no cumple con los estándares de seguridad requeridos',
      });
      return;
    }

    // 4. Escenario 1: Alta de cuenta exitosa
    const nuevoTransportista = {
      nombre: formDataCrear.nombre.trim(),
      apellido: formDataCrear.apellido.trim(),
      email: emailNormalizado,
      telefono: formDataCrear.telefono.trim(),
      vehiculo: formDataCrear.vehiculo.trim(),
      password: formDataCrear.password,
    };

    try {
      const res = await crearTransportista(nuevoTransportista);
      const creado = res.data || {
        ...nuevoTransportista,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        estado: 'ACTIVO',
        rol: 'REPARTIDOR',
      };

      setTransportistas((prev) => [creado, ...prev]);

      setFormDataCrear({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        vehiculo: '',
        password: '',
      });

      setMostrarModalCrear(false);

      setAlerta({
        tipo: 'success',
        mensaje: 'El usuario transportista ha sido creado con éxito',
      });
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.message || 'Error al crear la cuenta del transportista.',
      });
    }
  }

  // ==========================================
  // HISTORIA 2: ELIMINAR TRANSPORTISTA
  // ==========================================
  function handleAbrirEliminar() {
    setTransportistaSeleccionadoId('');
    setMostrarModalEliminar(true);
  }

  function handleCerrarEliminar() {
    setMostrarModalEliminar(false);
    setTransportistaSeleccionadoId('');
  }

  async function handleConfirmarEliminacion() {
    // Escenario 2: No se ha seleccionado al repartidor
    if (!transportistaSeleccionadoId) {
      setAlerta({
        tipo: 'error',
        mensaje: 'Debe seleccionar un transportista de la lista para proceder con la eliminación.',
      });
      return;
    }

    try {
      const idNum = Number(transportistaSeleccionadoId);
      const existe = transportistas.some((t) => t.id === idNum);

      if (!existe) {
        throw new Error(`El transportista con ID ${transportistaSeleccionadoId} no fue encontrado.`);
      }

      await eliminarTransportista(idNum);

      // Escenario 1: Se elimina al repartidor de manera exitosa
      setTransportistas((prev) => prev.filter((t) => t.id !== idNum));

      setAlerta({
        tipo: 'success',
        mensaje: 'El transportista ha sido eliminado de forma correcta.',
      });

      handleCerrarEliminar();
    } catch (error) {
      // Escenario 3: Error al eliminar (almacenar en registro de errores del sistema)
      const logError = {
        fecha: new Date().toISOString(),
        origen: 'EliminarTransportista',
        error: error.message,
        idTransportistaIntentado: transportistaSeleccionadoId,
      };

      try {
        const erroresGuardados = JSON.parse(localStorage.getItem('sistema_errores') || '[]');
        erroresGuardados.push(logError);
        localStorage.setItem('sistema_errores', JSON.stringify(erroresGuardados));
      } catch (_) {}

      console.error('[SISTEMA / LOGS / ERRORES]:', logError);

      setAlerta({
        tipo: 'error',
        mensaje:
          'Ocurrió un error al intentar eliminar el transportista. El error fue registrado en el sistema para su verificación.',
      });
    }
  }

  return (
    <div className="transportistas-container">
      {/* ── Notificación Flotante (Toast) ── */}
      {alerta && (
        <div className={`toast-notification toast-${alerta.tipo}`} role="alert">
          <div className="toast-content">
            <span className="toast-icon">
              {alerta.tipo === 'success' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </span>
            <span className="toast-text">{alerta.mensaje}</span>
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => setAlerta(null)}
            title="Cerrar aviso"
          >
            &times;
          </button>
        </div>
      )}

      {/* ── Encabezado Principal ── */}
      <header className="page-header">
        <div className="header-meta">
          <div className="header-breadcrumb">
            <span>Repartos Ya</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Transportistas</span>
          </div>
          <h1 className="header-title">Gestión de Transportistas</h1>
        </div>

        <div className="header-actions">
          {/* Botón de la Historia 1: Crear cuenta al transportista */}
          <button
            type="button"
            className="btn-action-primary"
            onClick={() => setMostrarModalCrear(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Nuevo transportista</span>
          </button>

          {/* Botón de la Historia 2: Eliminar transportista */}
          <button
            type="button"
            className="btn-action-danger"
            onClick={handleAbrirEliminar}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Eliminar transportista</span>
          </button>

          {/* Toggle de simulación de base vacía para pruebas */}
          <button
            type="button"
            className={`btn-test-toggle ${simularBaseVacia ? 'activo' : ''}`}
            onClick={() => setSimularBaseVacia((prev) => !prev)}
            title="Alternar simulación de base de datos vacía"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <span>{simularBaseVacia ? 'Restaurar datos' : 'Simular base vacía'}</span>
          </button>

          <div className="repartidores-count-pill">
            <span className="count-number">{transportistasFiltrados.length}</span>
            <span className="count-label">
              {transportistasFiltrados.length === 1 ? 'repartidor' : 'repartidores'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Barra de Herramientas y Filtros ── */}
      <section className="command-bar" aria-label="Herramientas de filtrado">
        {/* Buscador */}
        <div className="search-field">
          <svg className="search-field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-field-input"
            placeholder="Buscar por nombre, email o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setBusqueda('')}
              title="Borrar búsqueda"
              aria-label="Borrar búsqueda"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Grupo de Filtros */}
        <div className="filters-group">
          {/* Filtro por Estado: Píldoras Segmentadas */}
          <div className="segmented-control" role="group" aria-label="Filtrar por estado">
            <button
              type="button"
              className={`segmented-btn ${filtroEstado === 'TODOS' ? 'activo' : ''}`}
              onClick={() => setFiltroEstado('TODOS')}
            >
              Todos
            </button>
            <button
              type="button"
              className={`segmented-btn ${filtroEstado === 'ACTIVO' ? 'activo' : ''}`}
              onClick={() => setFiltroEstado('ACTIVO')}
            >
              Activos
            </button>
            <button
              type="button"
              className={`segmented-btn ${filtroEstado === 'INACTIVO' ? 'activo' : ''}`}
              onClick={() => setFiltroEstado('INACTIVO')}
            >
              Inactivos
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* Criterio de Orden */}
          <div className="order-control">
            <label htmlFor="orden-select" className="order-label">
              Ordenar:
            </label>
            <div className="select-wrapper">
              <select
                id="orden-select"
                className="minimal-select"
                value={criterioOrden}
                onChange={(e) => handleCambioCriterio(e.target.value)}
              >
                <option value="alfabetico">Alfabéticamente</option>
                <option value="antiguedad">Antigüedad</option>
              </select>
              <svg className="select-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {/* Botón de Inversión */}
            <button
              type="button"
              className={`btn-invert ${direccionOrden === 'desc' ? 'invertido' : ''}`}
              onClick={handleInvertirOrden}
              title={`Invertir orden (actual: ${etiquetaDireccion})`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 16 4 4 4-4" />
                <path d="M7 20V4" />
                <path d="m21 8-4-4-4 4" />
                <path d="M17 4v16" />
              </svg>
              <span>{etiquetaDireccion}</span>
            </button>
          </div>

          {/* Botón Reset */}
          {hayFiltrosActivos && (
            <button
              type="button"
              className="btn-reset"
              onClick={handleResetFiltros}
              title="Restablecer todos los filtros"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Restablecer</span>
            </button>
          )}
        </div>
      </section>

      {/* ── Contenido Principal / Tabla ── */}
      {cargando ? (
        <div className="state-card loading">
          <div className="minimal-spinner" />
          <span className="loading-text">Cargando transportistas...</span>
        </div>
      ) : listaBase.length === 0 ? (
        <div className="state-card empty-base text-only">
          <h2 className="empty-title">Aún no hay transportistas cargados en el sistema</h2>
        </div>
      ) : transportistasFiltrados.length === 0 ? (
        <div className="state-card empty-filtered">
          <div className="empty-header-inline">
            <div className="empty-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
            <h2 className="empty-title">No hay transportistas bajo este criterio</h2>
          </div>
          <p className="empty-description">
            No se encontraron repartidores que coincidan con la búsqueda o el estado seleccionado.
          </p>
          <button
            type="button"
            className="btn-action-primary"
            onClick={handleResetFiltros}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-user">Repartidor</th>
                <th className="col-phone">Teléfono</th>
                <th className="col-vehicle">Vehículo</th>
                <th className="col-status">Estado</th>
                <th className="col-date">Alta en Sistema</th>
              </tr>
            </thead>
            <tbody>
              {transportistasFiltrados.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="col-user">
                    <div className="user-profile">
                      <div
                        className={`user-avatar ${item.estado === 'INACTIVO' ? 'inactivo' : ''}`}
                        aria-hidden="true"
                      >
                        {item.nombre.charAt(0)}
                        {item.apellido.charAt(0)}
                      </div>
                      <div className="user-details">
                        <span className="user-name">
                          {item.nombre} {item.apellido}
                        </span>
                        <span className="user-email">{item.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="col-phone">
                    <span className="cell-phone">{item.telefono || '—'}</span>
                  </td>
                  <td className="col-vehicle">
                    <span className="cell-vehicle">{item.vehiculo || '—'}</span>
                  </td>
                  <td className="col-status">
                    <span
                      className={`status-pill ${
                        item.estado === 'ACTIVO' ? 'activo' : 'inactivo'
                      }`}
                    >
                      <span className="status-dot" />
                      <span className="status-label">{item.estado}</span>
                    </span>
                  </td>
                  <td className="col-date">
                    <span className="cell-date font-mono">
                      {formatearFecha(item.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <footer className="table-footer">
            <span className="footer-metric">
              Mostrando {transportistasFiltrados.length} de {listaBase.length} repartidores
            </span>
            <span className="footer-legend">Directorio Activo</span>
          </footer>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL HISTORIA 1: CREAR CUENTA AL TRANSPORTISTA              */}
      {/* ============================================================ */}
      {mostrarModalCrear && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-window">
            <div className="modal-header">
              <h2 className="modal-title">Registrar Nuevo Transportista</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setMostrarModalCrear(false)}
                title="Cerrar modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitCrear} noValidate className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre *</label>
                  <input
                    id="nombre"
                    type="text"
                    name="nombre"
                    placeholder="Ej. Lucas"
                    value={formDataCrear.nombre}
                    onChange={handleChangeCrear}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="apellido">Apellido *</label>
                  <input
                    id="apellido"
                    type="text"
                    name="apellido"
                    placeholder="Ej. Gómez"
                    value={formDataCrear.apellido}
                    onChange={handleChangeCrear}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Correo Electrónico *</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="repartidor@repartosya.com"
                  value={formDataCrear.email}
                  onChange={handleChangeCrear}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="telefono">Teléfono *</label>
                  <input
                    id="telefono"
                    type="tel"
                    name="telefono"
                    placeholder="+54 221 456-7890"
                    value={formDataCrear.telefono}
                    onChange={handleChangeCrear}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vehiculo">Vehículo / Modelo *</label>
                  <input
                    id="vehiculo"
                    type="text"
                    name="vehiculo"
                    placeholder="Ej. Moto / Camioneta"
                    value={formDataCrear.vehiculo}
                    onChange={handleChangeCrear}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña Temporal *</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Mínimo 8 caracteres (letras y números)"
                  value={formDataCrear.password}
                  onChange={handleChangeCrear}
                />
                <span className="field-hint">
                  Debe tener al menos 8 caracteres e incluir letras y números.
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setMostrarModalCrear(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-modal-submit">
                  Guardar transportista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL HISTORIA 2: ELIMINAR AL TRANSPORTISTA                  */}
      {/* ============================================================ */}
      {mostrarModalEliminar && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-window modal-window-wide">
            <div className="modal-header">
              <h2 className="modal-title">Eliminar al Transportista</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCerrarEliminar}
                title="Cerrar modal"
              >
                &times;
              </button>
            </div>

            <p className="modal-description">
              Seleccioná de la lista al transportista que deseás dar de baja y presioná el botón de eliminar.
            </p>

            {transportistas.length === 0 ? (
              <div className="empty-base text-only" style={{ padding: '2rem 0' }}>
                <p className="empty-title">No hay transportistas cargados en el sistema para eliminar.</p>
              </div>
            ) : (
              <div className="modal-table-wrap">
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th style={{ width: '48px', textAlign: 'center' }}>Elegir</th>
                      <th>Nombre y Apellido</th>
                      <th>Vehículo</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transportistas.map((t) => {
                      const seleccionado = transportistaSeleccionadoId === String(t.id);
                      return (
                        <tr
                          key={t.id}
                          className={seleccionado ? 'row-selected' : ''}
                          onClick={() => setTransportistaSeleccionadoId(String(t.id))}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="radio"
                              name="selTransportista"
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
                          <td>{t.vehiculo || '—'}</td>
                          <td>{t.email}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={handleCerrarEliminar}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-modal-danger"
                onClick={handleConfirmarEliminacion}
              >
                Eliminar transportista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
