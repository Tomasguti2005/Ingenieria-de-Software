// TransportistasPage.jsx — Listado y gestión de transportistas (admin).
// Ruta: /admin/transportistas
// Inspiración de diseño: Linear / Vercel (Minimalist Dark Dashboard).
// Cero emojis, uso exclusivo de iconos vectoriales SVG limpios.

import { useState, useEffect, useMemo } from 'react';
import { obtenerTransportistas } from '../../../services/transportistas.service.js';
import './TransportistasPage.css';
import { useNavigate } from 'react-router-dom';

export default function TransportistasPage() {
  const [transportistas, setTransportistas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  // Estados de filtros y ordenamiento
  const [busqueda, setBusqueda] = useState('');
  const [criterioOrden, setCriterioOrden] = useState('alfabetico'); // 'alfabetico' | 'antiguedad'
  const [direccionOrden, setDireccionOrden] = useState('asc');       // 'asc' | 'desc'
  const [filtroEstado, setFiltroEstado] = useState('TODOS');         // 'TODOS' | 'ACTIVO' | 'INACTIVO'

  // Modo de prueba para simular base sin datos
  const [simularBaseVacia, setSimularBaseVacia] = useState(false);

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
    setDireccionOrden('asc'); // Predeterminado: A-Z para alfabético, más antiguo para antigüedad
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

  return (
    <div className="transportistas-container">
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
        /* Caso Base: No hay transportistas cargados aún en el sistema (Solo texto en negrita) */
        <div className="state-card empty-base text-only">
          <h2 className="empty-title">Aún no hay transportistas cargados en el sistema</h2>
        </div>
      ) : transportistasFiltrados.length === 0 ? (
        /* Escenario 2: Sin resultados bajo los filtros aplicados */
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
        /* Escenario 1: Éxito y Transportistas Encontrados */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-user">Repartidor</th>
                <th className="col-phone">Teléfono</th>
                <th className="col-status">Estado</th>
                <th className="col-date">Alta en Sistema</th>
                <th className="col-date"></th>
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
                   <td className="col-date">
                    <button onClick={() => navigate(`/admin/transportistas/${item.id}/editar`)} className="btn-action-primary">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer de la Tabla */}
          <footer className="table-footer">
            <span className="footer-metric">
              Mostrando {transportistasFiltrados.length} de {listaBase.length} repartidores
            </span>
            <span className="footer-legend">Directorio Activo</span>
          </footer>
        </div>
      )}
    </div>
  );
}
