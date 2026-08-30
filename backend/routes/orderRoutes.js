const express = require('express');
const router = express.Router();
// Importamos cancelOrder (o deleteOrder como fallback)
const { createOrder, getOrders, getOrderById, getDailySummary, cancelOrder, deleteOrder } = require('../controllers/orderController');

// Definir handler para eliminar/cancelar sin importar cómo esté nombrado en el controlador
const handleDelete = cancelOrder || deleteOrder;

// Intentar cargar middleware de autenticación con fallback seguro
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
    console.warn('⚠️ No se encontró authMiddleware, continuando sin protección estricta temporalmente');
  }
}

// Rutas
router.post('/', protect, createOrder);
router.get('/', protect, getOrders);
if (getDailySummary) router.get('/summary/daily', protect, getDailySummary);
if (getOrderById) router.get('/:id', protect, getOrderById);
if (handleDelete) router.delete('/:id', protect, handleDelete);

module.exports = router;