import Navbar from "@/components/bars/NavBar";


export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />

      <main className="flex-1 bg-gray-100 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}