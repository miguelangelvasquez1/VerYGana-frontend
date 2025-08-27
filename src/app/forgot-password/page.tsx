'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
  Mail,
  Key,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Lock,
  RefreshCw,
  Smartphone,
  ArrowRight
} from 'lucide-react';

export default function PasswordRecovery() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Email, 2: Code, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [canResend, setCanResend] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Timer para reenvío de código
  useEffect(() => {
    if (currentStep === 2 && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [currentStep, timeLeft]);

  // Validación de fortaleza de contraseña
  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 8) strength += 25;
    if (/[A-Z]/.test(newPassword)) strength += 25;
    if (/[0-9]/.test(newPassword)) strength += 25;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 25;
    setPasswordStrength(strength);
  }, [newPassword]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEmailSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor ingresa tu email');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // Simular envío de email
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(2);
      setTimeLeft(300);
      setCanResend(false);
    }, 2000);
  };

  const handleCodeChange = (index: number, value: string | any[]) => {
    if (value.length > 1) return; // Solo un carácter
    
    const newCode = [...code];
    newCode[index] = String(value);
    setCode(newCode);

    // Auto-focus al siguiente input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Backspace: ir al input anterior si está vacío
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodeSubmit = async () => {
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError('Por favor ingresa el código completo');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simular verificación del código
    setTimeout(() => {
      setIsLoading(false);
      // Simular código incorrecto para demostración
      if (fullCode === '123456') {
        setCurrentStep(3);
      } else {
        setError('Código incorrecto. Intenta nuevamente.');
      }
    }, 1500);
  };

  const handlePasswordSubmit = async () => {    
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (passwordStrength < 75) {
      setError('La contraseña debe ser más segura');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simular cambio de contraseña
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(4);
    }, 2000);
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');
    setCanResend(false);
    setTimeLeft(300);

    // Simular reenvío
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Muy débil';
    if (passwordStrength < 50) return 'Débil';
    if (passwordStrength < 75) return 'Media';
    return 'Fuerte';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {currentStep === 1 && 'Recuperar Contraseña'}
            {currentStep === 2 && 'Verifica tu Email'}
            {currentStep === 3 && 'Nueva Contraseña'}
            {currentStep === 4 && '¡Listo!'}
          </h1>
          <p className="text-gray-600">
            {currentStep === 1 && 'Ingresa tu email para recibir un código de recuperación'}
            {currentStep === 2 && 'Hemos enviado un código de 6 dígitos a tu email'}
            {currentStep === 3 && 'Crea una nueva contraseña segura para tu cuenta'}
            {currentStep === 4 && 'Tu contraseña ha sido actualizada exitosamente'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}
              >
                {currentStep > step ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{step}</span>
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(Math.min(currentStep, 3) - 1) * 50}%` }}
            ></div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Step 1: Email */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@ejemplo.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleEmailSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Código
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Code Verification */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full mb-4">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-sm font-medium">{email}</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Ingresa el código de 6 dígitos que enviamos a tu email
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-3 justify-center">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { codeInputRefs.current[index] = el; }}
                      type="text"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      maxLength={1}
                    />
                  ))}
                </div>

                {/* Timer */}
                <div className="text-center">
                  {timeLeft > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        Código válido por: <span className="font-medium text-blue-600">{formatTime(timeLeft)}</span>
                      </span>
                    </div>
                  ) : (
                    <p className="text-red-600 text-sm">El código ha expirado</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleCodeSubmit}
                    disabled={isLoading || code.join('').length !== 6}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Verificar Código
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleResendCode}
                    disabled={!canResend || isLoading}
                    className="w-full text-blue-600 py-2 font-medium hover:text-blue-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {canResend ? 'Reenviar Código' : 'Reenviar código disponible cuando expire'}
                  </button>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Cambiar email
                </button>
              </div>
            </div>
          )}

          {/* Step 3: New Password */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ingresa tu nueva contraseña"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{getPasswordStrengthText()}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>La contraseña debe contener:</p>
                      <div className="mt-1 space-y-1">
                        <div className={newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                          • Al menos 8 caracteres
                        </div>
                        <div className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                          • Una letra mayúscula
                        </div>
                        <div className={/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                          • Un número
                        </div>
                        <div className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                          • Un carácter especial
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma tu nueva contraseña"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                  <button
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">Las contraseñas no coinciden</p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handlePasswordSubmit}
                disabled={isLoading || passwordStrength < 75 || newPassword !== confirmPassword}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Actualizar Contraseña
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {currentStep === 4 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  ¡Contraseña Actualizada!
                </h3>
                <p className="text-gray-600">
                  Tu contraseña ha sido cambiada exitosamente. 
                  Ahora puedes iniciar sesión con tu nueva contraseña.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-900">Consejo de seguridad</p>
                    <p className="text-xs text-blue-700">
                      Guarda tu contraseña en un lugar seguro y no la compartas con nadie.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => window.location.href = '/login'}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                Ir a Iniciar Sesión
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm mb-2">¿Necesitas ayuda?</p>
          <div className="flex justify-center gap-4">
            <a href="#" className="text-blue-600 hover:text-blue-700 text-sm transition-colors">
              Centro de Ayuda
            </a>
            <a href="#" className="text-blue-600 hover:text-blue-700 text-sm transition-colors">
              Contactar Soporte
            </a>
          </div>
        </div>

        {/* Demo Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 mb-1">Instrucciones para la demo:</p>
              <div className="text-xs text-yellow-800 space-y-1">
                <p>• Paso 1: Usa cualquier email válido</p>
                <p>• Paso 2: Usa el código <strong>123456</strong> para continuar</p>
                <p>• Paso 3: La contraseña debe ser fuerte (mínimo 75% de fortaleza)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}