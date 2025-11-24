'use client';

import { useState } from "react";
import { loginUser } from "@/services/AuthService";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const LoginForm = () => {
    const [identifier, setIdentifier] = useState(''); // Puede ser email o teléfono
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!identifier || !password) {
            toast.error("Completa todos los campos");
            return;
        }

        setIsLoading(true);
        try {
            const { token } = await loginUser(identifier, password);
            // localStorage.setItem('authToken', token);
            toast.success("Inicio de sesión exitoso 🎉");
            router.push("/");
        } catch (error) {
            console.error("Login failed:", error);
            toast.error("Credenciales inválidas");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 border border-gray-100">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    {/* <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        Bienvenido de nuevo
                    </h1> */}
                    <p className="text-gray-600 text-sm sm:text-base">
                        Inicia sesión en tu cuenta de Ver y Gana
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
                            Correo electrónico o teléfono
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            id="identifier"
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                            placeholder="ej. usuario@correo.com o 3001234567"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                     transition-all duration-200 ease-in-out
                                     hover:border-gray-400
                                     text-gray-900 placeholder-gray-500
                                     bg-white text-sm"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                                Contraseña
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <a 
                                href="/forgot-password" 
                                className="text-sm text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-2"
                            >
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Ingrese su contraseña"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                     transition-all duration-200 ease-in-out
                                     hover:border-gray-400
                                     text-gray-900 placeholder-gray-500
                                     bg-white text-sm"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 
                                     hover:from-blue-700 hover:to-blue-800
                                     disabled:from-gray-400 disabled:to-gray-500
                                     text-white font-semibold py-3 px-6 rounded-lg
                                     transition-all duration-200 ease-in-out
                                     transform hover:scale-[1.02] active:scale-[0.98]
                                     disabled:cursor-not-allowed disabled:transform-none
                                     shadow-lg hover:shadow-xl
                                     flex items-center justify-center gap-2
                                     text-sm sm:text-base"
                        >
                            {isLoading ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8z"
                                        ></path>
                                    </svg>
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                <>
                                    <span>Iniciar Sesión</span>
                                    <svg 
                                        className="w-5 h-5" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
                                        />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600 text-sm">
                        ¿No tienes una cuenta?{" "}
                        <a 
                            href="/register" 
                            className="text-blue-600 hover:text-blue-700 font-semibold underline decoration-2 underline-offset-2"
                        >
                            Regístrate aquí
                        </a>
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                        <a href="/terminos" className="hover:text-gray-700 underline">
                            Términos
                        </a>
                        <span>•</span>
                        <a href="/privacidad" className="hover:text-gray-700 underline">
                            Privacidad
                        </a>
                        <span>•</span>
                        <a href="/ayuda" className="hover:text-gray-700 underline">
                            Ayuda
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;