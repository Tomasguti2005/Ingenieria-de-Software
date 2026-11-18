const { Router } = require('express');
const autenticarRepartidor = require('../../middlewares/authRepartidor.middleware');
const {
  obtenerPedidosAsignados,
  actualizarRetiroPedido,
  iniciarViaje,
} = require('../../controllers/mobilePedidos.controller');

const router = Router();

router.use(autenticarRepartidor);

router.get('/pedidos', obtenerPedidosAsignados);
router.patch('/pedidos/:id/retiro', actualizarRetiroPedido);
router.post('/viaje/iniciar', iniciarViaje);

module.exports = router;
