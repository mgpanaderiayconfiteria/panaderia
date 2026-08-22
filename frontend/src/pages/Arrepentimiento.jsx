import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Arrepentimiento() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    numeroOrden: '',
    motivo: '',
    metodo: 'whatsapp' // 'whatsapp' o 'email'
  });
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Botón de Arrepentimiento - Luisinna Pilcheria";
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Reemplazá TU_ENDPOINT_DE_FORMSPREE con el ID que te da Formspree
    const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqpzyvvl"; 
    const TELEFONO_WHATSAPP = "5493482202857";

    if (formData.metodo === 'whatsapp') {
      // OPCIÓN 1: ENVÍO POR WHATSAPP
      const mensajeWA = `Hola! Quiero solicitar la revocación de mi compra (Botón de Arrepentimiento):%0A%0A` +
        `• *Nombre:* ${formData.nombre}%0A` +
        `• *Email:* ${formData.email}%0A` +
        `• *Teléfono:* ${formData.telefono}%0A` +
        `• *N° de Orden/Pedido:* ${formData.numeroOrden || 'No especificado'}%0A` +
        `• *Motivo/Comentario:* ${formData.motivo || 'Sin detalles adicionales'}`;

      window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${mensajeWA}`, '_blank');
      setLoading(false);
      setEnviado(true);
    } else {
      // OPCIÓN 2: ENVÍO POR EMAIL (FORMSPREE)
      try {
        const response = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: `⚠️ Solicitud de Arrepentimiento - Orden #${formData.numeroOrden || 'S/N'}`,
            Nombre: formData.nombre,
            Email: formData.email,
            Telefono: formData.telefono,
            Numero_Orden: formData.numeroOrden || 'No especificado',
            Motivo: formData.motivo || 'Sin detalles'
          })
        });

        if (response.ok) {
          setEnviado(true);
        } else {
          alert("Ocurrió un error al enviar la solicitud por correo. Por favor probá seleccionando WhatsApp.");
        }
      } catch (error) {
        console.error("Error al enviar por email:", error);
        alert("Error de conexión. Intentá enviar la solicitud por WhatsApp.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-2xl border border-rose-200 shadow-sm space-y-6">
        
        {/* ENCABEZADO */}
        <div className="border-b border-rose-100 pb-4 text-center sm:text-left">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-rose-800 hover:text-stone-900 font-semibold uppercase tracking-wider mb-2 inline-flex items-center gap-1 transition cursor-pointer"
          >
            ← Volver al inicio
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 uppercase tracking-wide">
            Botón de Arrepentimiento
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Conforme a la normativa vigente en Argentina (Ley N° 24.240 de Defensa del Consumidor), podés solicitar la revocación de tu compra dentro de los 10 días corridos contados a partir de la entrega del producto.
          </p>
        </div>

        {enviado ? (
          <div className="bg-rose-50 border border-rose-200 p-6 rounded-xl text-center space-y-3">
            <span className="text-4xl">✅</span>
            <h2 className="text-lg font-bold text-stone-900 uppercase">Solicitud Procesada</h2>
            <p className="text-xs text-stone-600">
              Hemos registrado tu pedido de arrepentimiento. Nos pondremos en contacto a la brevedad para coordinar la devolución de la prenda y el reingreso del importe.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-2 bg-stone-900 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl hover:bg-stone-800 transition cursor-pointer"
            >
              Volver a la Tienda
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            <div>
              <label className="block font-bold text-stone-700 uppercase mb-1">
                Nombre y Apellido *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: María García"
                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 bg-stone-50/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ejemplo@gmail.com"
                  className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 bg-stone-50/50"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="3482..."
                  className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 bg-stone-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase mb-1">
                N° de Orden o Pedido (opcional)
              </label>
              <input
                type="text"
                value={formData.numeroOrden}
                onChange={(e) => setFormData({ ...formData, numeroOrden: e.target.value })}
                placeholder="Ej: #1024"
                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 bg-stone-50/50"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase mb-1">
                Motivo o Comentarios (opcional)
              </label>
              <textarea
                rows="3"
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                placeholder="Indicanos brevemente el motivo de la cancelación..."
                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 bg-stone-50/50"
              />
            </div>

            {/* SELECCIÓN DE MÉTODO DE ENVÍO */}
            <div className="pt-2">
              <label className="block font-bold text-stone-700 uppercase mb-2">
                ¿Cómo querés enviar la solicitud?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, metodo: 'whatsapp' })}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition cursor-pointer ${
                    formData.metodo === 'whatsapp'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span>💬</span> WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, metodo: 'email' })}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition cursor-pointer ${
                    formData.metodo === 'email'
                      ? 'border-rose-600 bg-rose-50 text-rose-800 shadow-xs'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span>✉️</span> Correo (Gmail)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition active:scale-95 uppercase tracking-wider text-[11px] shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Procesando...' : `Enviar por ${formData.metodo === 'whatsapp' ? 'WhatsApp' : 'Correo'}`}
            </button>

          </form>
        )}

      </div>
    </div>
  );
}