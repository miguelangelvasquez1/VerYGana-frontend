import '../globals.css';
import { Inter, Lato, Open_Sans, Poppins, Roboto } from 'next/font/google';
import { ReactNode } from 'react';

// Cargar la fuente Poppins
const poppins = Poppins({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

// Inter
// const inter = Inter({
//   weight: ['400', '500', '600', '700'],
//   subsets: ['latin'],
//   variable: '--font-inter',
// });

// Roboto
const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

// Open Sans
const openSans = Open_Sans({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-open-sans',
});

// Lato
const lato = Lato({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-lato',
});

export default function AdvertiserLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${poppins.className} `}>
      <main>{children}</main>
    </div>
  );
}