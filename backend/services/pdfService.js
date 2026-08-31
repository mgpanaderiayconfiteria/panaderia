const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Genera el PDF de la Factura C con QR de ARCA/AFIP
 * @param {Object} sale - Objeto completo de la venta procesada
 * @returns {Promise<Buffer>} Buffer del PDF generado
 */
const generateInvoicePDF = (sale) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // -------------------------------------------------------------
      // DATOS DE LA EMPRESA / EMISOR (Modificar con los datos reales)
      // -------------------------------------------------------------
      const emisor = {
        razonSocial: 'GS TECH S.R.L.',
        cuit: '30-12345678-9',
        condicionIva: 'Responsable Monotributo',
        direccion: 'San Miguel, Buenos Aires',
        inicioActividades: '01/01/2026'
      };

      // --- ENCABEZADO Y RECUADRO FACTURA C ---
      doc.rect(40, 40, 515, 120).stroke();
      
      // Letra "C" Comprobante
      doc.rect(272, 40, 50, 40).fillAndStroke('#ffffff', '#000000');
      doc.fillColor('#000000').fontSize(24).font('Helvetica-Bold').text('C', 290, 48);
      doc.fontSize(8).font('Helvetica').text('COD. 011', 282, 70);

      // Datos Emisor (Izquierda)
      doc.fontSize(14).font('Helvetica-Bold').text(emisor.razonSocial, 55, 55);
      doc.fontSize(9).font('Helvetica')
         .text(`Razon Social: ${emisor.razonSocial}`, 55, 75)
         .text(`Domicilio Comercial: ${emisor.direccion}`, 55, 90)
         .text(`Condición frente al IVA: ${emisor.condicionIva}`, 55, 105);

      // Datos Comprobante (Derecha)
      const fechaVenta = new Date(sale.timestamp || Date.now()).toLocaleDateString('es-AR');
      doc.fontSize(14).font('Helvetica-Bold').text('FACTURA', 340, 55);
      doc.fontSize(9).font('Helvetica')
         .text(`Punto de Venta: 00001   Comp. Nro: ${String(sale.invoiceNumber || 1).padStart(8, '0')}`, 340, 75)
         .text(`Fecha de Emisión: ${fechaVenta}`, 340, 90)
         .text(`CUIT: ${emisor.cuit}`, 340, 105)
         .text(`Inicio de Actividades: ${emisor.inicioActividades}`, 340, 120);

      // --- DATOS DEL CLIENTE ---
      doc.rect(40, 165, 515, 45).stroke();
      doc.fontSize(9).font('Helvetica-Bold').text('DATOS DEL RECEPTOR', 50, 172);
      doc.font('Helvetica')
         .text(`Nombre / Razón Social: ${sale.clientName || 'Consumidor Final'}`, 50, 188)
         .text(`DNI / CUIT: ${sale.clientDocNum || '0'}`, 300, 188)
         .text(`Condición de IVA: Consumidor Final`, 50, 198)
         .text(`Forma de Pago: ${sale.paymentMethod === 'digital' ? 'Mercado Pago / Transferencia' : 'Efectivo'}`, 300, 198);

      // --- TABLA DE ITEMS ---
      let y = 220;
      doc.rect(40, y, 515, 20).fill('#e5e7eb').stroke();
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9);
      doc.text('Producto / Descripción', 50, y + 6);
      doc.text('Cant.', 330, y + 6, { width: 40, align: 'right' });
      doc.text('Precio Unit.', 390, y + 6, { width: 70, align: 'right' });
      doc.text('Subtotal', 470, y + 6, { width: 75, align: 'right' });

      y += 25;
      doc.font('Helvetica').fontSize(9);

      sale.items.forEach((item) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        
        const cantTexto = item.mode === 'weight' ? `${(item.quantity / 1000).toFixed(2)} kg` : `${item.quantity}`;
        
        doc.text(item.name, 50, y, { width: 270 });
        doc.text(cantTexto, 330, y, { width: 40, align: 'right' });
        doc.text(`$${parseFloat(item.price).toFixed(2)}`, 390, y, { width: 70, align: 'right' });
        doc.text(`$${parseFloat(item.subtotal).toFixed(2)}`, 470, y, { width: 75, align: 'right' });
        
        y += 18;
      });

      // --- TOTALES ---
      y = Math.max(y + 10, 620);
      doc.rect(40, y, 515, 40).stroke();
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('TOTAL:', 380, y + 14);
      doc.fontSize(14).text(`$${parseFloat(sale.total).toFixed(2)}`, 450, y + 12, { width: 95, align: 'right' });

      // --- PIE DE PÁGINA: QR AFIP/ARCA Y CAE ---
      const footerY = y + 50;

      // Estructura JSON Oficial de ARCA/AFIP para el QR
      const qrData = JSON.stringify({
        ver: 1,
        fecha: fechaVenta,
        cuit: parseInt(emisor.cuit.replace(/-/g, '')),
        ptoVta: 1,
        tipoCmp: 11, // 11 = Factura C
        nroCmp: sale.invoiceNumber || 1,
        importe: sale.total,
        moneda: 'PES',
        ctz: 1,
        tipoDocRec: sale.clientDocNum && sale.clientDocNum !== '0' ? 96 : 99,
        nroDocRec: parseInt(sale.clientDocNum || 0),
        tipoCodAut: 'E',
        codAut: sale.cae || 74012345678901 // CAE recibido de AFIP
      });

      // Base64 requerido por el estándar AFIP
      const qrBase64 = Buffer.from(qrData).toString('base64');
      const afipUrl = `https://www.afip.gob.ar/fe/qr/?p=${qrBase64}`;
      const qrImageBuffer = await QRCode.toBuffer(afipUrl, { margin: 1, width: 90 });

      // Dibujar QR y Datos Oficiales CAE
      doc.image(qrImageBuffer, 45, footerY, { width: 85 });
      
      doc.font('Helvetica-Bold').fontSize(9).text('ARCA / AFIP', 140, footerY + 10);
      doc.font('Helvetica').fontSize(8).text('Comprobante Autorizado Electrónicamente', 140, footerY + 23);

      doc.font('Helvetica-Bold').fontSize(9)
         .text(`CAE: ${sale.cae || '74012345678901'}`, 360, footerY + 10)
         .text(`Vencimiento CAE: ${sale.caeFchVto || fechaVenta}`, 360, footerY + 25);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };