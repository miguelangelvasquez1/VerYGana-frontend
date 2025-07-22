import { User } from "lucide-react"; // o cualquier ícono de perfil
import Image from "next/image"; // si usas Next.js

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 bg-gradient-to-b from-[#014C92] via-[#1EA5BD] to-[#014C92] text-white shadow">
      {/* LOGO */}
      <div className="flex items-center gap-4">
        <Image src="/logo.png" alt="Logo" width={40} height={40} />
      </div>

      {/* BOTONES */}
      <div className="flex gap-3">
        <button className="bg-white text-blue-900 font-semibold px-4 py-1 rounded-full shadow-sm">Inicio</button>
        <button className="bg-yellow-400 text-black font-bold px-4 py-1 rounded-full shadow-sm">Juega ya!</button>
        <button className="bg-white text-blue-900 font-semibold px-4 py-1 rounded-full shadow-sm">Celulares</button>
        <button className="bg-white text-blue-900 font-semibold px-4 py-1 rounded-full shadow-sm">Ganadores</button>
      </div>

      {/* PERFIL Y SALDO */}
      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <div className="font-semibold">Depositar</div>
          <div className="text-sm">10.000 $<br />Saldo</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
            <User className="text-white w-4 h-4" />
          </div>
          <span className="font-semibold">Juan</span>
        </div>
      </div>
    </nav>
  );
}