'use client'

import { useEffect, useState } from 'react'
import { X, Check, Loader2 } from 'lucide-react'
import { getActiveAvatars, type AvatarDTO } from '@/services/AvatarService'
import { updateConsumerAvatar } from '@/services/ConsumerService'

interface Props {
  isOpen: boolean
  currentAvatarUrl: string | null
  onClose: () => void
  onUpdated: () => void
}

export function AvatarPickerModal({ isOpen, currentAvatarUrl, onClose, onUpdated }: Props) {
  const [avatars, setAvatars] = useState<AvatarDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<number | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setError(false)
    getActiveAvatars()
      .then(setAvatars)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [isOpen])

  async function handleSelect(avatarId: number) {
    if (saving !== null) return
    setSaving(avatarId)
    try {
      await updateConsumerAvatar(avatarId)
      onUpdated()
      onClose()
    } catch {
      setSaving(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Cambiar avatar</h2>
          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 max-h-[60dvh] overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          )}

          {error && !loading && (
            <p className="text-center text-sm text-red-500 py-6">
              No se pudieron cargar los avatares. Intenta de nuevo.
            </p>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-4 gap-3">
              {avatars.map((av) => {
                const isSelected = av.imageUrl === currentAvatarUrl
                const isSaving = saving === av.id
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => handleSelect(av.id)}
                    disabled={saving !== null}
                    className={`cursor-pointer relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all active:scale-95 disabled:cursor-not-allowed
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <div className="relative w-14 h-14">
                      <img
                        src={av.imageUrl}
                        alt={av.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      {isSelected && !isSaving && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {isSaving && (
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500 truncate w-full text-center leading-tight">
                      {av.name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
