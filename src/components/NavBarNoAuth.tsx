
import Image from "next/image"

export default function NavBarNoAuth(){
    return(
    <nav className="w-full flex items-center justify-between px-6 py-3 bg-gradient-to-r from-[#014C92] via-[#1EA5BD] to-[#014C92] text-white shadow">
        <div className="flex items-center gap-4">
            <Image src={"/logo.png"} alt="logo" width={100} height={100}/>
        </div>
        <div className="flex gap-3">
            <button className="bg-white text-blue-900 font-semibold px-4 py-1 rounded-full shadow-md">Entrar</button>
            <button className="bg-white text-blue-900 font-semibold px-4 py-1 rounded-full shadow-md">Registrarse</button>
        </div>
    </nav>
    );
}