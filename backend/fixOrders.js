// fixOrders.js
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Error: No se encontró MONGO_URI en el archivo .env');
  process.exit(1);
}

// 1. Modelo de Producto flexible para leer todas sus configuraciones
const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  allowByUnit: Boolean,
  allowByWeight: Boolean,
  allowByPorcion: Boolean,
  allowByAmount: Boolean,
  priceUnit: Number,
  priceKg: Number,
  priceHalfDozen: Number,
  priceDozen: Number,
  pricePorcion: Number,
  price: Number
}, { strict: false });

const Product = mongoose.model('Product', productSchema);

// 2. Modelo de Orden
const orderSchema = new mongoose.Schema({
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    mode: String,
    detailLabel: String,
    subtotal: Number
  }],
  subtotal: Number,
  discountAmount: Number,
  isCashDiscountApplied: Boolean,
  total: Number,
  paidAmount: Number,
  changeAmount: Number,
  paymentMethod: String,
  status: String
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

// 3. Función para calcular el subtotal del ítem consultando la configuración real del producto
function calculateItemSubtotal(item, product) {
  const mode = item.mode || 'unit';
  const qty = parseFloat(item.quantity || 0);

  // Si no se encuentra el producto en BD, usamos los valores guardados en el ítem
  const priceKg = parseFloat(product?.priceKg || product?.price || item.price || 0);
  const priceUnit = parseFloat(product?.priceUnit || product?.price || item.price || 0);
  const priceHalfDozen = parseFloat(product?.priceHalfDozen || 0);
  const priceDozen = parseFloat(product?.priceDozen || 0);

  // CASO A: Venta por Monto Fijo ($) -> Se respeta el monto ingresado
  if (mode === 'amount' || (item.subtotal > 0 && item.detailLabel?.includes('$'))) {
    return parseFloat(item.subtotal || item.price || 0);
  }

  // CASO B: Venta por Peso (Gramos o Kilos)
  if (mode === 'weight' || mode === 'kg' || product?.allowByWeight) {
    if (priceKg <= 0) return parseFloat(item.subtotal || 0);
    // Si qty es mayor o igual a 5, asumimos que son gramos (ej: 350g). Si no, kilos (ej: 0.35kg)
    const grams = qty >= 5 ? qty : qty * 1000;
    return (priceKg / 1000) * grams;
  }

  // CASO C: Venta por Unidades con Promociones/Escalas (Docena / Media Docena)
  if (priceDozen > 0 || priceHalfDozen > 0) {
    let subtotal = 0;
    let unidadesRestantes = qty;

    // Docenas completas
    if (priceDozen > 0 && unidadesRestantes >= 12) {
      const docenas = Math.floor(unidadesRestantes / 12);
      subtotal += docenas * priceDozen;
      unidadesRestantes %= 12;
    }

    // Media docena sobrante
    if (priceHalfDozen > 0 && unidadesRestantes >= 6) {
      subtotal += priceHalfDozen;
      unidadesRestantes -= 6;
    }

    // Unidades individuales restantes
    if (unidadesRestantes > 0) {
      subtotal += unidadesRestantes * priceUnit;
    }

    return subtotal;
  }

  // CASO D: Venta Simple por Unidad
  return priceUnit * qty;
}

async function fixOrders() {
  try {
    console.log('🔌 Conectando a MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conexión exitosa.');

    // Cargar productos en memoria para cruce rápido
    const dbProducts = await Product.find({});
    const productMap = new Map();
    dbProducts.forEach(p => {
      productMap.set(p._id.toString(), p);
      if (p.name) productMap.set(p.name.trim().toLowerCase(), p);
    });

    const orders = await Order.find({});
    console.log(`📦 Auditando ${orders.length} órdenes basándonos en las reglas de cada producto...\n`);

    let fixedCount = 0;

    for (const order of orders) {
      let orderModified = false;
      let newSubtotal = 0;

      if (Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach((item) => {
          const prodIdStr = item.product ? item.product.toString() : '';
          const itemNameNorm = item.name ? item.name.trim().toLowerCase() : '';
          
          // Buscar producto en la BD por ID o Nombre
          const product = productMap.get(prodIdStr) || productMap.get(itemNameNorm);

          // Calcular el subtotal correcto consultando el modelo del producto
          let itemSubtotal = calculateItemSubtotal(item, product);
          itemSubtotal = Math.round(itemSubtotal * 100) / 100;

          if (Math.abs((item.subtotal || 0) - itemSubtotal) > 0.01) {
            item.subtotal = itemSubtotal;
            orderModified = true;
          }

          newSubtotal += itemSubtotal;
        });
      } else {
        newSubtotal = parseFloat(order.subtotal || order.total || 0);
      }

      newSubtotal = Math.round(newSubtotal * 100) / 100;

      // Actualizar Subtotal General
      if (Math.abs((order.subtotal || 0) - newSubtotal) > 0.01) {
        order.subtotal = newSubtotal;
        orderModified = true;
      }

      // Descuento en Efectivo (10%)
      let newDiscount = parseFloat(order.discountAmount || 0);
      const isCash = (order.paymentMethod || 'efectivo') === 'efectivo';

      if (order.isCashDiscountApplied || (isCash && newDiscount > 0)) {
        newDiscount = Math.round((newSubtotal * 0.10) * 100) / 100;
        order.discountAmount = newDiscount;
        order.isCashDiscountApplied = true;
        orderModified = true;
      } else {
        newDiscount = 0;
        if (order.discountAmount !== 0) {
          order.discountAmount = 0;
          orderModified = true;
        }
      }

      // Total Final
      const newTotal = Math.max(0, Math.round((newSubtotal - newDiscount) * 100) / 100);
      if (Math.abs((order.total || 0) - newTotal) > 0.01) {
        order.total = newTotal;
        orderModified = true;
      }

      // Vuelto
      const paid = parseFloat(order.paidAmount || newTotal);
      const newChange = isCash ? Math.max(0, Math.round((paid - newTotal) * 100) / 100) : 0;
      if (Math.abs((order.changeAmount || 0) - newChange) > 0.01) {
        order.changeAmount = newChange;
        orderModified = true;
      }

      if (orderModified) {
        await order.save();
        fixedCount++;
        console.log(`🛠️ Orden ${order._id} recalculada -> Subtotal: $${newSubtotal} | Total: $${newTotal}`);
      }
    }

    console.log(`\n🎉 ¡Finalizado! Se procesaron ${fixedCount} órdenes sincronizadas con los modelos de productos.`);
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
    process.exit(1);
  }
}

fixOrders();