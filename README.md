## Observations:
import Head from 'next/head';
import Link from 'next/link';

export default function Home2() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <Head>
        <title>RifaMóvil - Gana Celulares con Loterías de Colombia</title>
        <meta name="description" content="Participa en rifas de celulares jugando con los números de las loterías de Colombia. ¡Descarga RifaMóvil y gana hoy!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-blue-600 text-white py-4 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">RifaMóvil</h1>
          <nav className="space-x-4">
            <Link href="#features" className="hover:text-blue-200">Características</Link>
            <Link href="#how-it-works" className="hover:text-blue-200">Cómo funciona</Link>
            <Link href="#download" className="hover:text-blue-200">Descargar</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6">
          Gana Celulares con <span className="text-blue-600">RifaMóvil</span>
        </h2>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Participa en nuestras rifas usando los números de las loterías de Colombia. ¡Descarga la app y comienza a ganar los mejores smartphones!
        </p>
        <div className="flex justify-center gap-4">
          <a href="#download" className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition">
            Descargar Ahora
          </a>
          <a href="#how-it-works" className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-blue-600 hover:text-white transition">
            ¿Cómo funciona?
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">Por qué elegir RifaMóvil</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="text-4xl mb-4">📱</div>
              <h4 className="text-xl font-semibold mb-2">Celulares de Última Generación</h4>
              <p className="text-gray-600">Gana los últimos modelos de iPhone, Samsung, Xiaomi y más.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="text-4xl mb-4">🎫</div>
              <h4 className="text-xl font-semibold mb-2">Basado en Loterías Colombianas</h4>
              <p className="text-gray-600">Juega con los números de loterías oficiales como Baloto y Lotería de Bogotá.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h4 className="text-xl font-semibold mb-2">Seguro y Transparente</h4>
              <p className="text-gray-600">Plataforma confiable con resultados verificables y pagos seguros.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">Cómo Funciona</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">1</div>
            <h4 className="text-xl font-semibold mb-2">Descarga la App</h4>
            <p className="text-gray-600">Instala RifaMóvil desde Google Play o App Store.</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">2</div>
            <h4 className="text-xl font-semibold mb-2">Elige tus Números</h4>
            <p className="text-gray-600">Selecciona números basados en las loterías de Colombia.</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">3</div>
            <h4 className="text-xl font-semibold mb-2">Gana Premios</h4>
            <p className="text-gray-600">Si tus números coinciden, ¡gana un celular nuevo!</p>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="bg-blue-600 text-white py-16 text-center">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold mb-6">Descarga RifaMóvil Hoy</h3>
          <p className="text-lg mb-8 max-w-xl mx-auto">Únete a miles de colombianos que ya están ganando con RifaMóvil. ¡Tu próximo celular está a un clic de distancia!</p>
          <div className="flex justify-center gap-4">
            <a href="#" className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition">Google Play</a>
            <a href="#" className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition">App Store</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-4">&copy; 2025 RifaMóvil. Todos los derechos reservados.</p>
          <div className="space-x-4">
            <a href="#" className="hover:text-blue-300">Términos y Condiciones</a>
            <a href="#" className="hover:text-blue-300">Política de Privacidad</a>
            <a href="#" className="hover:text-blue-300">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
