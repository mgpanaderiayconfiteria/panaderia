const Order = require('../models/Order');

// Crear nueva venta desde el POS
exports.createOrder = async (req, res) => {
  try {
    const { items, subtotal, discount, total, paidAmount, changeAmount, paymentMethod } = req.body;

    const newOrder = new Order({
      items,
      subtotal,
      discount: discount || 0,
      total,
      paidAmount,
      changeAmount,
      paymentMethod,
      seller: req.user?._id, // Viene del middleware de autenticación (JWT)
      employee: req.user?.name || 'Empleado Caja'
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar la venta', error: error.message });
  }
};

// Obtener todas las ventas (Para Panel Admin)
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('seller', 'name email role').sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las ventas', error: error.message });
  }
};