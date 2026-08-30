const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PurchaseTransaction = require('../models/PurchaseTransaction');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

// GET /api/purchase-transactions - Obtener compras
router.get('/', async (req, res) => {
  try {
    const transactions = await PurchaseTransaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ message: 'Error al obtener compras', error: error.message });
  }
});

// POST /api/purchase-transactions - Registrar ingreso de mercadería
router.post('/', async (req, res) => {
  try {
    const { supplierId, supplierName, items, totalAmount, invoiceNumber, paymentMethod, notes } = req.body;

    let finalSupplierName = supplierName || 'Proveedor General';
    
    // Validar si el supplierId enviado es un ID de MongoDB válido antes de consultar
    if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
      const sup = await Supplier.findById(supplierId);
      if (sup) finalSupplierName = sup.name;
    }

    // Asegurar estructura válida para los items
    const formattedItems = Array.isArray(items) ? items.map(item => ({
      product: item.product || item.productId || null,
      name: item.name || 'Producto',
      quantity: parseFloat(item.quantity) || 0,
      unitCost: parseFloat(item.unitCost) || 0
    })) : [];

    const isPaid = paymentMethod !== 'Pendiente';

    const newTransaction = new PurchaseTransaction({
      supplierId: (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) ? supplierId : null,
      supplierName: finalSupplierName,
      items: formattedItems,
      totalAmount: parseFloat(totalAmount) || 0,
      invoiceNumber: invoiceNumber || '',
      paymentMethod: paymentMethod || 'Efectivo',
      isPaid: isPaid,
      notes: notes || ''
    });

    await newTransaction.save();

    // Actualizar stock y costo en la colección de productos
    for (const item of formattedItems) {
      if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
        const prod = await Product.findById(item.product);
        if (prod) {
          prod.stock = (parseFloat(prod.stock) || 0) + item.quantity;
          if (item.unitCost > 0) {
            prod.costPrice = item.unitCost;
          }
          await prod.save();
        }
      }
    }

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('🔥 Error en POST /api/purchase-transactions:', error);
    res.status(500).json({ message: 'Error interno al registrar la compra', error: error.message });
  }
});

// PATCH /api/purchase-transactions/:id/pay - Marcar como PAGADO
router.patch('/:id/pay', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID de transacción inválido' });
    }

    const transaction = await PurchaseTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    transaction.isPaid = true;
    transaction.paymentMethod = 'Efectivo';
    await transaction.save();

    res.json({ message: 'Transacción saldada con éxito', transaction });
  } catch (error) {
    console.error('Error al saldar deuda:', error);
    res.status(500).json({ message: 'Error al actualizar pago', error: error.message });
  }
});

module.exports = router;