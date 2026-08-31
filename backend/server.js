const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
// Importamos las funciones del servicio de WhatsApp
const { initWhatsApp, getIsReady, sendStockAlert } = require('./services/whatsappService');

// Importaciones de rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://mgpanaderia.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware Logger
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  console.log(`📥 [INCOMING] ${method} ${originalUrl} - IP: ${ip}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const icon = status >= 400 ? '❌' : '✅';
    console.log(`${icon} [OUTGOING] ${method} ${originalUrl} -> Status: ${status} (${duration}ms)`);
  });

  next();
});

// Endpoint dedicado para verificar el estado del bot de WhatsApp
app.get('/qr', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Estado WhatsApp - MG Panadería</title>
      <style>
        body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; }
        .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
        .status { font-weight: bold; color: #166534; font-size: 1.2rem; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2 style="margin: 0; color: #0f172a;">Servicio de Alertas WhatsApp</h2>
        <div class="status">✅ Conectado y Activo vía CallMeBot API</div>
        <p style="color: #64748b; font-size: 0.9rem; margin-top: 15px;">Las alertas de stock bajo se enviarán automáticamente sin requerir escaneo de QR.</p>
      </div>
    </body>
    </html>
  `);
});

// Endpoint auxiliar para verificar el estado de la conexión
app.get('/qr-status', (req, res) => {
  res.json({ isReady: getIsReady() });
});

// Endpoint para probar el envío directo de alertas por WhatsApp
app.get('/api/test-whatsapp', async (req, res) => {
  const targetPhone = process.env.ALERT_PHONE_NUMBER;

  if (!targetPhone) {
    return res.status(400).json({
      success: false,
      error: 'La variable ALERT_PHONE_NUMBER no está configurada en el entorno (.env / Render).'
    });
  }

  try {
    const sendPromise = sendStockAlert('Harina 000 (PRUEBA)', 2, 5, 'Kg');
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo de espera agotado al enviar por WhatsApp')), 10000)
    );

    await Promise.race([sendPromise, timeoutPromise]);

    res.json({
      success: true,
      message: `Alerta de prueba enviada con éxito al número ${targetPhone}`
    });
  } catch (error) {
    console.error('❌ Error en test-whatsapp:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enrutamiento directo de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api', supplierRoutes);
app.use('/api/purchase-transactions', purchaseRoutes);
app.use('/api/expenses', expenseRoutes);

// Inicialización del Admin
const initAdmin = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'mgpanaderiayconfiteria@gmail.com').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'pana80y2';

    let existingAdmin = await User.findOne({ email: adminEmail }).select('+password');

    if (!existingAdmin) {
      await User.create({
        name: 'Administrador Panadería',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isAdmin: true
      });
      console.log('👑 ¡Cuenta del Administrador creada con éxito!');
    } else {
      existingAdmin.password = adminPassword;
      existingAdmin.role = 'admin';
      existingAdmin.isAdmin = true;
      await existingAdmin.save();
      console.log('🔄 ¡Cuenta de Admin re-sincronizada con éxito!');
    }
  } catch (error) {
    console.error('Error al inicializar cuenta admin:', error.message);
  }
};

// Conexión MongoDB
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('❌ ERROR CRÍTICO: Falta la variable MONGO_URI en el archivo .env');
} else {
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('Conexión exitosa a MongoDB Atlas 🍃');
      initAdmin();
      initWhatsApp();
    })
    .catch(err => console.error('Error al conectar a MongoDB:', err));
}

app.get('/', (req, res) => {
  res.send('API de Panadería funcionando 🚀');
});

app.use((req, res, next) => {
  console.warn(`⚠️ [404] Ruta no encontrada: ${req.originalUrl}`);
  res.status(404).json({ message: `La ruta ${req.originalUrl} no existe en el servidor` });
});

app.use((err, req, res, next) => {
  console.error('🔥 Error en el servidor:', err.message);
  res.status(500).json({ message: 'Error interno en el servidor', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});