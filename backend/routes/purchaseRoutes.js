const express = require('express');
const router = express.Router();
const PurchaseTransaction = require('../models/PurchaseTransaction');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

// GET /api/purchase-transactions - Obtener compras
router.get('/', async (req, res) => {
  try {
    const transactions = await PurchaseTransaction.find().sort({ createdAt: -1 });
    
    // Si la transacción no tiene supplierName guardado, buscamos el nombre en Supplier
    const formatted = await Promise.all(
      transactions.map(async (t) => {
        let name = t.supplierName || 'Proveedor General';
        if ((!t.supplierName || t.supplierName === 'Proveedor General') && t.supplierId) {
          const sup = await Supplier.findById(t.supplierId);
          if (sup) name = sup.name;
        }
        return {
          ...t._doc,
          supplierName: name
        };
      })
    );

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener compras', error: error.message });
  }
});

// POST /api/purchase-transactions - Registrar ingreso de mercadería
router.post('/', async (req, res) => {
  try {
    const { supplierId, supplierName, items, totalAmount, invoiceNumber, paymentMethod, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Se requiere al menos un producto' });
    }

    let finalSupplierName = supplierName;
    if (!finalSupplierName && supplierId) {
      const sup = await Supplier.findById(supplierId);
      if (sup) finalSupplierName = sup.name;
    }

    const isPaid = paymentMethod !== 'Pendiente';

    const newTransaction = new PurchaseTransaction({
      supplierId,
      supplierName: finalSupplierName || 'Proveedor General',
      items,
      totalAmount: parseFloat(totalAmount) || 0,
      invoiceNumber,
      paymentMethod,
      isPaid,
      notes
    });

    await newTransaction.save();

    // Actualizar stock y costo en tabla de productos
    for (const item of items) {
      const productId = item.product || item.productId;
      if (productId) {
        const prod = await Product.findById(productId);
        if (prod) {
          const addedQty = parseFloat(item.quantity) || 0;
          prod.stock = (prod.stock || 0) + addedQty;
          if (item.unitCost) {
            prod.costPrice = parseFloat(item.unitCost);
          }
          await prod.save();
        }
      }
    }

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error al guardar ingreso:', error);
    res.status(500).json({ message: 'Error interno al registrar compra', error: error.message });
  }
});

// PATCH /api/purchase-transactions/:id/pay - Marcar ingreso a cuenta como PAGADO
router.patch('/:id/pay', async (req, res) => {
  try {
    const transaction = await PurchaseTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    transaction.isPaid = true;
    transaction.paymentMethod = 'Efectivo';
    await transaction.save();

    res.json({ message: 'Transacción saldada con éxito', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar pago', error: error.message });
  }
});

module.exports = router;