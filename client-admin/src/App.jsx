import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import LoginPage from './pages/login/LoginPage.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import TransportistasPage from './pages/admin/transportistas/TransportistasPage.jsx';

// Páginas pendientes de Fase 2/3 — se importarán cuando se implementen:
// import PedidosPage from './pages/admin/pedidos/PedidosPage.jsx';
// import RendicionPage from './pages/admin/rendicion/RendicionPage.jsx';
// import ReportesPage from './pages/admin/reportes/ReportesPage.jsx';
// import TrackingPage from './pages/tracking/TrackingPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          {/* <Route path="/seguimiento/:codigo" element={<TrackingPage />} /> */}

          {/* Rutas protegidas del admin — Layout con Sidebar */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="transportistas" element={<TransportistasPage />} />
            {/* Fases 2 y 3: descomentar cuando estén implementadas */}
            {/* <Route path="pedidos" element={<PedidosPage />} /> */}
            {/* <Route path="rendicion" element={<RendicionPage />} /> */}
            {/* <Route path="reportes" element={<ReportesPage />} /> */}
          </Route>

          {/* Cualquier ruta desconocida → login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

