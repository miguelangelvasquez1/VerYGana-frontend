interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const menuItems = [
    { icon: "📊", label: "Dashboard", count: null },
    { icon: "🎯", label: "Mi progreso", count: "Nivel 5" },
    { icon: "🏆", label: "Logros", count: "8/15" },
    { icon: "⚙️", label: "Configuración", count: null },
  ];

  const quickStats = [
    { label: "Videos vistos hoy", value: "47", color: "text-green-400" },
    { label: "Ganancia del día", value: "$12.50", color: "text-blue-400" },
    { label: "Racha actual", value: "7 días", color: "text-yellow-400" },
  ];

  return (
    <div className="h-full bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a] border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Panel de control</h2>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white p-1 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* User Info */}
        <div className="mt-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold">JD</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">John Doe</p>
            <p className="text-xs text-gray-400">Usuario Premium</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Estadísticas rápidas</h3>
        <div className="space-y-2">
          {quickStats.map((stat, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-xs text-gray-400">{stat.label}</span>
              <span className={`text-sm font-semibold ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Menu - Reducido */}
      <div className="p-4 border-b border-gray-800">
        <nav className="space-y-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="w-full flex items-center justify-between p-2 rounded-lg text-left 
                       hover:bg-gray-800/50 transition-all duration-200 group
                       border border-transparent hover:border-gray-700"
            >
              <div className="flex items-center gap-2">
                <span className="text-base group-hover:scale-110 transition-transform duration-200">
                  {item.icon}
                </span>
                <span className="text-xs font-medium text-gray-300 group-hover:text-white">
                  {item.label}
                </span>
              </div>
              {item.count && (
                <span className="text-xs bg-gray-800 text-gray-400 px-1 py-0.5 rounded group-hover:bg-gray-700 group-hover:text-white">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Expanded Footer Content */}
      <div className="flex-1 p-4 space-y-6">
        {/* Company Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">R</span>
            </div>
            <h3 className="text-lg font-bold text-white">Rifacel</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            ¡Gana tu próximo celular con nosotros! Participa en nuestras rifas y vive la emoción de ganar.
          </p>
          <div className="space-y-1 text-xs text-gray-500">
            <p>Versión 2.1.0</p>
            <p>© 2025 Rifacel Inc.</p>
            <p>Todos los derechos reservados</p>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Enlaces Rápidos</h4>
          <div className="grid grid-cols-2 gap-2">
            <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800/30 rounded">
              🏠 Inicio
            </a>
            <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800/30 rounded">
              📱 Celulares
            </a>
            <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800/30 rounded">
              🏆 Ganadores
            </a>
            <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800/30 rounded">
              📞 Contacto
            </a>
            <a href="/terminos" className="text-xs text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800/30 rounded">
              📄 Términos
            </a>
            <a href="/privacidad" className="text-xs text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800/30 rounded">
              🔒 Privacidad
            </a>
            <a href="/ayuda" className="text-xs text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800/30 rounded">
              ❓ Ayuda
            </a>
            <a href="/soporte" className="text-xs text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800/30 rounded">
              🛠️ Soporte
            </a>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Contacto</h4>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span>📧</span>
              <span>soporte@rifacel.com</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📞</span>
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>Colombia</span>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Síguenos</h4>
          <div className="flex justify-center gap-4">
            <a href="#" className="text-gray-500 hover:text-blue-400 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-500 hover:text-pink-400 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-500 hover:text-red-400 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* App Download */}
        <div className="border-t border-gray-800 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Descarga la App</h4>
          <div className="space-y-2">
            <button className="w-full bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-2 flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                <span className="text-xs font-bold text-black">📱</span>
              </div>
              <div className="text-left flex-1">
                <div className="text-xs text-gray-300">Disponible en</div>
                <div className="text-xs font-semibold text-white">App Store & Google Play</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}