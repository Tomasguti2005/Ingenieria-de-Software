const { Router } = require('express');
const autenticarRepartidor = require('../../middlewares/authRepartidor.middleware');
const {
  obtenerPedidosAsignados,
  actualizarRetiroPedido,
} = require('../../controllers/mobilePedidos.controller');

const router = Router();

router.use(autenticarRepartidor);

router.get('/pedidos', obtenerPedidosAsignados);
router.patch('/pedidos/:id/retiro', actualizarRetiroPedido);

module.exports = router;
