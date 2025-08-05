'use client';

import Image from "next/image"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export default function NavBarNoAuth() {

    const pathName = usePathname(); //Seguir con esto
    const router = useRouter();

    const handleLoginClick = () => {
        router.push("/login");
    };
    const handleRegisterClick = () => {
        router.push("/register");
    };

    const buttonsStyle = "cursor-pointer bg-white text-blue-900 font-semibold px-4 py-1 rounded-full shadow-md hover:bg-gray-300";
    return (
        <nav className="sticky top-0 z-50 w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#014C92] via-[#1EA5BD] to-[#014C92] text-white shadow">
            <div className="flex items-center gap-4">
                <Image src={"/logos/logo2.png"} alt="logo" width={80} height={80} />
            </div>
            <div className="flex gap-3">
                <Link href={"/"}>
                    <button className={buttonsStyle}>Inicio</button>
                </Link>
                <Link href={"/raffles"}>
                    <button className="bg-yellow-400 text-black text-shadow-lg font-bold px-4 py-1 rounded-full shadow-sm">Rifas</button>
                </Link>
                <Link href={"/ads"}>
                    <button className={buttonsStyle}>Anuncios</button>
                </Link>
                <Link href={"/products"}>
                    <button className={buttonsStyle}>Productos</button>
                </Link>
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