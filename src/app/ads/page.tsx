import Sidebar from "@/components/AdsPage/Sidebar";
import VideoAdPlayer from "@/components/AdsPage/VideoAdPlayer";
import Navbar from "@/components/bars/NavBar";


export default function AnunciosPage() {
    return (
        <main className=" bg-black">
            <Navbar/>
            {/* Sidebar solo visible en escritorio */}
            <div className="flex h-screen text-white">
                <aside className="hidden md:block w-64">
                    <Sidebar />
                </aside>

                {/* Contenido principal */}
                <section className="flex-1 flex items-center justify-center overflow-hidden">
                    <VideoAdPlayer />
                </section>
            </div>
        </main>
    );
}

