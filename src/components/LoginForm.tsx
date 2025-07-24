'use client';
import { useState } from "react";

const LoginForm = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = () => {

    }

    return (
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
                        className="w-full mt-1 px-4 py-2 bg-gray-300 rounded-md focus:outline-none" />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium">
                        Contraseña
                    </label>
                    <input id="password" type="password" value={password}
                        onChange={(e) => setPassword(e.target.value)} required
                        placeholder="Ingrese su contraseña"
                        className="w-full mt-1 px-4 py-2 bg-gray-300 rounded-md focus:outline-none" />
                </div>
                <div>
                    <button type="submit"
                        className="w-full px-4 py-2 font-medium text-white bg-blue-950 rounded-md hover:bg-blue-900 cursor-pointer">
                        Iniciar Sesión
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