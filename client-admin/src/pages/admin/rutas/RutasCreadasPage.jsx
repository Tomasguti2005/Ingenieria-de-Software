// RutasCreadasPage.jsx — Listado y gestión de rutas creadas.
// Permite visualizar rutas, modificar sus pedidos y cambiar/eliminar el transportista a cargo.

import { useState, useEffect } from 'react';
import {
  obtenerRutasCreadas,
  obtenerTransportistasParaRuta,
  obtenerPedidosParaRuta,
  asignarPedidoARuta,
  desasignarPedidosDeRuta,
  reordenarPedidosDeRuta,
  asignarTransportistaARuta,
  removerTransportistaDeRuta,
  eliminarRuta,
} from '../../../services/rutas.service.js';
import './RutasCreadasPage.css';
import './CrearRutaPage.css';

export default function RutasCreadasPage() {
  const [rutas, setRutas] = useState([]);
  const [transportistas, setTransportistas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [alerta, setAlerta] = useState(null);

  // Modales
  const [rutaEditarPedidos, setRutaEditarPedidos] = useState(null);
  const [rutaEditarTransportista, setRutaEditarTransportista] = useState(null);
  const [nuevoTransportistaId, setNuevoTransportistaId] = useState('');
  const [desplegableChoferModalAbierto, setDesplegableChoferModalAbierto] = useState(false);
  const [rutaConfirmarEliminar, setRutaConfirmarEliminar] = useState(null);

  // Reordenamiento de pedidos en el modal (null = sin cambios pendientes)
  const [ordenPedidosEditado, setOrdenPedidosEditado] = useState(null);
  const [indiceArrastrado, setIndiceArrastrado] = useState(null);

  // Filtros del listado de rutas
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODAS');
  const [filtroTransportista, setFiltroTransportista] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  // Auto-cierre de alertas a los 5 segundos
  useEffect(() => {
    if (!alerta) return;
    const t = setTimeout(() => setAlerta(null), 5000);
    return () => clearTimeout(t);
  }, [alerta]);

  // Carga inicial
  async function cargarDatos() {
    setCargando(true);
    try {
      const [rutasData, transData, pedidosData] = await Promise.all([
        obtenerRutasCreadas(),
        obtenerTransportistasParaRuta(),
        obtenerPedidosParaRuta(),
      ]);
      setRutas(rutasData);
      setTransportistas(transData);
      setPedidos(pedidosData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setAlerta({ tipo: 'error', mensaje: 'No se pudieron cargar las rutas.' });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    let componenteActivo = true;

    async function cargarDatosIniciales() {
      try {
        const [rutasData, transData, pedidosData] = await Promise.all([
          obtenerRutasCreadas(),
          obtenerTransportistasParaRuta(),
          obtenerPedidosParaRuta(),
        ]);
        if (!componenteActivo) return;
        setRutas(rutasData);
        setTransportistas(transData);
        setPedidos(pedidosData);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        if (componenteActivo) {
          setAlerta({ tipo: 'error', mensaje: 'No se pudieron cargar las rutas y los datos relacionados.' });
        }
      } finally {
        if (componenteActivo) setCargando(false);
      }
    }

    cargarDatosIniciales();
    return () => {
      componenteActivo = false;
    };
  }, []);

  // Formatear fecha
  function formatearFecha(f) {
    if (!f) return '-';
    return new Date(f).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Un pedido retirado (o posterior) bloquea su eliminación/reordenamiento y el borrado de la ruta
  const ESTADOS_PEDIDO_RETIRADO = ['RETIRADO', 'EN_CAMINO', 'ENTREGADO', 'FALLIDO'];
  const esPedidoRetirado = (p) => ESTADOS_PEDIDO_RETIRADO.includes(p.estado);
  const esRutaIniciada = (ruta) => (ruta.pedidos || []).some(esPedidoRetirado);
  // Terminada: iniciada y con todos sus pedidos entregados, fallidos o cancelados
  const esRutaTerminada = (ruta) =>
    esRutaIniciada(ruta) &&
    (ruta.pedidos || []).every((p) => ['ENTREGADO', 'FALLIDO', 'CANCELADO'].includes(p.estado));
  // Vencida: creada un día anterior y nunca terminada (ya no bloquea al transportista)
  const esRutaVencida = (ruta) => {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    return !esRutaTerminada(ruta) && new Date(ruta.createdAt) < inicioHoy;
  };
  const estadoDeRuta = (ruta) => {
    if (esRutaTerminada(ruta)) return 'TERMINADA';
    if (esRutaVencida(ruta)) return 'VENCIDA';
    if (esRutaIniciada(ruta)) return 'EN_CURSO';
    return 'ASIGNADA';
  };
  const claseEstadoRuta = (ruta) => {
    if (esRutaTerminada(ruta)) return 'ruta-card-terminada';
    if (esRutaVencida(ruta)) return 'ruta-card-vencida';
    if (esRutaIniciada(ruta)) return 'ruta-card-iniciada';
    return '';
  };

  function abrirModalPedidos(ruta) {
    setOrdenPedidosEditado(null);
    setRutaEditarPedidos(ruta);
  }

  // ── 1. MODIFICAR PEDIDOS ──────────────────────────────────────────
  async function handleAgregarPedidoARuta(pedidoId) {
    if (!rutaEditarPedidos) return;
    try {
      await asignarPedidoARuta(rutaEditarPedidos.id, pedidoId);
      setAlerta({ tipo: 'success', mensaje: 'Pedido asignado a la ruta correctamente.' });
      await cargarDatos();
      const rutaActualizada = (await obtenerRutasCreadas()).find((r) => r.id === rutaEditarPedidos.id);
      setOrdenPedidosEditado(null);
      setRutaEditarPedidos(rutaActualizada || null);
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message || 'Error al asignar pedido.' });
    }
  }

  async function handleQuitarPedidoDeRuta(pedido) {
    if (!rutaEditarPedidos) return;
    if (esPedidoRetirado(pedido)) {
      setAlerta({ tipo: 'error', mensaje: 'No pueden eliminarse pedidos retirados' });
      return;
    }
    try {
      await desasignarPedidosDeRuta(rutaEditarPedidos.id, [pedido.id]);
      setAlerta({ tipo: 'success', mensaje: 'Pedido desasignado de la ruta.' });
      await cargarDatos();
      const rutaActualizada = (await obtenerRutasCreadas()).find((r) => r.id === rutaEditarPedidos.id);
      setOrdenPedidosEditado(null);
      setRutaEditarPedidos(rutaActualizada || null);
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message || 'Error al desasignar pedido.' });
    }
  }

  // Mueve un pedido de posición en la lista local (drag & drop o flechas)
  function moverPedido(desde, hasta) {
    const base = rutaEditarPedidos?.pedidos || [];
    const actual = ordenPedidosEditado || base;
    if (desde === null || hasta < 0 || hasta >= actual.length || desde === hasta) return;

    const nuevo = [...actual];
    const [movido] = nuevo.splice(desde, 1);
    nuevo.splice(hasta, 0, movido);

    // Los pedidos retirados deben quedar en su misma posición
    const retiradoDesplazado = base.some((p, idx) => esPedidoRetirado(p) && nuevo[idx].id !== p.id);
    if (retiradoDesplazado) {
      setAlerta({ tipo: 'error', mensaje: 'No pueden reordenarse pedidos retirados' });
      return;
    }
    setOrdenPedidosEditado(nuevo);
  }

  async function handleGuardarOrden() {
    if (!rutaEditarPedidos || !ordenPedidosEditado) return;
    try {
      await reordenarPedidosDeRuta(rutaEditarPedidos.id, ordenPedidosEditado.map((p) => p.id));
      setAlerta({ tipo: 'success', mensaje: 'Orden de pedidos actualizado.' });
      await cargarDatos();
      const rutaActualizada = (await obtenerRutasCreadas()).find((r) => r.id === rutaEditarPedidos.id);
      setOrdenPedidosEditado(null);
      setRutaEditarPedidos(rutaActualizada || null);
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message || 'Error al reordenar los pedidos.' });
    }
  }

  // ── 2. MODIFICAR TRANSPORTISTA ────────────────────────────────────
  async function handleQuitarTransportista(rutaId) {
    try {
      await removerTransportistaDeRuta(rutaId);
      setAlerta({ tipo: 'success', mensaje: 'Transportista eliminado, la ruta no tiene transportista asignado' });
      setRutaEditarTransportista(null);
      await cargarDatos();
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message || 'Error al quitar transportista.' });
    }
  }

  async function handleAsignarNuevoTransportista(e) {
    e.preventDefault();
    if (!nuevoTransportistaId) {
      setAlerta({ tipo: 'error', mensaje: 'Debe seleccionar un transportista.' });
      return;
    }

    try {
      const modificarAsignacion = Boolean(rutaEditarTransportista.transportistaId);
      await asignarTransportistaARuta(
        rutaEditarTransportista.id,
        Number(nuevoTransportistaId),
        modificarAsignacion
      );
      setAlerta({ tipo: 'success', mensaje: 'Transportista asignado correctamente a la ruta.' });
      setRutaEditarTransportista(null);
      setNuevoTransportistaId('');
      await cargarDatos();
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message || 'Error al asignar transportista.' });
    }
  }

  // ── 3. ELIMINAR RUTA COMPLETA ─────────────────────────────────────
  async function handleConfirmarEliminarRuta() {
    if (!rutaConfirmarEliminar) return;
    try {
      await eliminarRuta(rutaConfirmarEliminar.id);
      setAlerta({ tipo: 'success', mensaje: 'Ruta eliminada exitosamente y pedidos desvinculados.' });
      setRutaConfirmarEliminar(null);
      await cargarDatos();
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message || 'Error al eliminar la ruta.' });
    }
  }

  // Pedidos que están libres en el sistema (sin ruta)
  const pedidosLibres = pedidos.filter(
    (p) => (p.rutaId === null || p.rutaId === undefined) && p.estado !== 'CANCELADO'
  );

  // ── FILTROS DEL LISTADO ───────────────────────────────────────────
  const ESTADOS_FILTRO = [
    { valor: 'TODAS', etiqueta: 'Todas' },
    { valor: 'ASIGNADA', etiqueta: 'Asignadas' },
    { valor: 'EN_CURSO', etiqueta: 'En curso' },
    { valor: 'TERMINADA', etiqueta: 'Terminadas' },
    { valor: 'VENCIDA', etiqueta: 'Vencidas' },
  ];

  // Fecha local YYYY-MM-DD (mismo formato que el input type="date")
  function fechaLocalISO(f) {
    const d = new Date(f);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  const textoBusqueda = busqueda.trim().toLowerCase();
  const rutasFiltradas = rutas.filter((ruta) => {
    if (filtroEstado !== 'TODAS' && estadoDeRuta(ruta) !== filtroEstado) return false;
    if (filtroTransportista === 'SIN' && ruta.transportistaId) return false;
    if (filtroTransportista && filtroTransportista !== 'SIN' && ruta.transportistaId !== Number(filtroTransportista)) {
      return false;
    }
    if (filtroFecha && fechaLocalISO(ruta.createdAt) !== filtroFecha) return false;
    if (!textoBusqueda) return true;

    const campos = [
      ruta.nombre,
      ruta.transportista && `${ruta.transportista.nombre} ${ruta.transportista.apellido}`,
      ...(ruta.pedidos || []).flatMap((p) => [p.codigoSeguimiento, p.destinatarioNombre, p.direccionDestino]),
    ];
    return campos.some((c) => c && String(c).toLowerCase().includes(textoBusqueda));
  });

  const hayFiltrosActivos = Boolean(busqueda || filtroEstado !== 'TODAS' || filtroTransportista || filtroFecha);

  function handleResetFiltros() {
    setBusqueda('');
    setFiltroEstado('TODAS');
    setFiltroTransportista('');
    setFiltroFecha('');
  }

  // Transportista actualmente preseleccionado en el modal
  const transportistaModalSeleccionado = transportistas.find(
    (t) => t.id === Number(nuevoTransportistaId)
  );

  return (
    <div className="rutas-creadas-container">

      {/* ── Toast Flotante ── */}
      {alerta && (
        <div className={`toast-notification toast-${alerta.tipo}`} role="alert">
          <div className="toast-content">
            <span className="toast-icon">
              {alerta.tipo === 'success' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /></svg>
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
            <span>Rutas</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Rutas creadas</span>
          </div>
          <h1 className="header-title">Rutas Creadas</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary, #9ca3af)', marginTop: '4px' }}>
            Visualizá las hojas de ruta vigentes, administrá sus pedidos y gestioná los transportistas asignados.
          </p>
        </div>
      </header>

      {/* ── Listado de Rutas ── */}
      {cargando ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          Cargando rutas registradas...
        </div>
      ) : rutas.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', background: '#121316', borderRadius: '12px', border: '1px solid #22242a' }}>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>
            No hay rutas creadas en el sistema todavía. Podés crear la primera desde la sección <strong>Crear rutas</strong>.
          </p>
        </div>
      ) : (
        <>
        {/* ── Barra de búsqueda y filtros ── */}
        <section className="command-bar" aria-label="Herramientas de filtrado">
          <div className="search-field">
            <svg className="search-field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-field-input"
              placeholder="Buscar por ruta, transportista, código, destinatario o dirección"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button type="button" className="search-clear-btn" onClick={() => setBusqueda('')} title="Limpiar búsqueda">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <div className="filters-group">
            <div className="segmented-control" role="group">
              {ESTADOS_FILTRO.map((e) => (
                <button
                  key={e.valor}
                  type="button"
                  className={`segmented-btn ${filtroEstado === e.valor ? 'activo' : ''}`}
                  onClick={() => setFiltroEstado(e.valor)}
                >
                  {e.etiqueta}
                </button>
              ))}
            </div>

            <div className="toolbar-divider" />

            <div className="select-wrapper">
              <select
                className="minimal-select"
                value={filtroTransportista}
                onChange={(e) => setFiltroTransportista(e.target.value)}
                title="Filtrar por transportista"
              >
                <option value="">Todos los transportistas</option>
                <option value="SIN">Sin transportista</option>
                {transportistas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>
                ))}
              </select>
              <svg className="select-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            <input
              type="date"
              className="minimal-select filtro-fecha"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              title="Filtrar por día de creación"
            />

            {hayFiltrosActivos && (
              <button type="button" className="btn-reset" onClick={handleResetFiltros}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Restablecer</span>
              </button>
            )}
          </div>
        </section>

        {rutasFiltradas.length === 0 ? (
          <div className="ruta-empty-box" style={{ padding: '40px', textAlign: 'center' }}>
            No hay rutas que coincidan con los filtros aplicados.
          </div>
        ) : (
        <div className="rutas-grid">
          {rutasFiltradas.map((ruta) => (
            <div
              key={ruta.id}
              className={`ruta-card ${claseEstadoRuta(ruta)}`}
            >

              {/* Header de la tarjeta */}
              <div className="ruta-card-header">
                <div className="ruta-card-title-group">
                  <h2 className="ruta-card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                      <circle cx="6" cy="19" r="3" />
                      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
                      <circle cx="18" cy="5" r="3" />
                    </svg>
                    {ruta.nombre}
                    {esRutaTerminada(ruta) ? (
                      <span className="pill pill-ruta-terminada">Terminada</span>
                    ) : esRutaVencida(ruta) ? (
                      <span className="pill pill-ruta-vencida" title="Ruta de un día anterior que no se terminó">Vencida</span>
                    ) : esRutaIniciada(ruta) ? (
                      <span className="pill pill-ruta-iniciada">En curso</span>
                    ) : null}
                  </h2>
                  <span className="ruta-card-date">Creada: {formatearFecha(ruta.createdAt)}</span>
                </div>

                <div className="ruta-card-actions">
                  <button
                    type="button"
                    className="btn-ruta-action"
                    onClick={() => abrirModalPedidos(ruta)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    Modificar pedidos ({ruta.pedidos?.length || 0})
                  </button>

                  <button
                    type="button"
                    className="btn-ruta-action"
                    onClick={() => {
                      if (esRutaIniciada(ruta)) {
                        setAlerta({ tipo: 'error', mensaje: 'No puede cambiarse el transportista de una ruta ya iniciada' });
                        return;
                      }
                      setRutaEditarTransportista(ruta);
                      setNuevoTransportistaId(ruta.transportistaId ? String(ruta.transportistaId) : '');
                      setDesplegableChoferModalAbierto(false);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                    {ruta.transportista ? 'Cambiar transportista' : 'Asignar transportista'}
                  </button>

                  <button
                    type="button"
                    className="btn-ruta-action btn-danger-action"
                    title="Eliminar ruta completa"
                    onClick={() => {
                      if (esRutaIniciada(ruta)) {
                        setAlerta({ tipo: 'error', mensaje: 'No pueden eliminarse rutas ya iniciadas' });
                        return;
                      }
                      setRutaConfirmarEliminar(ruta);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    Eliminar ruta
                  </button>
                </div>
              </div>

              {/* Cuerpo de la tarjeta */}
              <div className="ruta-card-body">

                {/* Columna Transportista */}
                <div className="ruta-chofer-section">
                  <div className="subseccion-titulo">Transportista a cargo</div>
                  {ruta.transportista ? (
                    <div className="chofer-box">
                      <div className="chofer-avatar">
                        {ruta.transportista.nombre.charAt(0)}{ruta.transportista.apellido.charAt(0)}
                      </div>
                      <div className="chofer-info">
                        <span className="chofer-nombre">
                          {ruta.transportista.nombre} {ruta.transportista.apellido}
                        </span>
                        <div className="chofer-pills">
                          <span className={`pill ${ruta.transportista.estado === 'ACTIVO' ? 'pill-activo' : 'pill-inactivo'}`}>
                            {ruta.transportista.estado}
                          </span>
                          <span className={`pill ${ruta.transportista.vehiculo ? 'pill-vehiculo' : 'pill-sin-vehiculo'}`}>
                            {ruta.transportista.vehiculo ? `Patente: ${ruta.transportista.vehiculo}` : 'Sin vehículo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="chofer-box" style={{ borderStyle: 'dashed', borderColor: '#475569' }}>
                      <div className="chofer-avatar sin-chofer">?</div>
                      <div className="chofer-info">
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Sin transportista asignado</span>
                        <span style={{ color: '#eab308', fontSize: '0.75rem' }}>Pendiente de asignación</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Columna Pedidos */}
                <div className="ruta-pedidos-section">
                  <div className="subseccion-titulo">
                    Pedidos asignados ({ruta.pedidos?.length || 0})
                  </div>
                  {(!ruta.pedidos || ruta.pedidos.length === 0) ? (
                    <div className="ruta-empty-box">
                      No hay pedidos vinculados a esta ruta.
                    </div>
                  ) : (
                    <div className="pedidos-mini-list">
                      {ruta.pedidos.map((p, idx) => (
                        <div key={p.id} className="pedido-mini-item">
                          <div className="pedido-mini-left">
                            <span className="pedido-orden-badge">{p.ordenEntrega || idx + 1}</span>
                            <div className="pedido-mini-info">
                              <span className="pedido-mini-code">{p.codigoSeguimiento}</span>
                              <span className="pedido-mini-dest">{p.direccionDestino}</span>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{p.destinatarioNombre}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ))}
        </div>
        )}
        </>
      )}

      {/* ── MODAL: MODIFICAR PEDIDOS DE LA RUTA ── */}
      {rutaEditarPedidos && (
        <div className="modal-overlay" onClick={() => setRutaEditarPedidos(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Modificar pedidos — {rutaEditarPedidos.nombre}</h3>
              <button type="button" className="toast-close" onClick={() => setRutaEditarPedidos(null)}>&times;</button>
            </div>

            {/* Pedidos actuales de la ruta */}
            <div>
              <h4 className="modal-section-title-pedidos">
                Pedidos en la ruta ({rutaEditarPedidos.pedidos?.length || 0})
              </h4>
              {(rutaEditarPedidos.pedidos?.length || 0) > 1 && (
                <p className="reordenar-ayuda">
                  Arrastrá los pedidos (o usá las flechas) para cambiar el orden de entrega.
                </p>
              )}
              <div className="pedidos-mini-list" style={{ maxHeight: '240px' }}>
                {rutaEditarPedidos.pedidos?.length === 0 ? (
                  <div className="ruta-empty-box-compact">No hay pedidos en la ruta.</div>
                ) : (
                  (ordenPedidosEditado || rutaEditarPedidos.pedidos || []).map((p, idx, lista) => {
                    const yaRetirado = esPedidoRetirado(p);
                    return (
                      <div
                        key={p.id}
                        className={`pedido-mini-item ${yaRetirado ? '' : 'pedido-reordenable'} ${indiceArrastrado === idx ? 'pedido-arrastrando' : ''}`}
                        draggable={!yaRetirado}
                        onDragStart={() => setIndiceArrastrado(idx)}
                        onDragEnd={() => setIndiceArrastrado(null)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          moverPedido(indiceArrastrado, idx);
                          setIndiceArrastrado(null);
                        }}
                      >
                        <div className="pedido-mini-left">
                          <span className="pedido-orden-badge">{idx + 1}</span>
                          <div className="pedido-mini-info">
                            <span className="pedido-mini-code">{p.codigoSeguimiento}</span>
                            <span className="pedido-mini-dest">{p.direccionDestino}</span>
                          </div>
                        </div>
                        <div className="pedido-mini-left">
                          {!yaRetirado && (
                            <>
                              <button
                                type="button"
                                className="btn-orden-flecha"
                                title="Subir"
                                disabled={idx === 0}
                                onClick={() => moverPedido(idx, idx - 1)}
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                className="btn-orden-flecha"
                                title="Bajar"
                                disabled={idx === lista.length - 1}
                                onClick={() => moverPedido(idx, idx + 1)}
                              >
                                ▼
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            className="btn-ruta-action btn-danger-action"
                            onClick={() => handleQuitarPedidoDeRuta(p)}
                            title={yaRetirado ? 'No pueden eliminarse pedidos retirados' : 'Quitar pedido de la ruta'}
                            style={yaRetirado ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                          >
                            {yaRetirado ? 'Ya retirado' : 'Quitar de ruta'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {ordenPedidosEditado && (
                <div className="modal-buttons" style={{ marginTop: '10px' }}>
                  <button type="button" className="btn-cancelar-ruta" onClick={() => setOrdenPedidosEditado(null)}>
                    Descartar orden
                  </button>
                  <button type="button" className="btn-crear-ruta" onClick={handleGuardarOrden}>
                    Guardar orden
                  </button>
                </div>
              )}
            </div>

            {/* Pedidos libres para sumar */}
            <div>
              <h4 className="modal-section-title-libres">
                Pedidos disponibles en el sistema ({pedidosLibres.length})
              </h4>
              <div className="pedidos-mini-list" style={{ maxHeight: '180px' }}>
                {pedidosLibres.length === 0 ? (
                  <div className="ruta-empty-box-compact">No hay pedidos libres disponibles.</div>
                ) : (
                  pedidosLibres.map((p) => (
                    <div key={p.id} className="pedido-mini-item">
                      <div className="pedido-mini-info">
                        <span className="pedido-mini-code">{p.codigoSeguimiento}</span>
                        <span className="pedido-mini-dest">{p.direccionDestino}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-ruta-action btn-agregar-pedido-action"
                        onClick={() => handleAgregarPedidoARuta(p.id)}
                      >
                        + Agregar a ruta
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-buttons">
              <button type="button" className="btn-cancelar-ruta" onClick={() => setRutaEditarPedidos(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CAMBIAR / ELIMINAR TRANSPORTISTA CON BURBUJITAS ── */}
      {rutaEditarTransportista && (
        <div className="modal-overlay" onClick={() => setRutaEditarTransportista(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Transportista a cargo — {rutaEditarTransportista.nombre}</h3>
              <button type="button" className="toast-close" onClick={() => setRutaEditarTransportista(null)}>&times;</button>
            </div>

            {/* Transportista actual con botón para quitar */}
            {rutaEditarTransportista.transportista ? (
              <div className="chofer-box chofer-box-current">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="chofer-avatar">
                    {rutaEditarTransportista.transportista.nombre.charAt(0)}{rutaEditarTransportista.transportista.apellido.charAt(0)}
                  </div>
                  <div>
                    <div className="chofer-nombre">
                      {rutaEditarTransportista.transportista.nombre} {rutaEditarTransportista.transportista.apellido}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <span className={`pill ${rutaEditarTransportista.transportista.estado === 'ACTIVO' ? 'pill-activo' : 'pill-inactivo'}`}>
                        {rutaEditarTransportista.transportista.estado}
                      </span>
                      <span className={`pill ${rutaEditarTransportista.transportista.vehiculo ? 'pill-vehiculo' : 'pill-sin-vehiculo'}`}>
                        {rutaEditarTransportista.transportista.vehiculo ? `Patente: ${rutaEditarTransportista.transportista.vehiculo}` : 'Sin vehículo'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-ruta-action btn-danger-action"
                  onClick={() => handleQuitarTransportista(rutaEditarTransportista.id)}
                >
                  Eliminar transportista a cargo
                </button>
              </div>
            ) : (
              <div className="ruta-empty-box-warning">
                Esta ruta actualmente no cuenta con ningún transportista asignado.
              </div>
            )}

            {/* Asignar nuevo transportista con Selector de Burbujitas */}
            <form onSubmit={handleAsignarNuevoTransportista} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Asignar otro transportista disponible:
              </label>

              <div className="custom-select-container">
                <button
                  type="button"
                  className={`custom-select-trigger ${desplegableChoferModalAbierto ? 'abierto' : ''}`}
                  onClick={() => setDesplegableChoferModalAbierto(!desplegableChoferModalAbierto)}
                >
                  {transportistaModalSeleccionado ? (
                    <div className="option-left">
                      <div className="option-avatar">
                        {transportistaModalSeleccionado.nombre.charAt(0)}{transportistaModalSeleccionado.apellido.charAt(0)}
                      </div>
                      <span className="option-name">{transportistaModalSeleccionado.nombre} {transportistaModalSeleccionado.apellido}</span>
                      <div className="option-pills">
                        <span className={`pill ${transportistaModalSeleccionado.estado === 'ACTIVO' ? 'pill-activo' : 'pill-inactivo'}`}>
                          {transportistaModalSeleccionado.estado}
                        </span>
                        <span className={`pill ${transportistaModalSeleccionado.vehiculo ? 'pill-vehiculo' : 'pill-sin-vehiculo'}`}>
                          {transportistaModalSeleccionado.vehiculo ? `Patente: ${transportistaModalSeleccionado.vehiculo}` : 'Sin vehículo'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="custom-select-placeholder">-- Seleccionar transportista responsable --</span>
                  )}

                  <svg 
                    className={`sidebar-chevron ${desplegableChoferModalAbierto ? 'rotado' : ''}`} 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {desplegableChoferModalAbierto && (
                  <div className="custom-select-menu">
                    {transportistas.map((t) => {
                      const tieneVehiculo = Boolean(t.vehiculo && t.vehiculo.trim() !== '');
                      const esApto = t.estado === 'ACTIVO' && tieneVehiculo;
                      const estaSeleccionado = Number(nuevoTransportistaId) === t.id;

                      return (
                        <button
                          type="button"
                          key={t.id}
                          className={`custom-select-option ${estaSeleccionado ? 'seleccionado' : ''} ${!esApto ? 'deshabilitado' : ''}`}
                          onClick={() => {
                            if (esApto) {
                              setNuevoTransportistaId(String(t.id));
                              setDesplegableChoferModalAbierto(false);
                            }
                          }}
                        >
                          <div className="option-left">
                            <div className="option-avatar">
                              {t.nombre.charAt(0)}{t.apellido.charAt(0)}
                            </div>
                            <span className="option-name">{t.nombre} {t.apellido}</span>
                          </div>

                          <div className="option-pills">
                            <span className={`pill ${t.estado === 'ACTIVO' ? 'pill-activo' : 'pill-inactivo'}`}>
                              {t.estado}
                            </span>
                            <span className={`pill ${tieneVehiculo ? 'pill-vehiculo' : 'pill-sin-vehiculo'}`}>
                              {tieneVehiculo ? `Patente: ${t.vehiculo}` : 'Sin vehículo'}
                            </span>
                            <span className={`pill ${esApto ? 'pill-apto' : 'pill-no-apto'}`}>
                              {esApto ? '✓ Apto' : 'No disponible'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-cancelar-ruta" onClick={() => setRutaEditarTransportista(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-crear-ruta">
                  Guardar asignación
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRMAR ELIMINAR RUTA ── */}
      {rutaConfirmarEliminar && (
        <div className="modal-overlay" onClick={() => setRutaConfirmarEliminar(null)}>
          <div className="modal-content-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#f87171' }}>¿Eliminar ruta?</h3>
              <button type="button" className="toast-close" onClick={() => setRutaConfirmarEliminar(null)}>&times;</button>
            </div>

            <p className="modal-confirm-text">
              ¿Estás seguro de que deseás eliminar la ruta <strong>"{rutaConfirmarEliminar.nombre}"</strong>?
              <br /><br />
              Esta acción desvinculará todos los pedidos asociados (quedando libres para asignarse a otra ruta) y preservará al transportista en el sistema.
            </p>

            <div className="modal-buttons">
              <button type="button" className="btn-cancelar-ruta" onClick={() => setRutaConfirmarEliminar(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-ruta-action btn-danger-action"
                style={{ padding: '10px 18px', fontWeight: 600 }}
                onClick={handleConfirmarEliminarRuta}
              >
                Sí, eliminar ruta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
