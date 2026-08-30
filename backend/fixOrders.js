// fixOrders.js
require('dotenv').config();
const mongoose = require('mongoose');

// Obtener la URI desde el archivo .env
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Error: No se encontró MONGO_URI en el archivo .env');
  process.exit(1);
}

// Esquema de la orden
const orderSchema = new mongoose.Schema({
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String },
    price: { type: Number },
    quantity: { type: Number },
    mode: { type: String },
    detailLabel: { type: String },
    subtotal: { type: Number }
  }],
  subtotal: { type: Number },
  discountAmount: { type: Number },
  isCashDiscountApplied: { type: Boolean },
  total: { type: Number },
  paidAmount: { type: Number },
  changeAmount: { type: Number },
  paymentMethod: { type: String },
  seller: { type: mongoose.Schema.Types.ObjectId },
  employee: { type: String },
  status: { type: String }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

async function fixOrders() {
  try {
    console.log('🔌 Conectando a MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conexión exitosa a la base de datos.');

    const orders = await Order.find({});
    console.log(`📦 Se encontraron ${orders.length} órdenes en total. Iniciando auditoría...`);

    let fixedCount = 0;

    for (const order of orders) {
      let orderModified = false;
      let newSubtotal = 0;

      // 1. Auditamos y recalculamos cada ítem de la orden
      if (Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach((item) => {
          let itemSubtotal = 0;
          const price = parseFloat(item.price || 0);
          const qty = parseFloat(item.quantity || 0);
          const mode = item.mode || 'unit';

          // A) Si el item ya tenía un subtotal válido y coherente
          if (item.subtotal !== undefined && item.subtotal !== null && !isNaN(item.subtotal) && item.subtotal > 0) {
            itemSubtotal = parseFloat(item.subtotal);
          } 
          // B) Si es venta por peso/kilo
          else if (mode === 'weight' || mode === 'kg') {
            // Si el precio guardado es por Kilo (ej: $2500) y la cantidad está en Gramos (ej: 250g)
            if (price > 50 && qty >= 10) {
              itemSubtotal = (price / 1000) * qty;
            } else {
              // Si el precio ya era por Gramo (ej: $2.5/g * 250g)
              itemSubtotal = price * qty;
            }
          } 
          // C) Unidades o Porciones
          else {
            itemSubtotal = price * qty;
          }

          // Si el subtotal guardado difiere del calculado, lo actualizamos
          if (Math.abs((item.subtotal || 0) - itemSubtotal) > 0.01) {
            item.subtotal = itemSubtotal;
            orderModified = true;
          }

          newSubtotal += itemSubtotal;
        });
      } else {
        // Fallback si la orden no tenía arreglo de ítems
        newSubtotal = parseFloat(order.subtotal || order.total || 0);
      }

      // 2. Verificar y corregir subtotal general de la orden
      if (Math.abs((order.subtotal || 0) - newSubtotal) > 0.01) {
        order.subtotal = newSubtotal;
        orderModified = true;
      }

      // 3. Recalcular Descuento del 10% para Efectivo
      let newDiscount = parseFloat(order.discountAmount || 0);
      const isCash = (order.paymentMethod || 'efectivo') === 'efectivo';

      if (order.isCashDiscountApplied || (isCash && newDiscount > 0)) {
        const expectedDiscount = newSubtotal * 0.10;
        if (Math.abs(newDiscount - expectedDiscount) > 0.01) {
          newDiscount = expectedDiscount;
          order.discountAmount = newDiscount;
          order.isCashDiscountApplied = true;
          orderModified = true;
        }
      } else {
        if (order.discountAmount !== 0) {
          order.discountAmount = 0;
          orderModified = true;
        }
        newDiscount = 0;
      }

      // 4. Recalcular Total Final
      const newTotal = Math.max(0, newSubtotal - newDiscount);
      if (Math.abs((order.total || 0) - newTotal) > 0.01) {
        order.total = newTotal;
        orderModified = true;
      }

      // 5. Recalcular Vuelto
      const paid = parseFloat(order.paidAmount || newTotal);
      const newChange = isCash ? Math.max(0, paid - newTotal) : 0;
      if (Math.abs((order.changeAmount || 0) - newChange) > 0.01) {
        order.changeAmount = newChange;
        orderModified = true;
      }

      // Guardar únicamente si se detectó algún desfasaje
      if (orderModified) {
        await order.save();
        fixedCount++;
        console.log(`🛠️ Orden ${order._id} corregida -> Subtotal: $${newSubtotal.toFixed(2)} | Total: $${newTotal.toFixed(2)}`);
      }
    }

    console.log(`\n🎉 ¡Proceso completado con éxito! Se auditaron ${orders.length} órdenes y se corrigieron ${fixedCount} desfasadas.`);
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error durante la corrección de órdenes:', error);
    process.exit(1);
  }
}

fixOrders();