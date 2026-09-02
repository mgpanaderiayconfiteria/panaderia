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

// Registrar merma / sobrante leyendo costos/precios del modelo Product de MongoDB
const registerWaste = async (req, res) => {
  try {
    const { productId, quantity, employee, reason, mode: reqMode } = req.body;

    // Buscar el producto en MongoDB
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado en la base de datos' });
    }

    const numQty = parseFloat(quantity) || 0;

    // 1. Determinar modalidad del producto
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
    } else if (reqMode === 'porcion' || product.allowByPorcion || product.stockUnit === 'porcion') {
      mode = 'porcion';
    } else if (reqMode === 'dozen') {
      mode = 'dozen';
    } else if (reqMode === 'half_dozen') {
      mode = 'half_dozen';
    }

    let costPrice = 0;
    let totalLoss = 0;

    // 2. Extraer precios/costos directamente desde la instancia del producto en MongoDB
    switch (mode) {
      case 'weight': {
        // Busca costo por kilo; si no tiene cargado costo (0), usa el precio de venta por kilo
        const valPerKg = parseFloat(product.cogsKg) || parseFloat(product.cogs) || parseFloat(product.priceKg) || parseFloat(product.price) || 0;
        
        // Convertir costo/precio de kilo a gramos
        costPrice = valPerKg / 1000;
        totalLoss = numQty * costPrice;

        // Descuento de stock en gramos
        if (product.stockGrams !== undefined) {
          product.stockGrams = Math.max(0, (product.stockGrams || 0) - numQty);
        }
        if (product.stock !== undefined) {
          product.stock = Math.max(0, (product.stock || 0) - numQty);
        }
        break;
      }

      case 'porcion': {
        costPrice = parseFloat(product.cogsPorcion) || parseFloat(product.cogs) || parseFloat(product.pricePorcion) || parseFloat(product.price) || 0;
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
        const valDozen = parseFloat(product.cogsDozen) || (parseFloat(product.cogsUnit) * 12) || parseFloat(product.priceDozen) || (parseFloat(product.price) * 12) || 0;
        costPrice = valDozen;
        totalLoss = numQty * costPrice;

        const unitsToRemove = numQty * 12;
        if (product.stockUnits !== undefined) {
          product.stockUnits = Math.max(0, (product.stockUnits || 0) - unitsToRemove);
        }
        if (product.stock !== undefined) {
          product.stock = Math.max(0, (product.stock || 0) - unitsToRemove);
        }
        break;
      }

      case 'half_dozen': {
        const valHalfDozen = parseFloat(product.cogsHalfDozen) || (parseFloat(product.cogsUnit) * 6) || parseFloat(product.priceHalfDozen) || (parseFloat(product.price) * 6) || 0;
        costPrice = valHalfDozen;
        totalLoss = numQty * costPrice;

        const unitsToRemove = numQty * 6;
        if (product.stockUnits !== undefined) {
          product.stockUnits = Math.max(0, (product.stockUnits || 0) - unitsToRemove);
        }
        if (product.stock !== undefined) {
          product.stock = Math.max(0, (product.stock || 0) - unitsToRemove);
        }
        break;
      }

      case 'unit':
      default: {
        costPrice = parseFloat(product.cogsUnit) || parseFloat(product.cogs) || parseFloat(product.priceUnit) || parseFloat(product.price) || 0;
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