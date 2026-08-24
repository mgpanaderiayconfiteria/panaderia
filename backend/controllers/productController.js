const Product = require('../models/Product');

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

exports.createProduct = async (req, res) => {
  const logData = { ...req.body, image: req.body.image ? '[BASE64_IMAGE]' : '' };
  console.log('📝 [PRODUCTOS] Intentando crear producto con datos:', JSON.stringify(logData));

  try {
    const {
      name,
      category,
      allowByUnit,
      allowByWeight,
      allowByPorcion,
      allowByAmount,
      priceUnit,
      priceKg,
      pricePorcion,
      cogs,
      stockUnits,
      stockGrams,
      stockPorciones,
      image
    } = req.body;

    const parsedPriceUnit = parseFloat(priceUnit || 0);
    const parsedPriceKg = parseFloat(priceKg || 0);
    const parsedPricePorcion = parseFloat(pricePorcion || 0);

    const mainPrice = parsedPriceUnit || parsedPriceKg || parsedPricePorcion || 0;

    let primaryStock = 0;
    let primaryStockUnit = 'un';

    if (allowByUnit) {
      primaryStock = parseFloat(stockUnits || 0);
      primaryStockUnit = 'un';
    } else if (allowByWeight) {
      primaryStock = parseFloat(stockGrams || 0);
      primaryStockUnit = 'gr';
    } else if (allowByPorcion) {
      primaryStock = parseFloat(stockPorciones || 0);
      primaryStockUnit = 'porcion';
    }

    const newProduct = new Product({
      name,
      category: category || 'Panadería',
      allowByUnit: Boolean(allowByUnit),
      allowByWeight: Boolean(allowByWeight),
      allowByPorcion: Boolean(allowByPorcion),
      allowByAmount: Boolean(allowByAmount),
      priceUnit: parsedPriceUnit,
      priceKg: parsedPriceKg,
      pricePorcion: parsedPricePorcion,
      price: mainPrice,
      cogs: parseFloat(cogs || 0),
      stockUnits: parseFloat(stockUnits || 0),
      stockGrams: parseFloat(stockGrams || 0),
      stockPorciones: parseFloat(stockPorciones || 0),
      stock: primaryStock,
      stockUnit: primaryStockUnit,
      sellType: allowByWeight ? 'peso' : allowByPorcion ? 'porcion' : 'unidad',
      unit: primaryStockUnit,
      image: image || ''
    });

    const savedProduct = await newProduct.save();
    console.log('✅ [PRODUCTOS] Producto creado exitosamente con ID:', savedProduct._id);
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('❌ [PRODUCTOS ERROR] Error en createProduct:', error.message);
    res.status(400).json({ message: 'Error al crear el producto', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  console.log(`✏️ [PRODUCTOS] Intentando actualizar producto ID: ${id}`);
  try {
    const {
      priceUnit,
      priceKg,
      pricePorcion,
      allowByUnit,
      allowByWeight,
      allowByPorcion,
      stockUnits,
      stockGrams,
      stockPorciones
    } = req.body;

    const parsedPriceUnit = parseFloat(priceUnit || 0);
    const parsedPriceKg = parseFloat(priceKg || 0);
    const parsedPricePorcion = parseFloat(pricePorcion || 0);

    const updateData = { ...req.body };
    updateData.price = parsedPriceUnit || parsedPriceKg || parsedPricePorcion || req.body.price || 0;

    if (allowByUnit) {
      updateData.stock = parseFloat(stockUnits || 0);
      updateData.stockUnit = 'un';
    } else if (allowByWeight) {
      updateData.stock = parseFloat(stockGrams || 0);
      updateData.stockUnit = 'gr';
    } else if (allowByPorcion) {
      updateData.stock = parseFloat(stockPorciones || 0);
      updateData.stockUnit = 'porcion';
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