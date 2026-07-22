'use client';

import { Suspense } from 'react';
import UnlockAccountForm from '@/components/auth/UnlockAccountForm';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';

export default function UnlockAccountPage() {
  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50 overflow-hidden">
        <div className="flex-1 flex">

          {/* ── Left panel (desktop) ── */}
          <div className="hidden lg:block lg:w-2/5 shrink-0 bg-linear-to-br from-[#0b1440] via-[#03548C] to-[#0b1440] text-white">
            <div className="sticky top-0 h-screen flex flex-col justify-center items-center p-8 xl:p-12 w-full">
              <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute -bottom-20 -left-12 w-56 h-56 rounded-full bg-white/5" />

              <div className="relative max-w-sm text-center">
                <Link href="/">
                  <Image src="/logos/logoDorado.png" alt="Ver y Gana" width={72} height={72} className="mx-auto mb-6" />
                </Link>
                <h2 className="text-2xl xl:text-3xl font-extrabold mb-3 leading-tight">
                  Seguridad de tu <span className="text-[#FFD700]">cuenta</span>
                </h2>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Bloqueamos tu cuenta temporalmente para protegerla. Verifica el código que enviamos a tu correo para recuperar el acceso.
                </p>
              </div>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="w-full lg:w-3/5 bg-white flex-1 flex flex-col">
            <div className="lg:hidden bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] px-6 py-5 flex items-center gap-3">
              <Link href="/">
                <Image src="/logos/logo.png" alt="Ver y Gana" width={40} height={40} />
              </Link>
              <span className="text-white font-bold text-lg">Ver y Gana</span>
            </div>

            <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
              <Suspense fallback={null}>
                <UnlockAccountForm />
              </Suspense>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}
