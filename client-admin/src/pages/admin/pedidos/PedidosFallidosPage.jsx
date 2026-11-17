import { useEffect, useState } from 'react';
import { obtenerPedidosFallidos } from '../../../services/pedidosService';
import './PedidosFallidosPage.css';

export default function PedidosFallidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
