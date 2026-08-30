require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://mgpanaderiayconfiteria_db_user:N8eY6Ea2CGwnJ1np@panaderia.sjimwn3.mongodb.net/?appName=Panaderia";

const orderSchema = new mongoose.Schema({
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    mode: { type: String },
    detailLabel: { type: String },
    subtotal: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  isCashDiscountApplied: { type: Boolean, default: false },
  total: { type: Number, required: true },
  paidAmount: { type: Number },
  changeAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['efectivo', 'digital'], default: 'efectivo' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employee: { type: String, default: 'Cajero' },
  status: { type: String, enum: ['completed', 'cancelled'], default: 'completed' }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

async function fixOrders(readOnly = false) {
  try {
    console.log('Conectando a MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('Conexión exitosa a la base de datos.\n');

    const orders = await Order.find({ status: 'completed' });
    let updatedCount = 0;

    for (const order of orders) {
      let isModified = false;
      let newOrderSubtotal = 0;

      order.items.forEach(item => {
        // Redondear subtotales con decimales
        const roundedSubtotal = Math.round(item.subtotal);
        if (item.subtotal !== roundedSubtotal) {
          item.subtotal = roundedSubtotal;
          isModified = true;
        }

        // Si el precio se guardó en 1, corregir el precio unitario exacto por gramo/unidad
        if (item.price === 1 && item.quantity > 0) {
          item.price = item.subtotal / item.quantity;
          isModified = true;
        }

        newOrderSubtotal += item.subtotal;
      });

      if (isModified || order.subtotal !== newOrderSubtotal) {
        order.subtotal = newOrderSubtotal;
        
        // Recalcular el total considerando el descuento
        const discount = order.discountAmount || 0;
        order.total = Math.max(0, newOrderSubtotal - discount);

        if (!readOnly) {
          await order.save();
        }
        updatedCount++;
      }
    }

    if (readOnly) {
      console.log(`[MODO PRUEBA] Se corregirán ${updatedCount} órdenes cuando se active la escritura.`);
    } else {
      console.log(`[CORRECCIÓN COMPLETADA] Se actualizaron ${updatedCount} órdenes en la base de datos.`);
    }

  } catch (error) {
    console.error('Error durante la ejecución:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de la base de datos.');
  }
}

// Cambiar a false para ejecutar la actualización real en la base de datos
fixOrders(true);