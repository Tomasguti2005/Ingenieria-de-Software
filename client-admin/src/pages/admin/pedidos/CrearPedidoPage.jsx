// CrearPedidoPage.jsx — Cargar datos de una nueva solicitud de pedido.
// Cumple con la Historia de Usuario:
// - Campos obligatorios: dirección origen, dirección destino, día de entrega, nombre del destinatario, transportista.
// - Estado inicial: REGISTRADO automático.
// - Notificaciones específicas por campo:
//   * Destinatario: formato solo letras y espacios.
//   * Fecha: validación específica para día, mes, año de 4 dígitos y fechas pasadas.
//   * Direcciones y transportista: advertencias de obligatoriedad.
// - Adaptable al tema visual Claro y Oscuro.

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearPedido, obtenerTransportistasDisponibles } from '../../../services/pedidosService';
import './CrearPedidoPage.css';

export default function CrearPedidoPage() {
  const navigate = useNavigate();

  // Estados del formulario
  const [formData, setFormData] = useState({
    direccionOrigen: '',
    direccionDestino: '',
    destinatarioNombre: '',
    destinatarioTelefono: '',
    descripcionProductos: '',
    nombreTransportista: '',
    repartidorId: '',
    notas: '',
  });

  // Fecha unificada en formato DD/MM/AAAA
  const [fechaInput, setFechaInput] = useState('');
  const fechaRef = useRef(null);

  // Errores específicos por campo
  const [erroresCampos, setErroresCampos] = useState({});

  const [transportistas, setTransportistas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [intentadoEnviar, setIntentadoEnviar] = useState(false);

  useEffect(() => {
    async function cargarTransportistas() {
      try {
        const lista = await obtenerTransportistasDisponibles();
        setTransportistas(lista);
      } catch (err) {
        console.error('Error cargando transportistas:', err);
      }
    }
    cargarTransportistas();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    
    // Limpiar error específico del campo al tipear
    setErroresCampos((prev) => ({
      ...prev,
      [name]: '',
    }));

    if (name === 'nombreTransportista') {
      const seleccionado = transportistas.find(
        (t) => (t.nombreCompleto || `${t.nombre} ${t.apellido}`) === value
      );
      setFormData((prev) => ({
        ...prev,
        nombreTransportista: value,
        repartidorId: seleccionado ? seleccionado.id : '',
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Formateador con máscara automática DD/MM/AAAA
  function handleFechaChange(e) {
    let valor = e.target.value.replace(/\D/g, ''); // solo dígitos
    if (valor.length > 8) {
      valor = valor.slice(0, 8);
    }

    let formateado = '';
    if (valor.length > 0) {
      formateado = valor.slice(0, 2);
    }
    if (valor.length >= 3) {
      formateado += '/' + valor.slice(2, 4);
    }
    if (valor.length >= 5) {
      formateado += '/' + valor.slice(4, 8);
    }

    setFechaInput(formateado);
    setErroresCampos((prev) => ({
      ...prev,
      diaEntrega: '',
    }));
  }

  // Validación granular de la fecha
  function validarFechaDetallada(fechaStr) {
    if (!fechaStr.trim()) {
      return { esValida: false, error: 'Debe ingresar la fecha de entrega (DD/MM/AAAA).' };
    }

    const partes = fechaStr.split('/');
    if (partes.length !== 3 || !partes[0] || !partes[1] || !partes[2]) {
      return { esValida: false, error: 'Fecha incompleta. Complete día, mes y año (DD/MM/AAAA).' };
    }

    const diaStr = partes[0];
    const mesStr = partes[1];
    const anioStr = partes[2];

    const dia = parseInt(diaStr, 10);
    const mes = parseInt(mesStr, 10);
    const anio = parseInt(anioStr, 10);

    // Validación de 4 dígitos obligatorios en el año
    if (anioStr.length !== 4 || isNaN(anio)) {
      return { esValida: false, error: 'El año debe contener exactamente 4 dígitos (ej: 2026).' };
    }

    if (mes < 1 || mes > 12) {
      return { esValida: false, error: 'Mes inválido: debe estar comprendido entre 01 y 12.' };
    }

    // Días válidos según el mes (incluye bisiestos)
    const diasEnMes = new Date(anio, mes, 0).getDate();
    if (dia < 1 || dia > diasEnMes) {
      return { esValida: false, error: `Día inválido: el mes ${String(mes).padStart(2, '0')} tiene entre 01 y ${diasEnMes} días.` };
    }

    // Validación de fecha anterior a hoy
    const fechaIngresada = new Date(anio, mes - 1, dia);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaIngresada < hoy) {
      return { esValida: false, error: 'Fecha pasada: no se pueden ingresar fechas anteriores al día de hoy.' };
    }

    const isoStr = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return { esValida: true, iso: isoStr };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIntentadoEnviar(true);
    setMensaje({ tipo: '', texto: '' });

    const nuevosErrores = {};

    // 1. Dirección de origen
    if (!formData.direccionOrigen.trim()) {
      nuevosErrores.direccionOrigen = 'La dirección de origen es obligatoria.';
    }

    // 2. Dirección de destino
    if (!formData.direccionDestino.trim()) {
      nuevosErrores.direccionDestino = 'La dirección de destino es obligatoria.';
    }

    // 3. Nombre del destinatario (solo letras y espacios)
    const nombreTrim = formData.destinatarioNombre.trim();
    if (!nombreTrim) {
      nuevosErrores.destinatarioNombre = 'El nombre del destinatario es obligatorio.';
    } else {
      const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
      if (!regexSoloLetras.test(nombreTrim)) {
        nuevosErrores.destinatarioNombre = 'Formato incorrecto: el nombre solo debe contener letras.';
      } else if (nombreTrim.length < 3) {
        nuevosErrores.destinatarioNombre = 'El nombre debe tener al menos 3 caracteres.';
      }
    }

    // 3b. Teléfono del destinatario
    const telTrim = (formData.destinatarioTelefono || '').trim();
    if (!telTrim) {
      nuevosErrores.destinatarioTelefono = 'El teléfono de contacto es obligatorio.';
    } else if (!/^\+?[0-9\s-]{6,20}$/.test(telTrim)) {
      nuevosErrores.destinatarioTelefono = 'Ingrese un teléfono válido (números, mínimo 6 dígitos).';
    }

    // 4. Nombre del transportista
    if (!formData.nombreTransportista.trim()) {
      nuevosErrores.nombreTransportista = 'Debe seleccionar un transportista asignado.';
    }

    // 5. Fecha de entrega detallada
    const resFecha = validarFechaDetallada(fechaInput);
    if (!resFecha.esValida) {
      nuevosErrores.diaEntrega = resFecha.error;
    }

    setErroresCampos(nuevosErrores);

    // Si hay algún error, mostrar alerta de Criterio 2
    if (Object.keys(nuevosErrores).length > 0) {
      setMensaje({
        tipo: 'error',
        texto: 'Falta completar campos obligatorios, intente nuevamente',
      });
      return;
    }

    setCargando(true);
    try {
      const res = await crearPedido({
        ...formData,
        descripcionProductos: formData.descripcionProductos.trim() || 'Paquete general',
        diaEntrega: resFecha.iso,
      });

      // Criterio 1: Carga exitosa con mensaje "Pedido realizado"
      setMensaje({
        tipo: 'exito',
        texto: res.mensaje || 'Pedido realizado',
      });

      setFormData({
        direccionOrigen: '',
        direccionDestino: '',
        destinatarioNombre: '',
        destinatarioTelefono: '',
        descripcionProductos: '',
        nombreTransportista: '',
        repartidorId: '',
        notas: '',
      });
      setFechaInput('');
      setErroresCampos({});
      setIntentadoEnviar(false);

      setTimeout(() => {
        navigate('/admin/pedidos/vigentes');
      }, 1500);
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'Falta completar campos obligatorios, intente nuevamente',
      });
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="crear-pedido-container">
      {/* Encabezado Principal */}
      <header className="page-header">
        <div className="header-meta">
          <div className="header-breadcrumb">
            <span>Repartos Ya</span>
            <span className="breadcrumb-separator">/</span>
            <span>Pedidos</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Crear Pedido</span>
          </div>
          <h1 className="header-title">Cargar Nueva Solicitud de Pedido</h1>
        </div>
      </header>

      {/* Alerta de Criterios de Aceptación */}
      {mensaje.texto && (
        <div className={`alerta-container ${mensaje.tipo}`} role="alert">
          {mensaje.tipo === 'exito' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Card del Formulario */}
      <div className="crear-pedido-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="formulario-secciones">
            {/* Sección 1: Planificación y Asignación */}
            <div className="seccion-formulario">
              <div className="seccion-header">
                <span className="seccion-titulo">1. Planificación y Asignación</span>
              </div>
              <div className="formulario-grid">
                {/* Fecha / Día de Entrega */}
                <div className="campo-grupo">
                  <label htmlFor="diaEntrega">
                    Día de entrega <span className="campo-requerido">* (DD/MM/AAAA)</span>
                  </label>
                  <input
                    ref={fechaRef}
                    id="diaEntrega"
                    type="text"
                    name="diaEntrega"
                    placeholder="DD/MM/AAAA"
                    value={fechaInput}
                    onChange={handleFechaChange}
                    onFocus={(e) => {
                      if (!fechaInput) {
                        e.target.setSelectionRange(0, 0);
                      }
                    }}
                    maxLength={10}
                    className={intentadoEnviar && erroresCampos.diaEntrega ? 'error' : ''}
                  />
                  {intentadoEnviar && erroresCampos.diaEntrega && (
                    <span className="campo-error-texto">{erroresCampos.diaEntrega}</span>
                  )}
                </div>

                {/* Nombre del Transportista */}
                <div className="campo-grupo">
                  <label htmlFor="nombreTransportista">
                    Nombre del transportista <span className="campo-requerido">*</span>
                  </label>
                  <select
                    id="nombreTransportista"
                    name="nombreTransportista"
                    value={formData.nombreTransportista}
                    onChange={handleChange}
                    className={intentadoEnviar && erroresCampos.nombreTransportista ? 'error' : ''}
                  >
                    <option value="">-- Seleccionar transportista asignado --</option>
                    {transportistas.map((t) => {
                      const nombre = t.nombreCompleto || `${t.nombre} ${t.apellido}`;
                      return (
                        <option key={t.id} value={nombre}>
                          {nombre}
                        </option>
                      );
                    })}
                  </select>
                  {intentadoEnviar && erroresCampos.nombreTransportista && (
                    <span className="campo-error-texto">{erroresCampos.nombreTransportista}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sección 2: Puntos de Trayecto */}
            <div className="seccion-formulario">
              <div className="seccion-header">
                <span className="seccion-titulo">2. Puntos de Trayecto</span>
              </div>
              <div className="formulario-grid">
                {/* Dirección de Origen */}
                <div className="campo-grupo">
                  <label htmlFor="direccionOrigen">
                    Dirección de origen <span className="campo-requerido">*</span>
                  </label>
                  <input
                    id="direccionOrigen"
                    type="text"
                    name="direccionOrigen"
                    placeholder="Ej. Calle 12 #450, La Plata"
                    value={formData.direccionOrigen}
                    onChange={handleChange}
                    className={intentadoEnviar && erroresCampos.direccionOrigen ? 'error' : ''}
                  />
                  {intentadoEnviar && erroresCampos.direccionOrigen && (
                    <span className="campo-error-texto">{erroresCampos.direccionOrigen}</span>
                  )}
                </div>

                {/* Dirección de Destino */}
                <div className="campo-grupo">
                  <label htmlFor="direccionDestino">
                    Dirección de destino <span className="campo-requerido">*</span>
                  </label>
                  <input
                    id="direccionDestino"
                    type="text"
                    name="direccionDestino"
                    placeholder="Ej. Av. 7 #1220, La Plata"
                    value={formData.direccionDestino}
                    onChange={handleChange}
                    className={intentadoEnviar && erroresCampos.direccionDestino ? 'error' : ''}
                  />
                  {intentadoEnviar && erroresCampos.direccionDestino && (
                    <span className="campo-error-texto">{erroresCampos.direccionDestino}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sección 3: Cliente Destinatario */}
            <div className="seccion-formulario">
              <div className="seccion-header">
                <span className="seccion-titulo">3. Cliente Destinatario</span>
              </div>
              <div className="formulario-grid">
                {/* Nombre del Destinatario */}
                <div className="campo-grupo">
                  <label htmlFor="destinatarioNombre">
                    Nombre del destinatario <span className="campo-requerido">*</span>
                  </label>
                  <input
                    id="destinatarioNombre"
                    type="text"
                    name="destinatarioNombre"
                    placeholder="Ej. Juan Carlos Pérez"
                    value={formData.destinatarioNombre}
                    onChange={handleChange}
                    className={intentadoEnviar && erroresCampos.destinatarioNombre ? 'error' : ''}
                  />
                  {intentadoEnviar && erroresCampos.destinatarioNombre && (
                    <span className="campo-error-texto">{erroresCampos.destinatarioNombre}</span>
                  )}
                </div>

                {/* Teléfono del Destinatario */}
                <div className="campo-grupo">
                  <label htmlFor="destinatarioTelefono">
                    Teléfono de contacto <span className="campo-requerido">*</span>
                  </label>
                  <input
                    id="destinatarioTelefono"
                    type="text"
                    name="destinatarioTelefono"
                    placeholder="Ej. 2214567890"
                    value={formData.destinatarioTelefono}
                    onChange={handleChange}
                    className={intentadoEnviar && erroresCampos.destinatarioTelefono ? 'error' : ''}
                  />
                  {intentadoEnviar && erroresCampos.destinatarioTelefono && (
                    <span className="campo-error-texto">{erroresCampos.destinatarioTelefono}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sección 4: Detalle e Indicaciones (Opcionales en 2 columnas simétricas) */}
            <div className="seccion-formulario">
              <div className="seccion-header">
                <span className="seccion-titulo">4. Detalle e Indicaciones</span>
              </div>
              <div className="formulario-grid">
                {/* Descripción de Productos / Contenido */}
                <div className="campo-grupo">
                  <label htmlFor="descripcionProductos">
                    Descripción de productos <span className="campo-opcional">(opcional)</span>
                  </label>
                  <textarea
                    id="descripcionProductos"
                    name="descripcionProductos"
                    rows="3"
                    placeholder="Contenido del paquete (ej. Indumentaria, insumos)..."
                    value={formData.descripcionProductos}
                    onChange={handleChange}
                  />
                </div>

                {/* Comentario adicional / Notas */}
                <div className="campo-grupo">
                  <label htmlFor="notas">
                    Notas adicionales <span className="campo-opcional">(opcional)</span>
                  </label>
                  <textarea
                    id="notas"
                    name="notas"
                    rows="3"
                    placeholder="Observaciones de entrega, timbres, horarios o indicaciones..."
                    value={formData.notas}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="crear-pedido-acciones" style={{ marginTop: '24px' }}>
            <button
              type="button"
              className="btn-secundario"
              onClick={() => navigate('/admin/pedidos/vigentes')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primario"
              disabled={cargando}
            >
              {cargando ? 'Procesando...' : 'Cargar pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
