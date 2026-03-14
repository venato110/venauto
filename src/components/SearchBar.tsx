import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (lat: number, lng: number) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (data.length > 0) {
        onSearch(parseFloat(data[0].lat), parseFloat(data[0].lon));
      }
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="glass-card pl-10 pr-4 shadow-lg border-none"
        disabled={searching}
      />
    </form>
  );
};

export default SearchBar;
