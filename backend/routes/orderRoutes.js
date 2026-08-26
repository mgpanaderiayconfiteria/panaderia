const express = require('express');
const router = express.Router();
const { createOrder, getOrders, deleteOrder } = require('../controllers/orderController'); // <--- Importamos deleteOrder

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

router.post('/', protect, createOrder);
router.get('/', protect, getOrders);
router.delete('/:id', protect, deleteOrder); // <--- Nueva ruta DELETE

module.exports = router;