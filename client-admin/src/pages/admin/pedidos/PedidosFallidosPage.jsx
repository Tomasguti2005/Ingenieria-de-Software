import { useEffect, useState } from 'react';
import { obtenerPedidosFallidos, reprogramarPedido } from '../../../services/pedidosService';
import './PedidosFallidosPage.css';

export default function PedidosFallidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [reprogramandoId, setReprogramandoId] = useState(null);
  const [mensajeToast, setMensajeToast] = useState('');

  useEffect(() => {
    let componenteActivo = true;

    async function cargarPedidosFallidos() {
      try {
        const lista = await obtenerPedidosFallidos();
        if (componenteActivo) setPedidos(lista);
      } catch (err) {
        console.error('Error al cargar pedidos fallidos y cancelados:', err);
        if (componenteActivo) {
          setError(err.message || 'No se pudieron cargar los pedidos fallidos y cancelados.');
        }
      } finally {
        if (componenteActivo) setCargando(false);
      }
    }

    cargarPedidosFallidos();
    return () => {
      componenteActivo = false;
    };
  }, []);

  const handleReprogramar = async (pedido) => {
    setError('');
    setMensajeToast('');
    try {
      setReprogramandoId(pedido.id);
      const res = await reprogramarPedido(pedido.id);
      const nuevoCodigo = res?.pedido?.codigoSeguimiento;
      setPedidos((prev) => prev.filter((item) => item.id !== pedido.id));
      setMensajeToast(
        nuevoCodigo
          ? `El pedido se ha reprogramado para hoy exitosamente (Nuevo código: ${nuevoCodigo})`
          : 'El pedido se ha reprogramado para hoy exitosamente'
      );
      setTimeout(() => setMensajeToast(''), 5000);
    } catch (err) {
      setError(err.message || 'No se pudo reprogramar el pedido.');
    } finally {
      setReprogramandoId(null);
    }
  };

  return (
    <div className="pedidos-fallidos-container">
      <header className="pedidos-fallidos-header">
        <div className="pedidos-fallidos-breadcrumb">
          <span>Repartos Ya</span>
          <span aria-hidden="true">/</span>
          <span>Pedidos</span>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Fallidos y cancelados</span>
        </div>
        <h1>Pedidos fallidos y cancelados</h1>
        <p>Consultá los pedidos fallidos y cancelados. Solo los fallidos podrán reprogramarse.</p>
      </header>

      {mensajeToast && (
        <div className="pedidos-fallidos-toast" role="status">
          {mensajeToast}
        </div>
      )}

      {cargando ? (
        <div className="pedidos-fallidos-state" role="status">
          Cargando pedidos fallidos y cancelados...
        </div>
      ) : error ? (
        <div className="pedidos-fallidos-state error" role="alert">
          {error}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="pedidos-fallidos-state" role="status">
          No hay pedidos fallidos ni cancelados
        </div>
      ) : (
        <ul className="pedidos-fallidos-list">
          {pedidos.map((pedido) => {
            const esFallido = pedido.estado === 'FALLIDO';

            return (
              <li className="pedido-fallido-card" key={pedido.id}>
                <div className="pedido-fallido-card-header">
                  <h2>{pedido.codigoSeguimiento}</h2>
                  <span
                    className={`pedido-fallido-status ${esFallido ? 'fallido' : 'cancelado'}`}
                    aria-label={`Estado: ${esFallido ? 'Fallido' : 'Cancelado'}`}
                  >
                    {esFallido ? 'Fallido' : 'Cancelado'}
                  </span>
                </div>
                <dl>
                  <div>
                    <dt>Destinatario</dt>
                    <dd>
                      {pedido.destinatarioNombre}
                      {pedido.destinatarioTelefono ? ` (${pedido.destinatarioTelefono})` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt>Origen</dt>
                    <dd>{pedido.direccionOrigen}</dd>
                  </div>
                  <div>
                    <dt>Destino</dt>
                    <dd>{pedido.direccionDestino}</dd>
                  </div>
                  {pedido.descripcionProductos && (
                    <div>
                      <dt>Productos</dt>
                      <dd>{pedido.descripcionProductos}</dd>
                    </div>
                  )}
                  {esFallido ? (
                    <>
                      <div>
                        <dt>Motivo del fallo</dt>
                        <dd>{pedido.motivoFallo || 'Sin motivo informado'}</dd>
                      </div>
                      {pedido.descripcionFallo?.trim() && (
                        <div>
                          <dt>Descripción</dt>
                          <dd>{pedido.descripcionFallo}</dd>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <dt>Estado</dt>
                      <dd>Pedido cancelado; no corresponde reprogramarlo.</dd>
                    </div>
                  )}
                </dl>
                {esFallido && (
                  <div className="pedido-fallido-actions">
                    <button
                      type="button"
                      className="btn-reprogramar"
                      onClick={() => handleReprogramar(pedido)}
                      disabled={reprogramandoId !== null}
                    >
                      {reprogramandoId === pedido.id ? 'Reprogramando...' : 'Reprogramar'}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
