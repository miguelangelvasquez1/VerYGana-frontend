'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export default function NavBarNoAuth() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathName = usePathname();
    const router = useRouter();

    const handleLoginClick = () => {
        router.push("/login");
        setIsMenuOpen(false); // Cerrar menú al navegar
    };
    
    const handleRegisterClick = () => {
        router.push("/register");
        setIsMenuOpen(false); // Cerrar menú al navegar
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const buttonsStyle = "cursor-pointer bg-white text-blue-900 font-semibold px-4 py-2 rounded-full shadow-md hover:bg-gray-300 transition-colors duration-200";
    const authButtonStyle = "bg-white text-blue-900 font-semibold px-4 py-2 rounded-full shadow-md cursor-pointer hover:bg-gray-300 transition-colors duration-200";

    return (
        <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#014C92] via-[#1EA5BD] to-[#014C92] text-white shadow">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                    <Image src={"/logos/logo.png"} alt="logo" width={60} height={60} />
                </div>
                
                <div className="flex gap-3">
                    <Link href={"/"}>
                        <button className={buttonsStyle}>Inicio</button>
                    </Link>
                    <Link href={"/raffles"}>
                        <button className="cursor-pointer bg-yellow-400 text-black font-bold px-4 py-2 rounded-full shadow-sm hover:bg-amber-500 transition-colors duration-200">
                            Rifas
                        </button>
                    </Link>
                    <Link href={"/ads"}>
                        <button className={buttonsStyle}>Anuncios</button>
                    </Link>
                    <Link href={"/products"}>
                        <button className={buttonsStyle}>Productos</button>
                    </Link>
                </div>
                
                <div className="flex gap-3">
                    <button className={authButtonStyle} onClick={handleLoginClick}>
                        Entrar
                    </button>
                    <button className={authButtonStyle} onClick={handleRegisterClick}>
                        Registrarse
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="lg:hidden">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Image src={"/logos/logo2.png"} alt="logo" width={50} height={50} />
                    </div>
                    
                    {/* Hamburger Button */}
                    <button
                        onClick={toggleMenu}
                        className="p-2 rounded-md hover:bg-white/10 transition-colors duration-200"
                        aria-label="Toggle menu"
                    >
                        <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                            <span className={`block w-6 h-0.5 bg-white transform transition duration-300 ease-in-out ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                            <span className={`block w-6 h-0.5 bg-white transition duration-300 ease-in-out ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                            <span className={`block w-6 h-0.5 bg-white transform transition duration-300 ease-in-out ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                        </div>
                    </button>
                </div>

                {/* Mobile Menu */}
                <div className={`${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-300 ease-in-out bg-gradient-to-r from-[#014C92] via-[#1EA5BD] to-[#014C92]`}>
                    <div className="px-4 py-4 space-y-3">
                        {/* Navigation Links */}
                        <Link href={"/"} onClick={() => setIsMenuOpen(false)}>
                            <button className="w-full text-left bg-white text-blue-900 font-semibold px-4 py-3 rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-200">
                                Inicio
                            </button>
                        </Link>
                        
                        <Link href={"/raffles"} onClick={() => setIsMenuOpen(false)}>
                            <button className="w-full text-left bg-yellow-400 text-black font-bold px-4 py-3 rounded-lg shadow-sm hover:bg-amber-500 transition-colors duration-200">
                                Rifas
                            </button>
                        </Link>
                        
                        <Link href={"/ads"} onClick={() => setIsMenuOpen(false)}>
                            <button className="w-full text-left bg-white text-blue-900 font-semibold px-4 py-3 rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-200">
                                Anuncios
                            </button>
                        </Link>
                        
                        <Link href={"/products"} onClick={() => setIsMenuOpen(false)}>
                            <button className="w-full text-left bg-white text-blue-900 font-semibold px-4 py-3 rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-200">
                                Productos
                            </button>
                        </Link>

                        {/* Auth Buttons */}
                        <div className="pt-4 border-t border-white/20 space-y-3">
                            <button 
                                className="w-full bg-white text-blue-900 font-semibold px-4 py-3 rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-200"
                                onClick={handleLoginClick}
                            >
                                Entrar
                            </button>
                            <button 
                                className="w-full bg-white text-blue-900 font-semibold px-4 py-3 rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-200"
                                onClick={handleRegisterClick}
                            >
                                Registrarse
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tablet Navigation (md to lg) */}
            <div className="hidden md:flex lg:hidden items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <Image src={"/logos/logo2.png"} alt="logo" width={60} height={60} />
                </div>
                
                <div className="flex gap-2">
                    <Link href={"/"}>
                        <button className="cursor-pointer bg-white text-blue-900 font-semibold px-3 py-2 rounded-full shadow-md hover:bg-gray-300 transition-colors duration-200 text-sm">
                            Inicio
                        </button>
                    </Link>
                    <Link href={"/raffles"}>
                        <button className="cursor-pointer bg-yellow-400 text-black font-bold px-3 py-2 rounded-full shadow-sm hover:bg-amber-500 transition-colors duration-200 text-sm">
                            Rifas
                        </button>
                    </Link>
                    <Link href={"/ads"}>
                        <button className="cursor-pointer bg-white text-blue-900 font-semibold px-3 py-2 rounded-full shadow-md hover:bg-gray-300 transition-colors duration-200 text-sm">
                            Anuncios
                        </button>
                    </Link>
                    <Link href={"/products"}>
                        <button className="cursor-pointer bg-white text-blue-900 font-semibold px-3 py-2 rounded-full shadow-md hover:bg-gray-300 transition-colors duration-200 text-sm">
                            Productos
                        </button>
                    </Link>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        className="bg-white text-blue-900 font-semibold px-3 py-2 rounded-full shadow-md cursor-pointer hover:bg-gray-300 transition-colors duration-200 text-sm"
                        onClick={handleLoginClick}
                    >
                        Entrar
                    </button>
                    <button 
                        className="bg-white text-blue-900 font-semibold px-3 py-2 rounded-full shadow-md cursor-pointer hover:bg-gray-300 transition-colors duration-200 text-sm"
                        onClick={handleRegisterClick}
                    >
                        Registrarse
                    </button>
                </div>
            </div>
        </nav>
    );
}