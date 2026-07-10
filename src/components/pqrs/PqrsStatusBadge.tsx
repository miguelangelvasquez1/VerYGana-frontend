import { PqrsStatus } from "@/types/Pqrs.types";
import { pqrsStatusColor, pqrsStatusDot, pqrsStatusLabel } from "./pqrsMeta";

interface Props {
  status: PqrsStatus;
  className?: string;
}

const PqrsStatusBadge = ({ status, className = "" }: Props) => (
  <span
    className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-full shrink-0 ${pqrsStatusColor[status]} ${className}`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${pqrsStatusDot[status]}`} />
    {pqrsStatusLabel[status]}
  </span>
);

export default PqrsStatusBadge;
