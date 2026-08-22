import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

// Importaciones de Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

// Estilos de Swiper
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const getCleanApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'https://luisinnapilcheria-api.onrender.com/api';

  if ((url.match(/https?:\/\//g) || []).length > 1) {
    const parts = url.split(/(?=https?:\/\/)/);
    url = parts[parts.length - 1];
  }

  url = url.replace(/[\[\]\(\)'"]/g, '').trim().replace(/\/+$/, '');

  if (!url.endsWith('/api')) {
    url += '/api';
  }

  return url;
};

const API_URL = getCleanApiUrl();

const SafeImage = ({ src, alt, className = "", fit = "cover" }) => {
  const [error, setError] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  if (error || !src) {
    return (
      <div className={`bg-rose-50 flex flex-col items-center justify-center text-stone-400 text-[10px] sm:text-xs select-none rounded-xs border border-rose-100 ${className}`}>
        <span className="text-xl sm:text-2xl mb-1">👗</span>
        <span>Sin foto</span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden relative w-full h-full flex items-center justify-center bg-stone-100/50 ${className}`}>
      <img
        src={src}
        alt={alt}
        onError={() => setError(true)}
        onLoad={(e) => {
          if (e.target.naturalHeight > e.target.naturalWidth) {
            setIsPortrait(true);
          }
        }}
        className={`w-full h-full ${
          isPortrait ? 'object-contain p-1' : fit === 'contain' ? 'object-contain' : 'object-cover'
        } object-center transition-transform duration-300 group-hover:scale-105`}
        loading="lazy"
      />
    </div>
  );
};

const logoModules = import.meta.glob('../assets/logo.*', { eager: true });
const logoImg = Object.values(logoModules)[0]?.default || '';

const chunkArray = (array, chunkSize) => {
  if (!array || array.length === 0) return [];
  const results = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    results.push(array.slice(i, i + chunkSize));
  }
  return results;
};

export default function Home() {
  const [latestProducts, setLatestProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();
  const searchContainerRef = useRef(null);

  // TÍTULO DE LA PESTAÑA DEL NAVEGADOR
  useEffect(() => {
    document.title = "Luisinna Pilcheria";
  }, []);

  // CARGAR PRODUCTOS DESDE LA API
  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar productos');
        return res.json();
      })
      .then((data) => {
        setAllProducts(data);
        const recentSix = [...data].reverse().slice(0, 6);
        setLatestProducts(recentSix);
      })
      .catch((err) => console.warn("Aviso productos:", err.message));
  }, []);

  // ROTACIÓN AUTOMÁTICA EN ÚLTIMOS LANZAMIENTOS
  useEffect(() => {
    if (latestProducts.length <= 3) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % latestProducts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [latestProducts]);

  const visibleProducts = latestProducts.length > 0
    ? Array.from({ length: Math.min(3, latestProducts.length) }, (_, i) => 
        latestProducts[(currentIndex + i) % latestProducts.length]
      )
    : [];

  // GRUPOS DE 5 PRODUCTOS PARA EL CARRETE DE EXTREMO A EXTREMO
  const productsWithImages = allProducts.filter((p) => p.image);
  const photoGroups = chunkArray(productsWithImages, 5);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim().length > 0) {
      const filtered = allProducts.filter((product) =>
        product.name?.toLowerCase().includes(value.toLowerCase()) ||
        product.category?.toLowerCase().includes(value.toLowerCase()) ||
        product.description?.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filtered);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const goToCatalogo = (category = '') => {
    setShowDropdown(false);
    if (category) {
      navigate(`/catalogo?categoria=${encodeURIComponent(category)}`);
    } else {
      navigate('/catalogo');
    }
  };

  const handleSelectProduct = (productId) => {
    setShowDropdown(false);
    setSearchTerm('');
    navigate(`/catalogo?producto=${productId}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowDropdown(false);
    if (searchTerm.trim()) {
      navigate(`/catalogo?busqueda=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/catalogo');
    }
  };

  const handleAddProduct = (item) => {
    if (item.variants && item.variants.length > 0) {
      navigate(`/catalogo?producto=${item._id}`);
      return;
    }

    const price = item.priceRetail || item.price || 0;
    addToCart({ ...item, price }, 1, null);
    alert(`🛒 ¡"${item.name}" agregado al carrito!`);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans antialiased relative">

      {/* 0. BARRA SUPERIOR DE ANUNCIOS */}
      <div className="bg-stone-900 text-rose-100 py-2 px-4 text-center text-[10px] md:text-xs font-medium tracking-wider uppercase flex justify-center items-center gap-6">
        <div className="flex items-center gap-1.5">
          <span>💸</span>
          <span>
            <strong>15% OFF</strong> con transferencia en cada prenda
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-rose-200">
          <span>👑</span>
          <span>Envíos a todo el país</span>
        </div>
      </div>

      {/* 1. HEADER & NAVBAR CON BUSCADOR */}
      <header className="sticky top-0 z-50 border-b border-rose-200/60 shadow-xs" style={{ backgroundColor: '#fce4ec' }}>
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex justify-between items-center gap-4">
          
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => navigate('/')}>
            {logoImg && (
              <img 
                src={logoImg} 
                alt="Logo Luisinna" 
                className="h-20 md:h-28 w-auto object-contain mix-blend-multiply -my-2" 
              />
            )}
            <div className="text-lg md:text-2xl font-light tracking-[0.25em] text-stone-900 uppercase">
              LUISINNA <span className="font-semibold text-rose-900">PILCHERIA</span>
            </div>
          </div>
          
          {/* BUSCADOR OPERATIVO */}
          <div className="w-full max-w-xs md:max-w-md relative" ref={searchContainerRef}>
            <form 
              onSubmit={handleSearchSubmit} 
              className="flex items-center border border-rose-300 rounded-xs px-3 py-1.5 bg-white shadow-2xs focus-within:ring-1 focus-within:ring-stone-900 transition"
            >
              <input 
                type="text" 
                placeholder="Buscar remeras, vestidos, pantalones..." 
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => searchTerm.trim().length > 0 && setShowDropdown(true)}
                className="w-full bg-transparent focus:outline-none text-xs text-stone-700 placeholder-stone-400" 
              />
              <button type="submit" className="text-stone-500 text-xs hover:text-stone-900 transition ml-1" title="Buscar">
                🔍
              </button>
            </form>

            {/* DESPLEGABLE CON RESULTADOS */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-rose-200 shadow-xl rounded-xs z-50 max-h-64 overflow-y-auto divide-y divide-rose-50">
                {searchResults.length > 0 ? (
                  searchResults.map((product) => (
                    <div
                      key={product._id}
                      onClick={() => handleSelectProduct(product._id)}
                      className="flex items-center gap-3 p-2 hover:bg-rose-50/60 cursor-pointer transition"
                    >
                      {product.image && (
                        <div className="w-9 h-9 shrink-0 overflow-hidden rounded-xs border border-rose-100 bg-rose-50/30 flex items-center justify-center">
                          <SafeImage src={product.image} alt={product.name} fit="cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-stone-800 truncate uppercase">{product.name}</p>
                        <p className="text-[10px] text-stone-400 uppercase tracking-wider">{product.category || 'Indumentaria'}</p>
                      </div>
                      <span className="text-xs font-semibold text-stone-900 shrink-0">
                        ${(product.priceRetail || product.price || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-stone-400">
                    No se encontraron prendas con "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* MENÚ DE NAVEGACIÓN */}
        <nav className="border-t border-rose-200/50 max-w-6xl mx-auto px-6 py-2 flex justify-center space-x-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-700">
          <button onClick={() => goToCatalogo()} className="hover:text-rose-900 transition pb-0.5 border-b-2 border-transparent hover:border-stone-900 cursor-pointer">
            Ver Todo el Catálogo
          </button>
          <button onClick={() => {
            const el = document.getElementById('ultimos-lanzamientos');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }} className="hover:text-rose-900 transition pb-0.5 border-b-2 border-transparent hover:border-stone-900 cursor-pointer">
            Últimas Novedades
          </button>
        </nav>
      </header>

      {/* 2. HERO BANNER */}
      <section className="w-full bg-stone-100 pt-2 pb-6 border-b border-rose-200/40 shadow-inner">
        <div className="w-full px-0">
          
          {photoGroups.length > 0 ? (
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              speed={1100}
              autoplay={{
                delay: 3800,
                disableOnInteraction: false,
              }}
              loop={photoGroups.length > 1}
              pagination={{ clickable: true }}
              navigation={true}
              className="w-full"
            >
              {photoGroups.map((group, groupIndex) => (
                <SwiperSlide key={groupIndex} className="pb-6">
                  <div className="grid grid-cols-5 gap-0.5 sm:gap-1 h-64 sm:h-80 md:h-[420px] w-full overflow-hidden shadow-xs bg-stone-200 border-y border-stone-200">
                    {group.map((product) => (
                      <div 
                        key={product._id} 
                        onClick={() => handleSelectProduct(product._id)}
                        className="relative w-full h-full overflow-hidden group cursor-pointer border-r border-stone-200 last:border-r-0 bg-white"
                      >
                        <SafeImage 
                          src={product.image} 
                          alt={product.name} 
                          fit="cover" 
                          className="w-full h-full transform group-hover:scale-105 transition duration-700 ease-in-out"
                        />
                        <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-stone-900/0 transition duration-300 pointer-events-none" />
                      </div>
                    ))}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="h-64 sm:h-80 bg-white border-y border-stone-200 flex items-center justify-center text-stone-400 text-xs uppercase tracking-widest">
              Aún no hay productos cargados con foto en el catálogo
            </div>
          )}

          <div className="text-center space-y-2 pt-4 px-4 max-w-3xl mx-auto">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-rose-800 block">
              Moda & Estilo Femenino
            </span>
            <h1 className="text-xl md:text-3xl font-light tracking-wide text-stone-900 uppercase">
              Diseños Exclusivos para tu Día a Día
            </h1>
            <p className="text-xs text-stone-600 max-w-md mx-auto font-light">
              Elegancia, comodidad y tendencia en cada prenda. Descubrí lo nuevo de nuestra colección.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => goToCatalogo()}
                className="inline-block bg-stone-900 text-white text-[10px] font-medium tracking-[0.25em] uppercase px-8 py-3 hover:bg-stone-800 transition shadow-xs cursor-pointer"
              >
                Explorar Colección
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 3. ÚLTIMOS LANZAMIENTOS */}
      <section id="ultimos-lanzamientos" className="max-w-4xl mx-auto px-6 py-8 scroll-mt-24">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse"></span>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-stone-500">
            Últimos Lanzamientos
          </h2>
        </div>
        
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 transition-all duration-700 ease-in-out">
            {visibleProducts.map((item) => (
              <div key={item._id} className="bg-white border border-rose-100 p-3 rounded-xs relative flex flex-col justify-between shadow-2xs hover:border-rose-300 transition duration-300 group">
                
                <span className="absolute top-2.5 right-2.5 z-10 bg-rose-500 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-xs uppercase tracking-wider">
                  Nuevo
                </span>

                <div className="relative h-44 sm:h-48 w-full bg-stone-50 p-1 rounded-xs mb-3 overflow-hidden border border-stone-100 flex items-center justify-center cursor-pointer" onClick={() => handleSelectProduct(item._id)}>
                  <SafeImage src={item.image} alt={item.name} fit="cover" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-[11px] font-medium tracking-wider text-stone-700 uppercase truncate cursor-pointer" title={item.name} onClick={() => handleSelectProduct(item._id)}>
                    {item.name}
                  </h3>
                  <p className="text-xs font-semibold text-stone-900 pb-0.5">
                    ${(item.priceRetail || item.price || 0).toLocaleString('es-AR')}
                  </p>
                  <button 
                    onClick={() => handleAddProduct(item)}
                    className="w-full bg-stone-900 text-white py-2 text-[9px] font-medium uppercase tracking-[0.15em] hover:bg-stone-800 transition rounded-none cursor-pointer"
                  >
                    {item.variants && item.variants.length > 0 ? 'Ver Opciones / Elegir Talle' : 'Agregar al Carrito'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-stone-400 uppercase tracking-widest border border-dashed border-stone-200">
            Cargando últimos productos...
          </div>
        )}
      </section>

      {/* 4. FOOTER */}
      <footer className="bg-stone-100 border-t border-stone-200 text-xs">
        <div className="bg-stone-900 text-stone-100 py-6 px-6">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛍️</span>
              <div>
                <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-rose-200">
                  Descuento Exclusivo
                </h3>
                <p className="text-xs text-stone-300 font-light mt-0.5">
                  Aprovechá un <span className="text-white font-semibold underline underline-offset-2">15% OFF</span> abonando con transferencia bancaria en cada prenda.
                </p>
              </div>
            </div>
            <button 
              onClick={() => goToCatalogo()} 
              className="bg-rose-100 text-stone-900 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-white transition shrink-0 cursor-pointer"
            >
              Ir al Catálogo
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-stone-600 font-light">
          <div className="space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-stone-900 text-[10px]">Atención al Cliente</h4>
            <p className="flex items-center gap-2">
              📞 <a href="https://wa.me/5493482202857" target="_blank" rel="noreferrer" className="hover:text-stone-900 transition">+54 9 3482 20-2857</a>
            </p>
            <p className="flex items-center gap-2">
              ✉️ <a href="mailto:luisinnapilcheria@gmail.com" className="hover:text-stone-900 transition">luisinnapilcheria@gmail.com</a>
            </p>
            <p className="flex items-center gap-2">
              🚚 Envíos a todo el país
            </p>
          </div>

          <div className="md:text-right space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-stone-900 text-[10px]">Seguinos en Redes</h4>
            <p className="text-xs text-stone-500">
              @luisinnapilcheria
            </p>
          </div>
        </div>

        {/* PIE DE PÁGINA INFERIOR CON LOS 3 BOTONES / ENLACES */}
        <div className="border-t border-stone-200 py-6 text-center text-[9px] text-stone-400 tracking-wider space-y-3 px-4">
          
          {/* TRES BOTONES LEGALES DE ABAJO */}
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-[10px] uppercase font-semibold text-stone-600">
            <Link to="/terminos" className="hover:text-stone-900 transition underline underline-offset-2">
              Términos y Condiciones
            </Link>
            <span className="text-stone-300">•</span>
            <Link to="/privacidad" className="hover:text-stone-900 transition underline underline-offset-2">
              Política de Privacidad
            </Link>
            <span className="text-stone-300">•</span>
            <Link to="/arrepentimiento" className="text-rose-800 hover:text-rose-900 transition underline underline-offset-2 font-bold">
              Botón de Arrepentimiento
            </Link>
          </div>

          <div>
            © {new Date().getFullYear()} LUISINNA PILCHERIA. TODOS LOS DERECHOS RESERVADOS.
          </div>

          <div className="text-[10px] font-medium text-stone-500 flex items-center justify-center gap-1">
            <span>Desarrollado con</span>
            <span className="inline-block select-none">
              💗
            </span>
            <span>por</span>
            <a 
              href="https://www.instagram.com/gs.tech.argentina" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-stone-800 font-bold tracking-widest hover:text-rose-900 transition underline underline-offset-2"
            >
              GS Tech
            </a>
          </div>
        </div>
      </footer>

      {/* 5. BOTONES FLOTANTES LATERALES */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {/* Botón Instagram */}
        <a 
          href="https://www.instagram.com/luisinnapilcheria" 
          target="_blank" 
          rel="noreferrer" 
          title="Seguinos en Instagram"
          className="bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white w-12 h-12 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 flex items-center justify-center"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </a>

        {/* Botón WhatsApp */}
        <a 
          href="https://wa.me/5493482202857" 
          target="_blank" 
          rel="noreferrer" 
          title="Enviar WhatsApp"
          className="bg-stone-900 text-white w-12 h-12 rounded-full shadow-lg hover:bg-stone-800 hover:scale-110 transition duration-300 flex items-center justify-center text-lg border border-stone-700"
        >
          💬
        </a>
      </div>

    </div>
  );
}