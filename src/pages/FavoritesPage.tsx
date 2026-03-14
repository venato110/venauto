import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, MapPin, Search, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import FavoriteButton from "@/components/FavoriteButton";
import { Input } from "@/components/ui/input";

type ParkingSpot = Tables<"parking_spots">;
type SortKey = "name" | "price_low" | "price_high";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "price_low", label: "Price ↑" },
  { value: "price_high", label: "Price ↓" },
];

const FavoritesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");

  const fetchFavorites = async () => {
    if (!user) return;
    const { data: favs } = await supabase
      .from("favorites")
      .select("parking_id")
      .eq("user_id", user.id);
    if (!favs || favs.length === 0) {
      setSpots([]);
      setLoading(false);
      return;
    }
    const ids = favs.map((f) => f.parking_id);
    const { data } = await supabase.from("parking_spots").select("*").in("id", ids);
    setSpots(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const filtered = useMemo(() => {
    let result = spots;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.address || "").toLowerCase().includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      if (sortBy === "price_low") return Number(a.price_per_hour) - Number(b.price_per_hour);
      if (sortBy === "price_high") return Number(b.price_per_hour) - Number(a.price_per_hour);
      return a.name.localeCompare(b.name);
    });
    return result;
  }, [spots, search, sortBy]);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <div className="venato-gradient px-4 pb-6 pt-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/map")} className="rounded-full bg-primary-foreground/20 p-2 backdrop-blur-sm">
            <ArrowLeft className="h-5 w-5 text-primary-foreground" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">My Favorites</h1>
        </div>
      </div>

      <div className="-mt-3 flex-1 rounded-t-3xl bg-background px-4 pt-6 pb-8">
        {/* Search & sort */}
        {spots.length > 0 && (
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search favorites..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex rounded-xl border border-border bg-card overflow-hidden">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    sortBy === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground">Loading...</div>
        ) : spots.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Heart className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No favorites yet</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Tap the heart icon on any spot to save it here</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No matches found</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((spot, i) => (
              <motion.div
                key={spot.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                {spot.image_url && (
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    <img src={spot.image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{spot.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {spot.address || "No address"}
                  </p>
                  <p className="text-sm font-bold text-primary mt-0.5">{spot.price_per_hour} AZN/hr</p>
                </div>
                <FavoriteButton parkingId={spot.id} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
