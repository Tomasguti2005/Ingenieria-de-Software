import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  obtenerPedidoPorId,
  modificarPedido,
  eliminarPedido,
} from '../../../services/pedidosService';
import './EditarPedidoPage.css';

export default function EditarPedidoPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados de datos
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Formulario editable
  const [formData, setFormData] = useState({
    direccionOrigen: '',
    direccionDestino: '',
    destinatarioNombre: '',
    destinatarioTelefono: '',
    descripcionProductos: '',
    notas: '',
  });

  // Estado inicial de referencia para detectar si hay cambios sin guardar
  const [datosIniciales, setDatosIniciales] = useState(null);
  const [fechaInicial, setFechaInicial] = useState('');

  // Campo de fecha en formato texto con máscara DD/MM/AAAA
  const [fechaInput, setFechaInput] = useState('');
  const [erroresCampos, setErroresCampos] = useState({});

  // Mensajes y alertas
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');
  const [copiadoExitoso, setCopiadoExitoso] = useState(false);

  // HU: Copiar enlace de seguimiento al portapapeles
  const handleCopiarEnlace = async () => {
    const cod = pedido?.codigoSeguimiento;
    if (!cod) return;
    const url = `${window.location.origin}/seguimiento/${cod}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setMensajeExito('Enlace copiado al portapapeles');
      setCopiadoExitoso(true);
      setErrorGeneral('');
      setTimeout(() => {
        setCopiadoExitoso(false);
        setMensajeExito('');
      }, 3000);
    } catch {
      setMensajeExito('Enlace copiado al portapapeles');
      setCopiadoExitoso(true);
      setTimeout(() => {
        setCopiadoExitoso(false);
        setMensajeExito('');
      }, 3000);
    }
  };

  // Modales interactivos
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState(false);
  const [modalConfirmarSalida, setModalConfirmarSalida] = useState(false);

  // Estados bloqueados para modificación (Escenario 4)
  const estadosBloqueados = ['RETIRADO', 'EN_CAMINO', 'ENTREGADO', 'FALLIDO', 'CANCELADO'];
  const estaBloqueado = pedido && estadosBloqueados.includes(pedido.estado);

  // Convierte YYYY-MM-DD o ISO a DD/MM/AAAA
  function isoADDMMAAAA(isoStr) {
    if (!isoStr) return '';
    const soloFecha = isoStr.split('T')[0];
    const partes = soloFecha.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return '';
  }

  // Validador detallado de la fecha ingresada
  function validarFecha(fechaStr) {
    if (!fechaStr || !fechaStr.trim()) {
      return { esValida: false, error: 'Debe ingresar la fecha de entrega (DD/MM/AAAA).' };
    }

    const partes = fechaStr.split('/');
    if (partes.length !== 3 || !partes[0] || !partes[1] || !partes[2]) {
      return { esValida: false, error: 'Fecha incompleta. Complete día, mes y año (DD/MM/AAAA).' };
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr.trim())) {
      return { esValida: false, error: 'Formato inválido. Use DD/MM/AAAA (ej: 25/11/2026).' };
    }

    const diaStr = partes[0];
    const mesStr = partes[1];
    const anioStr = partes[2];

    const dia = parseInt(diaStr, 10);
    const mes = parseInt(mesStr, 10);
    const anio = parseInt(anioStr, 10);

    if (anioStr.length !== 4 || isNaN(anio)) {
      return { esValida: false, error: 'El año debe contener exactamente 4 dígitos (ej: 2026).' };
    }

    if (mes < 1 || mes > 12) {
      return { esValida: false, error: 'Mes inválido: debe estar comprendido entre 01 y 12.' };
    }

    const diasEnMes = new Date(anio, mes, 0).getDate();
    if (dia < 1 || dia > diasEnMes) {
      return { esValida: false, error: `Día inválido: el mes ${String(mes).padStart(2, '0')} tiene entre 01 y ${diasEnMes} días.` };
    }

    // Normalizar a fecha local YYYY-MM-DD
    const isoStr = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const ahora = new Date();
    const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;

    // Si la fecha ingresada es estrictamente menor al día de hoy, salta la falla
    if (isoStr < hoyStr) {
      return { esValida: false, error: 'La fecha de entrega ingresada es anterior a la actual' };
    }

    return { esValida: true, iso: isoStr };
  }

  // Carga inicial de datos
  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      try {
        setCargando(true);
        const pedidoRes = await obtenerPedidoPorId(id);

        if (!activo) return;

        setPedido(pedidoRes);

        // Prellenar campos
        const fechaRaw = pedidoRes.fechaEntrega || pedidoRes.diaEntrega || '';
        const fechaFormateada = isoADDMMAAAA(fechaRaw);
        setFechaInput(fechaFormateada);
        setFechaInicial(fechaFormateada);

        const initialValues = {
          direccionOrigen: pedidoRes.direccionOrigen || '',
          direccionDestino: pedidoRes.direccionDestino || '',
          destinatarioNombre: pedidoRes.destinatarioNombre || '',
          destinatarioTelefono: pedidoRes.destinatarioTelefono || '',
          descripcionProductos: pedidoRes.descripcionProductos || '',
          notas: pedidoRes.notas || '',
        };

        setFormData(initialValues);
        setDatosIniciales(initialValues);
      } catch (err) {
        if (!activo) return;
        setErrorGeneral(err.message || 'Error al cargar los datos del pedido.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarDatos();
    return () => {
      activo = false;
    };
  }, [id]);

  // Detector de cambios sin guardar
  const hayCambiosSinGuardar = () => {
    if (estaBloqueado || !datosIniciales) return false;

    if (fechaInput !== fechaInicial) return true;

    return Object.keys(formData).some((key) => {
      const valActual = String(formData[key] ?? '').trim();
      const valInicial = String(datosIniciales[key] ?? '').trim();
      return valActual !== valInicial;
    });
  };

  // Manejo de volver con advertencia si hay cambios sin guardar
  const handleIntentarVolver = () => {
    if (hayCambiosSinGuardar()) {
      setModalConfirmarSalida(true);
    } else {
      navigate('/admin/pedidos/vigentes');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErroresCampos((prev) => ({ ...prev, [name]: '' }));
    setMensajeExito('');
  };

  // Manejador con máscara automática DD/MM/AAAA para escribir y borrar sin trabas
  const handleFechaChange = (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 8) valor = valor.slice(0, 8);

    let formateado = '';
    if (valor.length > 0) formateado = valor.slice(0, 2);
    if (valor.length >= 3) formateado += '/' + valor.slice(2, 4);
    if (valor.length >= 5) formateado += '/' + valor.slice(4, 8);

    setFechaInput(formateado);
    setErroresCampos((prev) => ({ ...prev, fechaEntrega: '' }));
    setMensajeExito('');
  };

  // Guardar Cambios
  const handleGuardar = async (e) => {
    if (e) e.preventDefault();
    if (estaBloqueado) return;

    setErrorGeneral('');
    setMensajeExito('');

    // Validación general de campos obligatorios y formato
    const nuevosErrores = {};
    if (!formData.direccionOrigen.trim()) {
      nuevosErrores.direccionOrigen = 'La dirección de origen es obligatoria.';
    }
    if (!formData.direccionDestino.trim()) {
      nuevosErrores.direccionDestino = 'La dirección de destino es obligatoria.';
    }
    const nombreTrim = formData.destinatarioNombre.trim();
    if (!nombreTrim) {
      nuevosErrores.destinatarioNombre = 'El nombre del destinatario es obligatorio.';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombreTrim)) {
      nuevosErrores.destinatarioNombre = 'Formato incorrecto: el nombre solo debe contener letras.';
    } else if (nombreTrim.length < 3) {
      nuevosErrores.destinatarioNombre = 'El nombre debe tener al menos 3 caracteres.';
    }

    const telTrim = (formData.destinatarioTelefono || '').trim();
    if (telTrim && !/^\+?[0-9\s-]{6,20}$/.test(telTrim)) {
      nuevosErrores.destinatarioTelefono = 'Ingrese un teléfono válido (números, mínimo 6 dígitos).';
    }

    // Validación de fecha (obligatoria + formato DD/MM/AAAA + no pasada)
    const validacionFecha = validarFecha(fechaInput);
    if (!validacionFecha.esValida) {
      nuevosErrores.fechaEntrega = validacionFecha.error;
      if (validacionFecha.error === 'La fecha de entrega ingresada es anterior a la actual') {
        setErrorGeneral('La fecha de entrega ingresada es anterior a la actual');
      }
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresCampos(nuevosErrores);
      return;
    }

    try {
      setGuardando(true);
      setErrorGeneral('');
      setMensajeExito('');

      await modificarPedido(id, {
        direccionOrigen: formData.direccionOrigen.trim(),
        direccionDestino: formData.direccionDestino.trim(),
        destinatarioNombre: nombreTrim,
        destinatarioTelefono: telTrim,
        descripcionProductos: formData.descripcionProductos.trim(),
        fechaEntrega: new Date(validacionFecha.iso + 'T12:00:00Z').toISOString(),
        diaEntrega: validacionFecha.iso,
        notas: formData.notas.trim(),
      });

      // Se cierra la ventana volviendo a la lista de pedidos vigentes con el mensaje de éxito
      navigate('/admin/pedidos/vigentes', {
        state: { mensajeExito: 'El pedido ha sido modificado con éxito' },
        replace: true,
      });
    } catch (err) {
      const mensaje = err.message || '';
      if (err.status === 400 && mensaje.toLowerCase().includes('fecha')) {
        setErroresCampos((prev) => ({
          ...prev,
          fechaEntrega: 'La fecha de entrega ingresada es anterior a la actual',
        }));
        setErrorGeneral('La fecha de entrega ingresada es anterior a la actual');
      } else {
        setErrorGeneral(mensaje || 'Ocurrió un error al intentar modificar el pedido.');
      }
    } finally {
      setGuardando(false);
    }
  };

  // Eliminación confirmada del pedido
  const handleConfirmarEliminacion = async () => {
    try {
      setGuardando(true);
      await eliminarPedido(id);
      setModalConfirmarEliminar(false);
      navigate('/admin/pedidos/vigentes', { replace: true });
    } catch (err) {
      setErrorGeneral(err.message || 'No se pudo eliminar el pedido.');
      setModalConfirmarEliminar(false);
      setModalDuplicado(false);
      setModalFechaPasada(false);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="editar-pedido-container">
        <p style={{ color: 'var(--text-muted)', padding: '40px 0', textAlign: 'center' }}>
          Cargando datos del pedido...
        </p>
      </div>
    );
  }

  return (
    <div className="editar-pedido-container">
      {/* Botón de navegación persistente con confirmación de cambios pendientes */}
      <button type="button" onClick={handleIntentarVolver} className="btn-back-link">
        ← Volver al listado
      </button>

      {/* Encabezado */}
      <header className="editar-pedido-header">
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Edición de Pedido #{pedido?.id}{pedido?.codigoSeguimiento ? ` · ${pedido.codigoSeguimiento}` : ''}
          </span>
          <h1 className="editar-pedido-title">Modificar Pedido</h1>
        </div>

        {/* Estado actual y botón rápido de seguimiento */}
        {pedido && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Estado actual:</span>
              <span className={`status-pill ${pedido.estado?.toLowerCase()}`}>
                <span className="status-dot" />
                <span className="status-label">{pedido.estado?.replace(/_/g, ' ')}</span>
              </span>
            </div>

            {pedido.codigoSeguimiento && (
              <button
                type="button"
                onClick={handleCopiarEnlace}
                className={`btn-copiar-enlace ${copiadoExitoso ? 'copiado' : ''}`}
                title="Copiar enlace de seguimiento al portapapeles"
              >
                {copiadoExitoso ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Enlace copiado al portapapeles
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copiar enlace de seguimiento
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </header>

      {/* Escenario 4: Bloqueo de modificación por pedido en distribución */}
      {estaBloqueado && (
        <div className="alert-banner bloqueo" role="alert">
          <svg className="alert-banner-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>Operación no permitida:</strong> no se pueden modificar los datos de un pedido que ya se encuentra en camino con el transportista.
          </div>
        </div>
      )}

      {/* Mensaje de éxito */}
      {mensajeExito && (
        <div className="alert-banner success" role="status">
          <svg className="alert-banner-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>{mensajeExito}</div>
        </div>
      )}

      {/* Error general */}
      {errorGeneral && (
        <div className="alert-banner bloqueo" role="alert">
          <div>{errorGeneral}</div>
        </div>
      )}

      {/* Formulario Reorganizado por Secciones */}
      <form onSubmit={handleGuardar} className="form-card" noValidate>
        {/* Sección 1: Planificación */}
        <div className="form-section">
          <div className="form-section-header">
            <span className="form-section-title">1. Planificación</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="fechaEntrega">
              Fecha de Entrega * (DD/MM/AAAA)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="fechaEntrega"
                name="fechaEntrega"
                type="text"
                placeholder="DD/MM/AAAA"
                maxLength={10}
                required
                disabled={estaBloqueado}
                className={`form-input ${erroresCampos.fechaEntrega ? 'input-error' : ''}`}
                value={fechaInput}
                onChange={handleFechaChange}
              />
              {!estaBloqueado && fechaInput && (
                <button
                  type="button"
                  onClick={() => {
                    setFechaInput('');
                    setErroresCampos((prev) => ({ ...prev, fechaEntrega: '' }));
                  }}
                  title="Borrar fecha"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#8b949e',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            {erroresCampos.fechaEntrega && (
              <span style={{ color: '#f85149', fontSize: '11.5px' }}>{erroresCampos.fechaEntrega}</span>
            )}
          </div>
        </div>

        {/* Sección 2: Trayecto de Entrega */}
        <div className="form-section">
          <div className="form-section-header">
            <span className="form-section-title">2. Puntos de Trayecto</span>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="direccionOrigen">
                Dirección de Origen *
              </label>
              <input
                id="direccionOrigen"
                name="direccionOrigen"
                type="text"
                required
                disabled={estaBloqueado}
                className={`form-input ${erroresCampos.direccionOrigen ? 'input-error' : ''}`}
                value={formData.direccionOrigen}
                onChange={handleChange}
              />
              {erroresCampos.direccionOrigen && (
                <span style={{ color: '#f85149', fontSize: '11.5px' }}>{erroresCampos.direccionOrigen}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="direccionDestino">
                Dirección de Destino *
              </label>
              <input
                id="direccionDestino"
                name="direccionDestino"
                type="text"
                required
                disabled={estaBloqueado}
                className={`form-input ${erroresCampos.direccionDestino ? 'input-error' : ''}`}
                value={formData.direccionDestino}
                onChange={handleChange}
              />
              {erroresCampos.direccionDestino && (
                <span style={{ color: '#f85149', fontSize: '11.5px' }}>{erroresCampos.direccionDestino}</span>
              )}
            </div>
          </div>
        </div>

        {/* Sección 3: Datos del Destinatario */}
        <div className="form-section">
          <div className="form-section-header">
            <span className="form-section-title">3. Cliente Destinatario</span>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="destinatarioNombre">
                Nombre Completo *
              </label>
              <input
                id="destinatarioNombre"
                name="destinatarioNombre"
                type="text"
                required
                disabled={estaBloqueado}
                className={`form-input ${erroresCampos.destinatarioNombre ? 'input-error' : ''}`}
                value={formData.destinatarioNombre}
                onChange={handleChange}
              />
              {erroresCampos.destinatarioNombre && (
                <span style={{ color: '#f85149', fontSize: '11.5px' }}>{erroresCampos.destinatarioNombre}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="destinatarioTelefono">
                Teléfono de Contacto
              </label>
              <input
                id="destinatarioTelefono"
                name="destinatarioTelefono"
                type="text"
                disabled={estaBloqueado}
                className={`form-input ${erroresCampos.destinatarioTelefono ? 'input-error' : ''}`}
                value={formData.destinatarioTelefono}
                onChange={handleChange}
              />
              {erroresCampos.destinatarioTelefono && (
                <span style={{ color: '#f85149', fontSize: '11.5px' }}>{erroresCampos.destinatarioTelefono}</span>
              )}
            </div>
          </div>
        </div>

        {/* Sección 4: Paquete e Indicaciones Adicionales */}
        <div className="form-section">
          <div className="form-section-header">
            <span className="form-section-title">4. Detalle e Indicaciones</span>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="descripcionProductos">
                Descripción de Productos
              </label>
              <textarea
                id="descripcionProductos"
                name="descripcionProductos"
                rows={3}
                disabled={estaBloqueado}
                className="form-textarea"
                value={formData.descripcionProductos}
                onChange={handleChange}
                placeholder="Contenido del envío..."
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="notas">
                Notas Adicionales
              </label>
              <textarea
                id="notas"
                name="notas"
                rows={3}
                disabled={estaBloqueado}
                className="form-textarea"
                value={formData.notas}
                onChange={handleChange}
                placeholder="Instrucciones especiales para el transportista..."
              />
            </div>
          </div>
        </div>

        {/* Barra de Acciones */}
        <div className="form-actions-bar" style={{ justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleIntentarVolver}
              className="btn-secondary"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={estaBloqueado || guardando}
              className="btn-primary"
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </form>

      {/* ── Modal Confirmar Salida con Cambios sin Guardar ── */}
      {modalConfirmarSalida && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-header">
              <svg className="modal-icon-danger" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3 className="modal-title">Cambios sin guardar</h3>
            </div>
            <div className="modal-body">
              Has realizado modificaciones en el pedido que no han sido guardadas. ¿Deseas descartar los cambios y volver?
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setModalConfirmarSalida(false)}
                className="btn-secondary"
              >
                Continuar editando
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalConfirmarSalida(false);
                  navigate('/admin/pedidos/vigentes');
                }}
                className="btn-modal-danger"
              >
                Descartar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal HU Eliminar: Confirmar Eliminación (Aceptar / Cancelar) ── */}
      {modalConfirmarEliminar && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-header">
              <svg className="modal-icon-danger" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <h3 className="modal-title">Eliminar pedido</h3>
            </div>
            <div className="modal-body">
              ¿Está seguro de que desea eliminar este pedido? Esta acción no se puede deshacer.
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setModalConfirmarEliminar(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminacion}
                className="btn-modal-danger"
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
