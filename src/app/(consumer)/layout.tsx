import Navbar from "@/components/bars/NavBar";


export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-dvh">
      <Navbar />

      {/* Reserva el alto de la barra inferior fija del celular (4rem) más el área segura del equipo */}
      <main className="flex-1 bg-gray-100 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </main>
    </div>
  );
}