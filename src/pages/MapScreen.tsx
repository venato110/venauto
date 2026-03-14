import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Plus, Wallet, List, TrendingUp, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import ParkingMap from "@/components/ParkingMap";
import SearchBar from "@/components/SearchBar";
import ParkingBottomSheet from "@/components/ParkingBottomSheet";
import NotificationBell from "@/components/NotificationBell";
import MapFilters, { Filters, DEFAULT_FILTERS } from "@/components/MapFilters";

type ParkingSpot = Tables<"parking_spots">;

const BAKU_CENTER: [number, number] = [40.3693, 49.8371];

const MapScreen = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [center, setCenter] = useState<[number, number]>(BAKU_CENTER);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const fetchSpots = async () => {
    const { data } = await supabase.from("parking_spots").select("*");
    if (data) setSpots(data);
  };

  const fetchBalance = async () => {
    if (!user) return;
    const { data } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single();
    if (data) setWalletBalance(Number(data.balance));
  };

  useEffect(() => {
    fetchSpots();
    fetchBalance();

    const channel = supabase
      .channel("parking_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "parking_spots" }, () => fetchSpots())
      .on("postgres_changes", { event: "*", schema: "public", table: "wallets" }, () => fetchBalance())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => {
      // Type filter
      if (filters.types.length > 0 && !filters.types.includes((spot as any).listing_type || "garage")) {
        return false;
      }
      // Price range
      const price = Number(spot.price_per_hour);
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }
      // Availability
      if (filters.availableOnly && spot.status !== "available") {
        return false;
      }
      return true;
    });
  }, [spots, filters]);

  const handleReserve = async (spot: ParkingSpot, duration: number) => {
    if (!user) return;

    const { data, error } = await supabase.functions.invoke("process-payment", {
      body: { parking_id: spot.id, duration },
    });

    if (error || data?.error) {
      const msg = data?.error || error?.message || "Payment failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
      throw new Error(msg);
    }

    await fetchSpots();
    await fetchBalance();
    toast({ title: "Reserved!", description: `Paid from wallet. ${spot.name} is yours for ${duration}h.` });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
      <ParkingMap spots={filteredSpots} center={center} onSpotClick={setSelectedSpot} />

      {/* Search + filter overlay */}
      <div className="absolute left-4 right-4 top-4 z-[999]">
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBar onSearch={(lat, lng) => setCenter([lat, lng])} />
          </div>
        </div>
        <div className="relative mt-2 flex justify-end">
          <MapFilters filters={filters} onChange={setFilters} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute right-4 top-28 z-[999] flex flex-col gap-2">
        <div className="relative">
          <NotificationBell />
        </div>
        <button
          onClick={() => navigate("/wallet")}
          className="glass-card flex h-10 items-center gap-2 rounded-full px-3 shadow-lg"
        >
          <Wallet className="h-4 w-4 text-foreground" />
          <span className="text-xs font-bold text-foreground">{walletBalance.toFixed(0)} ₼</span>
        </button>
        <button
          onClick={() => navigate("/add-listing")}
          className="glass-card flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
          title="Add listing"
        >
          <Plus className="h-4 w-4 text-foreground" />
        </button>
        <button
          onClick={() => navigate("/my-listings")}
          className="glass-card flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
          title="My listings"
        >
          <List className="h-4 w-4 text-foreground" />
        </button>
        <button
          onClick={() => navigate("/earnings")}
          className="glass-card flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
          title="Earnings"
        >
          <TrendingUp className="h-4 w-4 text-foreground" />
        </button>
        <button
          onClick={() => navigate("/favorites")}
          className="glass-card flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
          title="Favorites"
        >
          <Heart className="h-4 w-4 text-foreground" />
        </button>
        <button
          onClick={() => navigate("/reservations")}
          className="glass-card flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
        >
          <User className="h-4 w-4 text-foreground" />
        </button>
        <button
          onClick={handleSignOut}
          className="glass-card flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
        >
          <LogOut className="h-4 w-4 text-foreground" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-4 z-[999] glass-card rounded-xl px-4 py-3 shadow-lg">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: "hsl(145, 63%, 42%)" }} />
            <span className="text-foreground">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: "hsl(0, 72%, 51%)" }} />
            <span className="text-foreground">Reserved</span>
          </div>
        </div>
      </div>

      <ParkingBottomSheet
        spot={selectedSpot}
        onClose={() => setSelectedSpot(null)}
        onReserve={handleReserve}
        walletBalance={walletBalance}
      />
    </div>
  );
};

export default MapScreen;
