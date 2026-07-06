import React, { useState } from "react";
import { SearchIcon } from "lucide-react";

interface SearchBarProps {
  onSearch: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    onSearch(query.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:p-4 bg-white rounded-xl shadow">
      <SearchIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar productos..."
        className="flex-1 min-w-0 text-sm sm:text-base text-black px-1 sm:px-3 py-1 outline-none focus:outline-none"
      />
      <button
        onClick={handleSearch}
        className="shrink-0 cursor-pointer px-3 sm:px-5 py-1.5 sm:py-2 text-white rounded-lg text-sm font-semibold whitespace-nowrap transition hover:opacity-90"
        style={{ background: "#014C92" }}
      >
        Buscar
      </button>
    </div>
  );
};

export default SearchBar;
