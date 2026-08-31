const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Envia el comprobante de pago por correo electronico al cliente
 */
const enviarFacturaEmail = async (toEmail, invoiceDetails) => {
  if (!toEmail) return;

  const mailOptions = {
    from: `"MG Panadería" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Tu comprobante de compra - Factura C N° ${invoiceDetails.ptoVta}-${invoiceDetails.cbteNro}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #dc2626; text-align: center;">MG Panadería y Confitería</h2>
        <p>¡Hola! Muchas gracias por tu compra.</p>
        <p>Te enviamos el detalle de tu comprobante electrónico emitido ante ARCA (AFIP):</p>
        <div style="background-color: #f9fafb; padding: 12px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 4px 0;"><b>Comprobante:</b> Factura C N° ${invoiceDetails.ptoVta}-${invoiceDetails.cbteNro}</p>
          <p style="margin: 4px 0;"><b>CAE:</b> ${invoiceDetails.cae}</p>
          <p style="margin: 4px 0;"><b>Monto Total:</b> $${invoiceDetails.amount}</p>
        </div>
        <p style="font-size: 0.85rem; color: #6b7280; text-align: center;">¡Esperamos verte pronto!</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Mail enviado con éxito a ${toEmail}`);
  } catch (err) {
    console.error('❌ Error al enviar el email:', err);
  }
};

module.exports = { enviarFacturaEmail };