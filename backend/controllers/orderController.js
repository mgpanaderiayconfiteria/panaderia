const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Crear un nuevo pedido
// @route   POST /api/orders
// @access  Private / Public
const createOrder = async (req, res) => {
  try {
    const { 
      items, 
      paymentMethod, 
      isCashDiscountActive, 
      paidAmount, 
      seller, 
      employee 
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No hay productos en la orden' });
    }

    // 1. Mapear productos y calcular subtotal de forma segura en servidor
    let calculatedSubtotal = 0;
    const formattedItems = items.map((item) => {
      const prodId = item.productId || item.product || item._id || item.id;
      const unitPrice = parseFloat(item.unitPrice || item.price || 0);
      const quantity = parseFloat(item.quantityVal || item.quantity || 1);
      
      calculatedSubtotal += (unitPrice * quantity);

      return {
        product: mongoose.Types.ObjectId.isValid(prodId) ? prodId : null,
        name: item.name || 'Producto Sin Nombre',
        price: unitPrice,
        quantity: quantity,
        mode: item.mode || 'unit',
        detailLabel: item.detailLabel || ''
      };
    });

    // 2. Aplicar descuento del 10% solo si la promo está ACTIVA y el pago es EFECTIVO
    const method = paymentMethod || 'efectivo';
    let discountAmount = 0;
    let isCashDiscountApplied = false;

    if (isCashDiscountActive && method === 'efectivo') {
      discountAmount = calculatedSubtotal * 0.10;
      isCashDiscountApplied = true;
    }

    const calculatedTotal = calculatedSubtotal - discountAmount;
    const cleanPaidAmount = parseFloat(paidAmount || calculatedTotal);
    const calculatedChange = method === 'efectivo' ? Math.max(0, cleanPaidAmount - calculatedTotal) : 0;

    // 3. Validar vendedor / empleado
    let validSeller = null;
    if (seller && mongoose.Types.ObjectId.isValid(seller)) {
      validSeller = seller;
    } else if (req.user && req.user._id) {
      validSeller = req.user._id;
    }

    // 4. Crear la orden
    const order = new Order({
      items: formattedItems,
      subtotal: calculatedSubtotal,
      discountAmount: discountAmount,
      isCashDiscountApplied: isCashDiscountApplied,
      total: calculatedTotal,
      paidAmount: cleanPaidAmount,
      changeAmount: calculatedChange,
      paymentMethod: method,
      seller: validSeller,
      employee: employee || (req.user ? req.user.name : 'Empleado Caja'),
      status: 'completed'
    });

    const createdOrder = await order.save();
    console.log('✅ Orden guardada exitosamente en BD:', createdOrder._id);
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

    // Revertir stock
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