// Sidebar.jsx — Menú lateral desplegable tipo drawer.
// Permanece oculto por defecto y se despliega al presionar el botón de menú en el topbar.
// Utiliza exclusivamente iconos vectoriales SVG minimalistas.

import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar({ abierto, onClose }) {
  const location = useLocation();

  // Estado para expandir/contraer el submenú de vehículos
  const [vehiculosAbierto, setVehiculosAbierto] = useState(
    location.pathname.startsWith('/admin/vehiculos') || 
    location.pathname.startsWith('/admin/registro-vehiculo') || 
    location.pathname.startsWith('/admin/asignar-vehiculo')
  );

  // Estado para expandir/contraer el submenú de rutas
  const [rutasAbierto, setRutasAbierto] = useState(
    location.pathname.startsWith('/admin/rutas') || 
    location.pathname.startsWith('/admin/asignar-ruta')
  );
  
  // Cerrar con Escape
  useEffect(() => {
    function manejarTecla(e) {
      if (e.key === 'Escape' && abierto) {
        onClose();
      }
    }
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, onClose]);

  return (
    <>
      {/* Backdrop con difuminado suave */}
      <div
        className={`sidebar-backdrop ${abierto ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer deslizante */}
      <aside
        className={`admin-sidebar-drawer ${abierto ? 'abierto' : ''}`}
        aria-label="Menú principal de navegación"
        aria-hidden={!abierto}
      >
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">Repartos Ya</span>
              <span className="sidebar-brand-sub">Panel de Control</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            title="Cerrar menú (Esc)"
            aria-label="Cerrar menú"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Módulos del Sistema</div>

          {/* 1. Gestión de Transportistas */}
          <NavLink
            to="/admin/transportistas"
            className={({ isActive }) => `sidebar-link ${isActive ? 'activo' : ''}`}
            onClick={onClose}
            title="Gestión de Transportistas"
          >
            <span className="sidebar-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                <path d="M15 18H9" />
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                <circle cx="17" cy="18.5" r="2.5" />
                <circle cx="7" cy="18.5" r="2.5" />
              </svg>
            </span>
            <span className="sidebar-label">Transportistas</span>
            <span className="sidebar-active-indicator" />
          </NavLink>

          {/* 2. Módulo de Vehículos (Desplegable) */}
          <div className="sidebar-dropdown-container">
            <button
              type="button"
              className={`sidebar-link ${
                location.pathname.startsWith('/admin/vehiculos') || 
                location.pathname.startsWith('/admin/registro-vehiculo') || 
                location.pathname.startsWith('/admin/asignar-vehiculo') ? 'activo' : ''
              }`}
              onClick={() => setVehiculosAbierto(!vehiculosAbierto)}
              title="Gestión de Vehículos"
            >
              <span className="sidebar-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                  <path d="M15 18H9" />
                  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                  <circle cx="17" cy="18.5" r="2.5" />
                  <circle cx="7" cy="18.5" r="2.5" />
                </svg>
              </span>
              <span className="sidebar-label">Vehículos</span>
              <svg 
                className={`sidebar-chevron ${vehiculosAbierto ? 'rotado' : ''}`} 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {/* Submenú desplegable */}
            {vehiculosAbierto && (
              <div className="sidebar-submenu">
                <NavLink
                  to="/admin/registro-vehiculo"
                  className={({ isActive }) => `sidebar-sublink ${isActive ? 'activo' : ''}`}
                  onClick={onClose}
                  title="Registrar vehículo"
                >
                  <span className="sidebar-sublink-dot" />
                  <span>Registrar</span>
                </NavLink>

                <NavLink
                  to="/admin/asignar-vehiculo"
                  className={({ isActive }) => `sidebar-sublink ${isActive ? 'activo' : ''}`}
                  onClick={onClose}
                  title="Asignar vehículo"
                >
                  <span className="sidebar-sublink-dot" />
                  <span>Asignar</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* 3. Gestión de Pedidos */}
          <div
            className="sidebar-link deshabilitado"
            title="Gestión de Pedidos"
          >
            <span className="sidebar-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="M12 11h4" />
                <path d="M12 16h4" />
                <path d="M8 11h.01" />
                <path d="M8 16h.01" />
              </svg>
            </span>
            <span className="sidebar-label">Pedidos</span>
          </div>

          {/* 4. Gestión de Rutas (Desplegable) */}
          <div className="sidebar-dropdown-container">
            <button
              type="button"
              className={`sidebar-link ${
                location.pathname.startsWith('/admin/rutas') || 
                location.pathname.startsWith('/admin/asignar-ruta') ? 'activo' : ''
              }`}
              onClick={() => setRutasAbierto(!rutasAbierto)}
              title="Gestión de Rutas"
            >
              <span className="sidebar-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="19" r="3" />
                  <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
                  <circle cx="18" cy="5" r="3" />
                </svg>
              </span>
              <span className="sidebar-label">Rutas</span>
              <svg 
                className={`sidebar-chevron ${rutasAbierto ? 'rotado' : ''}`} 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {/* Submenú desplegable */}
            {rutasAbierto && (
              <div className="sidebar-submenu">
                <NavLink
                  to="/admin/asignar-ruta"
                  className={({ isActive }) => `sidebar-sublink ${isActive ? 'activo' : ''}`}
                  onClick={onClose}
                  title="Asignar ruta"
                >
                  <span className="sidebar-sublink-dot" />
                  <span>Asignar ruta</span>
                </NavLink>

                <NavLink
                  to="/admin/rutas"
                  className={({ isActive }) => `sidebar-sublink ${isActive ? 'activo' : ''}`}
                  onClick={onClose}
                  title="Rutas creadas"
                >
                  <span className="sidebar-sublink-dot" />
                  <span>Rutas creadas</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* 5. Rendición de Cuentas */}
          <div
            className="sidebar-link deshabilitado"
            title="Rendición de Cuentas"
          >
            <span className="sidebar-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
              </svg>
            </span>
            <span className="sidebar-label">Rendición</span>
          </div>

          {/* 6. Reportes y Estadísticas */}
          <div
            className="sidebar-link deshabilitado"
            title="Reportes y Estadísticas"
          >
            <span className="sidebar-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </span>
            <span className="sidebar-label">Reportes</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-footer-dot" />
          <span>Sistema Operativo v1.0</span>
        </div>
      </aside>
    </>
  );
}
