require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product'); // Asegurate de que la ruta coincida con tu estructura

const updateCategories = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ Error: No se encontró la variable MONGO_URI en el archivo .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB correctamente.');

    // 1. Repostería / Reposteria -> Dulces
    const resDulces = await Product.updateMany(
      { category: { $in: ['Repostería', 'Reposteria'] } },
      { $set: { category: 'Dulces' } }
    );
    console.log(`🔄 Repostería -> Dulces: ${resDulces.modifiedCount} productos actualizados.`);

    // 2. Facturería / Factureria -> Postres
    const resPostres = await Product.updateMany(
      { category: { $in: ['Facturería', 'Factureria'] } },
      { $set: { category: 'Postres' } }
    );
    console.log(`🔄 Facturería -> Postres: ${resPostres.modifiedCount} productos actualizados.`);

    // 3. Especialidades -> Comida y Bebida
    const resComidaBebida = await Product.updateMany(
      { category: { $in: ['Especialidades', 'Especialidad'] } },
      { $set: { category: 'Comida y Bebida' } }
    );
    console.log(`🔄 Especialidades -> Comida y Bebida: ${resComidaBebida.modifiedCount} productos actualizados.`);

    console.log('🎉 Migración de categorías completada con éxito.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando el script:', error);
    process.exit(1);
  }
};

updateCategories();