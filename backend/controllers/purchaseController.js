const PurchaseTransaction = require('../models/PurchaseTransaction');
const Product = require('../models/Product');

exports.createPurchaseTransaction = async (req, res) => {
  try {
    const { supplierId, supplierName, items, totalAmount, invoiceNumber, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Debes incluir al menos un producto' });
    }

    // 1. Crear el registro del remito/pago
    const transaction = new PurchaseTransaction({
      supplier: supplierId,
      supplierName,
      items,
      totalAmount,
      invoiceNumber,
      notes
    });

    await transaction.save();

    // 2. Aumentar stock de CADA producto en la lista
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product) {
        if (item.sellType === 'peso') {
          product.stockGrams = (product.stockGrams || 0) + Number(item.quantity);
        } else if (item.sellType === 'porcion') {
          product.stockPorciones = (product.stockPorciones || 0) + Number(item.quantity);
        } else {
          product.stockUnits = (product.stockUnits || 0) + Number(item.quantity);
        }
        await product.save();
      }
    }

    res.status(201).json({
      message: 'Ingreso múltiple y pago registrado con éxito',
      transaction
    });

  } catch (error) {
    res.status(500).json({ message: 'Error al procesar la compra', error: error.message });
  }
};