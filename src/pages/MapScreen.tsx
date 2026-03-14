import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import ParkingMap from "@/components/ParkingMap";
import SearchBar from "@/components/SearchBar";
import ParkingBottomSheet from "@/components/ParkingBottomSheet";

type ParkingSpot = Tables<"parking_spots">;

const BAKU_CENTER: [number, number] = [40.3693, 49.8371];
const COMMISSION_RATE = 0.1;

const MapScreen = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [center, setCenter] = useState<[number, number]>(BAKU_CENTER);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);

  const fetchSpots = async () => {
    const { data } = await supabase.from("parking_spots").select("*");
    if (data) setSpots(data);
  };

  useEffect(() => {
    fetchSpots();
    
    const channel = supabase
      .channel("parking_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "parking_spots" }, () => {
        fetchSpots();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleReserve = async (spot: ParkingSpot, duration: number) => {
    if (!user) return;
    const totalPrice = Number(spot.price_per_hour) * duration;
    const commission = totalPrice * COMMISSION_RATE;

    const { error: resError } = await supabase.from("reservations").insert({
      user_id: user.id,
      parking_id: spot.id,
      duration,
      total_price: totalPrice,
      platform_commission: commission,
    });

    if (resError) {
      toast({ title: "Error", description: resError.message, variant: "destructive" });
      throw resError;
    }

    await supabase.from("parking_spots").update({ status: "reserved" }).eq("id", spot.id);
    await fetchSpots();
    toast({ title: "Success!", description: `Reserved ${spot.name} for ${duration}h` });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
      <ParkingMap spots={spots} center={center} onSpotClick={setSelectedSpot} />

      {/* Search overlay */}
      <div className="absolute left-4 right-4 top-4 z-[999]">
        <SearchBar onSearch={(lat, lng) => setCenter([lat, lng])} />
      </div>

      {/* User menu */}
      <div className="absolute right-4 top-16 z-[999] flex gap-2">
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
      />
    </div>
  );
};

export default MapScreen;
