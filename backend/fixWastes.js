require('dotenv').config();
const mongoose = require('mongoose');
const Waste = require('./models/Waste');
const Product = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/tu_base_de_datos';

const fixOldWastes = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Conectado a MongoDB...');

    const wastes = await Waste.find({});
    console.log(`📋 Se encontraron ${wastes.length} registros de mermas para revisar.`);

    let updatedCount = 0;

    for (const waste of wastes) {
      let product = null;

      if (waste.product) {
        product = await Product.findById(waste.product);
      }
      if (!product && waste.productName) {
        product = await Product.findOne({ name: waste.productName });
      }

      if (!product) {
        console.log(`⚠️ No se encontró el producto para la merma ID: ${waste._id}`);
        continue;
      }

      const numQty = parseFloat(waste.quantity) || 0;

      // Modalidad por peso
      const mode = 'weight';

      // Obtener valor del producto en MongoDB (Costo o Precio de Venta)
      const valPerKg = parseFloat(product.cogsKg) || parseFloat(product.cogs) || parseFloat(product.priceKg) || parseFloat(product.price) || 0;
      
      const costPrice = valPerKg / 1000; // Valor por gramo
      const totalLoss = numQty * costPrice;

      // Actualizar registro
      waste.product = product._id;
      waste.mode = mode;
      waste.costPrice = costPrice;
      waste.totalLoss = totalLoss;

      await waste.save();
      updatedCount++;
      console.log(`✅ Merma corregida: ${product.name} | Cantidad: ${numQty}gr | Precio/gr: $${costPrice.toFixed(4)} | Pérdida Total: $${totalLoss.toFixed(2)}`);
    }

    console.log(`\n🎉 Migración finalizada exitosamente. Registros corregidos: ${updatedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando la migración:', error);
    process.exit(1);
  }
};

fixOldWastes();