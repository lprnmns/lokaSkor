import React from 'react';
import { Search } from 'lucide-react';

interface SmartSearchBarProps {
  disabled: boolean;
  onSearch: (query: string) => void;
}

const SmartSearchBar: React.FC<SmartSearchBarProps> = ({ disabled, onSearch }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    if (query.trim()) {
      onSearch(query.trim());
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          name="search"
          placeholder="Adres arayın veya koordinat yapıştırın"
          disabled={disabled}
          className={`w-full pl-12 pr-4 py-4 text-lg border border-slate-200 rounded-xl 
            focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 
            transition-all duration-200 bg-white shadow-sm
            ${disabled ? 'opacity-50 pointer-events-none bg-slate-50' : 'hover:shadow-md'}
          `}
        />
      </div>
    </form>
  );
};

export default SmartSearchBar;