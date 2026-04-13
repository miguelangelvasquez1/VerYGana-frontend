import { DashboardLayout } from '@/components/commercial/layout/DashboardLayout';
import { Poppins } from 'next/font/google';
import { ReactNode } from 'react';

// Cargar la fuente Poppins
const poppins = Poppins({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export default function CommercialLayout({ children }: { children: ReactNode }) {
  return (
    
      <div className={`${poppins.className} `}>
        <DashboardLayout>
          <main>{children}</main>
        </DashboardLayout>
      </div>
    
  );
}