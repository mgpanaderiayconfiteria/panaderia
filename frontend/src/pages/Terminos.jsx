import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Terminos() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Términos y Condiciones - Luisinna Pilcheria";
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
            Términos y Condiciones de Uso
          </h1>
          <p className="text-[10px] sm:text-xs text-stone-400 mt-1">
            Última actualización: Agosto de {new Date().getFullYear()}
          </p>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-stone-600">
          
          <p>
            Bienvenido/a a la tienda virtual de <strong>Luisinna Pilcheria</strong>. Al utilizar nuestro sitio web y realizar compras en nuestra tienda, aceptás estar sujeto a los siguientes términos y condiciones.
          </p>

          <section>
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              1. Condiciones Generales
            </h2>
            <p>
              Nos reservamos el derecho de modificar o actualizar estos términos en cualquier momento. Nos comprometemos a ofrecer prendas de indumentaria femenina de calidad y la máxima transparencia en la información brindada.
            </p>
          </section>

          <section>
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              2. Precios y Promociones
            </h2>
            <p>
              Todos los precios informados en el sitio están expresados en Pesos Argentinos (ARS) e incluyen impuestos cuando corresponda. Nos reservamos el derecho de modificar precios, promociones o descuentos (como el beneficio del 15% OFF abonando por transferencia) sin previo aviso.
            </p>
          </section>

          <section>
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              3. Envíos y Entregas
            </h2>
            <p>
              Realizamos envíos a todo el país a través de empresas de transporte de confianza. Los plazos de entrega son estimados e informados al momento de confirmar el despacho. Luisinna Pilcheria no se responsabiliza por demoras ajenas derivadas de las empresas de correo.
            </p>
          </section>

          <section>
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              4. Cambios y Devoluciones
            </h2>
            <p>
              Las prendas pueden cambiarse dentro de los plazos fijados por la tienda, siempre que se encuentren sin uso, en perfectas condiciones y con sus respectivas etiquetas. Los costos de envío originados por cambios de talle o modelo corren por cuenta del cliente, salvo fallas de fabricación.
            </p>
          </section>

          <section>
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              5. Botón de Arrepentimiento
            </h2>
            <p>
              En cumplimiento con la Ley de Defensa del Consumidor, podés solicitar la revocación de la compra dentro de los 10 días corridos de recibida la prenda a través de nuestro formulario en la sección <strong>Botón de Arrepentimiento</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              6. Propiedad Intelectual
            </h2>
            <p>
              Todos los contenidos presentes en esta plataforma (marcas, logotipos, imágenes, textos y código fuente) son propiedad exclusiva de <strong>Luisinna Pilcheria</strong> o cuentan con la correspondiente autorización. Queda prohibida su reproducción o redistribución sin autorización expresa.
            </p>
          </section>

          <section>
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              7. Contacto
            </h2>
            <p>
              Ante cualquier consulta o reclamo relativo a estos Términos y Condiciones, podés comunicarte con nuestro equipo vía email a <a href="mailto:luisinnapilcheria@gmail.com" className="text-rose-800 underline">luisinnapilcheria@gmail.com</a> o por WhatsApp al +54 9 3482 20-2857.
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