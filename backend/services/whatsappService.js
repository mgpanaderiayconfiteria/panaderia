const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client;
let isReady = false;

const initWhatsApp = () => {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp_auth' }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', (qr) => {
    console.log('📱 ESCANEA ESTE CÓDIGO QR CON WHATSAPP PARA VINCULAR EL BOT:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('✅ Bot de WhatsApp conectado y listo para enviar alertas!');
    isReady = true;
  });

  client.on('disconnected', (reason) => {
    console.warn('⚠️ Bot de WhatsApp desconectado:', reason);
    isReady = false;
  });

  client.initialize();
};

const sendStockAlert = async (productName, currentStock, minStock, unitLabel) => {
  if (!isReady) {
    console.warn('⚠️ No se envió la alerta de WhatsApp: El bot no está conectado.');
    return;
  }

  const phone = process.env.ALERT_PHONE_NUMBER;
  if (!phone) {
    console.warn('⚠️ Falta configurar ALERT_PHONE_NUMBER en el archivo .env');
    return;
  }

  const formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`;
  const message = `⚠️ *ALERTA DE STOCK BAJO* ⚠️\n\nEl producto *${productName}* alcanzó el límite mínimo de stock.\n\n📉 *Stock Actual:* ${currentStock} ${unitLabel}\n⚙️ *Stock Mínimo:* ${minStock} ${unitLabel}\n\nPor favor, reponer stock a la brevedad.`;

  try {
    await client.sendMessage(formattedPhone, message);
    console.log(`📲 Alerta enviada a WhatsApp (${phone}) para el producto: ${productName}`);
  } catch (error) {
    console.error('❌ Error al enviar mensaje por WhatsApp:', error.message);
  }
};

module.exports = {
  initWhatsApp,
  sendStockAlert
};