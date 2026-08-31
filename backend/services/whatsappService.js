const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

let client;
let isReady = false;
let qrCodeDataUrl = null;

const getExecutablePath = () => {
  try {
    const pPath = puppeteer.executablePath();
    if (pPath && fs.existsSync(pPath)) return pPath;
  } catch (e) {
    // Si falla continua
  }

  const linuxPaths = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome-stable'
  ];

  for (const p of linuxPaths) {
    if (fs.existsSync(p)) return p;
  }

  return undefined;
};

const initWhatsApp = () => {
  // Directorio con permisos de escritura temporales en la nube
  const authPath = process.env.NODE_ENV === 'production' 
    ? path.join('/tmp', 'whatsapp_auth') 
    : path.join(__dirname, '../whatsapp_auth');

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: authPath }),
    puppeteer: {
      headless: true,
      executablePath: getExecutablePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
        '--no-default-browser-check'
      ]
    }
  });

  client.on('qr', async (qr) => {
    try {
      qrCodeDataUrl = await QRCode.toDataURL(qr, { margin: 2, width: 400 });
    } catch (err) {
      console.error('Error al generar DataURL del QR:', err);
    }

    console.log('\n==================================================');
    console.log('📱 CÓDIGO QR GENERADO');
    console.log('👉 Entrá a: https://panaderia-2syo.onrender.com/qr para escanearlo');
    console.log('==================================================\n');

    qrcodeTerminal.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('✅ Bot de WhatsApp conectado y listo para enviar alertas!');
    isReady = true;
    qrCodeDataUrl = null;
  });

  client.on('authenticated', () => {
    console.log('🔐 Sesión de WhatsApp autenticada correctamente.');
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación en WhatsApp:', msg);
    isReady = false;
  });

  client.on('disconnected', (reason) => {
    console.warn('⚠️ Bot de WhatsApp desconectado:', reason);
    isReady = false;
    // Intenta reiniciar si se desconecta
    setTimeout(() => {
      console.log('🔄 Reiniciando cliente de WhatsApp...');
      client.initialize();
    }, 5000);
  });

  client.initialize().catch(err => {
    console.error('🔥 Error al inicializar Puppeteer/WhatsApp:', err.message);
  });
};

const sendStockAlert = async (productName, currentStock, minStock, unitLabel) => {
  if (!isReady) {
    console.warn('⚠️ No se envió la alerta de WhatsApp: El bot no está conectado.');
    return;
  }

  const phone = process.env.ALERT_PHONE_NUMBER;
  if (!phone) {
    console.warn('⚠️ Falta configurar ALERT_PHONE_NUMBER en las variables de entorno.');
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

const getQrCodeDataUrl = () => qrCodeDataUrl;
const getIsReady = () => isReady;

module.exports = {
  initWhatsApp,
  sendStockAlert,
  getQrCodeDataUrl,
  getIsReady
};