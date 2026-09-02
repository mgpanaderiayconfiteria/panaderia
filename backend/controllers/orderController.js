const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendStockAlert } = require('../services/whatsappService');
const { emitirFacturaC } = require('../services/afipService');
const { enviarFacturaEmail } = require('../services/emailService');
const { generateInvoicePDF } = require('../services/pdfService');

// 1. Crear una nueva orden / venta
const createOrder = async (req, res) => {
  try {
    const { 
      items, 
      paymentMethod, 
      isCashDiscountActive, 
      paidAmount, 
      seller, 
      employee,
      requiresInvoice,
      clientEmail,
      clientDocType,
      clientDocNum,
      clientName
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

      if (!itemSubtotal || itemSubtotal <= 0) {
        if (mode === 'weight' || mode === 'kg') {
          if (unitPrice > 50 && quantity >= 10) {
            itemSubtotal = (unitPrice / 1000) * quantity;
          } else {
            itemSubtotal = unitPrice * quantity;
          }
        } else {
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
        subtotal: itemSubtotal
      };
    });

    const method = paymentMethod === 'digital' ? 'digital' : 'efectivo';
    let discountAmount = 0;
    let isCashDiscountApplied = false;

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

    // === EMISIÓN DE FACTURA ELECTRÓNICA Y ENVÍO POR MAIL ===
    let invoiceInfo = null;

    if (method === 'digital' || requiresInvoice) {
      try {
        const afipRes = await emitirFacturaC({
          amount: calculatedTotal,
          docType: clientDocNum ? (clientDocType || 96) : 99, // 99 = Consumidor Final
          docNum: clientDocNum || 0,
          clientName: clientName || 'Consumidor Final'
        });

        invoiceInfo = {
          cae: afipRes.cae,
          caeVto: afipRes.caeVto,
          cbteNro: afipRes.cbteNro,
          ptoVta: afipRes.ptoVta
        };

        // Enviar mail con Resend
        if (clientEmail) {
          enviarFacturaEmail(clientEmail, {
            ...invoiceInfo,
            amount: calculatedTotal
          });
        }
      } catch (afipError) {
        console.error('⚠️ No se pudo autorizar la factura en ARCA:', afipError.message);
      }
    }

    const employeeName = employee || (req.user ? req.user.name : 'Empleado Caja');

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
      employee: employeeName,
      invoice: invoiceInfo,
      status: 'completed'
    });

    const createdOrder = await order.save();

    // === DESCUENTO DE STOCK Y VERIFICACIÓN DE ALERTAS ===
    for (const item of formattedItems) {
      if (!item.product) continue;

      const product = await Product.findById(item.product);
      if (!product) continue;

      let isLowStock = false;
      let currentStockVal = 0;
      let minStockVal = 0;
      let unitLabel = '';

      if (item.mode === 'weight' || item.mode === 'kg') {
        product.stockGrams = Math.max(0, (product.stockGrams || 0) - item.quantity);
        product.stock = product.stockGrams;
        
        if (product.minStockGrams > 0 && product.stockGrams <= product.minStockGrams) {
          isLowStock = true;
          currentStockVal = (product.stockGrams / 1000).toFixed(2);
          minStockVal = (product.minStockGrams / 1000).toFixed(2);
          unitLabel = 'kg';
        }
      } else if (item.mode === 'porcion') {
        product.stockPorciones = Math.max(0, (product.stockPorciones || 0) - item.quantity);
        product.stock = product.stockPorciones;

        if (product.minStockPorciones > 0 && product.stockPorciones <= product.minStockPorciones) {
          isLowStock = true;
          currentStockVal = product.stockPorciones;
          minStockVal = product.minStockPorciones;
          unitLabel = 'porción/es';
        }
      } else {
        product.stockUnits = Math.max(0, (product.stockUnits || 0) - item.quantity);
        product.stock = product.stockUnits;

        if (product.minStockUnits > 0 && product.stockUnits <= product.minStockUnits) {
          isLowStock = true;
          currentStockVal = product.stockUnits;
          minStockVal = product.minStockUnits;
          unitLabel = 'unidades';
        }
      }

      if (isLowStock && !product.alertSent) {
        await sendStockAlert(product.name, currentStockVal, minStockVal, unitLabel);
        product.alertSent = true;
      }

      await product.save();
    }

    // === GENERACIÓN DE PDF Y RESPUESTA PARA DASHBOARD ===
    let pdfBase64 = null;
    if (requiresInvoice || method === 'digital') {
      try {
        const pdfBuffer = await generateInvoicePDF(createdOrder.toObject());
        pdfBase64 = pdfBuffer.toString('base64');
      } catch (pdfErr) {
        console.error('⚠️ Error generando PDF:', pdfErr.message);
      }
    }

    const createdDate = new Date(createdOrder.createdAt || Date.now());
    const orderObj = createdOrder.toObject();

    const responseData = {
      ...orderObj,
      sellerName: employeeName,
      cashier: employeeName,
      dateStr: createdDate.toLocaleDateString('es-AR'),
      timeStr: createdDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      pdfBase64
    };

    return res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ Error al crear la orden:', error);
    return res.status(500).json({ 
      message: 'Error interno al procesar el pedido', 
      error: error.message 
    });
  }
};

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

    const formattedOrders = orders.map(ord => {
      const o = ord.toObject();
      const dt = new Date(o.createdAt);
      return {
        ...o,
        sellerName: o.employee || (o.seller ? o.seller.name : 'Empleado Caja'),
        cashier: o.employee || (o.seller ? o.seller.name : 'Empleado Caja'),
        dateStr: dt.toLocaleDateString('es-AR'),
        timeStr: dt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      };
    });

    return res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('❌ Error al consultar órdenes:', error);
    return res.status(500).json({ message: 'Error al consultar las órdenes', error: error.message });
  }
};

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

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getDailySummary,
  cancelOrder
};