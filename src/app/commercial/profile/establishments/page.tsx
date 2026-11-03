import type { Metadata } from 'next';
import Link from 'next/link';
import { EstablishmentsManager } from '@/components/commercial/establishments/EstablishmentsManager';

export const metadata: Metadata = { title: 'Establecimientos' };

export default function EstablishmentsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-4 sm:p-6">
      <Link href="/commercial/profile" className="text-sm font-semibold text-[#03548C] hover:underline">
        Volver a Mi perfil
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">Establecimientos</h1>
      <EstablishmentsManager />
    </div>
  );
}
