// TransportistasPage.jsx — Listado y gestión de transportistas (admin).
// Ruta: /admin/transportistas
// Diseño: Linear / Vercel (Minimalist Dark Dashboard).

import { useState, useEffect, useMemo } from 'react';
import {
  obtenerTransportistas,
  crearTransportista,
  modificarTransportista,
  eliminarTransportista,
} from '../../../services/transportistas.service.js';
import './TransportistasPage.css';

export default function TransportistasPage() {
  const [transportistas, setTransportistas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Filtros y ordenamiento
  const [busqueda, setBusqueda] = useState('');
  const [criterioOrden, setCriterioOrden] = useState('alfabetico');
  const [direccionOrden, setDireccionOrden] = useState('asc');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [simularBaseVacia, setSimularBaseVacia] = useState(false);

  // Alertas flotantes (Toast)
  const [alerta, setAlerta] = useState(null);

  // Modal: Cargar transportista (Alta)
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [formDataCrear, setFormDataCrear] = useState({
    nombre: '', apellido: '', email: '', telefono: '', vehiculo: '', password: '',
  });

  // Ficha Personal del Empleado
  const [fichaTransportista, setFichaTransportista] = useState(null); // transportista seleccionado
  const [modoFicha, setModoFicha] = useState('ver');   // 'ver' | 'editar' | 'confirmarEliminar'
  const [formDataEditar, setFormDataEditar] = useState({});

  // Auto-cierre de alerta a los 5 segundos
  useEffect(() => {
    if (!alerta) return;
    const t = setTimeout(() => setAlerta(null), 5000);
    return () => clearTimeout(t);
  }, [alerta]);

  // Carga inicial de transportistas
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

  const transportistasFiltrados = useMemo(() => {
    let resultado = [...listaBase];
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      resultado = resultado.filter((t) => {
        const nombre = `${t.nombre} ${t.apellido}`.toLowerCase();
        return nombre.includes(q) || (t.email || '').toLowerCase().includes(q) || (t.telefono || '').toLowerCase().includes(q);
      });
    }
    if (filtroEstado !== 'TODOS') resultado = resultado.filter((t) => t.estado === filtroEstado);
    resultado.sort((a, b) => {
      if (criterioOrden === 'alfabetico') {
        const comp = `${a.nombre} ${a.apellido}`.toLowerCase().localeCompare(`${b.nombre} ${b.apellido}`.toLowerCase());
        return direccionOrden === 'asc' ? comp : -comp;
      }
      if (criterioOrden === 'antiguedad') {
        const diff = new Date(a.createdAt) - new Date(b.createdAt);
        return direccionOrden === 'asc' ? diff : -diff;
      }
      return 0;
    });
    return resultado;
  }, [listaBase, busqueda, criterioOrden, direccionOrden, filtroEstado]);

  function handleCambioCriterio(c) { setCriterioOrden(c); setDireccionOrden('asc'); }
  function handleInvertirOrden() { setDireccionOrden((p) => p === 'asc' ? 'desc' : 'asc'); }
  function handleResetFiltros() { setBusqueda(''); setCriterioOrden('alfabetico'); setDireccionOrden('asc'); setFiltroEstado('TODOS'); }

  function formatearFecha(f) {
    if (!f) return '-';
    return new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const etiquetaDireccion = useMemo(() => {
    if (criterioOrden === 'alfabetico') return direccionOrden === 'asc' ? 'A → Z' : 'Z → A';
    return direccionOrden === 'asc' ? 'Más antiguos' : 'Más recientes';
  }, [criterioOrden, direccionOrden]);

  const hayFiltrosActivos = busqueda.trim() !== '' || filtroEstado !== 'TODOS' || criterioOrden !== 'alfabetico' || direccionOrden !== 'asc';

  // ── Abrir Ficha Personal ─────────────────────────────────────────
  function handleAbrirFicha(transportista) {
    setFichaTransportista(transportista);
    setFormDataEditar({
      nombre: transportista.nombre,
      apellido: transportista.apellido,
      email: transportista.email,
      telefono: transportista.telefono,
      vehiculo: transportista.vehiculo || '',
      estado: transportista.estado,
    });
    setModoFicha('ver');
  }

  function handleCerrarFicha() {
    setFichaTransportista(null);
    setModoFicha('ver');
  }

  // ── HISTORIA 1: CARGAR TRANSPORTISTA (ALTA) ──────────────────────
  function handleChangeCrear(e) {
    const { name, value } = e.target;
    setFormDataCrear((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmitCrear(e) {
    e.preventDefault();
    const emailNorm = formDataCrear.email.trim().toLowerCase();

    if (!formDataCrear.nombre.trim() || !formDataCrear.apellido.trim() || !formDataCrear.email.trim() ||
        !formDataCrear.telefono.trim() || !formDataCrear.vehiculo.trim() || !formDataCrear.password.trim()) {
      setAlerta({ tipo: 'error', mensaje: 'Por favor, completá todos los campos requeridos.' });
      return;
    }

    // Escenario 2: email duplicado
    if (transportistas.some((t) => t.email.toLowerCase() === emailNorm)) {
      setAlerta({ tipo: 'error', mensaje: 'Operación no permitida: el correo electrónico ya pertenece a otro usuario registrado' });
      return;
    }

    // Escenario 3: contraseña débil (mínimo 8 caracteres, letra y número)
    const pwd = formDataCrear.password;
    if (pwd.length < 8 || !/[a-zA-Z]/.test(pwd) || !/\d/.test(pwd)) {
      setAlerta({ tipo: 'error', mensaje: 'La contraseña no cumple con los estándares de seguridad requeridos' });
      return;
    }

    // Escenario 1: alta exitosa
    try {
      const res = await crearTransportista({
        nombre: formDataCrear.nombre.trim(),
        apellido: formDataCrear.apellido.trim(),
        email: emailNorm,
        telefono: formDataCrear.telefono.trim(),
        vehiculo: formDataCrear.vehiculo.trim(),
        password: pwd,
      });
      const creado = res.data || { ...formDataCrear, id: Date.now(), email: emailNorm, createdAt: new Date().toISOString(), estado: 'ACTIVO', rol: 'REPARTIDOR' };
      setTransportistas((p) => [creado, ...p]);
      setFormDataCrear({ nombre: '', apellido: '', email: '', telefono: '', vehiculo: '', password: '' });
      setMostrarModalCrear(false);
      setAlerta({ tipo: 'success', mensaje: 'El usuario transportista ha sido creado con éxito' });
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message || 'Error al crear la cuenta.' });
    }
  }

  // ── HISTORIA: MODIFICAR TRANSPORTISTA ────────────────────────────
  function handleChangeEditar(e) {
    const { name, value } = e.target;
    setFormDataEditar((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmitEditar(e) {
    e.preventDefault();
    if (!formDataEditar.nombre.trim() || !formDataEditar.apellido.trim() ||
        !formDataEditar.email.trim() || !formDataEditar.telefono.trim() ||
        !formDataEditar.vehiculo.trim() || !formDataEditar.estado) {
      setAlerta({ tipo: 'error', mensaje: 'Debe completar todos los campos obligatorios con un formato válido.' });
      return;
    }

    try {
      const res = await modificarTransportista(fichaTransportista.id, formDataEditar);
      const actualizado = res.data?.transportista || { ...fichaTransportista, ...formDataEditar };
      setTransportistas((p) => p.map((t) => t.id === fichaTransportista.id ? actualizado : t));
      setFichaTransportista(actualizado);
      setModoFicha('ver');
      setAlerta({ tipo: 'success', mensaje: 'Los datos del transportista han sido actualizados con éxito.' });
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message || 'Error al actualizar los datos.' });
    }
  }

  // ── HISTORIA 2: ELIMINAR TRANSPORTISTA ───────────────────────────
  async function handleConfirmarEliminar() {
    try {
      await eliminarTransportista(fichaTransportista.id);
      setTransportistas((p) => p.filter((t) => t.id !== fichaTransportista.id));
      setAlerta({ tipo: 'success', mensaje: 'El transportista ha sido eliminado de forma correcta.' });
      handleCerrarFicha();
    } catch (err) {
      // Escenario 3: error registrado en log
      const logError = { fecha: new Date().toISOString(), origen: 'EliminarTransportista', error: err.message, id: fichaTransportista.id };
      try {
        const prev = JSON.parse(localStorage.getItem('sistema_errores') || '[]');
        localStorage.setItem('sistema_errores', JSON.stringify([...prev, logError]));
      } catch (_) {}
      console.error('[SISTEMA / LOGS / ERRORES]:', logError);
      setAlerta({ tipo: 'error', mensaje: 'Ocurrió un error al intentar eliminar el transportista. El error fue registrado en el sistema para su verificación.' });
    }
  }

  return (
    <div className="transportistas-container">

      {/* ── Toast Flotante ── */}
      {alerta && (
        <div className={`toast-notification toast-${alerta.tipo}`} role="alert">
          <div className="toast-content">
            <span className="toast-icon">
              {alerta.tipo === 'success' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              )}
            </span>
            <span className="toast-text">{alerta.mensaje}</span>
          </div>
          <button type="button" className="toast-close" onClick={() => setAlerta(null)}>&times;</button>
        </div>
      )}

      {/* ── Encabezado ── */}
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
          {/* Botón principal: Cargar transportista (Historia 1) */}
          <button type="button" className="btn-action-primary" onClick={() => setMostrarModalCrear(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Cargar transportista</span>
          </button>

          {/* Toggle de prueba */}
          <button type="button" className={`btn-test-toggle ${simularBaseVacia ? 'activo' : ''}`} onClick={() => setSimularBaseVacia((p) => !p)} title="Alternar simulación de base vacía">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <span>{simularBaseVacia ? 'Restaurar datos' : 'Simular base vacía'}</span>
          </button>

          <div className="repartidores-count-pill">
            <span className="count-number">{transportistasFiltrados.length}</span>
            <span className="count-label">{transportistasFiltrados.length === 1 ? 'repartidor' : 'repartidores'}</span>
          </div>
        </div>
      </header>

      {/* ── Barra de Filtros ── */}
      <section className="command-bar" aria-label="Herramientas de filtrado">
        <div className="search-field">
          <svg className="search-field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" className="search-field-input" placeholder="Buscar por nombre, email o teléfono..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          {busqueda && (
            <button type="button" className="search-clear-btn" onClick={() => setBusqueda('')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
        </div>

        <div className="filters-group">
          <div className="segmented-control" role="group">
            {['TODOS', 'ACTIVO', 'INACTIVO'].map((e) => (
              <button key={e} type="button" className={`segmented-btn ${filtroEstado === e ? 'activo' : ''}`} onClick={() => setFiltroEstado(e)}>
                {e === 'TODOS' ? 'Todos' : e === 'ACTIVO' ? 'Activos' : 'Inactivos'}
              </button>
            ))}
          </div>
          <div className="toolbar-divider" />
          <div className="order-control">
            <label htmlFor="orden-select" className="order-label">Ordenar:</label>
            <div className="select-wrapper">
              <select id="orden-select" className="minimal-select" value={criterioOrden} onChange={(e) => handleCambioCriterio(e.target.value)}>
                <option value="alfabetico">Alfabéticamente</option>
                <option value="antiguedad">Antigüedad</option>
              </select>
              <svg className="select-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
            <button type="button" className={`btn-invert ${direccionOrden === 'desc' ? 'invertido' : ''}`} onClick={handleInvertirOrden}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" /></svg>
              <span>{etiquetaDireccion}</span>
            </button>
          </div>
          {hayFiltrosActivos && (
            <button type="button" className="btn-reset" onClick={handleResetFiltros}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
              <span>Restablecer</span>
            </button>
          )}
        </div>
      </section>

      {/* ── Tabla Principal ── */}
      {cargando ? (
        <div className="state-card loading"><div className="minimal-spinner" /><span className="loading-text">Cargando transportistas...</span></div>
      ) : listaBase.length === 0 ? (
        <div className="state-card empty-base text-only"><h2 className="empty-title">Aún no hay transportistas cargados en el sistema</h2></div>
      ) : transportistasFiltrados.length === 0 ? (
        <div className="state-card empty-filtered">
          <div className="empty-header-inline">
            <div className="empty-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
            </div>
            <h2 className="empty-title">No hay transportistas bajo este criterio</h2>
          </div>
          <p className="empty-description">No se encontraron repartidores que coincidan con la búsqueda o el estado seleccionado.</p>
          <button type="button" className="btn-action-primary" onClick={handleResetFiltros}>Limpiar filtros</button>
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
                    {/* Nombre interactivo → abre Ficha Personal */}
                    <div className="user-profile">
                      <div className={`user-avatar ${item.estado === 'INACTIVO' ? 'inactivo' : ''}`} aria-hidden="true">
                        {item.nombre.charAt(0)}{item.apellido.charAt(0)}
                      </div>
                      <div className="user-details">
                        <button
                          type="button"
                          className="user-name-btn"
                          onClick={() => handleAbrirFicha(item)}
                          title="Ver ficha personal"
                        >
                          {item.nombre} {item.apellido}
                        </button>
                        <span className="user-email">{item.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="col-phone"><span className="cell-phone">{item.telefono || '—'}</span></td>
                  <td className="col-vehicle"><span className="cell-vehicle">{item.vehiculo || '—'}</span></td>
                  <td className="col-status">
                    <span className={`status-pill ${item.estado === 'ACTIVO' ? 'activo' : 'inactivo'}`}>
                      <span className="status-dot" /><span className="status-label">{item.estado}</span>
                    </span>
                  </td>
                  <td className="col-date"><span className="cell-date font-mono">{formatearFecha(item.createdAt)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <footer className="table-footer">
            <span className="footer-metric">Mostrando {transportistasFiltrados.length} de {listaBase.length} repartidores</span>
            <span className="footer-legend">Directorio Activo</span>
          </footer>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CARGAR TRANSPORTISTA (HISTORIA 1 — ALTA)                   */}
      {/* ================================================================= */}
      {mostrarModalCrear && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-window">
            <div className="modal-header">
              <h2 className="modal-title">Cargar nuevo transportista</h2>
              <button type="button" className="modal-close-btn" onClick={() => setMostrarModalCrear(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmitCrear} noValidate className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="crear-nombre">Nombre *</label>
                  <input id="crear-nombre" type="text" name="nombre" placeholder="Ej. Lucas" value={formDataCrear.nombre} onChange={handleChangeCrear} />
                </div>
                <div className="form-group">
                  <label htmlFor="crear-apellido">Apellido *</label>
                  <input id="crear-apellido" type="text" name="apellido" placeholder="Ej. Gómez" value={formDataCrear.apellido} onChange={handleChangeCrear} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="crear-email">Correo Electrónico *</label>
                <input id="crear-email" type="email" name="email" placeholder="repartidor@repartosya.com" value={formDataCrear.email} onChange={handleChangeCrear} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="crear-telefono">Teléfono *</label>
                  <input id="crear-telefono" type="tel" name="telefono" placeholder="+54221456789" value={formDataCrear.telefono} onChange={handleChangeCrear} />
                </div>
                <div className="form-group">
                  <label htmlFor="crear-vehiculo">Vehículo *</label>
                  <input id="crear-vehiculo" type="text" name="vehiculo" placeholder="Ej. Moto / Camioneta" value={formDataCrear.vehiculo} onChange={handleChangeCrear} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="crear-password">Contraseña Temporal *</label>
                <input id="crear-password" type="password" name="password" placeholder="Mínimo 8 caracteres (letras y números)" value={formDataCrear.password} onChange={handleChangeCrear} />
                <span className="field-hint">Debe tener al menos 8 caracteres, letras y números.</span>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setMostrarModalCrear(false)}>Cancelar</button>
                <button type="submit" className="btn-modal-submit">Guardar transportista</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* FICHA PERSONAL DEL EMPLEADO                                        */}
      {/* ================================================================= */}
      {fichaTransportista && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-window modal-window-wide">

            {/* ── Modo: VER FICHA ── */}
            {modoFicha === 'ver' && (
              <>
                <div className="modal-header">
                  <h2 className="modal-title">Ficha del Transportista</h2>
                  <button type="button" className="modal-close-btn" onClick={handleCerrarFicha}>&times;</button>
                </div>

                {/* Avatar + Nombre + Estado */}
                <div className="ficha-perfil">
                  <div className={`ficha-avatar ${fichaTransportista.estado === 'INACTIVO' ? 'inactivo' : ''}`}>
                    {fichaTransportista.nombre.charAt(0)}{fichaTransportista.apellido.charAt(0)}
                  </div>
                  <div className="ficha-identidad">
                    <h3 className="ficha-nombre">{fichaTransportista.nombre} {fichaTransportista.apellido}</h3>
                    <span className={`status-pill ${fichaTransportista.estado === 'ACTIVO' ? 'activo' : 'inactivo'}`}>
                      <span className="status-dot" /><span className="status-label">{fichaTransportista.estado}</span>
                    </span>
                  </div>
                </div>

                {/* Datos del empleado */}
                <div className="ficha-datos">
                  <div className="ficha-dato-item">
                    <span className="ficha-dato-label">Correo electrónico</span>
                    <span className="ficha-dato-valor">{fichaTransportista.email}</span>
                  </div>
                  <div className="ficha-dato-item">
                    <span className="ficha-dato-label">Teléfono de contacto</span>
                    <span className="ficha-dato-valor">{fichaTransportista.telefono || '—'}</span>
                  </div>
                  <div className="ficha-dato-item">
                    <span className="ficha-dato-label">Vehículo / Modelo</span>
                    <span className="ficha-dato-valor">{fichaTransportista.vehiculo || '—'}</span>
                  </div>
                  <div className="ficha-dato-item">
                    <span className="ficha-dato-label">Alta en el sistema</span>
                    <span className="ficha-dato-valor font-mono">{formatearFecha(fichaTransportista.createdAt)}</span>
                  </div>
                  <div className="ficha-dato-item">
                    <span className="ficha-dato-label">Rol</span>
                    <span className="ficha-dato-valor">{fichaTransportista.rol || 'REPARTIDOR'}</span>
                  </div>
                </div>

                {/* Acciones de la Ficha */}
                <div className="modal-actions ficha-acciones">
                  <button type="button" className="btn-modal-cancel" onClick={handleCerrarFicha}>Cerrar</button>
                  <button type="button" className="btn-modal-danger" onClick={() => setModoFicha('confirmarEliminar')}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    Eliminar transportista
                  </button>
                  <button type="button" className="btn-modal-submit" onClick={() => setModoFicha('editar')}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    Modificar datos
                  </button>
                </div>
              </>
            )}

            {/* ── Modo: EDITAR DATOS ── */}
            {modoFicha === 'editar' && (
              <>
                <div className="modal-header">
                  <h2 className="modal-title">Modificar datos — {fichaTransportista.nombre} {fichaTransportista.apellido}</h2>
                  <button type="button" className="modal-close-btn" onClick={() => setModoFicha('ver')}>&times;</button>
                </div>
                <form onSubmit={handleSubmitEditar} noValidate className="modal-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="editar-nombre">Nombre *</label>
                      <input id="editar-nombre" type="text" name="nombre" value={formDataEditar.nombre} onChange={handleChangeEditar} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editar-apellido">Apellido *</label>
                      <input id="editar-apellido" type="text" name="apellido" value={formDataEditar.apellido} onChange={handleChangeEditar} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="editar-email">Correo Electrónico *</label>
                    <input id="editar-email" type="email" name="email" value={formDataEditar.email} onChange={handleChangeEditar} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="editar-telefono">Teléfono *</label>
                      <input id="editar-telefono" type="tel" name="telefono" value={formDataEditar.telefono} onChange={handleChangeEditar} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editar-vehiculo">Vehículo *</label>
                      <input id="editar-vehiculo" type="text" name="vehiculo" value={formDataEditar.vehiculo} onChange={handleChangeEditar} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="editar-estado">Estado *</label>
                    <div className="select-wrapper select-wrapper-full">
                      <select id="editar-estado" name="estado" className="minimal-select select-full" value={formDataEditar.estado} onChange={handleChangeEditar}>
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="INACTIVO">INACTIVO</option>
                      </select>
                      <svg className="select-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-modal-cancel" onClick={() => setModoFicha('ver')}>← Volver</button>
                    <button type="submit" className="btn-modal-submit">Guardar cambios</button>
                  </div>
                </form>
              </>
            )}

            {/* ── Modo: CONFIRMAR ELIMINACIÓN ── */}
            {modoFicha === 'confirmarEliminar' && (
              <>
                <div className="modal-header">
                  <h2 className="modal-title">Confirmar baja del transportista</h2>
                  <button type="button" className="modal-close-btn" onClick={() => setModoFicha('ver')}>&times;</button>
                </div>
                <div className="ficha-perfil">
                  <div className={`ficha-avatar ${fichaTransportista.estado === 'INACTIVO' ? 'inactivo' : ''}`}>
                    {fichaTransportista.nombre.charAt(0)}{fichaTransportista.apellido.charAt(0)}
                  </div>
                  <div className="ficha-identidad">
                    <h3 className="ficha-nombre">{fichaTransportista.nombre} {fichaTransportista.apellido}</h3>
                    <span className="user-email">{fichaTransportista.email}</span>
                  </div>
                </div>
                <p className="modal-description" style={{ marginTop: '16px' }}>
                  ¿Estás seguro de que deseás eliminar este transportista del sistema?
                  Ya no podrá acceder ni recibir pedidos. Esta acción no se puede deshacer.
                </p>
                <div className="modal-actions">
                  <button type="button" className="btn-modal-cancel" onClick={() => setModoFicha('ver')}>← Cancelar</button>
                  <button type="button" className="btn-modal-danger" onClick={handleConfirmarEliminar}>Sí, eliminar transportista</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
