import { Poppins } from 'next/font/google';
import { ReactNode } from 'react';

const poppins = Poppins({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
});

export default function GameDesignerLayout({ children }: { children: ReactNode }) {
  return <div className={poppins.className}>{children}</div>;
}
