const Order = require('../models/Order');

// @desc    Crear un nuevo pedido
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { items, total, paymentMethod, customerName } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No hay productos en la orden' });
    }

    const order = new Order({
      user: req.user ? req.user._id : null,
      items,
      total,
      paymentMethod: paymentMethod || 'efectivo',
      customerName: customerName || 'Cliente General'
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ message: 'Error interno al procesar el pedido', error: error.message });
  }
};

// @desc    Obtener todas las órdenes
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ message: 'Error interno al consultar pedidos', error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders
};