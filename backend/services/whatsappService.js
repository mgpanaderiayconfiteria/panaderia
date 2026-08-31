const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer');
const fs = require('fs');

let client;
let isReady = false;

const getExecutablePath = () => {
  // Intentar la ruta auto-detectada por puppeteer
  try {
    const pPath = puppeteer.executablePath();
    if (pPath && fs.existsSync(pPath)) return pPath;
  } catch (e) {
    // Si falla continua a las rutas por defecto
  }

  // Rutas habituales de Chromium en entornos Linux / Render
  const linuxPaths = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome-stable'
  ];

  for (const path of linuxPaths) {
    if (fs.existsSync(path)) return path;
  }

  return puppeteer.executablePath();
};

const initWhatsApp = () => {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp_auth' }),
    puppeteer: {
      headless: true,
      executablePath: getExecutablePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
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