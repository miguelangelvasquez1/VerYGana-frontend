'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from "../../components/forms/LoginForm";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.has('callbackUrl')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('callbackUrl');
      const newPath = url.pathname + url.search;
      router.replace(newPath, { scroll: false });
    }
  }, [searchParams, router]);

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F2FF] to-[#F4F8FB] relative">

        {/* Logo arriba a la izquierda */}
        <div className="absolute top-6 left-6">
          <Link href="/">
            <Image src="/logos/logo.png" alt="Logo" width={60} height={60} />
          </Link>
        </div>

        {/* Formulario centrado */}
        <div className="flex flex-1 items-center justify-center">
          <LoginForm />
        </div>
      </div>
      <Footer />
    </>
  );
}
