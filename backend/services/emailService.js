const { Resend } = require('resend');

// Inicializa Resend con la API Key guardada en las variables de entorno
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía el comprobante de pago por correo electrónico al cliente usando Resend
 */
const enviarFacturaEmail = async (toEmail, invoiceDetails) => {
  if (!toEmail) return;

  try {
    const data = await resend.emails.send({
      from: 'MG Panadería <onboarding@resend.dev>', // Dominio por defecto para pruebas de Resend
      to: [toEmail],
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
    });

    console.log(`📧 Mail enviado con éxito a ${toEmail}:`, data);
  } catch (err) {
    console.error('❌ Error al enviar el email con Resend:', err);
  }
};

module.exports = { enviarFacturaEmail };