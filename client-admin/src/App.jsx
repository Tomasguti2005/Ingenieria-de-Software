import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        {/* <Route path="/login" element={<LoginPage />} /> */}
        {/* <Route path="/seguimiento/:codigo" element={<TrackingPage />} /> */}

        {/* Rutas protegidas del admin */}
        {/* <Route path="/admin/*" element={<AdminLayout />}> */}
        {/*   <Route path="pedidos" element={<PedidosPage />} /> */}
        {/*   <Route path="transportistas" element={<TransportistasPage />} /> */}
        {/*   <Route path="rendicion" element={<RendicionPage />} /> */}
        {/*   <Route path="reportes" element={<ReportesPage />} /> */}
        {/* </Route> */}

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
