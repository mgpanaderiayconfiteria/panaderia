const Order = require('../models/Order');

exports.addOrderItems = async (req, res) => {
  const { orderItems, shippingAddress, totalAmount } = req.body;
  if (orderItems && orderItems.length === 0) {
    return res.status(400).json({ message: 'No hay productos en el pedido' });
  } else {
    try {
      const order = new Order({
        user: req.user._id,
        products: orderItems.map(x => ({ product: x._id, quantity: x.qty })),
        shippingAddress,
        totalAmount
      });
      const createdOrder = await order.save();
      res.status(201).json(createdOrder);
    } catch (error) {
      res.status(500).json({ message: 'Error al procesar el pedido' });
    }
  }
};