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
      subcategory,
      allowByUnit,
      allowByWeight,
      allowByPorcion,
      allowByAmount,
      priceUnit,
      priceHalfDozen,
      priceDozen,
      priceKg,
      pricePorcion,
      cogsUnit,
      cogsHalfDozen,
      cogsDozen,
      cogsKg,
      cogsPorcion,
      cogs,
      stockUnits,
      stockGrams,
      stockPorciones,
      minStockUnits,
      minStockGrams,
      minStockPorciones,
      image
    } = req.body;

    // Parseo de precios de venta
    const parsedPriceUnit = parseFloat(priceUnit || 0);
    const parsedPriceHalfDozen = parseFloat(priceHalfDozen || 0);
    const parsedPriceDozen = parseFloat(priceDozen || 0);
    const parsedPriceKg = parseFloat(priceKg || 0);
    const parsedPricePorcion = parseFloat(pricePorcion || 0);

    // Parseo de costos (COGS)
    let parsedCogsUnit = parseFloat(cogsUnit || 0);
    let parsedCogsHalfDozen = parseFloat(cogsHalfDozen || 0);
    let parsedCogsDozen = parseFloat(cogsDozen || 0);
    let parsedCogsKg = parseFloat(cogsKg || 0);
    let parsedCogsPorcion = parseFloat(cogsPorcion || 0);

    if (!parsedCogsUnit) {
      if (parsedCogsDozen > 0) parsedCogsUnit = parsedCogsDozen / 12;
      else if (parsedCogsHalfDozen > 0) parsedCogsUnit = parsedCogsHalfDozen / 6;
      else if (cogs) parsedCogsUnit = parseFloat(cogs);
    }

    const mainCogs = parsedCogsUnit || (parsedCogsKg ? parsedCogsKg / 1000 : 0) || parsedCogsPorcion || parseFloat(cogs || 0);
    const mainPrice = parsedPriceUnit || parsedPriceHalfDozen || parsedPriceDozen || parsedPriceKg || parsedPricePorcion || 0;

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
      category: category?.trim() || 'General',
      subcategory: subcategory?.trim() || '',
      allowByUnit: Boolean(allowByUnit),
      allowByWeight: Boolean(allowByWeight),
      allowByPorcion: Boolean(allowByPorcion),
      allowByAmount: Boolean(allowByAmount),
      priceUnit: parsedPriceUnit,
      priceHalfDozen: parsedPriceHalfDozen,
      priceDozen: parsedPriceDozen,
      priceKg: parsedPriceKg,
      pricePorcion: parsedPricePorcion,
      price: mainPrice,
      cogsUnit: parsedCogsUnit,
      cogsHalfDozen: parsedCogsHalfDozen,
      cogsDozen: parsedCogsDozen,
      cogsKg: parsedCogsKg,
      cogsPorcion: parsedCogsPorcion,
      cogs: mainCogs,
      stockUnits: parseFloat(stockUnits || 0),
      stockGrams: parseFloat(stockGrams || 0),
      stockPorciones: parseFloat(stockPorciones || 0),
      minStockUnits: parseFloat(minStockUnits || 0),
      minStockGrams: parseFloat(minStockGrams || 0),
      minStockPorciones: parseFloat(minStockPorciones || 0),
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
      category,
      subcategory,
      priceUnit,
      priceHalfDozen,
      priceDozen,
      priceKg,
      pricePorcion,
      cogsUnit,
      cogsHalfDozen,
      cogsDozen,
      cogsKg,
      cogsPorcion,
      cogs,
      allowByUnit,
      allowByWeight,
      allowByPorcion,
      stockUnits,
      stockGrams,
      stockPorciones,
      minStockUnits,
      minStockGrams,
      minStockPorciones
    } = req.body;

    const parsedPriceUnit = parseFloat(priceUnit || 0);
    const parsedPriceHalfDozen = parseFloat(priceHalfDozen || 0);
    const parsedPriceDozen = parseFloat(priceDozen || 0);
    const parsedPriceKg = parseFloat(priceKg || 0);
    const parsedPricePorcion = parseFloat(pricePorcion || 0);

    let parsedCogsUnit = parseFloat(cogsUnit || 0);
    let parsedCogsHalfDozen = parseFloat(cogsHalfDozen || 0);
    let parsedCogsDozen = parseFloat(cogsDozen || 0);
    let parsedCogsKg = parseFloat(cogsKg || 0);
    let parsedCogsPorcion = parseFloat(cogsPorcion || 0);

    if (!parsedCogsUnit) {
      if (parsedCogsDozen > 0) parsedCogsUnit = parsedCogsDozen / 12;
      else if (parsedCogsHalfDozen > 0) parsedCogsUnit = parsedCogsHalfDozen / 6;
      else if (cogs) parsedCogsUnit = parseFloat(cogs);
    }

    const mainCogs = parsedCogsUnit || (parsedCogsKg ? parsedCogsKg / 1000 : 0) || parsedCogsPorcion || parseFloat(cogs || 0);

    const updateData = { ...req.body };
    if (category) updateData.category = category.trim();
    if (subcategory !== undefined) updateData.subcategory = subcategory.trim();

    updateData.priceUnit = parsedPriceUnit;
    updateData.priceHalfDozen = parsedPriceHalfDozen;
    updateData.priceDozen = parsedPriceDozen;
    updateData.priceKg = parsedPriceKg;
    updateData.pricePorcion = parsedPricePorcion;
    updateData.price = parsedPriceUnit || parsedPriceHalfDozen || parsedPriceDozen || parsedPriceKg || parsedPricePorcion || req.body.price || 0;

    updateData.cogsUnit = parsedCogsUnit;
    updateData.cogsHalfDozen = parsedCogsHalfDozen;
    updateData.cogsDozen = parsedCogsDozen;
    updateData.cogsKg = parsedCogsKg;
    updateData.cogsPorcion = parsedCogsPorcion;
    updateData.cogs = mainCogs;

    if (minStockUnits !== undefined) updateData.minStockUnits = parseFloat(minStockUnits || 0);
    if (minStockGrams !== undefined) updateData.minStockGrams = parseFloat(minStockGrams || 0);
    if (minStockPorciones !== undefined) updateData.minStockPorciones = parseFloat(minStockPorciones || 0);

    // Evaluar la re-activación de la alerta si el stock se repuso por encima del mínimo
    const currentProd = await Product.findById(id);
    if (currentProd) {
      const nextStockUnits = stockUnits !== undefined ? parseFloat(stockUnits) : currentProd.stockUnits;
      const nextStockGrams = stockGrams !== undefined ? parseFloat(stockGrams) : currentProd.stockGrams;
      const nextStockPorciones = stockPorciones !== undefined ? parseFloat(stockPorciones) : currentProd.stockPorciones;

      const nextMinUnits = minStockUnits !== undefined ? parseFloat(minStockUnits) : currentProd.minStockUnits;
      const nextMinGrams = minStockGrams !== undefined ? parseFloat(minStockGrams) : currentProd.minStockGrams;
      const nextMinPorciones = minStockPorciones !== undefined ? parseFloat(minStockPorciones) : currentProd.minStockPorciones;

      if (
        (currentProd.allowByUnit && nextMinUnits > 0 && nextStockUnits > nextMinUnits) ||
        (currentProd.allowByWeight && nextMinGrams > 0 && nextStockGrams > nextMinGrams) ||
        (currentProd.allowByPorcion && nextMinPorciones > 0 && nextStockPorciones > nextMinPorciones)
      ) {
        updateData.alertSent = false;
      }
    }

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