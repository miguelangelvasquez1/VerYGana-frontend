import { ReactNode } from 'react';
import ComplianceLayout from '@/components/compliance/ComplianceLayout';

export default function Layout({ children }: { children: ReactNode }) {
  return <ComplianceLayout>{children}</ComplianceLayout>;
}
