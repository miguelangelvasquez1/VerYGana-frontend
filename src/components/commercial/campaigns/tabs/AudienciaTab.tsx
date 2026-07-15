import React from 'react';
import { Loader2, Pencil, Save, Target, X } from 'lucide-react';
import type { Campaign } from '@/services/CampaignService';
import { CampaignTargetingSelector } from '../../branding/CampaignTargetingSelector';
import { InfoRow, fieldCls, genderLabel, missingTargetingFields, type AudienceForm } from '../campaignDetail.shared';

interface Props {
  campaign: Campaign;
  editing: boolean;
  form: AudienceForm;
  onChangeForm: React.Dispatch<React.SetStateAction<AudienceForm>>;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export const AudienciaTab: React.FC<Props> = ({ campaign, editing, form, onChangeForm, saving, onEdit, onCancel, onSave }) => {
  const missing = missingTargetingFields(campaign);

  return (
    <div className="p-5 space-y-4">
      {missing.length > 0 && !editing && (
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <Target size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Segmentación incompleta</p>
            <p className="text-xs text-amber-700 mt-0.5">Completa {missing.join(', ')} para poder activar la campaña.</p>
          </div>
        </div>
      )}

      {editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Género objetivo</label>
              <select
                value={form.targetGender}
                onChange={e => onChangeForm(f => ({ ...f, targetGender: e.target.value as 'ALL' | 'MALE' | 'FEMALE' }))}
                className={fieldCls}
              >
                <option value="ALL">Todos</option>
                <option value="MALE">Hombres</option>
                <option value="FEMALE">Mujeres</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sesiones máx / usuario / día <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.maxSessionsPerUserPerDay}
                onChange={e => onChangeForm(f => ({ ...f, maxSessionsPerUserPerDay: e.target.value }))}
                placeholder="Ej: 3"
                className={fieldCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Edad mínima</label>
              <input type="number" min={13} max={100} value={form.minAge} onChange={e => onChangeForm(f => ({ ...f, minAge: e.target.value }))} placeholder="13" className={fieldCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Edad máxima</label>
              <input type="number" min={13} max={100} value={form.maxAge} onChange={e => onChangeForm(f => ({ ...f, maxAge: e.target.value }))} placeholder="100" className={fieldCls} />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <CampaignTargetingSelector
              selectedCategoryIds={form.categoryIds}
              selectedMunicipalityCodes={form.municipalityCodes}
              onChangeCategoryIds={ids => onChangeForm(f => ({ ...f, categoryIds: ids }))}
              onChangeMunicipalityCodes={codes => onChangeForm(f => ({ ...f, municipalityCodes: codes }))}
              preloadedMunicipalities={campaign.targetMunicipalities}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
              <X size={14} /> Cancelar
            </button>
            <button onClick={onSave} disabled={saving} className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 cursor-pointer">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Audiencia y configuración actual</p>
            <button onClick={onEdit} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors">
              <Pencil size={13} /> Editar
            </button>
          </div>
          <InfoRow label="Género objetivo" value={genderLabel(campaign.targetGender)} />
          <InfoRow
            label="Edad objetivo"
            value={campaign.minAge || campaign.maxAge ? `${campaign.minAge ?? '—'} – ${campaign.maxAge ?? '—'} años` : '—'}
          />
          <InfoRow label="Sesiones máx / usuario / día" value={campaign.maxSessionsPerUserPerDay ?? '—'} />
          <div className="flex gap-3 text-sm">
            <span className="text-gray-500 shrink-0 w-48">Categorías</span>
            {campaign.categories.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {campaign.categories.map(c => (
                  <span key={c.id} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">{c.name}</span>
                ))}
              </div>
            ) : (
              <span className="text-gray-900 font-medium">—</span>
            )}
          </div>
          <div className="flex gap-3 text-sm">
            <span className="text-gray-500 shrink-0 w-48">Municipios</span>
            {campaign.targetMunicipalities.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {campaign.targetMunicipalities.map(m => (
                  <span key={m.code} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">{m.name}</span>
                ))}
              </div>
            ) : (
              <span className="text-gray-900 font-medium">—</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
