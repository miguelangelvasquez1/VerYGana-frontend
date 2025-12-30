"use client";

import { useSearchParams, useRouter } from "next/navigation";
import CreateReviewForm from "@/components/reviews/CreateReviewForm";
import Navbar from "@/components/bars/NavBar";
import Footer from "@/components/Footer";

export default function CreateReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const purchaseItemId = searchParams.get("purchaseItemId");

  if (!purchaseItemId) {
    return (
      <div className="p-10 text-center text-gray-500">
        No se encontró el producto a reseñar.
      </div>
    );
  }

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <CreateReviewForm
          purchaseItemId={Number(purchaseItemId)}
          onSuccess={() => router.push("/purchases")}
        />
      </div>
    </div>
    <Footer/>
    </>
  );
}
