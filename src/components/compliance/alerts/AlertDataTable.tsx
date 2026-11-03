import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import { parseDataUsed } from '@/lib/compliance/alerts';

// Datos que usó la alerta. Solo se pintan; un JSON ilegible muestra un texto de error (CA-19).
export function AlertDataTable({ dataUsedJson }: { dataUsedJson: string }) {
  const rows = parseDataUsed(dataUsedJson);
  if (rows === null) {
    return (
      <p role="alert" className="rounded-lg bg-cmp-hold-bg px-3 py-2 text-sm text-cmp-hold">
        {A.alertDataUnreadable}
      </p>
    );
  }
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-xs text-cmp-slate">
          <th scope="col" className="py-1 pr-4 font-medium">
            {U.dataKey}
          </th>
          <th scope="col" className="py-1 font-medium">
            {U.dataValue}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-cmp-rule-soft">
        {rows.map((row) => (
          <tr key={row.key}>
            <td className="cmp-mono py-1 pr-4 text-cmp-slate">{row.key}</td>
            <td className="py-1 break-words text-cmp-ink">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
