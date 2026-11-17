// PedidosVigentesPage.jsx — Listado y gestión de pedidos vigentes (admin).
// Ruta: /admin/pedidos/vigentes
// Diseño: Linear / Vercel (Minimalist Dark Dashboard), alineado con TransportistasPage.

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { obtenerPedidosVigentes, modificarPedido } from '../../../services/pedidosService';
import './PedidosVigentesPage.css';

export default function PedidosVigentesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Mensaje emergente de notificación (ej: tras modificar un pedido)
  const [mensajeToast, setMensajeToast] = useState(location.state?.mensajeExito || '');

  // Limpiar el estado de location para que no reaparezca si se refresca
  useEffect(() => {
    if (location.state?.mensajeExito) {
      setMensajeToast(location.state.mensajeExito);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Modal para confirmación de cancelación
  const [pedidoACancelar, setPedidoACancelar] = useState(null);
  const [pedidoCancelandoId, setPedidoCancelandoId] = useState(null);
  const [errorCancelacion, setErrorCancelacion] = useState('');
  const [errorSeguimiento, setErrorSeguimiento] = useState('');

  // Filtros y ordenamiento
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [criterioOrden, setCriterioOrden] = useState('fecha');
  const [direccionOrden, setDireccionOrden] = useState('desc');

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      try {
        const listaPedidos = await obtenerPedidosVigentes();
        setPedidos(listaPedidos);
      } catch (err) {
        console.error('Error al cargar pedidos vigentes:', err);
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  function formatearFecha(f) {
    if (!f) return '—';
    const partes = f.split('T')[0].split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return f;
  }

  async function handleCopiarEnlaceSeguimiento(pedido) {
    setMensajeToast('');
    setErrorSeguimiento('');

    if (!pedido.codigoSeguimiento) {
      setErrorSeguimiento('Este pedido no tiene un código de seguimiento disponible.');
      return;
    }

    const url = `${window.location.origin}/seguimiento/${encodeURIComponent(pedido.codigoSeguimiento)}`;

    try {
      await navigator.clipboard.writeText(url);
      setMensajeToast('Enlace copiado al portapapeles');
    } catch (err) {
      console.error('Error al copiar el enlace de seguimiento:', err);
      setErrorSeguimiento('No se pudo copiar el enlace. Compruebe los permisos del portapapeles e intente nuevamente.');
    }
  }

  // Regla: No puede eliminarse ni modificarse un pedido en estados posteriores al "retiro" (inclusive)
  const estadosBloqueados = ['RETIRADO', 'EN_CAMINO', 'ENTREGADO', 'FALLIDO', 'CANCELADO'];
  const esEstadoBloqueado = (estado) => estadosBloqueados.includes(estado);

  const handleSolicitarCancelacion = (pedido) => {
    setMensajeToast('');
    setErrorCancelacion('');

    if (pedido.estado === 'EN_CAMINO') {
      setErrorCancelacion('Operación no permitida: el pedido ya se encuentra en camino con el transportista');
      return;
    }

    if (!['REGISTRADO', 'ASIGNADO'].includes(pedido.estado)) {
      setErrorCancelacion('Solo se pueden cancelar pedidos registrados o asignados.');
      return;
    }

    setPedidoACancelar(pedido);
  };

  const handleConfirmarCancelacion = async () => {
    if (!pedidoACancelar) return;
    try {
      setPedidoCancelandoId(pedidoACancelar.id);
      setErrorCancelacion('');
      await modificarPedido(pedidoACancelar.id, { estado: 'CANCELADO' });
      setPedidos((prev) => prev.filter((item) => item.id !== pedidoACancelar.id));
      setPedidoACancelar(null);
      setMensajeToast('El pedido ha sido cancelado con éxito');
    } catch (err) {
      setErrorCancelacion(err.message || 'No se pudo cancelar el pedido.');
    } finally {
      setPedidoCancelandoId(null);
    }
  };

  // Filtrado reactivo en memoria
  const pedidosFiltrados = useMemo(() => {
    let resultado = pedidos.filter(
      (pedido) => !['FALLIDO', 'CANCELADO'].includes(pedido.estado)
    );

    // 1. Buscador inteligente multifunción: Destinatario, Transportista, Código o Fecha
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      // Remover barras o guiones para permitir matching de fechas flexible
      const qLimpio = q.replace(/[-/]/g, '');

      resultado = resultado.filter((p) => {
        const nombreDest = (p.destinatarioNombre || '').toLowerCase();
        const transportista = (p.nombreTransportista || '').toLowerCase();
        const codigo = (p.codigoSeguimiento || '').toLowerCase();
        const telefono = (p.destinatarioTelefono || '').toLowerCase();

        // Fechas del pedido en formato DD/MM/AAAA y YYYY-MM-DD
        const fRaw = p.diaEntrega || (p.fechaEntrega ? p.fechaEntrega.split('T')[0] : '');
        const fFormateada = formatearFecha(fRaw).toLowerCase();
        const fSinBarras = fFormateada.replace(/[-/]/g, '');

        return (
          nombreDest.includes(q) ||
          transportista.includes(q) ||
          codigo.includes(q) ||
          telefono.includes(q) ||
          fFormateada.includes(q) ||
          fRaw.includes(q) ||
          (qLimpio.length >= 2 && fSinBarras.includes(qLimpio))
        );
      });
    }

    // 2. Filtro por Estado (Segmented control)
    if (filtroEstado !== 'TODOS') {
      resultado = resultado.filter((p) => p.estado === filtroEstado);
    }

    // 3. Ordenamiento
    resultado.sort((a, b) => {
      if (criterioOrden === 'fecha') {
        const fa = new Date(a.diaEntrega || a.fechaEntrega || 0);
        const fb = new Date(b.diaEntrega || b.fechaEntrega || 0);
        return direccionOrden === 'asc' ? fa - fb : fb - fa;
      }
      if (criterioOrden === 'destinatario') {
        const comp = (a.destinatarioNombre || '').localeCompare(b.destinatarioNombre || '');
        return direccionOrden === 'asc' ? comp : -comp;
      }
      if (criterioOrden === 'transportista') {
        const comp = (a.nombreTransportista || '').localeCompare(b.nombreTransportista || '');
        return direccionOrden === 'asc' ? comp : -comp;
      }
      return 0;
    });

    return resultado;
  }, [pedidos, busqueda, filtroEstado, criterioOrden, direccionOrden]);

  function handleResetFiltros() {
    setBusqueda('');
    setFiltroEstado('TODOS');
    setCriterioOrden('fecha');
    setDireccionOrden('desc');
  }

  function handleInvertirOrden() {
    setDireccionOrden((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }

  const hayFiltrosActivos =
    busqueda.trim() !== '' ||
    filtroEstado !== 'TODOS' ||
    criterioOrden !== 'fecha' ||
    direccionOrden !== 'desc';

  const etiquetaDireccion = useMemo(() => {
    if (criterioOrden === 'destinatario' || criterioOrden === 'transportista') {
      return direccionOrden === 'asc' ? 'A → Z' : 'Z → A';
    }
    return direccionOrden === 'asc' ? 'Más antiguas' : 'Más recientes';
  }, [criterioOrden, direccionOrden]);

  return (
    <div className="pedidos-container">
      {/* ── Banner emergente de éxito (arriba del todo) ── */}
      {mensajeToast && (
        <div className="alert-banner-top success" role="status">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{mensajeToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensajeToast('')}
            aria-label="Cerrar notificación"
            className="btn-toast-close"
          >
            ✕
          </button>
        </div>
      )}

      {errorCancelacion && (
        <div className="alert-banner-top error" role="alert">
          <span>{errorCancelacion}</span>
          <button
            type="button"
            onClick={() => setErrorCancelacion('')}
            aria-label="Cerrar notificación"
            className="btn-toast-close"
          >
            ✕
          </button>
        </div>
      )}

      {errorSeguimiento && (
        <div className="alert-banner-top error" role="alert">
          <span>{errorSeguimiento}</span>
          <button
            type="button"
            onClick={() => setErrorSeguimiento('')}
            aria-label="Cerrar notificación"
            className="btn-toast-close"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Encabezado ── */}
      <header className="page-header">
        <div className="header-meta">
          <div className="header-breadcrumb">
            <span>Repartos Ya</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Pedidos Vigentes</span>
          </div>
          <h1 className="header-title">Gestión de Pedidos Vigentes</h1>
        </div>

        <div className="header-actions">
          <Link to="/admin/pedidos/crear" className="btn-action-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Crear pedido</span>
          </Link>

          <div className="pedidos-count-pill">
            <span className="count-number">{pedidosFiltrados.length}</span>
            <span className="count-label">{pedidosFiltrados.length === 1 ? 'pedido activo' : 'pedidos activos'}</span>
          </div>
        </div>
      </header>

      {/* ── Barra de Comandos y Filtros ── */}
      <section className="command-bar" aria-label="Herramientas de filtrado">
        {/* Buscador General Multifunción */}
        <div className="search-field">
          <svg className="search-field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-field-input"
            placeholder="Buscar por cliente, transportista, código o fecha"
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

        {/* Grupo de Filtros */}
        <div className="filters-group">
          {/* Segmented Control por Estado */}
          <div className="segmented-control" role="group">
            {['TODOS', 'REGISTRADO', 'ASIGNADO', 'RETIRADO', 'EN_CAMINO'].map((e) => (
              <button
                key={e}
                type="button"
                className={`segmented-btn ${filtroEstado === e ? 'activo' : ''}`}
                onClick={() => setFiltroEstado(e)}
              >
                {e === 'TODOS' ? 'Todos' : e === 'EN_CAMINO' ? 'En camino' : e.charAt(0) + e.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="toolbar-divider" />

          {/* Ordenamiento */}
          <div className="select-wrapper">
            <select
              className="minimal-select"
              value={criterioOrden}
              onChange={(e) => setCriterioOrden(e.target.value)}
              title="Criterio de orden"
            >
              <option value="fecha">Fecha de entrega</option>
              <option value="destinatario">Destinatario</option>
              <option value="transportista">Transportista</option>
            </select>
            <svg className="select-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          <button
            type="button"
            className={`btn-invert ${direccionOrden === 'asc' ? 'invertido' : ''}`}
            onClick={handleInvertirOrden}
            title="Invertir orden"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 16 4 4 4-4" />
              <path d="M7 20V4" />
              <path d="m21 8-4-4-4 4" />
              <path d="M17 4v16" />
            </svg>
            <span>{etiquetaDireccion}</span>
          </button>

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

      {/* ── Tabla Principal o Estado Vacío ── */}
      {cargando ? (
        <div className="state-card loading">
          <div className="minimal-spinner" />
          <span className="loading-text">Cargando pedidos vigentes...</span>
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        /* Escenario 2: Mensaje central exacto según HU */
        <div className="state-card empty-filtered" role="status">
          <div className="empty-header-inline">
            <div className="empty-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
            <h2 className="empty-title">No hay pedidos recientes bajo este criterio</h2>
          </div>
          <p className="empty-description">
            No se encontraron pedidos activos que coincidan con la búsqueda o filtros seleccionados.
          </p>
          <button type="button" className="btn-action-primary" onClick={handleResetFiltros}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        /* Escenario 1: Éxito y Pedidos Encontrados */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código / enlace de seguimiento</th>
                <th>Cliente Destinatario</th>
                <th>Trayecto</th>
                <th>Fecha Entrega</th>
                <th>Transportista Asignado</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map((pedido) => (
                <tr key={pedido.id} className="table-row">
                  <td>
                    <div className="tracking-table-cell">
                      <span className="badge-codigo-linear">{pedido.codigoSeguimiento}</span>
                      {pedido.codigoSeguimiento && (
                        <>
                          <a
                            className="tracking-table-link"
                            href={`${window.location.origin}/seguimiento/${encodeURIComponent(pedido.codigoSeguimiento)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {`${window.location.origin}/seguimiento/${encodeURIComponent(pedido.codigoSeguimiento)}`}
                          </a>
                          <button
                            type="button"
                            className="btn-copy-tracking"
                            onClick={() => handleCopiarEnlaceSeguimiento(pedido)}
                          >
                            Copiar enlace
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="destinatario-profile">
                      <div className="destinatario-avatar">
                        {(pedido.destinatarioNombre || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div className="destinatario-details">
                        <span className="destinatario-nombre">{pedido.destinatarioNombre}</span>
                        {pedido.destinatarioTelefono && (
                          <span className="destinatario-telefono font-mono">
                            {pedido.destinatarioTelefono}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="cell-ruta">
                      <div className="ruta-tramo">
                        <span className="ruta-label-muted">Desde:</span> {pedido.direccionOrigen}
                      </div>
                      <div className="ruta-tramo">
                        <span className="ruta-label-muted">Hasta:</span> {pedido.direccionDestino}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="cell-date font-mono">
                      {formatearFecha(pedido.diaEntrega || pedido.fechaEntrega)}
                    </span>
                  </td>
                  <td>
                    <span className="cell-transportista" style={{ color: pedido.nombreTransportista ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '12.5px' }}>
                      {pedido.nombreTransportista || 'Sin asignar'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${pedido.estado.toLowerCase()}`}>
                      <span className="status-dot" />
                      <span className="status-label">{pedido.estado.replace(/_/g, ' ')}</span>
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                      {/* Botón Modificar / Ver */}
                      {esEstadoBloqueado(pedido.estado) ? (
                        /* Si está bloqueado: botón con texto "Ver" */
                        <Link
                          to={`/admin/pedidos/${pedido.id}/editar`}
                          className="btn-action-table-view"
                          title="Ver detalle del pedido"
                        >
                          Ver
                        </Link>
                      ) : (
                        /* Si es editable: botón con icono de lápiz */
                        <Link
                          to={`/admin/pedidos/${pedido.id}/editar`}
                          className="btn-action-table-edit"
                          title="Modificar pedido"
                          aria-label="Modificar pedido"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Link>
                      )}

                      {['REGISTRADO', 'ASIGNADO', 'EN_CAMINO'].includes(pedido.estado) && (
                        <button
                          type="button"
                          className="btn-action-table-delete"
                          onClick={() => handleSolicitarCancelacion(pedido)}
                          disabled={pedidoCancelandoId !== null}
                          title="Cancelar pedido"
                          aria-label={`Cancelar pedido ${pedido.codigoSeguimiento}`}
                        >
                          {/* Icono de Cancelar / Cruz */}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <footer className="table-footer">
            <span className="footer-metric">
              Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos
            </span>
            <span className="footer-legend">Directorio Logístico Activo</span>
          </footer>
        </div>
      )}

      {/* Modal de confirmación de cancelación */}
      {pedidoACancelar && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-header">
              <svg className="modal-icon-danger" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <h3 className="modal-title">Cancelar pedido</h3>
            </div>
            <div className="modal-body">
              {errorCancelacion && (
                <div className="modal-error-text">
                  {errorCancelacion}
                </div>
              )}
              ¿Está seguro de que desea cancelar el pedido <strong>{pedidoACancelar.codigoSeguimiento}</strong>? Pasará a la pestaña de cancelados/fallidos.
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  setPedidoACancelar(null);
                  setErrorCancelacion('');
                }}
                disabled={pedidoCancelandoId !== null}
                className="btn-secondary"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmarCancelacion}
                disabled={pedidoCancelandoId !== null}
                className="btn-modal-danger"
              >
                {pedidoCancelandoId !== null ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
