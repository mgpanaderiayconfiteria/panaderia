const Product = require('../models/Product');

// Obtener todos los productos
exports.getProducts = async (req, res) => {
  console.log('🔍 [PRODUCTOS] Consultando catálogo completo...');
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    console.log(`✅ [PRODUCTOS] Se encontraron ${products.length} productos.`);
    res.status(200).json(products);
  } catch (error) {
    console.error('❌ [PRODUCTOS ERROR] Error en getProducts:', error.message);
    res.status(500).json({ message: 'Error al obtener los productos', error: error.message });
  }
};

// Crear un nuevo producto con modalidades de venta dinámicas
exports.createProduct = async (req, res) => {
  const logData = { ...req.body, image: req.body.image ? '[BASE64_IMAGE]' : '' };
  console.log('📝 [PRODUCTOS] Intentando crear producto con datos:', JSON.stringify(logData));

  try {
    const { 
      name, 
      category, 
      allowByUnit, 
      allowByWeight, 
      allowByAmount, 
      priceUnit, 
      priceKg, 
      price, 
      cogs, 
      stock, 
      stockUnit, 
      image 
    } = req.body;

    // Aseguramos que 'price' tenga un valor por defecto válido tomando priceKg o priceUnit
    const mainPrice = price || priceKg || priceUnit || 0;

    const newProduct = new Product({
      name,
      category,
      allowByUnit: allowByUnit ?? true,
      allowByWeight: allowByWeight ?? true,
      allowByAmount: allowByAmount ?? true,
      priceUnit: priceUnit || 0,
      priceKg: priceKg || 0,
      price: mainPrice,
      cogs: cogs || 0,
      stock: stock || 0,
      stockUnit: stockUnit || 'gr',
      image: image || ''
    });

    const savedProduct = await newProduct.save();
    console.log('✅ [PRODUCTOS] Producto creado exitosamente con ID:', savedProduct._id);
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('❌ [PRODUCTOS ERROR] Error de validación o guardado en createProduct:', error.message);
    res.status(400).json({ message: 'Error al crear el producto', error: error.message });
  }
};

// Actualizar un producto
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  console.log(`✏️ [PRODUCTOS] Intentando actualizar producto ID: ${id}`);
  try {
    const updateData = { ...req.body };
    if (!updateData.price && (updateData.priceKg || updateData.priceUnit)) {
      updateData.price = updateData.priceKg || updateData.priceUnit;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      console.warn(`⚠️ [PRODUCTOS] No se encontró el producto con ID: ${id}`);
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    console.log(`✅ [PRODUCTOS] Producto ID: ${id} actualizado correctamente.`);
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(`❌ [PRODUCTOS ERROR] Error al actualizar ID ${id}:`, error.message);
    res.status(400).json({ message: 'Error al actualizar el producto', error: error.message });
  }
};

// Eliminar un producto
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ [PRODUCTOS] Intentando eliminar producto ID: ${id}`);
  try {
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      console.warn(`⚠️ [PRODUCTOS] No se encontró producto para eliminar con ID: ${id}`);
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    console.log(`✅ [PRODUCTOS] Producto ID: ${id} eliminado correctamente.`);
    res.status(200).json({ message: 'Producto eliminado correctamente', id });
  } catch (error) {
    console.error(`❌ [PRODUCTOS ERROR] Error al eliminar ID ${id}:`, error.message);
    res.status(500).json({ message: 'Error al eliminar el producto', error: error.message });
  }
};