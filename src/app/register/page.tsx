import RegisterForm from "@/components/forms/RegisterForm"
import Footer from "@/components/Footer";
import NavBarNoAuth from "@/components/bars/NavBarNoAuth";

export default function RegisterPage() {
  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50 overflow-hidden">
        <NavBarNoAuth />
        
        {/* Hero Section - Mobile */}
        <div className="lg:hidden bg-gradient-to-br from-[#014C92] via-[#1EA5BD] to-[#0369A1] text-white px-4 py-6">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                Bienvenido a Rifacel
              </h2>
              <p className="text-sm text-blue-100 mb-4">
                ¡Descubre cómo puedes ganar recompensas!
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/10 rounded-lg p-2">
                <span className="text-lg">💰</span>
                <span className="block text-xs mt-1">Gana dinero</span>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <span className="text-lg">🎁</span>
                <span className="block text-xs mt-1">Rifas diarias</span>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <span className="text-lg">📱</span>
                <span className="block text-xs mt-1">Canjea premios</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Left Panel - Desktop */}
          <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-[#014C92] via-[#1EA5BD] to-[#0369A1] text-white">
            <div className="flex flex-col justify-center items-center p-6 xl:p-8 w-full">
              <div className="max-w-sm text-center">
                <div className="mb-6">
                  <h2 className="text-2xl xl:text-3xl font-bold mb-3 leading-tight">
                    Bienvenido a Rifacel
                  </h2>
                  <p className="text-base text-blue-100 mb-6 leading-relaxed">
                    ¡Descubre cómo puedes ganar recompensas!
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">💰</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-sm">Gana dinero</h3>
                      <p className="text-blue-100 text-xs">Visualiza anuncios</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🎁</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-sm">Rifas diarias</h3>
                      <p className="text-blue-100 text-xs">Gana premios increíbles</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📱</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-sm">Canjea recompensas</h3>
                      <p className="text-blue-100 text-xs">Recargas y productos</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="w-full lg:w-3/5 bg-white flex-1 flex flex-col">
            <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 lg:p-8">
              <div className="w-full max-w-2xl mx-auto">
                <div className="text-center mb-4 sm:mb-6">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                    Crear cuenta
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Completa el formulario para comenzar
                  </p>
                </div>

                <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-100">
                  <RegisterForm />
                </div>

                <div className="mt-4 text-center">
                  <p className="text-gray-600 text-xs sm:text-sm">
                    ¿Ya tienes una cuenta?{" "}
                    <a 
                      href="/login" 
                      className="text-blue-600 hover:text-blue-700 font-semibold underline decoration-2 underline-offset-2"
                    >
                      Inicia sesión aquí
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </>
  );
}