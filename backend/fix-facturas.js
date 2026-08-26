// fix-facturas-exact.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Order = require('./models/Order'); 

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/tu_base_de_datos';

// Cambia este valor por la cantidad REAL de facturas que representan esos $5000
const CANTIDAD_REAL_FACTURAS = 12; 

const TARGET_ORDERS = [
  '6a8db2c80079b524f32e68b2',
  '6a8e05ff58dee748c5e65aed'
];

async function fixFacturasExact() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);

    for (let orderId of TARGET_ORDERS) {
      const order = await Order.findById(orderId);
      if (!order || !Array.isArray(order.items)) continue;

      let modified = false;

      order.items = order.items.map(item => {
        if ((item.name || '').toLowerCase().includes('factura')) {
          modified = true;
          return {
            ...item.toObject(),
            quantityVal: CANTIDAD_REAL_FACTURAS,
            quantity: CANTIDAD_REAL_FACTURAS,
            subtotal: 5000,
            mode: 'unit',
            detailLabel: `$5000 (${CANTIDAD_REAL_FACTURAS} un)`
          };
        }
        return item;
      });

      if (modified) {
        order.markModified('items');
        await order.save();
        console.log(`✅ Orden ${orderId} actualizada a ${CANTIDAD_REAL_FACTURAS} facturas.`);
      }
    }

    console.log('🎉 Ajuste finalizado.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixFacturasExact();