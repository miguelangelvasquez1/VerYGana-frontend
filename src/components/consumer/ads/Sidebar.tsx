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
    <div className="h-full flex flex-col bg-white border-r border-gray-100">

      {/* Logo / header */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#004b8d] to-[#0075c4] flex items-center justify-center shadow-lg shadow-blue-900/20">
            <span className="text-sm font-black text-white">V</span>
          </div>
          <span className="text-base font-bold text-[#0b1440] tracking-tight">Ver y Gana</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar panel"
          className="md:hidden min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-100 text-gray-400 hover:text-[#0b1440] transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200">

        {/* Tagline card */}
        <div className="rounded-2xl bg-linear-to-br from-[#e8f2fc] to-[#eef1ff] border border-[#03548C]/15 p-4">
          <p className="text-sm font-semibold text-[#0b1440] mb-1">Gana mientras descubres</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Visualiza anuncios, acumula puntos y canjéalos por recargas,
            productos y premios. Todo desde tu dispositivo.
          </p>
        </div>

        {/* How it works */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">¿Cómo funciona?</h4>
          <div className="space-y-3">
            {[
              { icon: '▶️', title: 'Mira anuncios', desc: 'Completa la visualización para ganar puntos.' },
              { icon: '❤️', title: 'Dale like', desc: 'Confirma que viste el anuncio con un like.' },
              { icon: '🎁', title: 'Canjea premios', desc: 'Usa tus puntos en la tienda o rifas diarias.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-base leading-none mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-[#0b1440]">{item.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Contact */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Contacto</h4>
          <div className="space-y-2">
            {[
              { icon: '📧', text: 'soporte@verygana.com' },
              { icon: '📞', text: '+57 (601) 123-4567' },
              { icon: '📍', text: 'Colombia' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2.5 text-xs text-gray-600">
                <span className="text-sm">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="pt-1 pb-2 space-y-0.5 text-xs text-gray-400">
          <p>Versión 2.1.0</p>
          <p>© 2025 Ver y Gana · Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
}