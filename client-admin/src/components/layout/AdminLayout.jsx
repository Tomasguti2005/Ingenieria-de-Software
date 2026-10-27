// AdminLayout.jsx — Layout base del panel admin.
// Envuelve todas las rutas /admin/* con el Sidebar persistente.
// El Sidebar se implementará en la Fase 2/3 según el plan del CONTEXT.md.

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Sidebar from '../layout/Sidebar.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx';
import './AdminLayout.css';

export default function AdminLayout() {
  const { estaAutenticado, logout, usuario } = useAuth();
  const navigate = useNavigate();

  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalLogoutAbierto, setModalLogoutAbierto] = useState(false);
  const menuRef = useRef(null);

  // Guardia de ruta: si pierde la sesión, volver al login
  useEffect(() => {
    if (!estaAutenticado) {
      navigate('/login', { replace: true });
    }
  }, [estaAutenticado, navigate]);

  // Cerrar menú con clic afuera o tecla Escape
  useEffect(() => {
    function manejarClickAfuera(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    }

    function manejarKeyDown(e) {
      if (e.key === 'Escape') {
        setMenuAbierto(false);
        setSidebarAbierto(false);
        setModalLogoutAbierto(false);
      }
    }

    if (menuAbierto) {
      document.addEventListener('mousedown', manejarClickAfuera);
    }
    document.addEventListener('keydown', manejarKeyDown);

    return () => {
      document.removeEventListener('mousedown', manejarClickAfuera);
      document.removeEventListener('keydown', manejarKeyDown);
    };
  }, [menuAbierto]);

  function abrirModalLogout() {
    setMenuAbierto(false);
    setModalLogoutAbierto(true);
  }

  function cancelarLogout() {
    setModalLogoutAbierto(false);
  }

  function confirmarLogout() {
    setModalLogoutAbierto(false);
    logout();
  }

  if (!estaAutenticado) return null;

  const nombreMostrar = usuario?.nombre
    ? `${usuario.nombre} ${usuario.apellido || ''}`.trim()
    : 'Administrador';

  return (
    <div className="admin-layout">
      <Sidebar abierto={sidebarAbierto} onClose={() => setSidebarAbierto(false)} />
      <div className="admin-main-wrapper">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className={`admin-menu-toggle-btn ${sidebarAbierto ? 'activo' : ''}`}
              onClick={() => setSidebarAbierto((prev) => !prev)}
              aria-label="Alternar menú de navegación"
              title="Menú principal"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <span className="admin-menu-toggle-label">Menú</span>
            </button>

            <div className="admin-topbar-divider" />

            <div className="admin-topbar-title">
              Repartos Ya <span className="admin-topbar-subtitle">/ Admin</span>
            </div>
          </div>

          <div className="admin-topbar-right">
            <ThemeToggle />
            <div className="admin-user-menu-wrapper" ref={menuRef}>
            <button
              type="button"
              className={`admin-user-btn ${menuAbierto ? 'activo' : ''}`}
              onClick={() => setMenuAbierto((prev) => !prev)}
              aria-expanded={menuAbierto}
              aria-haspopup="menu"
            >
              <span className="admin-user-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span className="admin-user-name">{nombreMostrar}</span>
              <span className="admin-user-badge">Admin</span>
              <svg className={`admin-menu-arrow ${menuAbierto ? 'rotada' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {menuAbierto && (
              <div className="admin-dropdown-menu" role="menu">
                <div className="admin-dropdown-header">
                  <span className="admin-dropdown-user">{nombreMostrar}</span>
                  <span className="admin-dropdown-email">{usuario?.email || 'admin@repartosya.com'}</span>
                </div>

                <div className="admin-dropdown-divider" />

                <button
                  type="button"
                  className="admin-dropdown-item item-disabled"
                  disabled
                  role="menuitem"
                >
                  <svg className="item-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Configuración
                </button>

                <button
                  type="button"
                  className="admin-dropdown-item item-disabled"
                  disabled
                  role="menuitem"
                >
                  <svg className="item-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    {/* Cabeza circular */}
                    <circle cx="8.5" cy="7" r="4" />
                    {/* Torso en arco */}
                    <path d="M2.5 20.5c0-3.3 2.7-6 6-6h2" />
                    {/* Cápsula / lápiz oblicuo a 45° con extremos redondeados */}
                    <rect x="15" y="11.5" width="4.5" height="10" rx="2.25" transform="rotate(45 17.25 16.5)" />
                  </svg>
                  Mi Perfil
                </button>

                <div className="admin-dropdown-divider" />

                <button
                  type="button"
                  className="admin-dropdown-item item-danger"
                  onClick={abrirModalLogout}
                  role="menuitem"
                >
                  <svg className="item-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            )}
            </div>
          </div>
        </header>

        <main className="admin-content">
          {/* Aquí se renderizan las páginas hijas: pedidos, transportistas, etc. */}
          <Outlet />
        </main>
      </div>

      {/* Modal de confirmación de cierre de sesión */}
      {modalLogoutAbierto && (
        <div className="modal-overlay" onClick={cancelarLogout}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <h3 id="modal-title" className="modal-title">¿Seguro que desea cerrar sesión?</h3>
            <p className="modal-description">
              Se cerrará tu sesión actual y deberás volver a ingresar tus credenciales para acceder al panel.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal btn-cancelar"
                onClick={cancelarLogout}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-modal btn-aceptar"
                onClick={confirmarLogout}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
