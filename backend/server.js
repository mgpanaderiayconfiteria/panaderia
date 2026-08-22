const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const app = express();

// 1. Configuración de CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000'
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

// Middlewares para JSON e imágenes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rutas de la API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orders'));

// Función para inicializar/sincronizar cuenta Admin
const initAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'mgpanaderiayconfiteria@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'pana80y2';

    const cleanEmail = adminEmail.trim().toLowerCase();
    const existingAdmin = await User.findOne({ email: cleanEmail });

    if (!existingAdmin) {
      // Se le pasa la contraseña en texto plano, Mongoose la encripta en el hook pre('save')
      await User.create({
        name: 'Administrador Panadería',
        email: cleanEmail,
        password: adminPassword,
        role: 'admin',
        isAdmin: true
      });
      console.log('👑 ¡Cuenta del Administrador creada con éxito!');
    } else {
      // Al asignar la contraseña y hacer save(), el pre('save') re-encripta correctamente
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
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conexión exitosa a MongoDB Atlas 🍃');
    initAdmin();
  })
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Ruta raíz de prueba
app.get('/', (req, res) => {
  res.send('API de Panadería funcionando 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});