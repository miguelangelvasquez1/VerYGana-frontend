'use client';

import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { KeyRound, ShieldCheck, Lock } from 'lucide-react';

export default function ForgotPasswordPage() {
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

                <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FFD700]" />
                  Recupera el acceso de forma segura
                </div>

                <h2 className="text-2xl xl:text-3xl font-extrabold mb-3 leading-tight">
                  Recupera tu <span className="text-[#FFD700]">cuenta</span>
                </h2>
                <p className="text-blue-100 text-sm leading-relaxed mb-8">
                  Te enviaremos un código único a tu correo para que puedas crear una nueva contraseña.
                </p>

                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                    <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                      <KeyRound className="w-5 h-5 text-[#FFD700]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Código de un solo uso</p>
                      <p className="text-blue-200 text-xs">Válido por tiempo limitado, solo para ti</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                    <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5 text-[#FFD700]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Sesiones revocadas</p>
                      <p className="text-blue-200 text-xs">Al cambiar la contraseña, todas las sesiones anteriores se cierran</p>
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
              <div className="w-full max-w-sm mx-auto">
                <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl p-6 sm:p-8 border border-gray-100">
                  <ForgotPasswordForm />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}
