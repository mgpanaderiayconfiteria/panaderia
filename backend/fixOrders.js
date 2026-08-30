const mongoose = require('mongoose');
require('dotenv').config();

const OrderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model('Order', OrderSchema);

const PRODUCT_ID = '6a8ba599a606f9eb12b2aa0a';

const fixBizcochitoOrders = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI no está configurado en .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('🍃 Conectado a MongoDB Atlas...');

    // Buscar las ventas que tienen el producto con price === 1
    const ordersToFix = await Order.find({
      'items.product': new mongoose.Types.ObjectId(PRODUCT_ID),
      'items.price': 1
    });

    console.log(`\n🔧 Se encontraron ${ordersToFix.length} ventas con el precio mal guardado (price: 1).\n`);

    for (let order of ordersToFix) {
      let updated = false;

      order.items = order.items.map((item) => {
        if (
          (item.product && item.product.toString() === PRODUCT_ID) ||
          (item.name && item.name.toLowerCase().includes('bizcochito'))
        ) {
          if (item.price === 1) {
            console.log(`Corrigiendo venta ${order._id}: 'price' pasa de 1 a 14`);
            item.price = 14; // Precio corregido por gramo ($14.000 / 1000g)
            updated = true;
          }
        }
        return item;
      });

      if (updated) {
        order.markModified('items');
        await order.save();
      }
    }

    console.log('\n✅ Corrección completada con éxito.');
    await mongoose.disconnect();
    console.log('👋 Conexión cerrada.');
  } catch (error) {
    console.error('🔥 Error al corregir las ventas:', error.message);
    process.exit(1);
  }
};

fixBizcochitoOrders();