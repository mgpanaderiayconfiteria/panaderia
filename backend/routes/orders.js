const express = require('express');
const router = express.Router();
const { createOrder, getOrders } = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware'); // O tu middleware JWT

router.post('/', protect, createOrder);
router.get('/', protect, getOrders);

module.exports = router;