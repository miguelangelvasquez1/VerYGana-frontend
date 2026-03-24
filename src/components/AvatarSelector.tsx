// src/components/AvatarSelector.tsx
import React from "react";
import { AvatarDTO } from "@/services/AvatarService";

interface AvatarSelectorProps {
  avatars: AvatarDTO[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  loading: boolean;
}

export default function AvatarSelector({ avatars, selectedId, onSelect, loading }: AvatarSelectorProps) {
  if (loading) {
    return (
      <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-500">Cargando avatares...</p>
      </div>
    );
  }

  if (avatars.length === 0) {
    return (
      <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg text-center">
        <p className="text-red-500">No se pudieron cargar los avatares. Intenta recargar la página.</p>
      </div>
    );
  }

  return (
    <div>
      <label className="block font-semibold text-gray-700 mb-2">
        Elige tu avatar <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-4 bg-gray-100 border border-gray-200 rounded-lg max-h-56 overflow-y-auto">
        {avatars.map((avatar) => {
          const isSelected = selectedId === avatar.id;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onSelect(avatar.id)}
              title={avatar.name}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all
                ${isSelected
                  ? "border-blue-500 bg-blue-50 scale-105 shadow-md"
                  : "border-transparent hover:border-gray-300 hover:bg-gray-200"
                }`}
            >
              <img
                src={avatar.imageUrl}
                alt={avatar.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <span className="text-xs text-gray-600 truncate w-full text-center">{avatar.name}</span>
            </button>
          );
        })}
      </div>
      {!selectedId && (
        <p className="text-xs text-red-500 mt-1">Debes seleccionar un avatar para continuar</p>
      )}
    </div>
  );
}