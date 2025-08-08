// app/anuncios/components/Sidebar.tsx
export default function Sidebar() {
  return (
    <div className="h-full bg-[#0f0f0f] p-4 flex flex-col gap-6 border-r border-gray-800">
      <button className="text-left hover:text-blue-500">💼 Mis campañas</button>
      <button className="text-left hover:text-blue-500">📈 Recompensas</button>
      <button className="text-left hover:text-blue-500">🪙 Monedero</button>
      <button className="text-left hover:text-blue-500">⚙️ Configuración</button>
    </div>
  );
}
