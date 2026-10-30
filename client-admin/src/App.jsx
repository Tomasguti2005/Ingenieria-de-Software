import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import LoginPage from './pages/login/LoginPage.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import TransportistasPage from './pages/admin/transportistas/TransportistasPage.jsx';
import CrearRutaPage from './pages/admin/rutas/CrearRutaPage.jsx';
import RutasCreadasPage from './pages/admin/rutas/RutasCreadasPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rutas protegidas del admin — Layout con Sidebar */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="transportistas" element={<TransportistasPage />} />
              <Route path="asignar-ruta" element={<CrearRutaPage />} />
              <Route path="rutas" element={<RutasCreadasPage />} />
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
