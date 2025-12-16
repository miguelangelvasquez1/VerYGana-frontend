'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';

import Navbar from '@/components/bars/NavBar';
import Footer from '@/components/Footer';
import { purchaseService } from '@/services/PurchaseService';
import { PurchaseResponseDTO } from '@/types/purchases/purchase.types';

type Status = 'loading' | 'success' | 'error';

export default function PurchaseConfirmationPage() {
  const { purchaseId } = useParams();
  const router = useRouter();

  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [purchase, setPurchase] = useState<PurchaseResponseDTO | null>(null);

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const id = Array.isArray(purchaseId)
          ? Number(purchaseId[0])
          : Number(purchaseId);

        if (isNaN(id)) {
          throw new Error('ID de compra inválido');
        }

        const response = await purchaseService.getPurchaseById(id);
        setPurchase(response);
        setStatus('success');
      } catch (error) {
        console.error('Error validando compra:', error);
        setStatus('error');
        setErrorMessage(
          'No se pudo validar la compra. Por favor revisa tus compras.'
        );
      }
    };

    fetchPurchase();
  }, [purchaseId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4">
        {status === 'loading' && (
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Validando tu compra...</p>
          </div>
        )}

        {status === 'success' && purchase && (
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900">
                ¡Compra confirmada!
              </h1>
              <p className="text-gray-600 mt-2">
                Gracias por tu compra. Aquí están los detalles:
              </p>
            </div>

            {/* INFO GENERAL */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 mb-6 space-y-1">
              <p>
                <strong>ID:</strong> #{purchase.id}
              </p>
              <p>
                <strong>Referencia:</strong> {purchase.referenceId}
              </p>
              <p>
                <strong>Fecha:</strong>{' '}
                {new Date(purchase.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Total de productos:</strong> {purchase.totalItems}
              </p>
              <p>
                <strong>Total pagado:</strong>{' '}
                ${purchase.total.toLocaleString()}
              </p>
            </div>

            {/* ITEMS */}
            <div className="space-y-3 mb-6">
              {purchase.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 border rounded-lg p-3"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <span className="font-medium text-gray-800">
                    {item.productName}
                  </span>
                </div>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="space-y-3">
              <button
                onClick={() => router.push('/purchases')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Ver mis compras
              </button>

              <button
                onClick={() => router.push('/products')}
                className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Ocurrió un problema
            </h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>

            <button
              onClick={() => router.push('/purchases')}
              className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
            >
              Ir a mis compras
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
