'use client';

import { Search } from "lucide-react";

const GameSearchBar = () => (
  <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 shadow-sm">
    <Search className="h-5 w-5 text-gray-400" />
    <input
      type="text"
      placeholder="Buscar juegos"
      className="w-full outline-none text-sm"
    />
  </div>
);
export default GameSearchBar;