import '../globals.css';
import { Poppins } from 'next/font/google';
import { ReactNode } from 'react';

const poppins = Poppins({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-poppins',
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