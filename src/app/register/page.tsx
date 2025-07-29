import RegisterForm from "@/components/RegisterForm"
import Navbar from "@/components/NavBar";
import Footer from "@/components/Footer";
export default function RegisterPage() {
    return (
        <>
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1 flex">
                <div className="w-2/5 bg-gradient-to-b from-[#014C92] via-[#1EA5BD] to-[#014C92] text-white p-8 flex flex-col justify-center items-center">
                    <h2 className="text-3xl font-bold mb-4 text-center">Bienvenido a Rifacel</h2>
                    <p className="text-lg text-center mb-6">¡Descubre como puedes ganar recompensas!</p>
                    <ul className="text-lg text-center mb-6">
                        <li>💰 Gana dinero viendo anuncios</li>
                        <li>🎁 Participa en rifas diarias</li>
                        <li>📱 Canjea por recargas o productos</li>
                    </ul>
                </div>
                <div className="w-3/5 bg-white text-blue p-8 flex flex-col justify-center items-center">
                    <h1 className="text-3xl text-blue-950 text-center font-bold mt-10">Registrarse</h1>
                    <RegisterForm/>
                </div>
            </div>
        </div>
        <Footer/>
        </>
    );
}