'use client';

const Banner: React.FC<{ title: string; subtitle: string, color: string }> = ({ title, subtitle, color }) => (
  <div className={`w-full h-40 rounded-2xl bg-gradient-to-r ${color} p-14 text-white shadow`}>
    <h2 className="text-2xl font-bold">{title}</h2>
    <p className="mt-1 text-sm opacity-90">{subtitle}</p>
  </div>
);
export default Banner;