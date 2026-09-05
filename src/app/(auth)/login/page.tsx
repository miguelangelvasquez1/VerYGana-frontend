'use client';

import { Suspense, useEffect } from 'react';
import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import LoginForm from '../../../components/auth/LoginForm';

import Footer from '@/components/Footer';

import Image from 'next/image';
import Link from 'next/link';

import {
  Zap,
  Gift,
  Coins,
} from 'lucide-react';

import RecaptchaProvider from '@/components/auth/RecaptchaProvider';


function CallbackUrlCleaner() {

  const router = useRouter();

  const searchParams =
      useSearchParams();


  useEffect(() => {

    if (
        searchParams?.has('callbackUrl')
    ) {

      const url =
          new URL(
              window.location.href
          );

      url.searchParams.delete(
          'callbackUrl'
      );

      router.replace(
          url.pathname + url.search,
          {
            scroll: false,
          }
      );

    }

  }, [
    searchParams,
    router,
  ]);


  return null;
}


export default function Login() {

  return (
      <>
        <div
            className="
          min-h-screen
          flex
          flex-col
          bg-gray-50
        "
        >

          {/* ======================================================
            CALLBACK URL CLEANER
        ====================================================== */}

          <Suspense fallback={null}>
            <CallbackUrlCleaner />
          </Suspense>


          <div
              className="
            flex-1
            flex
            min-h-0
          "
          >

            {/* ====================================================
              LEFT PANEL
          ==================================================== */}

            <aside
                className="
    hidden
    lg:flex
    lg:w-2/5
    shrink-0

    relative
    overflow-hidden

    bg-linear-to-br
    from-[#0b1440]
    via-[#03548C]
    to-[#0b1440]

    text-white
  "
            >
              {/* Decoración */}

              <div
                  aria-hidden="true"
                  className="
      pointer-events-none
      absolute
      -top-20
      -right-20
      h-72
      w-72
      rounded-full
      bg-white/5
    "
              />

              <div
                  aria-hidden="true"
                  className="
      pointer-events-none
      absolute
      -bottom-24
      -left-20
      h-64
      w-64
      rounded-full
      bg-white/5
    "
              />

              {/* ============================================================
      CONTENIDO IZQUIERDO

      MISMA ESTRUCTURA HORIZONTAL QUE LA CARD
  ============================================================ */}

              <div
                  className="
      relative
      z-10

      flex
      min-h-screen
      w-full

      items-center

      px-6
      sm:px-10
      lg:px-12
      xl:px-16
    "
              >

                <div
                    className="
                      w-fit
                      mx-auto
                    "
                >
                  {/* ========================================================
                        LOGO
                    ======================================================== */}

                  <Link
                      href="/"
                      className="
                      block
                      w-fit
                      mb-7
                      mx-auto
                    "
                  >
                    <Image
                        src="/logos/logoDorado.png"
                        alt="Ver y Gana"
                        width={80}
                        height={80}
                    />
                  </Link>


                  {/* ========================================================
          EYEBROW
      ======================================================== */}

                  <div
                      className="
                        flex
                        items-center
                        gap-2
                        mb-4
                        mx-auto
                      "
                  >
                    <Zap
                        aria-hidden="true"
                        className="
                        h-4
                        w-4
                        shrink-0
                        text-[#FFD700]
                      "
                    />

                    <span
                        className="
                        text-sm
                        font-medium
                        leading-5
                        text-blue-100
                      "
                    >
          La plataforma que te paga por tu tiempo
        </span>
                  </div>


                  {/* ========================================================
          TITULO
      ======================================================== */}

                  <h2
                      className="
    text-[2rem]
    leading-[1.08]
    tracking-tight
    text-white
    xl:text-[2.5rem]
  "
                  >
                    Bienvenido de
                    <br />

                    <span className="text-[#FFD700]">
    vuelta.
  </span>
                  </h2>


                  {/* ========================================================
          DESCRIPCIÓN
      ======================================================== */}

                  <p
                      className="
          mt-3
          max-w-sm
          text-sm
          leading-6
          text-blue-200
        "
                  >
                    Accede a tu cuenta y sigue ganando
                    recompensas reales desde donde lo dejaste.
                  </p>


                  {/* ========================================================
          BENEFICIOS
      ======================================================== */}

                  <div
                      className="
          mt-9
          space-y-5
        "
                  >

                    {/* BENEFICIO 1 */}

                    <div
                        className="
    flex
    items-start
    gap-5
  "
                    >
                      <div
                          className="
      flex
      h-12
      w-12
      shrink-0
      items-center
      justify-center
      rounded-2xl
      bg-white/10
      ring-1
      ring-white/10
    "
                      >
                        <Coins
                            aria-hidden="true"
                            className="
        h-6
        w-6
        text-[#FFD700]
      "
                        />
                      </div>

                      <div>
                        <p
                            className="
        text-sm
        font-semibold
        leading-5
        text-white
      "
                        >
                          Gana llaves
                        </p>

                        <p
                            className="
        mt-0.5
        text-xs
        leading-5
        text-blue-300
      "
                        >
                          Viendo anuncios y encuestas
                        </p>
                      </div>
                    </div>


                    {/* BENEFICIO 2 */}

                    <div
                        className="
    flex
    items-start
    gap-5
  "
                    >
                      <div
                          className="
      flex
      h-12
      w-12
      shrink-0
      items-center
      justify-center
      rounded-2xl
      bg-white/10
      ring-1
      ring-white/10
    "
                      >
                        <Gift
                            aria-hidden="true"
                            className="
        h-6
        w-6
        text-[#FFD700]
      "
                        />
                      </div>

                      <div>
                        <p
                            className="
        text-sm
        font-semibold
        leading-5
        text-white
      "
                        >
                          Rifas y premios
                        </p>

                        <p
                            className="
        mt-0.5
        text-xs
        leading-5
        text-blue-300
      "
                        >
                          Participa con tus llaves acumuladas
                        </p>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

            </aside>


            {/* ====================================================
              RIGHT PANEL
          ==================================================== */}

            <main
                className="
              relative

              w-full
              lg:w-3/5
              flex-1

              bg-[#eef4fb]
            "
            >

              {/* ==================================================
                MOBILE HEADER
            ================================================== */}

              <div
                  className="
                lg:hidden

                flex
                items-center
                gap-3

                bg-linear-to-r
                from-[#0b1440]
                via-[#03548C]
                to-[#0b1440]

                px-6
                py-5
              "
              >

                <Link href="/">
                  <Image
                      src="/logos/logoDorado.png"
                      alt="Ver y Gana"
                      width={40}
                      height={40}
                  />
                </Link>

                <span
                    className="
                  text-lg
                  font-bold
                  text-white
                "
                >
                Ver y Gana
              </span>

              </div>


              {/* ==================================================
                RIGHT CONTENT

                LA CARD SE CENTRA VERTICALMENTE AQUÍ.
            ================================================== */}

              <div
                  className="
                min-h-screen

                flex
                items-center
                justify-center

                px-6
                py-12

                sm:px-10

                lg:px-12

                xl:px-16
              "
              >

                <div
                    className="
                  w-full
                  max-w-2xl
                "
                >

                  <RecaptchaProvider>
                    <LoginForm />
                  </RecaptchaProvider>


                  {/* ==================================================
                    LEGAL LINKS
                ================================================== */}

                  <div
                      className="
                    mt-5

                    flex
                    items-center
                    justify-center
                    gap-4

                    text-xs
                    text-gray-400
                  "
                  >

                    <a
                        href="/terminos"
                        className="
                      transition-colors
                      hover:text-gray-600
                    "
                    >
                      Términos
                    </a>

                    <span aria-hidden="true">
                    •
                  </span>

                    <a
                        href="/privacidad"
                        className="
                      transition-colors
                      hover:text-gray-600
                    "
                    >
                      Privacidad
                    </a>

                    <span aria-hidden="true">
                    •
                  </span>

                    <a
                        href="/ayuda"
                        className="
                      transition-colors
                      hover:text-gray-600
                    "
                    >
                      Ayuda
                    </a>

                  </div>

                </div>

              </div>

            </main>

          </div>

        </div>


        <Footer />
      </>
  );
}
