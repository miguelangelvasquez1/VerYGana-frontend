import Navbar from "@/components/bars/NavBar";
import Footer from "@/components/Footer";

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />

      <main className="flex-1 bg-gray-100">
        {children}
      </main>
    </div>
  );
}