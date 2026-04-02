import { useState } from 'react'

const categories = [
  'Todos',
  'Limpieza',
  'Utiles Escolares',
  'Hogar',
  'Cocina',
  'Descartables',
  'Cosmeticos',
]

const products = [
  { name: 'Detergente Industrial 15kg', category: 'Limpieza', price: 68.00, unit: 'saco', min: 10, img: 'https://images.unsplash.com/photo-1585441695325-21557f83020e?w=400&h=400&fit=crop' },
  { name: 'Lejia Concentrada 5L', category: 'Limpieza', price: 12.50, unit: 'bidon', min: 24, img: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop' },
  { name: 'Jabon Liquido 1L', category: 'Limpieza', price: 8.90, unit: 'und', min: 48, img: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop' },
  { name: 'Desinfectante Pino 5L', category: 'Limpieza', price: 14.00, unit: 'bidon', min: 12, img: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=400&h=400&fit=crop' },
  { name: 'Cuaderno A4 x100 hojas', category: 'Utiles Escolares', price: 3.20, unit: 'und', min: 100, img: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=400&fit=crop' },
  { name: 'Lapiceros Caja x50', category: 'Utiles Escolares', price: 18.00, unit: 'caja', min: 20, img: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=400&fit=crop' },
  { name: 'Colores x12 Caja', category: 'Utiles Escolares', price: 4.50, unit: 'caja', min: 50, img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop' },
  { name: 'Temperas Set x6', category: 'Utiles Escolares', price: 5.00, unit: 'set', min: 48, img: 'https://images.unsplash.com/photo-1560421683-6856ea585c78?w=400&h=400&fit=crop' },
  { name: 'Contenedor Hermetico x3', category: 'Cocina', price: 15.90, unit: 'pack', min: 24, img: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=400&fit=crop' },
  { name: 'Vaso Descartable x100', category: 'Descartables', price: 6.50, unit: 'paq', min: 50, img: 'https://images.unsplash.com/photo-1571942676516-bcab84649e44?w=400&h=400&fit=crop' },
  { name: 'Plato Descartable x50', category: 'Descartables', price: 8.00, unit: 'paq', min: 40, img: 'https://images.unsplash.com/photo-1610725954918-1e3e162e5fc4?w=400&h=400&fit=crop' },
  { name: 'Crema Corporal 500ml', category: 'Cosmeticos', price: 9.50, unit: 'und', min: 36, img: 'https://images.unsplash.com/photo-1556228720-195a672e68e0?w=400&h=400&fit=crop' },
  { name: 'Escoba Industrial', category: 'Limpieza', price: 11.00, unit: 'und', min: 24, img: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop' },
  { name: 'Organizador Plastico x5', category: 'Hogar', price: 24.90, unit: 'set', min: 12, img: 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=400&h=400&fit=crop' },
  { name: 'Mochila Escolar Reforzada', category: 'Utiles Escolares', price: 22.00, unit: 'und', min: 20, img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop' },
  { name: 'Shampoo 1L', category: 'Cosmeticos', price: 7.80, unit: 'und', min: 48, img: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=400&fit=crop' },
]

const WA = 'https://wa.me/51999999999'

export function LandingPage() {
  const [active, setActive] = useState('Todos')

  const filtered = active === 'Todos'
    ? products
    : products.filter((p) => p.category === active)

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Top bar */}
      <div className="bg-navy text-white">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
          <span className="text-slate-400">Lun - Sab: 7am a 6pm</span>
          <a href={WA} target="_blank" rel="noopener noreferrer" className="text-green-400 font-medium hover:underline">
            +51 999 999 999
          </a>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-navy rounded-lg flex items-center justify-center">
              <span className="text-primary font-black text-sm">OC</span>
            </div>
            <div className="leading-none">
              <p className="font-extrabold text-navy text-[15px]">DISTRIBUIDORA OCZA</p>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Importadora por mayor</p>
            </div>
          </div>
          <a
            href={WA}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 0 0 .917.918l4.462-1.494A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.68-6.426-1.852l-.242-.152-3.174 1.061 1.06-3.178-.166-.248A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            <span className="hidden sm:inline">Hacer pedido</span>
            <span className="sm:hidden">Pedir</span>
          </a>
        </div>
      </header>

      {/* Campaign Hero */}
      <section className="relative overflow-hidden bg-navy">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(249,115,22,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.08),transparent_50%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <div className="grid sm:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-primary text-xs font-bold uppercase tracking-wider">Campana Escolar 2026</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] mb-5">
                Productos importados al
                <span className="text-primary"> precio de fabrica</span>
              </h1>
              <p className="text-slate-400 text-lg mb-8 max-w-md">
                Abastece tu bodega, tienda o distribuidora. Mas de 1,000 productos con entrega directa en El Pedregal.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`${WA}?text=${encodeURIComponent('Hola, quiero ver el catalogo por mayor y cotizar productos')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm"
                >
                  Ver catalogo completo
                </a>
                <a
                  href={`${WA}?text=${encodeURIComponent('Hola, quiero cotizar utiles escolares por mayor para la campana 2026')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/15 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm backdrop-blur border border-white/10"
                >
                  Cotizar campana escolar
                </a>
              </div>
            </div>
            <div className="hidden sm:grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
                  <p className="text-4xl font-black text-primary">1000+</p>
                  <p className="text-slate-400 text-sm mt-1">Productos disponibles</p>
                </div>
                <div className="bg-primary rounded-2xl p-5">
                  <p className="text-4xl font-black text-white">24h</p>
                  <p className="text-white/70 text-sm mt-1">Entrega local</p>
                </div>
              </div>
              <div className="space-y-3 pt-6">
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
                  <p className="text-4xl font-black text-white">S/200</p>
                  <p className="text-slate-400 text-sm mt-1">Pedido minimo</p>
                </div>
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
                  <p className="text-4xl font-black text-white">0%</p>
                  <p className="text-slate-400 text-sm mt-1">Intermediarios</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaign Offers Bar */}
      <section className="bg-primary">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center gap-4 sm:gap-10 flex-wrap">
          {[
            { label: 'Cuadernos', off: '-20%' },
            { label: 'Lapiceros', off: '-15%' },
            { label: 'Mochilas', off: '-25%' },
            { label: 'Colores', off: '-20%' },
          ].map((d) => (
            <div key={d.label} className="text-center">
              <span className="text-white font-black text-xl sm:text-2xl">{d.off}</span>
              <p className="text-white/70 text-[11px] font-semibold uppercase tracking-wide">{d.label}</p>
            </div>
          ))}
          <a
            href={`${WA}?text=${encodeURIComponent('Hola, quiero aprovechar las ofertas de la campana escolar 2026')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-primary font-bold text-sm px-5 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Aprovechar ofertas
          </a>
        </div>
      </section>

      {/* Catalog */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Catalogo</p>
            <h2 className="text-2xl font-black text-navy">Productos por mayor</h2>
          </div>
          <p className="text-slate-400 text-sm">{filtered.length} productos</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                active === cat
                  ? 'bg-navy text-white shadow-lg shadow-navy/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product, i) => (
            <a
              key={i}
              href={`${WA}?text=${encodeURIComponent(`Hola, quiero cotizar: ${product.name} (min. ${product.min} ${product.unit})`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="aspect-square bg-slate-50 overflow-hidden relative">
                <img
                  src={product.img}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute top-0 left-0 bg-navy text-white text-[10px] font-bold px-2.5 py-1 rounded-br-lg">
                  Min. {product.min} {product.unit}
                </div>
              </div>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{product.category}</p>
                <p className="text-[13px] font-bold text-navy mt-1 leading-snug line-clamp-2">{product.name}</p>
                <div className="flex items-end justify-between mt-3">
                  <div>
                    <p className="text-xl font-black text-navy leading-none">
                      S/{product.price.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">x {product.unit}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors">
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 0 0 .917.918l4.462-1.494A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.68-6.426-1.852l-.242-.152-3.174 1.061 1.06-3.178-.166-.248A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href={`${WA}?text=${encodeURIComponent('Hola, quiero ver el catalogo completo por mayor')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-navy hover:bg-navy-light text-white font-bold px-8 py-3.5 rounded-lg transition-colors"
          >
            Ver catalogo completo
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <p className="text-primary text-xs font-bold uppercase tracking-widest text-center mb-1">Distribuidora Ocza</p>
          <h2 className="text-2xl font-black text-navy text-center mb-10">Por que comprar con nosotros</h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: 'Precio de fabrica',
                desc: 'Importamos directo sin intermediarios. Garantizamos el precio mas bajo del mercado para tu negocio.',
                icon: <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM9 7.5A.75.75 0 0 0 9 9h1.5c.98 0 1.813.626 2.122 1.5H9A.75.75 0 0 0 9 12h3.622a2.251 2.251 0 0 1-2.122 1.5H9a.75.75 0 0 0-.53 1.28l3 3a.75.75 0 1 0 1.06-1.06L11.378 15h.372a3.751 3.751 0 0 0 3.583-2.625.75.75 0 0 0 0-.256 3.751 3.751 0 0 0-.828-1.619H15a.75.75 0 0 0 0-1.5h-1.5A3.74 3.74 0 0 0 10.5 7.5H9Z" clipRule="evenodd" />,
              },
              {
                title: 'Entrega en tu puerta',
                desc: 'Flota propia de distribucion. Tu pedido llega directo a tu negocio en El Pedregal y alrededores en 24 horas.',
                icon: <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h8.25c1.035 0 1.875-.84 1.875-1.875V15Z" />,
              },
              {
                title: 'Stock permanente',
                desc: 'Importacion constante. Nunca te quedas sin mercaderia. Mas de 1,000 productos siempre disponibles.',
                icon: <path d="M12.378 1.602a.75.75 0 0 0-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03ZM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 0 0 .372-.648V7.93ZM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 0 0 .372.648l8.628 5.033Z" />,
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-8 border border-slate-100">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">{item.icon}</svg>
                </div>
                <h4 className="font-bold text-navy text-lg mb-2">{item.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-navy rounded-3xl px-8 py-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.15),transparent_60%)]" />
          <div className="relative">
            <h3 className="text-3xl font-black text-white mb-3">
              Listo para abastecer tu negocio?
            </h3>
            <p className="text-slate-400 max-w-md mx-auto mb-8">
              Escribenos por WhatsApp y te enviamos el catalogo completo con precios actualizados por mayor.
            </p>
            <a
              href={`${WA}?text=${encodeURIComponent('Hola, quiero recibir el catalogo completo con precios por mayor')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-10 rounded-xl transition-colors text-lg"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 0 0 .917.918l4.462-1.494A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.68-6.426-1.852l-.242-.152-3.174 1.061 1.06-3.178-.166-.248A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Pedir catalogo por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* WhatsApp float */}
      <a
        href={WA}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30 transition-colors z-50"
      >
        <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 0 0 .917.918l4.462-1.494A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.68-6.426-1.852l-.242-.152-3.174 1.061 1.06-3.178-.166-.248A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
      </a>

      {/* Footer */}
      <footer className="bg-navy">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div>
              <p className="font-black text-white text-lg mb-3">DISTRIBUIDORA OCZA</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Importadora y distribuidora por mayor. Abastecemos bodegas, tiendas, mercados y distribuidoras con productos de calidad a precio de fabrica.
              </p>
            </div>
            <div>
              <p className="text-white font-bold mb-3">Lineas de producto</p>
              <div className="space-y-2">
                {categories.filter(c => c !== 'Todos').map((cat) => (
                  <p key={cat} className="text-slate-400 text-sm">{cat}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-bold mb-3">Contacto</p>
              <div className="space-y-2 text-sm text-slate-400">
                <p>El Pedregal, Arequipa - Peru</p>
                <p>Lunes a Sabado: 7am - 6pm</p>
                <a href={WA} target="_blank" rel="noopener noreferrer" className="text-green-400 font-bold block text-base">
                  +51 999 999 999
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-slate-500 text-xs">&copy; {new Date().getFullYear()} Distribuidora Ocza — Ocsa Importaciones</p>
            <p className="text-slate-600 text-xs">Venta exclusiva por mayor</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
