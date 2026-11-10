import { Gift, Heart, PlayCircle, Sparkles } from "lucide-react";

const steps = [
  { Icon: PlayCircle, title: 'Mira anuncios', desc: 'Completa la visualización para ganar puntos.' },
  { Icon: Heart, title: 'Dale like', desc: 'Confirma que viste el anuncio con un like.' },
  { Icon: Gift, title: 'Canjea premios', desc: 'Usa tus puntos en la tienda o rifas diarias.' },
];

export default function Sidebar() {
  return (
      <div className="w-full overflow-hidden rounded-2xl bg-white/85 backdrop-blur-xl shadow-xl px-5 py-6 space-y-6 border border-white/40">

        {/* Widget de recompensas */}
        <div className="relative pb-6 border-b border-slate-300/60">
          <div
              className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-gradient-to-br from-amber-300/30 to-cyan-400/20 blur-xl"
              aria-hidden="true"
          />
          <div className="relative flex items-center gap-3.5">
            <div className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/30">
              <Sparkles className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900 leading-tight">Gana mientras descubres</p>
              {/* Texto secundario oscurecido para máximo contraste */}
              <p className="text-sm font-semibold text-slate-700 leading-snug mt-0.5">Acumula puntos con cada anuncio</p>
            </div>
          </div>
        </div>

        {/* Cómo funciona */}
        <div>
          {/* Título de sección con color oscuro y alta legibilidad */}
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">¿Cómo funciona?</h4>
          <ol>
            {steps.map(({ Icon, title, desc }, index) => (
                <li key={title} className="relative flex items-start gap-3.5 pb-6 last:pb-0">
                  {index < steps.length - 1 && (
                      <span className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-300" aria-hidden="true" />
                  )}
                  <div className="relative z-10 w-8 h-8 shrink-0 rounded-full bg-[#03548C] flex items-center justify-center shadow-sm">
                    <Icon className="w-4 h-4 text-white" strokeWidth={2.2} />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-base font-bold text-slate-900">{title}</p>
                    {/* Descripciones con color slate-700 en lugar de grises claros */}
                    <p className="text-sm font-medium text-slate-700 leading-snug mt-0.5">{desc}</p>
                  </div>
                </li>
            ))}
          </ol>
        </div>
      </div>
  );
}