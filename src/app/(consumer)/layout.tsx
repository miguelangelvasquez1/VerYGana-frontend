import Navbar from "@/components/bars/NavBar";
import Footer from "@/components/Footer";

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100">
        {children}
      </main>

      <Footer />
    </>
  );
}