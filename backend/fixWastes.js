require('dotenv').config();
const mongoose = require('mongoose');
const Waste = require('./models/Waste');
const Product = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tu_base_de_datos';

const fixOldWastes = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Conectado a MongoDB...');

    // Buscar mermas que tengan pérdida 0 o estén en modo 'unit' por defecto
    const wastes = await Waste.find({});
    console.log(`📋 Se encontraron ${wastes.length} registros de mermas para revisar.`);

    let updatedCount = 0;

    for (const waste of wastes) {
      if (!waste.product) continue;

      const product = await Product.findById(waste.product);
      if (!product) continue;

      const numQty = parseFloat(waste.quantity) || 0;

      // 1. Determinar la modalidad correcta del producto
      let mode = 'unit';
      if (
        product.allowByWeight ||
        product.stockUnit === 'kg' ||
        product.stockUnit === 'gr' ||
        product.unit === 'kg' ||
        product.unit === 'gr'
      ) {
        mode = 'weight';
      } else if (product.allowByPorcion || product.stockUnit === 'porcion') {
        mode = 'porcion';
      }

      let costPrice = 0;
      let totalLoss = 0;

      // 2. Recalcular costo y pérdida total
      if (mode === 'weight') {
        const cogsKg = parseFloat(product.cogsKg || product.cogs || 0);
        costPrice = cogsKg / 1000; // Costo por gramo
        totalLoss = numQty * costPrice;
      } else if (mode === 'porcion') {
        costPrice = parseFloat(product.cogsPorcion || product.cogs || 0);
        totalLoss = numQty * costPrice;
      } else {
        costPrice = parseFloat(product.cogsUnit || product.cogs || 0);
        totalLoss = numQty * costPrice;
      }

      // 3. Actualizar el registro
      waste.mode = mode;
      waste.costPrice = costPrice;
      waste.totalLoss = totalLoss;

      await waste.save();
      updatedCount++;
      console.log(`✅ Merma actualizada: ${product.name} | Modo: ${mode} | Pérdida: $${totalLoss.toFixed(2)}`);
    }

    console.log(`\n🎉 Migración finalizada exitosamente. Registros corregidos: ${updatedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando la migración:', error);
    process.exit(1);
  }
};

fixOldWastes();