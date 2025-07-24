'use client';

import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: { target: any; }) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const buttonsStyle = "bg-white text-blue-900 font-semibold px-4 py-1 rounded-full shadow-md";//bg-[#003C71]

  return (
    <nav className="sticky top-0 w-full flex items-center justify-between px-6 py-4 bg-gradient-to-b from-[#004b8d] to-[#0075c4] text-white shadow-md">
      {/* LOGO */}
      <div className="flex items-center gap-4">
        <Image src="/logos/logo2.png" alt="Logo" width={80} height={80} />
      </div>

      {/* BOTONES */}
      <div className="flex gap-3">
        <button className={buttonsStyle}>Inicio</button>
        <button className="bg-yellow-400 text-black text-shadow-lg font-bold px-4 py-1 rounded-full shadow-sm">Juega ya!</button>
        <button className={buttonsStyle}>Celulares</button>
        <button className={buttonsStyle}>Ganadores</button>
      </div>

      {/* PERFIL Y SALDO */}
      <div className="relative flex items-center gap-4">
        <div className="flex items-center gap-4 text-right leading-tight">
          <div className="font-semibold">Depositar</div>
          <div className="flex flex-col text-sm items-center">
            <span className="text-yellow-400">10.000</span>
            <span className="text-yellow-400">Saldo</span>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="group flex items-center gap-2 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center group-hover:border-yellow-400">
              <User className="text-white w-4 h-4 group-hover:text-yellow-400" />
            </div>
            <span className="font-semibold group-hover:text-yellow-400">Juan</span>
          </button>

          {openMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-50">
              <ul className="py-1">
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <Link href="/explore/profile" className="block w-full h-full">
                    Perfil
                  </Link>
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Configuración</li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Cerrar Sesión</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
