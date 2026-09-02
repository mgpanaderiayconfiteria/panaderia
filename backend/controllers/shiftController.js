const Shift = require('../models/Shift');
const Waste = require('../models/Waste');
const Product = require('../models/Product');

// Cerrar turno
const closeShift = async (req, res) => {
  try {
    const newShift = new Shift(req.body);
    const savedShift = await newShift.save();
    res.status(201).json(savedShift);
  } catch (error) {
    res.status(500).json({ message: 'Error al cerrar el turno', error: error.message });
  }
};

// Registrar merma / sobrante, descontar stock y calcular pérdida en dinero
const registerWaste = async (req, res) => {
  try {
    const { productId, quantity, employee, reason, mode: reqMode } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado en la base de datos' });
    }

    const numQty = parseFloat(quantity) || 0;
    const isWeight = product.allowByWeight || reqMode === 'weight';
    const mode = isWeight ? 'weight' : 'unit';

    let costPrice = 0;
    let totalLoss = 0;

    if (isWeight) {
      // Cálculo para productos por peso (gramos)
      const cogsKg = parseFloat(product.cogsKg || product.cogs || 0);
      costPrice = cogsKg / 1000;
      totalLoss = numQty * costPrice;

      // Descuento de stock en gramos
      if (product.stockGrams !== undefined) {
        product.stockGrams = Math.max(0, (product.stockGrams || 0) - numQty);
      }
      if (product.stock !== undefined) {
        product.stock = Math.max(0, (product.stock || 0) - numQty);
      }
    } else {
      // Cálculo para productos por unidad
      const cogsUnit = parseFloat(product.cogsUnit || product.cogs || 0);
      costPrice = cogsUnit;
      totalLoss = numQty * costPrice;

      // Descuento de stock en unidades
      if (product.stockUnits !== undefined) {
        product.stockUnits = Math.max(0, (product.stockUnits || 0) - numQty);
      }
      if (product.stock !== undefined) {
        product.stock = Math.max(0, (product.stock || 0) - numQty);
      }
    }

    await product.save();

    const newWaste = new Waste({
      product: product._id,
      productName: product.name || req.body.productName,
      quantity: numQty,
      mode,
      costPrice,
      totalLoss,
      employee: employee || 'Cajera',
      reason: reason || 'Sobrante de fin de turno'
    });

    const savedWaste = await newWaste.save();
    res.status(201).json(savedWaste);
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar la merma', error: error.message });
  }
};

// Obtener historial de turnos
const getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find().sort({ createdAt: -1 });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener turnos', error: error.message });
  }
};

// Obtener historial de mermas
const getWastes = async (req, res) => {
  try {
    const wastes = await Waste.find().sort({ createdAt: -1 });
    res.json(wastes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener mermas', error: error.message });
  }
};

module.exports = {
  closeShift,
  registerWaste,
  getShifts,
  getWastes
};