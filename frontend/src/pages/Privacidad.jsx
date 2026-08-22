import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Privacidad() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Política de Privacidad - Luisinna Pilcheria";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans py-10 px-4 sm:px-6 overflow-y-scroll">
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-2xl border border-rose-200 shadow-sm space-y-6">
        
        {/* ENCABEZADO */}
        <div className="border-b border-rose-100 pb-4 text-center sm:text-left">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-rose-800 hover:text-stone-900 font-semibold uppercase tracking-wider mb-2 inline-flex items-center gap-1 transition cursor-pointer"
          >
            ← Volver al inicio
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 uppercase tracking-wide">
            Política de Privacidad
          </h1>
          <p className="text-[10px] sm:text-xs text-stone-400 mt-1">
            Última actualización: Agosto de {new Date().getFullYear()}
          </p>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-stone-600">
          
          <p>
            En <strong>Luisinna Pilcheria</strong>, accesible desde nuestro sitio web, una de nuestras principales prioridades es la privacidad de nuestros visitantes. Este documento de Política de Privacidad describe los tipos de información que recopilamos y cómo la utilizamos.
          </p>

          <section>
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              1. Información que Recopilamos
            </h2>
            <p>
              Recopilamos información personal necesaria para procesar tus pedidos y ofrecerte la mejor experiencia de compra de prendas e indumentaria femenina. Esto incluye:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>Nombre, apellido y datos de contacto (teléfono y correo electrónico).</li>
              <li>Dirección de envío y datos necesarios para la facturación.</li>
              <li>Información del pedido e historial de compras.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              2. Uso de la Información
            </h2>
            <p>
              Utilizamos la información recopilada para:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
              <li>Procesar, despachar y entregar tus pedidos de ropa.</li>
              <li>Comunicarnos vos respecto al estado de tus compras vía WhatsApp o correo electrónico.</li>
              <li>Brindar soporte y atención personalizada al cliente.</li>
              <li>Prevenir fraudes y garantizar la seguridad de nuestras operaciones.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              3. Herramientas de Analítica e Integraciones
            </h2>
            <p>
              Nuestra plataforma utiliza herramientas de análisis como <strong>Google Analytics / Google Tag Manager</strong> con el fin de comprender cómo los usuarios interactúan con la tienda y así mejorar de manera continua nuestros servicios y catálogo de moda.
            </p>
            <p className="mt-2">
              Estos proveedores externos pueden recolectar datos de navegación técnica según sus respectivas políticas de privacidad. Podés consultar más detalles en la <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-rose-700 underline hover:text-stone-900">Política de Privacidad de Google</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              4. Protección y Derechos del Usuario
            </h2>
            <p>
              De acuerdo con la Ley N° 25.326 de Protección de Datos Personales de la República Argentina, tenés derecho a acceder, rectificar o solicitar la eliminación de tus datos personales de nuestra base de datos poniéndote en contacto con nosotros a través de nuestras vías oficiales.
            </p>
          </section>

        </div>

        {/* PIE DE PÁGINA INTERNO */}
        <div className="border-t border-rose-100 pt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="bg-stone-900 text-white text-xs font-bold tracking-wider uppercase px-6 py-3 rounded-xl hover:bg-stone-800 transition active:scale-95 cursor-pointer shadow-sm"
          >
            Entendido / Volver a la Tienda
          </button>
        </div>

      </div>
    </div>
  );
}