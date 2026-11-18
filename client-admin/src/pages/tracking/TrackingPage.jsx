// TrackingPage.jsx — Vista pública y responsive de seguimiento para el cliente final.
// Ruta: /seguimiento/:codigo
// Regla: La interfaz debe ser simple y acotada y no permitir ningún tipo de interacción.
//
// Criterios de Aceptación:
// Escenario 1: El cliente final hace clic en el enlace recibido y abre la página en su navegador.
//   El sistema valida el código del pedido y muestra de forma clara su estado actual (ej: "En camino"),
//   lista de productos e información básica del transportista.
// Escenario 2: El cliente ingresa a un enlace roto, expirado o que no corresponde a ningún pedido activo.
//   El sistema muestra una pantalla limpia con el mensaje de error:
//   "El enlace de seguimiento no es válido o el pedido ya no se encuentra disponible".

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { obtenerSeguimientoPedido } from '../../services/trackingService';
import './TrackingPage.css';

export default function TrackingPage() {
  const { codigo } = useParams();

  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorMensaje, setErrorMensaje] = useState(null);

  useEffect(() => {
    let montado = true;

    async function cargarDatos() {
      setCargando(true);
      setErrorMensaje(null);

      try {
        const datos = await obtenerSeguimientoPedido(codigo);
        if (montado) {
          setPedido(datos);
        }
      } catch (err) {
        if (montado) {
          // Escenario 2: Mensaje exacto requerido por la HU
          setErrorMensaje(
            err.message || 'El enlace de seguimiento no es válido o el pedido ya no se encuentra disponible'
          );
        }
      } finally {
        if (montado) {
          setCargando(false);
        }
      }
    }

    cargarDatos();

    return () => {
      montado = false;
    };
  }, [codigo]);

  function formatearFecha(f) {
    if (!f) return 'A coordinar';
    const partes = f.split('T')[0].split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return f;
  }

  function getEstadoClass(estado) {
    if (!estado) return 'registrado';
    const e = estado.toUpperCase();
    if (e === 'ENTREGADO') return 'entregado';
    if (e === 'EN_CAMINO' || e === 'RETIRADO') return 'en-camino';
    if (e === 'ASIGNADO') return 'asignado';
    if (e === 'FALLIDO' || e === 'CANCELADO') return 'fallido';
    return 'registrado';
  }

  function getEstadoLabel(estado) {
    if (!estado) return 'En preparación';
    const e = estado.toUpperCase();
    if (e === 'REGISTRADO') return 'Registrado / En preparación';
    if (e === 'ASIGNADO') return 'Asignado a transportista';
    if (e === 'RETIRADO') return 'Retirado por transportista';
    if (e === 'EN_CAMINO') return 'En camino a tu domicilio';
    if (e === 'ENTREGADO') return 'Entregado con éxito';
    if (e === 'FALLIDO') return 'Entrega fallida (reprogramando)';
    if (e === 'CANCELADO') return 'Pedido cancelado';
    return estado.replace(/_/g, ' ');
  }

  // ── 1. Pantalla de Carga ──
  if (cargando) {
    return (
      <div className="tracking-page-wrapper">
        <div className="tracking-card loading-state">
          <div className="tracking-spinner" />
          <p className="tracking-loading-text">Consultando estado del envío...</p>
        </div>
      </div>
    );
  }

  // ── 2. Escenario 2: Enlace inválido, expirado o no encontrado ──
  if (errorMensaje || !pedido) {
    return (
      <div className="tracking-page-wrapper">
        <div className="tracking-card error-state" role="alert">
          <div className="tracking-error-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="tracking-error-title">Seguimiento no disponible</h2>
          <p className="tracking-error-message">
            {errorMensaje || 'El enlace de seguimiento no es válido o el pedido ya no se encuentra disponible'}
          </p>
          <span className="tracking-error-footer">
            Si creés que se trata de un error, por favor contactate con el comercio emisor.
          </span>
        </div>
      </div>
    );
  }

  // ── 3. Escenario 1: Éxito (Vista de solo lectura del cliente) ──
  return (
    <div className="tracking-page-wrapper">
      <main className="tracking-card">
        {/* Encabezado con marca Repartos Ya */}
        <header className="tracking-header">
          <div className="tracking-brand">
            <div className="tracking-brand-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div>
              <span className="tracking-brand-title">Repartos Ya</span>
              <span className="tracking-brand-subtitle">Seguimiento en vivo</span>
            </div>
          </div>
          <div className="tracking-codigo-pill">
            <span className="tracking-codigo-label">CÓDIGO:</span>
            <span className="tracking-codigo-val">{pedido.codigoSeguimiento || codigo}</span>
          </div>
        </header>

        {/* Estado actual destacado */}
        <section className={`tracking-status-banner ${getEstadoClass(pedido.estado)}`}>
          <div className="tracking-status-indicator">
            <span className="tracking-pulse-dot" />
          </div>
          <div className="tracking-status-info">
            <span className="tracking-status-caption">Estado actual de tu envío</span>
            <h1 className="tracking-status-name">{getEstadoLabel(pedido.estado)}</h1>
          </div>
        </section>

        {/* Bloque: Información de entrega */}
        <section className="tracking-section">
          <h2 className="tracking-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Destino de Entrega
          </h2>
          <div className="tracking-info-grid">
            <div className="tracking-info-item">
              <span className="tracking-info-label">Destinatario</span>
              <span className="tracking-info-value">{pedido.destinatarioNombre || 'No especificado'}</span>
            </div>
            <div className="tracking-info-item">
              <span className="tracking-info-label">Dirección</span>
              <span className="tracking-info-value">{pedido.direccionDestino || 'Domicilio acordado'}</span>
            </div>
            <div className="tracking-info-item">
              <span className="tracking-info-label">Fecha de entrega</span>
              <span className="tracking-info-value font-mono">
                {formatearFecha(pedido.diaEntrega || pedido.fechaEntrega)}
              </span>
            </div>
          </div>
        </section>

        {/* Bloque: Productos del paquete */}
        <section className="tracking-section">
          <h2 className="tracking-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Contenido del Paquete
          </h2>
          <div className="tracking-productos-box">
            <p className="tracking-productos-text">
              {pedido.descripcionProductos || 'Paquete sellado de logística de última milla'}
            </p>
          </div>
        </section>

        {/* Bloque: Datos del transportista */}
        <section className="tracking-section">
          <h2 className="tracking-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Transportista Asignado
          </h2>
          <div className="tracking-transportista-card">
            <div className="tracking-transportista-avatar">
              {(pedido.transportista?.nombre || pedido.nombreTransportista || 'R').charAt(0).toUpperCase()}
            </div>
            <div className="tracking-transportista-details">
              <span className="tracking-transportista-name">
                {pedido.transportista?.nombre || pedido.nombreTransportista || 'Asignación en curso'}
              </span>
              <span className="tracking-transportista-vehiculo">
                {pedido.transportista?.vehiculo || 'Vehículo autorizado de flota Repartos Ya'}
              </span>
            </div>
          </div>
        </section>

        {/* Pie informativo — Solo lectura */}
        <footer className="tracking-footer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>Esta ventana es de solo lectura y se actualiza con el avance de tu entrega.</span>
        </footer>
      </main>
    </div>
  );
}
