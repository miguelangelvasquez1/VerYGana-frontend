'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import {
  Users, Gift, Trophy, TrendingUp, UserPlus,
  Share2, CheckCircle, Clock, Loader2, MapPin, Ticket
} from 'lucide-react';

import ReferralCodeBox      from '@/components/referrals/ReferralCodeBox';
import ReferralQR           from '@/components/referrals/ReferralQR';
import ReferralStatCard     from '@/components/referrals/ReferralStatCard';
import ReferralShareButtons from '@/components/referrals/ReferralShareButtons';
import ReferralTierCard, { TIER_CONFIG } from '@/components/referrals/ReferralTierCard';
import { tierTheme, levelSheen, LEVEL_BY_LABEL, MEDALLION_BEVEL } from '@/components/levels/levelTheme';
import { type ReferralInfoDTO, type ReferralItemDTO, getMyReferrals } from '@/services/ReferralService';

// ─── Tokens de animación (curvas fuertes, duraciones cortas) ──────────────────
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const listV: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.03 } } };
const itemV: Variants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
};
const panelV: Variants = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT, staggerChildren: 0.06, delayChildren: 0.02 } },
  exit:   { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

// ─── constantes ───────────────────────────────────────────────────────────────
const TIERS = [
  { level: 'Bronce',    minReferrals:  0, ticketsPerReferral: 1, color: '' },
  { level: 'Plata',     minReferrals:  5, ticketsPerReferral: 2, color: '' },
  { level: 'Oro',       minReferrals: 10, ticketsPerReferral: 3, color: '' },
  { level: 'Rubí',      minReferrals: 20, ticketsPerReferral: 4, color: '' },
  { level: 'Esmeralda', minReferrals: 35, ticketsPerReferral: 5, color: '' },
  { level: 'Diamante',  minReferrals: 50, ticketsPerReferral: 6, color: '' },
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
  const reduce = useReducedMotion();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border mb-8">
        <div className="flex overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id)}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              className={`relative flex-1 min-w-max flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors duration-200 ${
                activeTab === id ? 'text-[#00a4ff]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {activeTab === id && (
                <motion.span
                  layoutId="ref-tab-underline"
                  className="absolute left-4 right-4 -bottom-px h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #0089d6, #00a4ff)' }}
                  transition={reduce ? { duration: 0 } : { type: 'spring', duration: 0.5, bounce: 0.18 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">

      {/* ── Dashboard ── */}
      {activeTab === 'dashboard' && (
        <motion.div key="dashboard" className="space-y-8" variants={panelV} initial={reduce ? false : 'hidden'} animate="show" exit="exit">
          <motion.div variants={listV} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ReferralStatCard
              icon={Users}
              iconBg="bg-[#03548C]/10"
              iconColor="text-[#03548C]"
              value={info.totalReferrals}
              label="Total referidos"
            />
            <ReferralStatCard
              icon={Ticket}
              iconBg="bg-[#c9a227]/15"
              iconColor="text-[#c9a227]"
              value={totalTickets}
              label="Tickets ganados"
              badge={`${currentTier?.ticketsPerReferral} por referido`}
            />
            <ReferralStatCard
              icon={(currentTier ? (TIER_CONFIG[currentTier.level] ?? TIER_CONFIG.Bronce) : TIER_CONFIG.Bronce).Icon}
              iconStyle={{
                background: (currentTier ? (TIER_CONFIG[currentTier.level] ?? TIER_CONFIG.Bronce) : TIER_CONFIG.Bronce).bg,
                color: (currentTier ? (TIER_CONFIG[currentTier.level] ?? TIER_CONFIG.Bronce) : TIER_CONFIG.Bronce).bar,
              }}
              value={currentTier?.level ?? 'Bronce'}
              label="Nivel actual"
              badge={nextTier ? `${nextTier.minReferrals - info.totalReferrals} para ${nextTier.level}` : 'Máximo'}
            />
          </motion.div>

          {/* Progreso */}
          {(() => {
            const t = tierTheme(currentTier?.level);
            const levelKey = LEVEL_BY_LABEL[currentTier?.level ?? 'Bronce'];
            const CurIcon = (currentTier ? (TIER_CONFIG[currentTier.level] ?? TIER_CONFIG.Bronce) : TIER_CONFIG.Bronce).Icon;
            return (
              <motion.div variants={itemV} className="bg-white rounded-xl border shadow-sm p-6">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div>
                    <p className="text-gray-500" style={{ fontSize: 11, margin: '0 0 6px', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>
                      Nivel de referidos
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="text-gray-900" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>{currentTier?.level ?? '—'}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, background: t.soft, color: t.on, padding: '3px 10px', borderRadius: 999, fontVariantNumeric: 'tabular-nums' }}>
                        ×{currentTier?.ticketsPerReferral ?? 1} tickets
                      </span>
                    </div>
                  </div>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: levelSheen(levelKey),
                    boxShadow: `${MEDALLION_BEVEL}, 0 8px 20px ${t.accent}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CurIcon style={{ width: 24, height: 24, color: t.onGrad, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />
                  </div>
                </div>

                {/* Métricas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: '1rem' }}>
                  <div className="bg-gray-50" style={{ borderRadius: 12, padding: 14 }}>
                    <p className="text-gray-500" style={{ fontSize: 11, margin: '0 0 4px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Referidos totales</p>
                    <p className="text-gray-900" style={{ fontSize: 20, fontWeight: 600, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{info.totalReferrals}</p>
                  </div>
                  <div className="bg-gray-50" style={{ borderRadius: 12, padding: 14 }}>
                    <p className="text-gray-500" style={{ fontSize: 11, margin: '0 0 4px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Tickets ganados</p>
                    <p style={{ fontSize: 20, fontWeight: 600, margin: 0, color: '#c9a227', fontVariantNumeric: 'tabular-nums' }}>{totalTickets}</p>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </motion.div>
      )}

      {/* ── Invite ── */}
      {activeTab === 'invite' && (
        <motion.div key="invite" className="space-y-8" variants={panelV} initial={reduce ? false : 'hidden'} animate="show" exit="exit">
          <motion.div variants={itemV} className="bg-white rounded-xl p-8 shadow-sm border">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Tu código de referido</h2>
            <div className="flex flex-col lg:flex-row items-center gap-10">
              <div className="flex-1 w-full">
                <ReferralCodeBox referralCode={info.referralCode} referralLink={info.referralLink} />
              </div>
              <ReferralQR base64={info.qrCodeBase64} referralCode={info.referralCode} />
            </div>
          </motion.div>

          <motion.div variants={itemV} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03548C] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje (opcional)</label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="¡Hola! Te invito a conocer esta increíble plataforma..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03548C] outline-none resize-none"
                  />
                </div>
                <motion.button
                  onClick={sendInvite}
                  disabled={!inviteEmail}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.15, ease: EASE_OUT }}
                  className="w-full px-6 py-3 bg-[#03548C] text-white rounded-lg hover:bg-[#0b1440] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Enviar invitación
                </motion.button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemV} className="rounded-xl p-8 border" style={{ background: 'linear-gradient(135deg, #EAF4FB, #F3F8FC)', borderColor: '#DCEAF5' }}>
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">¿Cómo funciona?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { Icon: Share2,   bg: '#03548C', title: '1. Comparte tu código', desc: 'Envía tu código único a amigos y familiares'              },
                { Icon: UserPlus, bg: '#0b1440', title: '2. Ellos se registran', desc: 'Tus amigos usan tu código al crear su cuenta'             },
                { Icon: Ticket,   bg: '#00a4ff', title: '3. Ganas tickets',      desc: 'Recibe tickets de rifa por cada amigo que se registre'    },
              ].map(({ Icon, bg, title, desc }) => (
                <div key={title} className="text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: `linear-gradient(135deg, ${bg}, ${bg}CC)`, boxShadow: `${MEDALLION_BEVEL}, 0 8px 18px ${bg}33` }}
                  >
                    <Icon className="w-8 h-8 text-white" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">{title}</h4>
                  <p className="text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── Referrals ── */}
      {activeTab === 'referrals' && (
        <motion.div key="referrals" variants={panelV} initial={reduce ? false : 'hidden'} animate="show" exit="exit" className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold">Mis Referidos ({info.totalReferrals})</h3>
            <p className="text-gray-600 mt-1">Personas que se registraron con tu código</p>
          </div>

          {loadingReferrals && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-[#03548C]" />
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
              <motion.button
                onClick={() => setActiveTab('invite')}
                whileTap={reduce ? undefined : { scale: 0.96 }}
                transition={{ duration: 0.15, ease: EASE_OUT }}
                className="mt-4 px-6 py-2 bg-[#03548C] text-white rounded-lg hover:bg-[#0b1440] text-sm transition-colors"
              >
                Invitar amigos
              </motion.button>
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
                  {referrals.map((r) => {
                    const state = USER_STATE_LABEL[r.userState] ?? { label: r.userState, className: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr key={r.email} className="hover:bg-gray-50">
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
        </motion.div>
      )}

      {/* ── Rewards ── */}
      {activeTab === 'rewards' && (
        <motion.div key="rewards" className="space-y-8" variants={panelV} initial={reduce ? false : 'hidden'} animate="show" exit="exit">
          <motion.div variants={itemV} className="bg-white rounded-xl p-8 shadow-sm border">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sistema de Niveles</h2>
            <motion.div variants={listV} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {TIERS.map((tier) => (
                <ReferralTierCard
                  key={tier.level}
                  {...tier}
                  isCurrent={currentTier?.level === tier.level}
                  isUnlocked={info.totalReferrals >= tier.minReferrals}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Próximo nivel */}
          {(() => {
            const accentLabel = nextTier?.level ?? currentTier?.level;
            const t = tierTheme(accentLabel);
            const levelKey = LEVEL_BY_LABEL[accentLabel ?? 'Bronce'];
            const NextIcon = (nextTier ? TIER_CONFIG[nextTier.level] : currentTier ? TIER_CONFIG[currentTier.level] : undefined)?.Icon ?? Trophy;

            return (
              <motion.div variants={itemV} style={{ background: t.soft, border: `1.5px solid ${t.accent}44`, borderRadius: 'var(--border-radius-lg, 16px)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: t.on, margin: 0 }}>
                    {nextTier ? `Próximo: ${nextTier.level}` : '¡Nivel máximo!'}
                  </h3>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: levelSheen(levelKey),
                    boxShadow: `${MEDALLION_BEVEL}, 0 6px 14px ${t.accent}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <NextIcon style={{ width: 20, height: 20, color: t.onGrad, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />
                  </div>
                </div>

                {nextTier ? (
                  <>
                    <p style={{ fontSize: 13, color: t.on, opacity: 0.85, marginBottom: 14 }}>
                      Gana <strong>{nextTier.ticketsPerReferral} tickets</strong> por cada referido al alcanzar este nivel.
                    </p>
                    <motion.button
                      onClick={() => setActiveTab('invite')}
                      whileTap={reduce ? undefined : { scale: 0.97 }}
                      transition={{ duration: 0.15, ease: EASE_OUT }}
                      style={{ background: t.accent, color: t.onGrad, fontWeight: 600, fontSize: 14, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                    >
                      Invitar más amigos
                    </motion.button>
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: t.on, opacity: 0.85, margin: 0 }}>
                    {currentTier?.ticketsPerReferral} tickets por referido. ¡Felicitaciones!
                  </p>
                )}
              </motion.div>
            );
          })()}

          {/* Términos */}
          <motion.div variants={itemV} className="bg-white rounded-xl p-6 shadow-sm border">
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
          </motion.div>
        </motion.div>
      )}

      </AnimatePresence>

      {/* CTA */}
      <div className="my-12 relative overflow-hidden bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] rounded-2xl p-8 md:p-12 text-white text-center">
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="relative">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">¡Gana tickets invitando amigos!</h3>
          <p className="text-lg mb-8 text-white/70">
            Cada amigo que se registre con tu código te da {currentTier?.ticketsPerReferral ?? 1} ticket{(currentTier?.ticketsPerReferral ?? 1) > 1 ? 's' : ''} de rifa
          </p>
          <motion.button
            onClick={() => setActiveTab('invite')}
            whileTap={reduce ? undefined : { scale: 0.96 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            className="px-8 py-3 bg-white text-[#03548C] font-bold rounded-full hover:bg-gray-100 transition-colors"
          >
            Invitar amigos
          </motion.button>
        </div>
      </div>

    </div>
  );
}