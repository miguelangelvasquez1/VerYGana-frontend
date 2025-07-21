'use client';
import { useState } from "react";


const LoginForm = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = () => {

    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    Iniciar Sesión
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium">
                            Correo electrónico
                        </label>
                        <input id="email" type="email" value={email}
                            onChange={(e) => setEmail(e.target.value)} required
                            placeholder="Ingrese su correo electrónico" 
                            className="w-full mt-1 px-4 border border-gray-300 rounded-md focus:outline-none bg-amber-50"/>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium">
                            Contraseña
                        </label>
                        <input id="password" type="password" value={password}
                            onChange={(e) => setPassword(e.target.value)} required
                            placeholder="Ingrese su contraseña"
                            className="w-full"/>
                    </div>
                    <div>
                        <button type="submit"
                        className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md">
                            Iniciar Sesión
                        </button>
                    </div>
                </form>
                <p>
                    ¿No tienes una cuenta?
                    <a href="/register">Regístrate aquí</a>
                </p>
            </div>
        </div>
    );
};
export default LoginForm;