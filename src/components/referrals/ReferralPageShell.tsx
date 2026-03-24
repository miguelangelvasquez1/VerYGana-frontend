'use client';

import { useState, useEffect } from 'react';
import {
  Users, Gift, Trophy, Star, TrendingUp, UserPlus,
  Share2, CheckCircle, Clock, Loader2, MapPin, Ticket
} from 'lucide-react';

import ReferralCodeBox      from '@/components/referrals/ReferralCodeBox';
import ReferralQR           from '@/components/referrals/ReferralQR';
import ReferralStatCard     from '@/components/referrals/ReferralStatCard';
import ReferralShareButtons from '@/components/referrals/ReferralShareButtons';
import ReferralTierCard     from '@/components/referrals/ReferralTierCard';
import { type ReferralInfoDTO, type ReferralItemDTO, getMyReferrals } from '@/services/ReferralService';

// ─── constantes ───────────────────────────────────────────────────────────────
const TIERS = [
  { level: 'Bronze',   minReferrals:  0, ticketsPerReferral: 1, color: 'from-amber-600 to-amber-800'   },
  { level: 'Silver',   minReferrals:  5, ticketsPerReferral: 2, color: 'from-gray-400 to-gray-600'     },
  { level: 'Gold',     minReferrals: 10, ticketsPerReferral: 3, color: 'from-yellow-400 to-yellow-600' },
  { level: 'Platinum', minReferrals: 20, ticketsPerReferral: 4, color: 'from-purple-400 to-purple-600' },
];

const TABS = [
  { id: 'dashboard', label: 'Resumen',      icon: TrendingUp },
  { id: 'invite',    label: 'Invitar',       icon: UserPlus   },
  { id: 'referrals', label: 'Mis Referidos', icon: Users      },
  { id: 'rewards',   label: 'Recompensas',   icon: Gift       },
];

const USER_STATE_LABEL: Record<string, { label: string; className: string }> = {
  ACTIVE:   { label: 'Activo',    className: 'bg-green-100 text-green-800'   },
  INACTIVE: { label: 'Inactivo',  className: 'bg-gray-100 text-gray-600'     },
  BANNED:   { label: 'Baneado',   className: 'bg-red-100 text-red-800'       },
  PENDING:  { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function getCurrentTier(total: number) {
  return TIERS.find((t, i) =>
    total >= t.minReferrals && (i === TIERS.length - 1 || total < TIERS[i + 1].minReferrals)
  );
}
function getNextTier(total: number) {
  const cur = getCurrentTier(total);
  if (!cur) return null;
  const idx = TIERS.indexOf(cur);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}
function getTotalTickets(total: number) {
  const tier = getCurrentTier(total);
  return tier ? total * tier.ticketsPerReferral : total;
}

// ─── componente ───────────────────────────────────────────────────────────────
interface Props {
  info: ReferralInfoDTO;
}

export default function ReferralPageShell({ info }: Props) {
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  const [referrals, setReferrals]               = useState<ReferralItemDTO[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [errorReferrals, setErrorReferrals]     = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== 'referrals') return;
    const load = async () => {
      try {
        setLoadingReferrals(true);
        setErrorReferrals(null);
        setReferrals(await getMyReferrals());
      } catch (e: any) {
        setErrorReferrals(e.message);
      } finally {
        setLoadingReferrals(false);
      }
    };
    load();
  }, [activeTab]);

  if (!info) return null;

  const currentTier  = getCurrentTier(info.totalReferrals);
  const nextTier     = getNextTier(info.totalReferrals);
  const totalTickets = getTotalTickets(info.totalReferrals);

  const sendInvite = () => {
    alert('¡Invitación enviada correctamente!');
    setInviteEmail('');
    setInviteMessage('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border mb-8">
        <div className="flex overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 min-w-max flex items-center justify-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors duration-200 ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Dashboard ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ReferralStatCard
              icon={Users}
              iconBg="bg-green-100"
              iconColor="text-green-600"
              value={info.totalReferrals}
              label="Total referidos"
            />
            <ReferralStatCard
              icon={Ticket}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              value={totalTickets}
              label="Tickets ganados"
              badge={`${currentTier?.ticketsPerReferral} por referido`}
            />
            <ReferralStatCard
              icon={Trophy}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              value={currentTier?.level ?? 'Bronze'}
              label="Nivel actual"
              badge={nextTier ? `${nextTier.minReferrals - info.totalReferrals} para ${nextTier.level}` : 'Máximo'}
            />
          </div>

          {/* Progreso */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-xl font-semibold mb-6">Progreso al siguiente nivel</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nivel actual: <span className="font-medium">{currentTier?.level}</span></span>
                <span className="text-blue-600 font-medium">{info.totalReferrals} referidos</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: nextTier && currentTier
                      ? `${((info.totalReferrals - currentTier.minReferrals) / (nextTier.minReferrals - currentTier.minReferrals)) * 100}%`
                      : '100%',
                  }}
                />
              </div>
              {nextTier ? (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Siguiente: {nextTier.level} (+{nextTier.ticketsPerReferral} tickets/referido)</span>
                  <span>{nextTier.minReferrals} referidos</span>
                </div>
              ) : (
                <p className="text-sm text-purple-600 font-medium text-center">🎉 ¡Nivel máximo alcanzado!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Invite ── */}
      {activeTab === 'invite' && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl p-8 shadow-sm border">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Tu código de referido</h2>
            <div className="flex flex-col lg:flex-row items-center gap-10">
              <div className="flex-1 w-full">
                <ReferralCodeBox referralCode={info.referralCode} referralLink={info.referralLink} />
              </div>
              <ReferralQR base64={info.qrCodeBase64} referralCode={info.referralCode} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-xl font-semibold mb-6">Compartir en redes sociales</h3>
              <ReferralShareButtons referralLink={info.referralLink} />
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-xl font-semibold mb-6">Invitación personalizada</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email del amigo</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="amigo@ejemplo.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje (opcional)</label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="¡Hola! Te invito a conocer esta increíble plataforma..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
                <button
                  onClick={sendInvite}
                  disabled={!inviteEmail}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Enviar invitación
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">¿Cómo funciona?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { Icon: Share2,   bg: 'bg-blue-600',   title: '1. Comparte tu código', desc: 'Envía tu código único a amigos y familiares'              },
                { Icon: UserPlus, bg: 'bg-green-600',  title: '2. Ellos se registran', desc: 'Tus amigos usan tu código al crear su cuenta'             },
                { Icon: Ticket,   bg: 'bg-purple-600', title: '3. Ganas tickets',      desc: 'Recibe tickets de rifa por cada amigo que se registre'    },
              ].map(({ Icon, bg, title, desc }) => (
                <div key={title} className="text-center">
                  <div className={`w-16 h-16 ${bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">{title}</h4>
                  <p className="text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Referrals ── */}
      {activeTab === 'referrals' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold">Mis Referidos ({info.totalReferrals})</h3>
            <p className="text-gray-600 mt-1">Personas que se registraron con tu código</p>
          </div>

          {loadingReferrals && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          )}

          {!loadingReferrals && errorReferrals && (
            <div className="p-6 text-center text-red-600 text-sm">{errorReferrals}</div>
          )}

          {!loadingReferrals && !errorReferrals && referrals.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aún no tienes referidos</p>
              <p className="text-gray-400 text-sm mt-1">Comparte tu código y aparecerán aquí</p>
              <button
                onClick={() => setActiveTab('invite')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
              >
                Invitar amigos
              </button>
            </div>
          )}

          {!loadingReferrals && !errorReferrals && referrals.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Referido', 'Usuario', 'Ubicación', 'Estado', 'Fecha de registro'].map(h => (
                      <th key={h} className="text-left py-4 px-6 font-medium text-gray-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {referrals.map((r, i) => {
                    const state = USER_STATE_LABEL[r.userState] ?? { label: r.userState, className: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <p className="font-medium text-gray-900">{r.name} {r.lastName}</p>
                          <p className="text-sm text-gray-500">{r.email}</p>
                        </td>
                        <td className="py-4 px-6 text-gray-700">@{r.userName}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {r.municipality}, {r.department}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${state.className}`}>
                            {state.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-600 text-sm">
                          {new Date(r.registeredDate).toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Rewards ── */}
      {activeTab === 'rewards' && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl p-8 shadow-sm border">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sistema de Niveles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {TIERS.map((tier) => (
                <ReferralTierCard
                  key={tier.level}
                  {...tier}
                  isCurrent={currentTier?.level === tier.level}
                  isUnlocked={info.totalReferrals >= tier.minReferrals}
                />
              ))}
            </div>
          </div>

          {/* Próximo nivel */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">
              {nextTier ? `¡Próximo a alcanzar ${nextTier.level}!` : '¡Nivel máximo alcanzado!'}
            </h3>
            {nextTier ? (
              <>
                <p className="mb-6">
                  Solo necesitas {nextTier.minReferrals - info.totalReferrals} referidos más para ganar{' '}
                  <strong>{nextTier.ticketsPerReferral} tickets</strong> por cada referido.
                </p>
                <div className="bg-white/20 rounded-lg p-4 mb-6">
                  <p className="text-sm mb-2">Progreso: {info.totalReferrals} / {nextTier.minReferrals}</p>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(info.totalReferrals / nextTier.minReferrals) * 100}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('invite')}
                  className="bg-white text-purple-600 font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Invitar más amigos
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <Trophy className="w-6 h-6" />
                <span className="font-bold">Nivel Platinum — 4 tickets por referido</span>
              </div>
            )}
          </div>

          {/* Términos */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-xl font-semibold mb-6">Términos y beneficios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" /> Beneficios
                </h4>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• 1 ticket de rifa por cada amigo que se registre</li>
                  <li>• Más tickets al subir de nivel</li>
                  <li>• Sin límite de referidos</li>
                  <li>• Los tickets se acreditan inmediatamente</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" /> Condiciones
                </h4>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• El referido debe completar su registro</li>
                  <li>• No se permite auto-referido</li>
                  <li>• Cada usuario solo puede ser referido una vez</li>
                  <li>• Los tickets son válidos para la rifa activa</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="my-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white text-center">
        <h3 className="text-2xl md:text-3xl font-bold mb-4">¡Gana tickets invitando amigos!</h3>
        <p className="text-lg mb-8 text-blue-100">
          Cada amigo que se registre con tu código te da {currentTier?.ticketsPerReferral ?? 1} ticket{(currentTier?.ticketsPerReferral ?? 1) > 1 ? 's' : ''} de rifa
        </p>
        <button
          onClick={() => setActiveTab('invite')}
          className="px-8 py-3 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-colors"
        >
          Invitar amigos
        </button>
      </div>

    </div>
  );
}