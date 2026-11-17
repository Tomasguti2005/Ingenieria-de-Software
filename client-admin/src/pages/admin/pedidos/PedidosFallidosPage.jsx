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
        console.error('Error al cargar pedidos fallidos:', err);
        if (componenteActivo) {
          setError(err.message || 'No se pudieron cargar los pedidos fallidos.');
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
          <span aria-current="page">Pedidos fallidos</span>
        </div>
        <h1>Pedidos fallidos</h1>
        <p>Consultá los pedidos que requieren reasignación.</p>
      </header>

      {cargando ? (
        <div className="pedidos-fallidos-state" role="status">
          Cargando pedidos fallidos...
        </div>
      ) : error ? (
        <div className="pedidos-fallidos-state error" role="alert">
          {error}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="pedidos-fallidos-state" role="status">
          No hay pedidos fallidos para reasignar
        </div>
      ) : (
        <ul className="pedidos-fallidos-list">
          {pedidos.map((pedido) => (
            <li className="pedido-fallido-card" key={pedido.id}>
              <h2>{pedido.codigoSeguimiento}</h2>
              <dl>
                <div>
                  <dt>Motivo</dt>
                  <dd>{pedido.motivoFallo || 'Sin motivo informado'}</dd>
                </div>
                {pedido.descripcionFallo?.trim() && (
                  <div>
                    <dt>Descripción</dt>
                    <dd>{pedido.descripcionFallo}</dd>
                  </div>
                )}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
