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

    // 1. Detección precisa de la modalidad/unidad
    let mode = 'unit';

    if (
      reqMode === 'weight' ||
      reqMode === 'kg' ||
      reqMode === 'gr' ||
      product.allowByWeight ||
      product.stockUnit === 'kg' ||
      product.stockUnit === 'gr' ||
      product.unit === 'kg' ||
      product.unit === 'gr'
    ) {
      mode = 'weight';
    } else if (
      reqMode === 'porcion' ||
      product.allowByPorcion ||
      product.stockUnit === 'porcion'
    ) {
      mode = 'porcion';
    } else if (reqMode === 'dozen') {
      mode = 'dozen';
    } else if (reqMode === 'half_dozen') {
      mode = 'half_dozen';
    }

    let costPrice = 0;
    let totalLoss = 0;

    // 2. Cálculo de pérdida y descuento de stock según la modalidad
    switch (mode) {
      case 'weight': {
        // En peso, 'numQty' son gramos ingresados desde la caja
        const cogsKg = parseFloat(product.cogsKg || product.cogs || 0);
        costPrice = cogsKg / 1000; // Costo por gramo
        totalLoss = numQty * costPrice;

        // Descuento en stock de gramos
        if (product.stockGrams !== undefined) {
          product.stockGrams = Math.max(0, (product.stockGrams || 0) - numQty);
        }
        if (product.stock !== undefined) {
          product.stock = Math.max(0, (product.stock || 0) - numQty);
        }
        break;
      }

      case 'porcion': {
        const cogsPorcion = parseFloat(product.cogsPorcion || product.cogs || 0);
        costPrice = cogsPorcion;
        totalLoss = numQty * costPrice;

        if (product.stockPorciones !== undefined) {
          product.stockPorciones = Math.max(0, (product.stockPorciones || 0) - numQty);
        }
        if (product.stock !== undefined) {
          product.stock = Math.max(0, (product.stock || 0) - numQty);
        }
        break;
      }

      case 'dozen': {
        const cogsDozen = parseFloat(product.cogsDozen || (product.cogsUnit * 12) || (product.cogs * 12) || 0);
        costPrice = cogsDozen;
        totalLoss = numQty * costPrice;

        // Cada docena descuenta 12 unidades
        const totalUnitsToRemove = numQty * 12;
        if (product.stockUnits !== undefined) {
          product.stockUnits = Math.max(0, (product.stockUnits || 0) - totalUnitsToRemove);
        }
        if (product.stock !== undefined) {
          product.stock = Math.max(0, (product.stock || 0) - totalUnitsToRemove);
        }
        break;
      }

      case 'half_dozen': {
        const cogsHalfDozen = parseFloat(product.cogsHalfDozen || (product.cogsUnit * 6) || (product.cogs * 6) || 0);
        costPrice = cogsHalfDozen;
        totalLoss = numQty * costPrice;

        // Cada media docena descuenta 6 unidades
        const totalUnitsToRemove = numQty * 6;
        if (product.stockUnits !== undefined) {
          product.stockUnits = Math.max(0, (product.stockUnits || 0) - totalUnitsToRemove);
        }
        if (product.stock !== undefined) {
          product.stock = Math.max(0, (product.stock || 0) - totalUnitsToRemove);
        }
        break;
      }

      case 'unit':
      default: {
        const cogsUnit = parseFloat(product.cogsUnit || product.cogs || 0);
        costPrice = cogsUnit;
        totalLoss = numQty * costPrice;

        if (product.stockUnits !== undefined) {
          product.stockUnits = Math.max(0, (product.stockUnits || 0) - numQty);
        }
        if (product.stock !== undefined) {
          product.stock = Math.max(0, (product.stock || 0) - numQty);
        }
        break;
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