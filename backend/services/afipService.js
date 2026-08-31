const Afip = require('@afipsdk/afip.js');
const fs = require('fs');
const path = require('path');

// Obtener clave privada (desde variable de entorno o archivo local)
const getKey = () => {
  if (process.env.AFIP_KEY) return process.env.AFIP_KEY;
  const keyPath = path.join(__dirname, '../certs/privada.key');
  return fs.existsSync(keyPath) ? fs.readFileSync(keyPath, 'utf8') : '';
};

// Obtener certificado (desde variable de entorno o archivo local)
const getCert = () => {
  if (process.env.AFIP_CERT) return process.env.AFIP_CERT;
  const certPath = path.join(__dirname, '../certs/certificado.crt');
  return fs.existsSync(certPath) ? fs.readFileSync(certPath, 'utf8') : '';
};

const afip = new Afip({
  CUIT: parseInt(process.env.AFIP_CUIT || '20394845125', 10),
  production: process.env.AFIP_PRODUCTION === 'true',
  key: getKey(),
  cert: getCert()
});

/**
 * Emite una Factura C en ARCA (AFIP)
 */
const emitirFacturaC = async ({ amount, docType = 99, docNum = 0, clientName = '' }) => {
  try {
    const ptoVta = parseInt(process.env.AFIP_POS || '2', 10);
    const cbteTipo = 11; // 11 = Factura C

    // Obtener el último número de comprobante emitido
    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(ptoVta, cbteTipo);
    const nextVoucher = lastVoucher + 1;

    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

    const voucherData = {
      CantReg: 1,
      PtoVta: ptoVta,
      CbteTipo: cbteTipo,
      Concepto: 1, // 1 = Productos
      DocTipo: docType, // 99 = Consumidor Final (sin DNI)
      DocNro: docNum, // 0 si es 99
      CbteDesde: nextVoucher,
      CbteHasta: nextVoucher,
      CbteFch: dateStr,
      ImpTotal: amount,
      ImpTotConc: 0,
      ImpNeto: amount,
      ImpOpEx: 0,
      ImpTrib: 0,
      ImpIVA: 0,
      FchServ: dateStr,
      FchVtoPago: dateStr,
      MonId: 'PES',
      MonCotiz: 1
    };

    const res = await afip.ElectronicBilling.createVoucher(voucherData);

    return {
      success: true,
      cae: res.CAE,
      caeVto: res.CAEFchVto,
      cbteNro: nextVoucher,
      ptoVta
    };
  } catch (error) {
    console.error('❌ Error en ARCA/AFIP:', error);
    throw new Error(error.message || 'Error al autorizar el comprobante en ARCA');
  }
};

module.exports = { emitirFacturaC };