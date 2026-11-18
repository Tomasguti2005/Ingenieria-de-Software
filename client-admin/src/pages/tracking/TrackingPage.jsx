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
        if (activo) setError(err.message || 'No se pudo cargar el seguimiento del envío.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarSeguimiento();
    return () => {
      activo = false;
    };
  }, [codigo]);

  return (
    <main className="tracking-page">
      <section className="tracking-card">
        <p className="tracking-eyebrow">Seguimiento de envío</p>
        <h1>Estado de tu envío</h1>
        {cargando ? (
          <p role="status">Cargando estado del envío...</p>
        ) : error ? (
          <p className="tracking-error" role="alert">{error}</p>
        ) : (
          <>
            <p className="tracking-code">Código: <strong>{pedido?.codigoSeguimiento}</strong></p>
            <div className={`tracking-status ${pedido?.estado?.toLowerCase()}`}>
              {pedido?.estado?.replace(/_/g, ' ')}
            </div>
            <dl className="tracking-details">
              <div>
                <dt>Descripción</dt>
                <dd>{pedido?.descripcionProductos || 'Envío'}</dd>
              </div>
              {pedido?.fechaEntrega && (
                <div>
                  <dt>Fecha estimada de entrega</dt>
                  <dd>{new Date(pedido.fechaEntrega).toLocaleDateString()}</dd>
                </div>
              )}
              {pedido?.repartidor && (
                <div>
                  <dt>Transportista</dt>
                  <dd>{pedido.repartidor.nombre} {pedido.repartidor.apellido}</dd>
                </div>
              )}
            </dl>
          </>
        )}
      </section>
    </main>
  );
}
