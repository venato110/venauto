import { useState, useEffect, useRef } from "react";
import { Search, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (lat: number, lng: number) => void;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setShowResults(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: NominatimResult) => {
    setQuery(result.display_name.split(",")[0]);
    setShowResults(false);
    onSearch(parseFloat(result.lat), parseFloat(result.lon));
  };

  return (
    <div ref={containerRef} className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
      <Input
        placeholder="Search location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setShowResults(true)}
        className="glass-card pl-10 pr-10 shadow-lg border-none"
      />
      {query && (
        <button
          onClick={() => { setQuery(""); setResults([]); setShowResults(false); }}
          className="absolute right-3 top-3 z-10"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {showResults && (
        <div className="absolute left-0 right-0 top-12 z-50 glass-card rounded-xl shadow-xl overflow-hidden">
          {results.map((r) => (
            <button
              key={r.place_id}
              onClick={() => handleSelect(r)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b border-border/30 last:border-none"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm text-foreground line-clamp-2">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
