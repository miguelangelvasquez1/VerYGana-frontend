'use client';

import Image from "next/image"
import { useRouter } from "next/navigation";

export default function NavBarNoAuth() {

    const router = useRouter();

    const handleLoginClick = () => {
        router.push("/login");
    };
     const handleRegisterClick = () => {
        router.push("/register");
    };

    const buttonsStyle = "cursor-pointer bg-white text-blue-900 font-semibold px-4 py-1 rounded-full shadow-md hover:bg-gray-300";//bg-[#003C71]
    return (
        <nav className="sticky top-0 w-full flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#014C92] via-[#1EA5BD] to-[#014C92] text-white shadow">
            <div className="flex items-center gap-4">
                <Image src={"/logos/logo2.png"} alt="logo" width={80} height={80} />
            </div>
            <div className="flex gap-3">
                <button className={buttonsStyle}>Inicio</button>
                <button className="cursor-pointer bg-yellow-400 text-black text-shadow-lg font-bold px-4 py-1 rounded-full shadow-sm">Juega ya!</button>
                <button className={buttonsStyle}>Celulares</button>
                <button className={buttonsStyle}>Ganadores</button>
            </div>
            <div className="flex gap-3">
                <button className="bg-white text-blue-900 font-semibold px-4 py-1 rounded-full shadow-md cursor-pointer hover:bg-gray-300"
                    onClick={handleLoginClick}>
                    Entrar</button>
                <button className="bg-white text-blue-900 font-semibold px-4 py-1 rounded-full shadow-md cursor-pointer hover:bg-gray-300"
                    onClick={handleRegisterClick}>
                    Registrarse</button>
            </div>
        </nav>
    );
}