const sendStockAlert = async (productName, currentStock, minStock, unitLabel) => {
  const phone = process.env.ALERT_PHONE_NUMBER;
  const apiKey = process.env.CALLMEBOT_API_KEY;

  if (!phone || !apiKey) {
    console.warn('⚠️ Falta configurar ALERT_PHONE_NUMBER o CALLMEBOT_API_KEY en las variables de entorno.');
    return;
  }

  const text = `⚠️ *ALERTA DE STOCK BAJO* ⚠️\n\nEl producto *${productName}* alcanzó el límite mínimo de stock.\n\n📉 *Stock Actual:* ${currentStock} ${unitLabel}\n⚙️ *Stock Mínimo:* ${minStock} ${unitLabel}\n\nPor favor, reponer stock a la brevedad.`;

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url);
    if (response.ok) {
      console.log(`📲 Alerta enviada correctamente por WhatsApp a ${phone} para: ${productName}`);
    } else {
      console.error('❌ Error al enviar mensaje por CallMeBot:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Error de conexión al enviar alerta de WhatsApp:', error.message);
  }
};

const initWhatsApp = () => {
  console.log('✅ Servicio de alertas de WhatsApp activo vía CallMeBot API.');
};

const getQrCodeDataUrl = () => null;
const getIsReady = () => true;

module.exports = {
  initWhatsApp,
  sendStockAlert,
  getQrCodeDataUrl,
  getIsReady
};