// HistorialEntregadosPage.jsx — Historial de pedidos entregados (admin).
// Ruta: /admin/pedidos/historial
// Endpoint: GET /api/pedidos/historial-entregados
// Reutiliza la interfaz y estilos de PedidosVigentesPage (solo lectura, sin acciones de edición).

import { useState, useEffect, useMemo } from 'react';
import { obtenerHistorialEntregados } from '../../../services/pedidosService';
import './PedidosVigentesPage.css';
import './HistorialEntregadosPage.css';

const METODOS_PAGO = ['TODOS', 'EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO', 'OTRO'];

const ETIQUETAS_METODO_PAGO = {
  TODOS: 'Todos',
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  MERCADO_PAGO: 'Mercado Pago',
  OTRO: 'Otro',
};

export default function HistorialEntregadosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // Filtros y ordenamiento (Escenario 1: inicialmente sin filtro y del más reciente al más antiguo)
  const [busqueda, setBusqueda] = useState('');
  const [filtroMetodoPago, setFiltroMetodoPago] = useState('TODOS');
  const [criterioOrden, setCriterioOrden] = useState('fecha');
  const [direccionOrden, setDireccionOrden] = useState('desc');

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      setErrorCarga('');
      try {
        const listaPedidos = await obtenerHistorialEntregados();
        setPedidos(listaPedidos);
      } catch (err) {
        console.error('Error al cargar el historial de pedidos entregados:', err);
        setErrorCarga(err.message || 'No se pudo cargar el historial de pedidos entregados.');
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

  function formatearMonto(monto) {
    if (monto === null || monto === undefined || monto === '') return '—';
    const numero = Number(monto);
    if (!Number.isFinite(numero)) return '—';
    return numero.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  }

  // Filtrado reactivo en memoria (misma lógica que Pedidos Vigentes)
  const pedidosFiltrados = useMemo(() => {
    let resultado = [...pedidos];

    // 1. Buscador multifunción: Destinatario, Transportista, Código, Teléfono o Fecha
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      const qLimpio = q.replace(/[-/]/g, '');

      resultado = resultado.filter((p) => {
        const nombreDest = (p.destinatarioNombre || '').toLowerCase();
        const transportista = (p.nombreTransportista || '').toLowerCase();
        const codigo = (p.codigoSeguimiento || '').toLowerCase();
        const telefono = (p.destinatarioTelefono || '').toLowerCase();

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

    // 2. Filtro por método de pago cobrado (Segmented control)
    if (filtroMetodoPago !== 'TODOS') {
      resultado = resultado.filter((p) => p.metodoPagoCobrado === filtroMetodoPago);
    }

    // 3. Ordenamiento
    resultado.sort((a, b) => {
      if (criterioOrden === 'fecha') {
        const fa = new Date(a.fechaEntrega || a.fechaCreacion || 0);
        const fb = new Date(b.fechaEntrega || b.fechaCreacion || 0);
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
      if (criterioOrden === 'monto') {
        const ma = Number(a.montoCobrado) || 0;
        const mb = Number(b.montoCobrado) || 0;
        return direccionOrden === 'asc' ? ma - mb : mb - ma;
      }
      return 0;
    });

    return resultado;
  }, [pedidos, busqueda, filtroMetodoPago, criterioOrden, direccionOrden]);

  function handleResetFiltros() {
    setBusqueda('');
    setFiltroMetodoPago('TODOS');
    setCriterioOrden('fecha');
    setDireccionOrden('desc');
  }

  function handleInvertirOrden() {
    setDireccionOrden((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }

  const hayFiltrosActivos =
    busqueda.trim() !== '' ||
    filtroMetodoPago !== 'TODOS' ||
    criterioOrden !== 'fecha' ||
    direccionOrden !== 'desc';

  const etiquetaDireccion = useMemo(() => {
    if (criterioOrden === 'destinatario' || criterioOrden === 'transportista') {
      return direccionOrden === 'asc' ? 'A → Z' : 'Z → A';
    }
    if (criterioOrden === 'monto') {
      return direccionOrden === 'asc' ? 'Menor monto' : 'Mayor monto';
    }
    return direccionOrden === 'asc' ? 'Más antiguas' : 'Más recientes';
  }, [criterioOrden, direccionOrden]);

  return (
    <div className="pedidos-container historial-entregados">
      {errorCarga && (
        <div className="alert-banner-top error" role="alert">
          <span>{errorCarga}</span>
          <button
            type="button"
            onClick={() => setErrorCarga('')}
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
            <span>Pedidos</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Historial de Pedidos</span>
          </div>
          <h1 className="header-title">Historial de Pedidos Entregados</h1>
        </div>

        <div className="header-actions">
          <div className="pedidos-count-pill">
            <span className="count-number">{pedidosFiltrados.length}</span>
            <span className="count-label">
              {pedidosFiltrados.length === 1 ? 'pedido entregado' : 'pedidos entregados'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Barra de Comandos y Filtros ── */}
      <section className="command-bar" aria-label="Herramientas de filtrado">
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

        <div className="filters-group">
          {/* Segmented Control por Método de Pago */}
          <div className="segmented-control" role="group" aria-label="Filtrar por método de pago">
            {METODOS_PAGO.map((m) => (
              <button
                key={m}
                type="button"
                className={`segmented-btn ${filtroMetodoPago === m ? 'activo' : ''}`}
                onClick={() => setFiltroMetodoPago(m)}
              >
                {ETIQUETAS_METODO_PAGO[m]}
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
              <option value="monto">Monto cobrado</option>
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
          <span className="loading-text">Cargando historial de pedidos entregados...</span>
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        /* Escenario 2: Misma interfaz, vacía y con mensaje central exacto según HU */
        <div className="state-card empty-filtered" role="status">
          <div className="empty-header-inline">
            <div className="empty-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
            <h2 className="empty-title">No hay pedidos entregados bajo este criterio</h2>
          </div>
          {hayFiltrosActivos && (
            <button type="button" className="btn-action-primary" onClick={handleResetFiltros}>
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        /* Escenario 1: Éxito y Pedidos Encontrados */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente Destinatario</th>
                <th>Trayecto</th>
                <th>Fecha Entrega</th>
                <th>Transportista</th>
                <th>Método de Pago</th>
                <th style={{ textAlign: 'right' }}>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map((pedido) => (
                <tr key={pedido.id} className="table-row">
                  <td>
                    <span className="badge-codigo-linear">{pedido.codigoSeguimiento}</span>
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
                    <span className={`historial-transportista ${pedido.nombreTransportista ? '' : 'sin-dato'}`}>
                      {pedido.nombreTransportista || 'Sin asignar'}
                    </span>
                  </td>
                  <td>
                    <span className={`historial-metodo-pago ${pedido.metodoPagoCobrado ? '' : 'sin-dato'}`}>
                      {pedido.metodoPagoCobrado
                        ? ETIQUETAS_METODO_PAGO[pedido.metodoPagoCobrado] || pedido.metodoPagoCobrado
                        : 'Sin registrar'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="historial-monto font-mono">{formatearMonto(pedido.montoCobrado)}</span>
                  </td>
                  <td>
                    <span className={`status-pill ${pedido.estado.toLowerCase()}`}>
                      <span className="status-dot" />
                      <span className="status-label">{pedido.estado.replace(/_/g, ' ')}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <footer className="table-footer">
            <span className="footer-metric">
              Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos entregados
            </span>
            <span className="footer-legend">Historial de Entregas</span>
          </footer>
        </div>
      )}
    </div>
  );
}
