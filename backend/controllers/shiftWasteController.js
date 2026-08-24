const Shift = require('../models/Shift');
const Waste = require('../models/Waste');
const Product = require('../models/Product');
const Order = require('../models/Order');

// 1. Abrir Turno
exports.openShift = async (req, res) => {
  try {
    const { initialCash, employee, shiftType } = req.body;
    const activeShift = await Shift.findOne({ employee, status: 'open' });
    if (activeShift) {
      return res.status(400).json({ message: 'Ya existe un turno abierto para este empleado' });
    }

    const newShift = new Shift({
      employee,
      sellerId: req.user ? req.user._id : null,
      shiftType: shiftType || 'Mañana',
      initialCash: parseFloat(initialCash || 0)
    });

    await newShift.save();
    res.status(201).json(newShift);
  } catch (error) {
    res.status(500).json({ message: 'Error al abrir turno', error: error.message });
  }
};

// 2. Cerrar Turno y Calcular Efectivo Esperado
exports.closeShift = async (req, res) => {
  try {
    const { shiftId } = req.body;
    const shift = await Shift.findById(shiftId);
    if (!shift) return res.status(404).json({ message: 'Turno no encontrado' });

    // Calcular ventas realizadas durante el turno
    const orders = await Order.find({
      createdAt: { $gte: shift.startTime },
      employee: shift.employee
    });

    let cashSales = 0;
    let digitalSales = 0;

    orders.forEach(order => {
      if (order.paymentMethod === 'efectivo') {
        cashSales += order.total;
      } else {
        digitalSales += order.total;
      }
    });

    shift.cashSales = cashSales;
    shift.digitalSales = digitalSales;
    shift.finalCashCalculated = shift.initialCash + cashSales;
    shift.endTime = new Date();
    shift.status = 'closed';

    await shift.save();
    res.json({
      message: 'Turno cerrado con éxito',
      expectedCashInDrawer: shift.finalCashCalculated,
      shift
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al cerrar turno', error: error.message });
  }
};

// 3. Registrar Desperdicio (Mermas) y ajustar Stock
exports.registerWaste = async (req, res) => {
  try {
    const { productId, quantity, employee, reason } = req.body;
    const product = await Product.findById(productId);

    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    const qtyVal = parseFloat(quantity || 0);
    const cost = parseFloat(product.cost || 0);
    const totalLoss = qtyVal * cost;

    // Descontar stock
    product.stock = Math.max(0, (product.stock || 0) - qtyVal);
    await product.save();

    // Crear Log
    const wasteEntry = new Waste({
      product: product._id,
      productName: product.name,
      quantity: qtyVal,
      costPrice: cost,
      totalLoss: totalLoss,
      employee: employee || 'Cajera',
      reason: reason || 'Sobrante del día'
    });

    await wasteEntry.save();
    res.status(201).json({ message: 'Desperdicio registrado y stock actualizado', wasteEntry });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar desperdicio', error: error.message });
  }
};

// 4. Obtener Mermas para el Administrador
exports.getWasteLogs = async (req, res) => {
  try {
    const logs = await Waste.find({}).sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener logs de mermas', error: error.message });
  }
};