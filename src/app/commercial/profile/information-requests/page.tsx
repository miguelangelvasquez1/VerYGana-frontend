import type { Metadata } from 'next';
import Link from 'next/link';
import { InformationRequestsList } from '@/components/commercial/information-requests/InformationRequestsList';

export const metadata: Metadata = { title: 'Solicitudes de información' };

export default function InformationRequestsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-4 sm:p-6">
      <Link href="/commercial/profile" className="text-sm font-semibold text-[#03548C] hover:underline">
        Volver a Mi perfil
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">Solicitudes de información</h1>
      <InformationRequestsList mode="profile" />
    </div>
  );
}
