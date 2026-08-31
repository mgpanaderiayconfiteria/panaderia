const express = require('express');
const router = express.Router();
const { getIsReady } = require('../services/whatsappService');

router.get('/qr', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Estado de WhatsApp</title>
      <style>
        body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f4f6f8; }
        .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
        .status { font-weight: bold; color: #2e7d32; font-size: 1.2rem; margin-top: 1rem; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Servicio de Alertas WhatsApp</h2>
        <div class="status">✅ Conectado vía CallMeBot API</div>
        <p style="color: #666; margin-top: 0.5rem;">Las alertas de stock se enviarán automáticamente al número configurado.</p>
      </div>
    </body>
    </html>
  `);
});

router.get('/qr-status', (req, res) => {
  res.json({ ready: true, authenticated: true });
});

module.exports = router;