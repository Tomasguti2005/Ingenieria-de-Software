import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { obtenerSeguimiento } from '../../services/tracking.service';
import './TrackingPage.css';

export default function TrackingPage() {
  const { codigo } = useParams();
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    async function cargarSeguimiento() {
      try {
        setCargando(true);
        setError('');
        const resultado = await obtenerSeguimiento(codigo);
        if (activo) setPedido(resultado);
      } catch (err) {
        if (activo) {
          setError('El enlace de seguimiento no es válido');
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarSeguimiento();
    return () => {
      activo = false;
    };
  }, [codigo]);

  function formatearFecha(f) {
    if (!f) return null;
    const soloFecha = f.split('T')[0];
    const partes = soloFecha.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return f;
  }

  return (
    <main className="tracking-page">
      <section className="tracking-card">
        <p className="tracking-eyebrow">Repartos Ya — Seguimiento</p>
        <h1>Estado de tu envío</h1>

        {cargando ? (
          <p role="status">Cargando estado del envío...</p>
        ) : error ? (
          <p className="tracking-error" role="alert">
            {error}
          </p>
        ) : (
          <>
            <p className="tracking-code">
              Código de pedido: <strong>{pedido?.codigoSeguimiento || codigo}</strong>
            </p>

            <div className={`tracking-status ${pedido?.estado?.toLowerCase()}`}>
              {pedido?.estado?.replace(/_/g, ' ')}
            </div>

            <dl className="tracking-details">
              {pedido?.destinatarioNombre && (
                <div>
                  <dt>Destinatario</dt>
                  <dd>
                    <strong>{pedido.destinatarioNombre}</strong>
                  </dd>
                </div>
              )}

              {pedido?.direccionDestino && (
                <div>
                  <dt>Dirección de entrega</dt>
                  <dd>{pedido.direccionDestino}</dd>
                </div>
              )}

              <div>
                <dt>Contenido del paquete</dt>
                <dd>{pedido?.descripcionProductos || 'Paquete sellado'}</dd>
              </div>

              {(pedido?.fechaEntrega || pedido?.diaEntrega) && (
                <div>
                  <dt>Fecha estimada de entrega</dt>
                  <dd>
                    {formatearFecha(pedido.diaEntrega || pedido.fechaEntrega)}
                  </dd>
                </div>
              )}

              {(pedido?.transportista || pedido?.repartidor) && (
                <div>
                  <dt>Transportista asignado</dt>
                  <dd>
                    {pedido.transportista?.nombre ||
                      `${pedido.repartidor?.nombre || ''} ${pedido.repartidor?.apellido || ''}`.trim()}
                  </dd>
                </div>
              )}
            </dl>
          </>
        )}
      </section>
    </main>
  );
}
