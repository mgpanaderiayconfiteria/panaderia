const mongoose = require('mongoose');
const Order = require('../models/Order');

// 1. Crear una nueva orden / venta
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

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No hay productos en la orden' });
    }

    let calculatedSubtotal = 0;

    const formattedItems = items.map((item) => {
      const prodId = item.productId || item.product || item._id || item.id;
      const quantity = parseFloat(item.quantityVal || item.quantity || 1);
      const unitPrice = parseFloat(item.unitPrice || item.price || 0);
      const mode = item.mode || 'unit';
      
      let itemSubtotal = parseFloat(item.subtotal || 0);

      // Si no se envió subtotal individual o es 0, se calcula dinámicamente
      if (!itemSubtotal || itemSubtotal <= 0) {
        if (mode === 'weight' || mode === 'kg') {
          // Si el precio viene como $/kg (ej: $2500) y la cantidad en gramos (ej: 250g)
          if (unitPrice > 50 && quantity >= 10) {
            itemSubtotal = (unitPrice / 1000) * quantity;
          } else {
            // Si el precio ya viene expresado por gramo (ej: $2.5/g * 250g)
            itemSubtotal = unitPrice * quantity;
          }
        } else {
          // Unidades o porciones
          itemSubtotal = unitPrice * quantity;
        }
      }

      calculatedSubtotal += itemSubtotal;

      return {
        product: mongoose.Types.ObjectId.isValid(prodId) ? prodId : null,
        name: item.name || 'Producto Sin Nombre',
        price: unitPrice,
        quantity: quantity,
        mode: mode,
        detailLabel: item.detailLabel || '',
        subtotal: itemSubtotal // 👈 Guarda el subtotal individual
      };
    });

    const method = paymentMethod || 'efectivo';
    let discountAmount = 0;
    let isCashDiscountApplied = false;

    // Descuento del 10% solo si la compra es en efectivo
    if (isCashDiscountActive && method === 'efectivo') {
      discountAmount = calculatedSubtotal * 0.10;
      isCashDiscountApplied = true;
    }

    const calculatedTotal = Math.max(0, calculatedSubtotal - discountAmount);
    const cleanPaidAmount = parseFloat(paidAmount || calculatedTotal);
    const calculatedChange = method === 'efectivo' ? Math.max(0, cleanPaidAmount - calculatedTotal) : 0;

    let validSeller = null;
    if (seller && mongoose.Types.ObjectId.isValid(seller)) {
      validSeller = seller;
    } else if (req.user && req.user._id) {
      validSeller = req.user._id;
    }

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
    return res.status(201).json(createdOrder);

  } catch (error) {
    console.error('❌ Error al crear la orden:', error);
    return res.status(500).json({ 
      message: 'Error interno al procesar el pedido', 
      error: error.message 
    });
  }
};

// 2. Obtener todas las órdenes (con filtros opcionales por rango de fecha y estado)
const getOrders = async (req, res) => {
  try {
    const { startDate, endDate, status, limit = 100 } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('seller', 'name email');

    return res.status(200).json(orders);
  } catch (error) {
    console.error('❌ Error al consultar órdenes:', error);
    return res.status(500).json({ message: 'Error al consultar las órdenes', error: error.message });
  }
};

// 3. Obtener detalle de una orden por ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de orden no válido' });
    }

    const order = await Order.findById(id).populate('seller', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error('❌ Error al buscar la orden:', error);
    return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

// 4. Resumen de caja / ventas diarias
const getDailySummary = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'completed'
    });

    let totalSales = 0;
    let cashSales = 0;
    let digitalSales = 0;
    let totalDiscounts = 0;

    orders.forEach(order => {
      totalSales += order.total || 0;
      totalDiscounts += order.discountAmount || 0;

      if (order.paymentMethod === 'digital') {
        digitalSales += order.total || 0;
      } else {
        cashSales += order.total || 0;
      }
    });

    return res.status(200).json({
      date: startOfDay.toISOString().split('T')[0],
      totalOrders: orders.length,
      totalSales,
      cashSales,
      digitalSales,
      totalDiscounts
    });
  } catch (error) {
    console.error('❌ Error al generar resumen diario:', error);
    return res.status(500).json({ message: 'Error al calcular resumen diario', error: error.message });
  }
};

// 5. Cancelar / Anular una orden
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de orden no válido' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'La orden ya está cancelada' });
    }

    order.status = 'cancelled';
    await order.save();

    return res.status(200).json({ message: 'Orden cancelada con éxito', order });
  } catch (error) {
    console.error('❌ Error al cancelar la orden:', error);
    return res.status(500).json({ message: 'Error al cancelar la orden', error: error.message });
  }
};

// Exportación de todas las funciones del controlador
module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getDailySummary,
  cancelOrder
};