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

export default function AdminLayout2({ children }: { children: ReactNode }) {
  return (
    <div className={`${poppins.className} `}>
      <main>{children}</main>
    </div>
  );
}


// components/admin/Layout.tsx
// 'use client';

// import React from 'react';
// import Sidebar from './Sidebar';
// import Header from './Header';

// interface AdminLayoutProps {
//   children: React.ReactNode;
// }

// const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
//   return (
//     <div className="flex h-screen bg-gray-50">
//       <Sidebar />
//       <div className="flex-1 flex flex-col overflow-hidden">
//         <Header />
//         <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default AdminLayout;