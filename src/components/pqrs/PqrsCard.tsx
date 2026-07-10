import { MessageSquareText } from "lucide-react";
import { PqrsResponseDTO, PqrsStatus } from "@/types/Pqrs.types";
import PqrsStatusBadge from "./PqrsStatusBadge";
import { formatPqrsDate, pqrsTypeLabel } from "./pqrsMeta";

interface Props {
  pqrs: PqrsResponseDTO;
  onClick: () => void;
}

const PqrsCard = ({ pqrs, onClick }: Props) => {
  const isOverdue =
    pqrs.status !== PqrsStatus.RESUELTA &&
    pqrs.status !== PqrsStatus.CERRADA &&
    new Date(pqrs.dueDate).getTime() < Date.now();

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
    >
      <div className="p-4 sm:p-6 space-y-3">
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {pqrsTypeLabel[pqrs.type]} · #{pqrs.id}
            </p>
            <p className="font-semibold text-gray-900 truncate">{pqrs.subject}</p>
            <p className="text-xs sm:text-sm text-gray-400">
              Creada el <span className="text-gray-600">{formatPqrsDate(pqrs.createdAt)}</span>
            </p>
          </div>
          <PqrsStatusBadge status={pqrs.status} />
        </div>

        <p className="text-sm text-gray-500 line-clamp-2">{pqrs.description}</p>

        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <span className={`text-xs ${isOverdue ? "text-red-500 font-semibold" : "text-gray-400"}`}>
            {isOverdue ? "Vencida · " : "Vence "}
            {formatPqrsDate(pqrs.dueDate)}
          </span>
          {pqrs.response && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#03548C]">
              <MessageSquareText className="w-3.5 h-3.5" />
              Con respuesta
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default PqrsCard;
