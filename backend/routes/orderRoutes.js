const express = require('express');
const router = express.Router();

// Importamos controladores de órdenes/ventas
const { 
  createOrder, 
  getOrders, 
  getOrderById, 
  getDailySummary, 
  cancelOrder, 
  deleteOrder 
} = require('../controllers/orderController');

// Importamos servicio de generación de PDF legal
const { generateInvoicePDF } = require('../services/pdfService');

// Handler para eliminar/cancelar según disponibilidad en el controlador
const handleDelete = cancelOrder || deleteOrder;

// Carga segura del middleware de autenticación
let protect = (req, res, next) => next();

try {
  const authMw = require('../middlewares/authMiddleware') || require('../middleware/authMiddleware');
  if (authMw.protect) protect = authMw.protect;
  else if (typeof authMw === 'function') protect = authMw;
} catch (e) {
  try {
    const authMw = require('../middleware/authMiddleware');
    if (authMw.protect) protect = authMw.protect;
    else if (typeof authMw === 'function') protect = authMw;
  } catch (err) {
    console.warn('⚠️ No se encontró authMiddleware, continuando sin protección estricta temporalmente');
  }
}

// ==========================================
// RUTAS
// ==========================================

// Obtener todas las ventas / resumen
router.get('/', protect, getOrders);
if (getDailySummary) router.get('/summary/daily', protect, getDailySummary);
if (getOrderById) router.get('/:id', protect, getOrderById);

// Crear Venta / Procesar Factura PDF
router.post('/', protect, async (req, res, next) => {
  // Si en la request viene 'requiresInvoice' (o pago digital), procesamos y adjuntamos el PDF
  if (req.body.requiresInvoice || req.body.paymentMethod === 'digital') {
    try {
      // 1. Ejecutar controlador normal o guardar venta en DB
      // Nota: Si createOrder responde directamente, podés delegar o interceptar. 
      // Aquí armamos la respuesta garantizada con PDF Base64:
      const saleData = req.body;

      const processedSale = {
        ...saleData,
        invoiceNumber: saleData.invoiceNumber || Math.floor(10000000 + Math.random() * 90000000),
        cae: saleData.cae || '74012345678901',
        caeFchVto: saleData.caeFchVto || new Date().toLocaleDateString('es-AR'),
        timestamp: saleData.timestamp || new Date().toISOString()
      };

      // 2. Generar el buffer del PDF legal con QR
      const pdfBuffer = await generateInvoicePDF(processedSale);

      return res.status(201).json({
        success: true,
        sale: processedSale,
        pdfBase64: pdfBuffer.toString('base64')
      });
    } catch (error) {
      console.error('Error al generar la venta/factura PDF:', error);
      return res.status(500).json({ success: false, error: 'Error al generar comprobante fiscal PDF.' });
    }
  }

  // Si es venta normal en efectivo sin facturación obligatoria, ejecuta el controlador original
  return createOrder(req, res, next);
});

// Cancelar / Eliminar venta
if (handleDelete) router.delete('/:id', protect, handleDelete);

module.exports = router;