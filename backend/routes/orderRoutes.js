const express = require('express');
const router = express.Router();

const { 
  createOrder, 
  getOrders, 
  getOrderById, 
  getDailySummary, 
  cancelOrder, 
  deleteOrder 
} = require('../controllers/orderController');

const handleDelete = cancelOrder || deleteOrder;

// Carga segura de middleware de autenticación
let protect = (req, res, next) => next();
try {
  const authMw = require('../middlewares/authMiddleware') || require('../middleware/authMiddleware');
  if (authMw.protect) protect = authMw.protect;
  else if (typeof authMw === 'function') protect = authMw;
} catch (e) {
  try {
    const authMw = require('../middleware/authMiddleware');
    if (authMw.protect) protect = authMw.protect;
    else if (typeof authMw === 'function') protect = authMw;
  } catch (err) {
    console.warn('⚠️ authMiddleware no encontrado, continuando sin protección estricta');
  }
}

// ==========================================
// RUTAS DE ÓRDENES Y VENTAS
// ==========================================

// Obtener todas las ventas / resumen
router.get('/', protect, getOrders);
if (getDailySummary) router.get('/summary/daily', protect, getDailySummary);
if (getOrderById) router.get('/:id', protect, getOrderById);

// Crear venta (procesa efectivo y digital en MongoDB)
router.post('/', protect, createOrder);

// Cancelar / Eliminar venta
if (handleDelete) router.delete('/:id', protect, handleDelete);

module.exports = router;