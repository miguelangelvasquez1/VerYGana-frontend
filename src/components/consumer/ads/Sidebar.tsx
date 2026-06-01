interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  // Quick stats — commented out until connected to real data
  // const quickStats = [
  //   { label: "Videos vistos hoy", value: "47", color: "text-green-400" },
  //   { label: "Ganancia del día", value: "$12.50", color: "text-blue-400" },
  //   { label: "Racha actual", value: "7 días", color: "text-yellow-400" },
  // ];

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] border-r border-white/5">

      {/* Logo / header */}
      <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <span className="text-sm font-black text-white">V</span>
          </div>
          <span className="text-base font-bold text-white tracking-tight">Ver y Gana</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">

        {/* Tagline card */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 p-4">
          <p className="text-sm font-semibold text-white mb-1">Gana mientras descubres</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Visualiza anuncios, acumula puntos y canjéalos por recargas,
            productos y premios. Todo desde tu dispositivo.
          </p>
        </div>

        {/* How it works */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">¿Cómo funciona?</h4>
          <div className="space-y-3">
            {[
              { icon: '▶️', title: 'Mira anuncios', desc: 'Completa la visualización para ganar puntos.' },
              { icon: '❤️', title: 'Dale like', desc: 'Confirma que viste el anuncio con un like.' },
              { icon: '🎁', title: 'Canjea premios', desc: 'Usa tus puntos en la tienda o rifas diarias.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-base leading-none mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Contact */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Contacto</h4>
          <div className="space-y-2">
            {[
              { icon: '📧', text: 'soporte@verygana.com' },
              { icon: '📞', text: '+57 (601) 123-4567' },
              { icon: '📍', text: 'Colombia' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2.5 text-xs text-gray-400">
                <span className="text-sm">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Síguenos</h4>
          <div className="flex gap-3">
            {/* Facebook */}
            <a href="#" className="w-8 h-8 rounded-xl bg-white/5 hover:bg-blue-600/30 border border-white/10 hover:border-blue-500/40 flex items-center justify-center transition-all group">
              <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            {/* X / Twitter */}
            <a href="#" className="w-8 h-8 rounded-xl bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/40 flex items-center justify-center transition-all group">
              <svg className="w-4 h-4 text-gray-400 group-hover:text-sky-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="#" className="w-8 h-8 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/40 flex items-center justify-center transition-all group">
              <svg className="w-4 h-4 text-gray-400 group-hover:text-pink-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* App download */}
        <div className="rounded-2xl border border-white/5 bg-white/3 p-3 flex items-center gap-3 hover:bg-white/5 transition cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
            📱
          </div>
          <div>
            <p className="text-xs text-gray-500">Disponible en</p>
            <p className="text-xs font-bold text-white">App Store &amp; Google Play</p>
          </div>
        </div>

        {/* Footer note */}
        <div className="pt-1 pb-2 space-y-0.5 text-xs text-gray-600">
          <p>Versión 2.1.0</p>
          <p>© 2025 Ver y Gana · Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
}