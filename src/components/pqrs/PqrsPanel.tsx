"use client";

import { useEffect, useState } from "react";
import { Loader2, Headset, Plus } from "lucide-react";
import { getMyPqrs } from "@/services/PqrsService";
import { PqrsResponseDTO } from "@/types/Pqrs.types";
import PqrsCard from "./PqrsCard";
import CreatePqrsModal from "./CreatePqrsModal";
import PqrsDetailModal from "./PqrsDetailModal";

const PqrsPanel = () => {
  const [pqrsList, setPqrsList] = useState<PqrsResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyPqrs();
      setPqrsList(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreated = () => {
    setShowCreate(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Mis solicitudes</h2>
          <p className="text-sm text-gray-500">Peticiones, quejas, reclamos y sugerencias que has enviado</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#03548C] text-white text-sm font-semibold rounded-xl hover:bg-[#024270] transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva solicitud
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#03548C]" />
          <p className="text-sm">Cargando solicitudes...</p>
        </div>
      )}

      {!loading && pqrsList.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Headset className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-500">Aún no has enviado solicitudes</p>
          <p className="text-sm text-gray-400 mt-1">Crea una nueva solicitud si necesitas ayuda con algo.</p>
        </div>
      )}

      {!loading && pqrsList.length > 0 && (
        <div className="flex flex-col gap-4">
          {pqrsList.map((pqrs) => (
            <PqrsCard key={pqrs.id} pqrs={pqrs} onClick={() => setSelectedId(pqrs.id)} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePqrsModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}

      {selectedId !== null && (
        <PqrsDetailModal pqrsId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
};

export default PqrsPanel;
