// AdminLayout.jsx — Layout base del panel admin.
// Envuelve todas las rutas /admin/* con el Sidebar persistente.
// El Sidebar se implementará en la Fase 2/3 según el plan del CONTEXT.md.

import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Sidebar from '../layout/Sidebar.jsx';
import './AdminLayout.css';

export default function AdminLayout() {
  const { estaAutenticado, logout, usuario } = useAuth();
  const navigate = useNavigate();

  // Guardia de ruta: si pierde la sesión, volver al login
  useEffect(() => {
    if (!estaAutenticado) {
      navigate('/login', { replace: true });
    }
  }, [estaAutenticado, navigate]);

  if (!estaAutenticado) return null;

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main-wrapper">
        <header className="admin-topbar">
          <span className="admin-user-info">
            {usuario?.nombre ? `👤 ${usuario.nombre} ${usuario.apellido || ''} (Admin)` : 'Panel de Administración'}
          </span>
          <button
            type="button"
            className="btn-logout"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </header>
        <main className="admin-content">
          {/* Aquí se renderizan las páginas hijas: pedidos, transportistas, etc. */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
