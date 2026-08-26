const Order = require('../models/Order');
const Product = require('../models/Product'); // Requerimos el modelo de Producto para actualizar stock
const mongoose = require('mongoose');

// @desc    Crear un nuevo pedido
// @route   POST /api/orders
// @access  Private / Public
const createOrder = async (req, res) => {
  try {
    const { items, subtotal, discount, total, paidAmount, changeAmount, paymentMethod, seller, employee } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No hay productos en la orden' });
    }

    // Mapear e ingresar productos validando ObjectId
    const formattedItems = items.map((item) => {
      const prodId = item.productId || item.product || item._id || item.id;
      return {
        product: mongoose.Types.ObjectId.isValid(prodId) ? prodId : null,
        name: item.name || 'Producto Sin Nombre',
        price: parseFloat(item.unitPrice || item.price || 0),
        quantity: parseFloat(item.quantityVal || item.quantity || 1),
        mode: item.mode || 'unit',
        detailLabel: item.detailLabel || ''
      };
    });

    // Validar si 'seller' es un ObjectId válido de Mongoose
    let validSeller = null;
    if (seller && mongoose.Types.ObjectId.isValid(seller)) {
      validSeller = seller;
    } else if (req.user && req.user._id) {
      validSeller = req.user._id;
    }

    const order = new Order({
      items: formattedItems,
      subtotal: parseFloat(subtotal || total || 0),
      discount: parseFloat(discount || 0),
      total: parseFloat(total || 0),
      paidAmount: parseFloat(paidAmount || total || 0),
      changeAmount: parseFloat(changeAmount || 0),
      paymentMethod: paymentMethod || 'efectivo',
      seller: validSeller,
      employee: employee || (req.user ? req.user.name : 'Empleado Caja'),
      status: 'completed'
    });

    const createdOrder = await order.save();
    console.log('✅ Orden guardada exitosamente en MongoDB:', createdOrder._id);
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('❌ Error al crear orden en BD:', error);
    res.status(500).json({ message: 'Error interno al procesar el pedido', error: error.message });
  }
};

// @desc    Obtener todas las órdenes
// @route   GET /api/orders
// @access  Private / Public
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('❌ Error al obtener órdenes:', error);
    res.status(500).json({ message: 'Error interno al consultar pedidos', error: error.message });
  }
};

// @desc    Eliminar una orden y restaurar stock
// @route   DELETE /api/orders/:id
// @access  Private / Admin
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de orden no válido' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    // Revertir el stock de cada ítem en el inventario
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
          const product = await Product.findById(item.product);
          if (product) {
            const qty = parseFloat(item.quantity) || 0;
            
            if (product.allowByWeight) {
              product.stockGrams = (product.stockGrams || 0) + qty;
            } else {
              product.stockUnits = (product.stockUnits || 0) + qty;
            }
            product.stock = (product.stock || 0) + qty;
            
            await product.save();
          }
        }
      }
    }

    await Order.findByIdAndDelete(id);
    console.log('🗑️ Orden eliminada y stock devuelto:', id);
    res.json({ message: 'Orden eliminada y stock devuelto con éxito', deletedId: id });
  } catch (error) {
    console.error('❌ Error al eliminar orden:', error);
    res.status(500).json({ message: 'Error interno al eliminar el pedido', error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  deleteOrder
};