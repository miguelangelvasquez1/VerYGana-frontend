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
    <div className="flex items-center space-x-2 p-4 bg-white rounded-xl shadow">
      <SearchIcon className="text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar por nombre, descripción..."
        className="text-black flex-1 px-4 py-2 rounded-md"
      />
      <button
        onClick={handleSearch}
        className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md "
      >
        Buscar
      </button>
    </div>
  );
};

export default SearchBar;
