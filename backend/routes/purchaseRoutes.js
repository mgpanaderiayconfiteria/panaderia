const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PurchaseTransaction = require('../models/PurchaseTransaction');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

// GET /api/purchase-transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await PurchaseTransaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ message: 'Error al obtener compras', error: error.message });
  }
});

// POST /api/purchase-transactions
router.post('/', async (req, res) => {
  try {
    const { supplierId, supplierName, items, totalAmount, invoiceNumber, paymentMethod, notes } = req.body;

    let validSupplierId = null;
    let finalSupplierName = supplierName || 'Proveedor General';

    // Verificar si el supplierId enviado es un ObjectId válido de Mongoose
    if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
      validSupplierId = supplierId;
      const sup = await Supplier.findById(supplierId);
      if (sup) finalSupplierName = sup.name;
    }

    // Normalización de productos recibidos
    const formattedItems = Array.isArray(items) ? items.map(item => {
      const prodId = item.product || item.productId;
      return {
        product: (prodId && mongoose.Types.ObjectId.isValid(prodId)) ? prodId : null,
        name: item.name || item.productName || 'Producto',
        quantity: parseFloat(item.quantity) || 0,
        unitCost: parseFloat(item.unitCost || item.costPrice) || 0
      };
    }) : [];

    const isPaid = paymentMethod !== 'Pendiente';

    const newTransaction = new PurchaseTransaction({
      supplierId: validSupplierId,
      supplierName: finalSupplierName,
      items: formattedItems,
      totalAmount: parseFloat(totalAmount) || 0,
      invoiceNumber: invoiceNumber || '',
      paymentMethod: paymentMethod || 'Efectivo',
      isPaid: isPaid,
      notes: notes || ''
    });

    await newTransaction.save();

    // Actualización de stock en la colección de productos
    for (const item of formattedItems) {
      if (item.product) {
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
    console.error('🔥 Error crítico en POST /api/purchase-transactions:', error);
    res.status(500).json({ message: 'Error interno al guardar compra', error: error.message });
  }
});

// PUT /api/purchase-transactions/:id (Edición de remito / compra cargada)
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID de transacción inválido' });
    }

    const transaction = await PurchaseTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    const { supplierId, supplierName, items, totalAmount, invoiceNumber, paymentMethod, notes } = req.body;

    // 1. Revertir el stock acumulado previamente por esta transacción
    if (Array.isArray(transaction.items)) {
      for (const oldItem of transaction.items) {
        if (oldItem.product) {
          const prod = await Product.findById(oldItem.product);
          if (prod) {
            prod.stock = Math.max(0, (parseFloat(prod.stock) || 0) - (parseFloat(oldItem.quantity) || 0));
            await prod.save();
          }
        }
      }
    }

    let validSupplierId = null;
    let finalSupplierName = supplierName || 'Proveedor General';

    if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
      validSupplierId = supplierId;
      const sup = await Supplier.findById(supplierId);
      if (sup) finalSupplierName = sup.name;
    }

    const formattedItems = Array.isArray(items) ? items.map(item => {
      const prodId = item.product || item.productId;
      return {
        product: (prodId && mongoose.Types.ObjectId.isValid(prodId)) ? prodId : null,
        name: item.name || item.productName || 'Producto',
        quantity: parseFloat(item.quantity) || 0,
        unitCost: parseFloat(item.unitCost || item.costPrice) || 0
      };
    }) : [];

    const isPaid = paymentMethod !== 'Pendiente';

    transaction.supplierId = validSupplierId;
    transaction.supplierName = finalSupplierName;
    transaction.items = formattedItems;
    transaction.totalAmount = parseFloat(totalAmount) || 0;
    transaction.invoiceNumber = invoiceNumber || '';
    transaction.paymentMethod = paymentMethod || 'Efectivo';
    transaction.isPaid = isPaid;
    transaction.notes = notes || '';

    await transaction.save();

    // 2. Aplicar el nuevo stock correspondiente a los ítems actualizados
    for (const item of formattedItems) {
      if (item.product) {
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

    res.json(transaction);
  } catch (error) {
    console.error('🔥 Error crítico en PUT /api/purchase-transactions/:id:', error);
    res.status(500).json({ message: 'Error interno al actualizar compra', error: error.message });
  }
});

// PATCH /api/purchase-transactions/:id/pay
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

    res.json({ message: 'Deuda registrada como pagada con éxito', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar pago', error: error.message });
  }
});

module.exports = router;