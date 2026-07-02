'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from "../../../components/auth/LoginForm";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { Zap, Gift, Coins } from "lucide-react";

function CallbackUrlCleaner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.has('callbackUrl')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('callbackUrl');
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}

export default function Login() {
  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50 overflow-hidden">
        <Suspense fallback={null}>
          <CallbackUrlCleaner />
        </Suspense>

        <div className="flex-1 flex">

          {/* ── Left panel (desktop) ── */}
          <div className="hidden lg:block lg:w-2/5 shrink-0 bg-linear-to-br from-[#0b1440] via-[#03548C] to-[#0b1440] text-white">
            <div className="sticky top-0 h-screen flex flex-col justify-center items-center p-8 xl:p-12 w-full">

              {/* Decorative circles */}
              <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute -bottom-20 -left-12 w-56 h-56 rounded-full bg-white/5" />

              <div className="relative max-w-sm text-center">
                <Link href="/">
                  <Image src="/logos/logoDorado.png" alt="Ver y Gana" width={72} height={72} className="mx-auto mb-6" />
                </Link>

                <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                  <Zap className="w-3.5 h-3.5 text-[#FFD700]" />
                  La plataforma que te paga por tu tiempo
                </div>

                <h2 className="text-2xl xl:text-3xl font-extrabold mb-3 leading-tight">
                  Bienvenido de <span className="text-[#FFD700]">vuelta</span>
                </h2>
                <p className="text-blue-100 text-sm leading-relaxed mb-8">
                  Accede a tu cuenta y sigue ganando recompensas reales desde donde lo dejaste.
                </p>

                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                    <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                      <Coins className="w-5 h-5 text-[#FFD700]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Gana llaves</p>
                      <p className="text-blue-200 text-xs">Viendo anuncios y encuestas</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                    <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                      <Gift className="w-5 h-5 text-[#FFD700]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Rifas y premios</p>
                      <p className="text-blue-200 text-xs">Participa con tus llaves acumuladas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="w-full lg:w-3/5 bg-white flex-1 flex flex-col">

            {/* Mobile header */}
            <div className="lg:hidden bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] px-6 py-5 flex items-center gap-3">
              <Link href="/">
                <Image src="/logos/logo.png" alt="Ver y Gana" width={40} height={40} />
              </Link>
              <span className="text-white font-bold text-lg">Ver y Gana</span>
            </div>

            {/* Form area */}
            <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
              <LoginForm />
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}
