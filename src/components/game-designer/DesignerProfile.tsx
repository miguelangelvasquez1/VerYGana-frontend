'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Save, Key, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getDesignerProfile,
  updateDesignerProfile,
  changeDesignerPassword,
  type DesignerProfile as ProfileData,
} from '@/services/GameDesignerService';

const fieldCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{title}</h3>
    {children}
  </div>
);

export const DesignerProfile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit form
  const [bio, setBio] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    getDesignerProfile(ctrl.signal)
      .then(p => {
        setProfile(p);
        setBio(p.bio ?? '');
      })
      .catch(err => { if (err?.code !== 'ERR_CANCELED') toast.error('No se pudo cargar el perfil'); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateDesignerProfile({ bio: bio.trim() || undefined });
      setProfile(prev => prev ? { ...prev, bio: bio.trim() || null } : prev);
      toast.success('Perfil actualizado');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Completa ambos campos');
      return;
    }
    setPasswordSaving(true);
    try {
      await changeDesignerPassword({ currentPassword, newPassword });
      toast.success('Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al cambiar la contraseña');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-violet-600" size={32} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Mi perfil</h2>
        <p className="text-sm text-gray-500 mt-0.5">{profile.name} {profile.lastName}</p>
      </div>

      {/* Readonly info */}
      <SectionCard title="Identificación">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg border border-violet-100">
            <BadgeCheck size={18} className="text-violet-600 shrink-0" />
            <div>
              <p className="text-xs text-violet-600 font-medium">Código de diseñador</p>
              <p className="font-mono font-bold text-violet-900 text-sm">{profile.designerCode}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Email</p>
              <p className="font-medium text-gray-800">{profile.email}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Campañas diseñadas</p>
              <p className="font-medium text-gray-800">{profile.campaignsDesigned}</p>
            </div>
            {profile.phone && (
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Teléfono</p>
                <p className="font-medium text-gray-800">{profile.phone}</p>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Editable info */}
      <SectionCard title="Datos personales">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" value={profile.name} readOnly className={fieldCls + ' bg-gray-50 text-gray-500 cursor-default focus:ring-0 focus:border-gray-300 pointer-events-none'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
              <input type="text" value={profile.lastName} readOnly className={fieldCls + ' bg-gray-50 text-gray-500 cursor-default focus:ring-0 focus:border-gray-300 pointer-events-none'} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Cuéntanos sobre ti..."
              className={fieldCls + ' resize-none'}
            />
            <span className="text-xs text-gray-400 float-right">{bio.length}/500</span>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={profileSaving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {profileSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar cambios
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Password change */}
      <SectionCard title="Cambiar contraseña">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className={fieldCls}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className={fieldCls}
              autoComplete="new-password"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {passwordSaving ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
              Cambiar contraseña
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};
