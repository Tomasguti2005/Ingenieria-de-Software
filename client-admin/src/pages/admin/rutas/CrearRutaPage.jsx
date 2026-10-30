// CrearRutaPage.jsx — Formulario para crear una ruta y asociar pedidos y transportista.
// Historia: El administrador podra crear una ruta, a la cual podra asignar sus respectivos pedidos, transportistas, y describir la ruta.

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerTransportistasParaRuta,
  obtenerPedidosParaRuta,
  obtenerRutasCreadas,
  crearRuta,
} from '../../../services/rutas.service.js';
import './CrearRutaPage.css';

export default function CrearRutaPage() {
  const navigate = useNavigate();

  // Estados del formulario
  const [nombreRuta, setNombreRuta] = useState('');
  const [transportistaId, setTransportistaId] = useState('');
  const [desplegableChoferAbierto, setDesplegableChoferAbierto] = useState(false);
  const [pedidosSeleccionados, setPedidosSeleccionados] = useState([]);

  // Datos del backend / mock
  const [transportistas, setTransportistas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [rutasExistentes, setRutasExistentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Alerta flotante (Toast)
  const [alerta, setAlerta] = useState(null);

  // Auto-cierre de alertas a los 5 segundos
  useEffect(() => {
    if (!alerta) return;
    const t = setTimeout(() => setAlerta(null), 5000);
    return () => clearTimeout(t);
  }, [alerta]);

  // Cargar transportistas, pedidos y rutas existentes al montar
  useEffect(() => {
    async function cargarDatosIniciales() {
      setCargando(true);
      try {
        const [transpData, pedidosData, rutasData] = await Promise.all([
          obtenerTransportistasParaRuta(),
          obtenerPedidosParaRuta(),
          obtenerRutasCreadas(),
        ]);
        setTransportistas(transpData);
        setPedidos(pedidosData);
        setRutasExistentes(rutasData);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setAlerta({ tipo: 'error', mensaje: 'No se pudieron cargar los datos necesarios.' });
      } finally {
        setCargando(false);
      }
    }

    cargarDatosIniciales();
  }, []);

  // Transportista actualmente seleccionado
  const transportistaSeleccionado = useMemo(() => {
    if (!transportistaId) return null;
    return transportistas.find((t) => t.id === Number(transportistaId)) || null;
  }, [transportistas, transportistaId]);

  // Validación de requisitos del transportista seleccionado:
  // 1. Debe estar ACTIVO
  // 2. Debe tener un vehículo asignado
  // 3. Debe estar DISPONIBLE (no asignado previamente a otra ruta)
  const transportistaCumpleRequisitos = useMemo(() => {
    if (!transportistaSeleccionado) return false;
    const estaActivo = transportistaSeleccionado.estado === 'ACTIVO';
    const tieneVehiculo = Boolean(
      transportistaSeleccionado.vehiculo && String(transportistaSeleccionado.vehiculo).trim() !== ''
    );
    const yaTieneRuta = rutasExistentes.some((r) => r.transportistaId === transportistaSeleccionado.id);
    return estaActivo && tieneVehiculo && !yaTieneRuta;
  }, [transportistaSeleccionado, rutasExistentes]);

  // Selección de transportista con validación de requisitos
  function handleSeleccionarTransportista(t) {
    const estaActivo = t.estado === 'ACTIVO';
    const tieneVehiculo = Boolean(t.vehiculo && String(t.vehiculo).trim() !== '');
    const yaTieneRuta = rutasExistentes.some((r) => r.transportistaId === t.id);
    const esApto = estaActivo && tieneVehiculo && !yaTieneRuta;

    // Regla: "Un transportista no puede ser asignado a una ruta si no cumple con los requisitos establecidos"
    if (!esApto) {
      let motivo = 'El transportista no puede ser asignado: ';
      if (!estaActivo) motivo += 'debe estar ACTIVO en el sistema.';
      else if (!tieneVehiculo) motivo += 'debe tener un vehículo asignado.';
      else if (yaTieneRuta) motivo += 'ya se encuentra asignado a otra ruta de entrega.';
      setAlerta({ tipo: 'error', mensaje: motivo });
      return;
    }

    setTransportistaId(String(t.id));
    setDesplegableChoferAbierto(false);
  }

  // Manejo de selección múltiple de pedidos
  function toggleSeleccionPedido(pedido) {
    // Regla: "Un pedido no puede estar asignado a más de una ruta"
    if (pedido.rutaId !== null && pedido.rutaId !== undefined) {
      setAlerta({
        tipo: 'error',
        mensaje: 'Este pedido ya está asignado a otra ruta y no puede ser seleccionado.',
      });
      return;
    }

    setPedidosSeleccionados((prev) => {
      if (prev.includes(pedido.id)) {
        return prev.filter((id) => id !== pedido.id);
      } else {
        return [...prev, pedido.id];
      }
    });
  }

  // Enviar formulario (Creación de ruta)
  async function handleSubmit(e) {
    e.preventDefault();

    // ESCENARIO 2: Creación fallida por no asignar pedidos
    if (pedidosSeleccionados.length === 0) {
      setAlerta({
        tipo: 'error',
        mensaje: 'La ruta ha fallado al crearse, necesita asignar pedidos',
      });
      return;
    }

    // Validación de nombre / descripción
    if (!nombreRuta.trim()) {
      setAlerta({
        tipo: 'error',
        mensaje: 'Debe ingresar un nombre o descripción para la ruta.',
      });
      return;
    }

    // Validación de transportista
    if (!transportistaId) {
      setAlerta({
        tipo: 'error',
        mensaje: 'Debe seleccionar un transportista para la ruta.',
      });
      return;
    }

    if (!transportistaCumpleRequisitos) {
      setAlerta({
        tipo: 'error',
        mensaje: 'El transportista seleccionado debe estar activo, disponible y tener un vehículo asignado.',
      });
      return;
    }

    setEnviando(true);
    try {
      // ESCENARIO 1: Creación exitosa de la ruta
      await crearRuta({
        nombre: nombreRuta.trim(),
        transportistaId: Number(transportistaId),
        pedidosIds: pedidosSeleccionados,
      });

      setAlerta({
        tipo: 'success',
        mensaje: 'Ruta creada exitosamente',
      });

      // Limpiar formulario tras éxito
      setNombreRuta('');
      setTransportistaId('');
      setPedidosSeleccionados([]);

      // Recargar pedidos y rutas para actualizar estados
      const [pedidosActualizados, rutasActualizadas] = await Promise.all([
        obtenerPedidosParaRuta(),
        obtenerRutasCreadas(),
      ]);
      setPedidos(pedidosActualizados);
      setRutasExistentes(rutasActualizadas);
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: err.message || 'Error al intentar crear la ruta.',
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="crear-ruta-container">

      {/* ── Toast Flotante ── */}
      {alerta && (
        <div className={`toast-notification toast-${alerta.tipo}`} role="alert">
          <div className="toast-content">
            <span className="toast-icon">
              {alerta.tipo === 'success' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
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
            <span className="breadcrumb-current">Crear ruta</span>
          </div>
          <h1 className="header-title">Creación de Rutas</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary, #9ca3af)', marginTop: '4px' }}>
            Asigná sus respectivos pedidos, seleccioná un transportista disponible con vehículo y describí la ruta.
          </p>
        </div>
      </header>

      {/* ── Formulario Principal ── */}
      <form onSubmit={handleSubmit} className="crear-ruta-form" noValidate>

        {/* SECCIÓN 1: Descripción / Nombre de la ruta */}
        <section className="ruta-card-section">
          <div className="section-header">
            <h2 className="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              1. Descripción de la Ruta
            </h2>
            <span className="section-badge">Obligatorio</span>
          </div>

          <div>
            <input
              type="text"
              className="form-input-text"
              placeholder="Ej: Ruta Casco Urbano La Plata - Mañana"
              value={nombreRuta}
              onChange={(e) => setNombreRuta(e.target.value)}
            />
            <div className="form-hint">Ingresá un nombre identificatorio para la hoja de ruta del repartidor.</div>
          </div>
        </section>

        {/* SECCIÓN 2: Selección de Transportista */}
        <section className="ruta-card-section">
          <div className="section-header">
            <h2 className="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              2. Asignar Transportista
            </h2>
            <span className="section-badge">Máximo 1 transportista</span>
          </div>

          <div>
            <div className="custom-select-container">
              <button
                type="button"
                className={`custom-select-trigger ${desplegableChoferAbierto ? 'abierto' : ''}`}
                onClick={() => setDesplegableChoferAbierto(!desplegableChoferAbierto)}
              >
                {transportistaSeleccionado ? (
                  <div className="option-left">
                    <div className="option-avatar">
                      {transportistaSeleccionado.nombre.charAt(0)}{transportistaSeleccionado.apellido.charAt(0)}
                    </div>
                    <span className="option-name">{transportistaSeleccionado.nombre} {transportistaSeleccionado.apellido}</span>
                    <div className="option-pills">
                      <span className={`pill ${transportistaSeleccionado.estado === 'ACTIVO' ? 'pill-activo' : 'pill-inactivo'}`}>
                        {transportistaSeleccionado.estado}
                      </span>
                      <span className={`pill ${transportistaSeleccionado.vehiculo ? 'pill-vehiculo' : 'pill-sin-vehiculo'}`}>
                        {transportistaSeleccionado.vehiculo ? `Vehículo: ${transportistaSeleccionado.vehiculo}` : 'Sin vehículo'}
                      </span>
                      <span className={`pill ${transportistaCumpleRequisitos ? 'pill-apto' : 'pill-no-apto'}`}>
                        {transportistaCumpleRequisitos ? 'Disponible para trabajar' : 'No disponible'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="custom-select-placeholder">-- Seleccionar transportista responsable --</span>
                )}

                <svg 
                  className={`sidebar-chevron ${desplegableChoferAbierto ? 'rotado' : ''}`} 
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

              {desplegableChoferAbierto && (
                <div className="custom-select-menu">
                  {transportistas.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>
                      No hay transportistas registrados.
                    </div>
                  ) : (
                    transportistas.map((t) => {
                      const tieneVehiculo = Boolean(t.vehiculo && String(t.vehiculo).trim() !== '');
                      const estaActivo = t.estado === 'ACTIVO';
                      const yaTieneRuta = rutasExistentes.some((r) => r.transportistaId === t.id);
                      const esApto = estaActivo && tieneVehiculo && !yaTieneRuta;
                      const estaSeleccionado = Number(transportistaId) === t.id;

                      return (
                        <button
                          type="button"
                          key={t.id}
                          className={`custom-select-option ${estaSeleccionado ? 'seleccionado' : ''} ${!esApto ? 'deshabilitado' : ''}`}
                          onClick={() => handleSeleccionarTransportista(t)}
                          title={!esApto ? 'No cumple con los requisitos para ser asignado' : 'Seleccionar chofer'}
                        >
                          <div className="option-left">
                            <div className="option-avatar">
                              {t.nombre.charAt(0)}{t.apellido.charAt(0)}
                            </div>
                            <span className="option-name">{t.nombre} {t.apellido}</span>
                          </div>

                          {/* Atributos indicados en la lista según criterios de aceptación */}
                          <div className="option-pills">
                            <span className={`pill ${estaActivo ? 'pill-activo' : 'pill-inactivo'}`}>
                              {estaActivo ? 'Activo' : 'Inactivo'}
                            </span>
                            <span className={`pill ${tieneVehiculo ? 'pill-vehiculo' : 'pill-sin-vehiculo'}`}>
                              {tieneVehiculo ? `Vehículo: ${t.vehiculo}` : 'Sin vehículo'}
                            </span>
                            <span className={`pill ${esApto ? 'pill-apto' : 'pill-no-apto'}`}>
                              {esApto ? 'Disponible para trabajar' : yaTieneRuta ? 'En otra ruta' : 'No disponible'}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <div className="form-hint">
              Requisitos: el transportista debe estar registrado, activo, disponible y contar con un vehículo asignado.
            </div>

            {/* Vista previa de atributos del transportista seleccionado */}
            {transportistaSeleccionado && (
              <div className="transportista-preview">
                <div className="transportista-preview-info">
                  <div className="transportista-preview-avatar">
                    {transportistaSeleccionado.nombre.charAt(0)}{transportistaSeleccionado.apellido.charAt(0)}
                  </div>
                  <div>
                    <div className="preview-name">{transportistaSeleccionado.nombre} {transportistaSeleccionado.apellido}</div>
                    <div className="preview-tags">
                      <span className={`tag-attr ${transportistaSeleccionado.estado === 'ACTIVO' ? 'tag-success' : 'tag-warning'}`}>
                        {transportistaSeleccionado.estado === 'ACTIVO' ? 'Estado: Activo' : 'Estado: Inactivo'}
                      </span>
                      <span className={`tag-attr ${transportistaSeleccionado.vehiculo ? 'tag-success' : 'tag-warning'}`}>
                        {transportistaSeleccionado.vehiculo ? `Vehículo: ${transportistaSeleccionado.vehiculo}` : 'Sin vehículo'}
                      </span>
                      <span className={`tag-attr ${transportistaCumpleRequisitos ? 'tag-success' : 'tag-warning'}`}>
                        {transportistaCumpleRequisitos ? 'Disponible para trabajar' : 'No cumple requisitos'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECCIÓN 3: Selección de Pedidos */}
        <section className="ruta-card-section">
          <div className="section-header">
            <h2 className="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              </svg>
              3. Asociar Pedidos a la Ruta
            </h2>
            <span className="section-badge">
              {pedidosSeleccionados.length} {pedidosSeleccionados.length === 1 ? 'pedido seleccionado' : 'pedidos seleccionados'}
            </span>
          </div>

          <div className="form-hint" style={{ marginBottom: '8px' }}>
            Seleccioná uno o más pedidos disponibles para incorporarlos a la ruta. Los pedidos asignados a otra ruta no pueden seleccionarse.
          </div>

          <div className="pedidos-selection-list">
            {cargando ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>Cargando pedidos disponibles...</div>
            ) : pedidos.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No hay pedidos registrados en el sistema.</div>
            ) : (
              pedidos.map((p) => {
                const estaAsignadoAOtraRuta = p.rutaId !== null && p.rutaId !== undefined;
                const estaSeleccionado = pedidosSeleccionados.includes(p.id);

                return (
                  <div
                    key={p.id}
                    className={`pedido-select-item ${estaSeleccionado ? 'seleccionado' : ''} ${estaAsignadoAOtraRuta ? 'deshabilitado' : ''}`}
                    onClick={() => toggleSeleccionPedido(p)}
                  >
                    <div className="pedido-item-left">
                      <input
                        type="checkbox"
                        className="pedido-checkbox"
                        checked={estaSeleccionado}
                        disabled={estaAsignadoAOtraRuta}
                        onChange={() => {}} // Manejado por onClick del contenedor
                      />
                      <div className="pedido-item-details">
                        <span className="pedido-codigo">{p.codigoSeguimiento}</span>
                        <span className="pedido-destino">{p.direccionDestino}</span>
                        <span className="pedido-destinatario">Destinatario: {p.destinatarioNombre}</span>
                      </div>
                    </div>

                    {/* El pedido indicará a su costado si está asignado a otra ruta */}
                    <div className="pedido-item-right">
                      {estaAsignadoAOtraRuta ? (
                        <span className="badge-ruta asignado">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          Asignado a otra ruta
                        </span>
                      ) : (
                        <span className="badge-ruta disponible">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          Disponible para asignar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Acciones finales */}
        <div className="ruta-form-actions">
          <button
            type="button"
            className="btn-cancelar-ruta"
            onClick={() => navigate('/admin/rutas')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-crear-ruta"
            disabled={enviando}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
            <span>{enviando ? 'Creando ruta...' : 'Crear ruta'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
