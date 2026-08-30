const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

// Importaciones directas de rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const supplierRoutes = require('./routes/supplierRoutes'); // 👈 Importado

const app = express();

// Configuración de CORS
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

// Middlewares para parseo de body e imágenes
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

// Enrutamiento directo de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api', supplierRoutes); // 👈 Montado para proveedores y egresos (/api/suppliers y /api/expenses)

// Función para inicializar la cuenta Admin
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

// Conexión a MongoDB Atlas
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('❌ ERROR CRÍTICO: Falta la variable MONGO_URI en el archivo .env');
} else {
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('Conexión exitosa a MongoDB Atlas 🍃');
      initAdmin();
    })
    .catch(err => console.error('Error al conectar a MongoDB:', err));
}

// Ruta raíz de prueba
app.get('/', (req, res) => {
  res.send('API de Panadería funcionando 🚀');
});

// Capturador de rutas 404
app.use((req, res, next) => {
  console.warn(`⚠️ [404] Ruta no encontrada: ${req.originalUrl}`);
  res.status(404).json({ message: `La ruta ${req.originalUrl} no existe en el servidor` });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('🔥 Error en el servidor:', err.message);
  res.status(500).json({ message: 'Error interno en el servidor', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});