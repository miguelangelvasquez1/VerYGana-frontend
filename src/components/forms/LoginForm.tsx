'use client';

import { useState } from "react";
import { loginUser } from "@/services/UserService";
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
            localStorage.setItem('authToken', token);
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
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
                Iniciar Sesión
            </h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="identifier" className="block text-sm font-medium">
                        Correo electrónico o número de teléfono
                    </label>
                    <input
                        id="identifier"
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        placeholder="ej. usuario@correo.com o 3001234567"
                        className="w-full mt-1 px-4 py-2 bg-gray-300 rounded-md focus:outline-none"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium">
                        Contraseña
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Ingrese su contraseña"
                        className="w-full mt-1 px-4 py-2 bg-gray-300 rounded-md focus:outline-none"
                    />
                </div>
                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-2 font-medium text-white bg-blue-950 rounded-md hover:bg-blue-900 cursor-pointer flex justify-center items-center gap-2"
                    >
                        {isLoading && (
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
                        )}
                        {isLoading ? "Procesando..." : "Iniciar Sesión"}
                    </button>
                </div>
            </form>
            <p className="text-center mt-5">
                ¿No tienes una cuenta?
                <a href="/register" className="hover:text-gray-500"> Regístrate aquí</a>
            </p>
        </div>
    );
};

export default LoginForm;
