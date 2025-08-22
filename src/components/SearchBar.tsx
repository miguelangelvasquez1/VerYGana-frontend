import React, {useState} from "react";
import { SearchIcon } from "lucide-react";

interface SearchBarProps {
  onSearch: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    const handleSearch = () => {
        console.log('Buscando:', query);
        //Logica para mostrar productos que coincidan con la busqueda
    };
    return (
        <div className="flex items-center space-x-2 p-4">
            <SearchIcon/>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar..." 
            className="w-2xl px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleSearch} className="px-4 py-2 bg-blue-950 text-white rounded-md hover:bg-blue-700 transition">Buscar</button>
        </div>
    );
};
export default SearchBar;