import type { Metadata } from 'next';

import { AlertRules } from '@/components/compliance/alert-rules/AlertRules';

export const metadata: Metadata = { title: 'Reglas de alerta' };

export default function AlertRulesPage() {
  return <AlertRules />;
}
