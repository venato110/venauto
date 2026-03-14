import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, MapPin, Trash2, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MyListingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchListings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("parking_spots")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setListings(data);
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, [user]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("parking_spots").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Listing removed." });
      await fetchListings();
    }
    setDeleting(null);
  };

  const typeEmoji: Record<string, string> = {
    garage: "🏠",
    parking_lot: "🅿️",
    arena: "🏟️",
    mall: "🏬",
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="venato-gradient px-4 pb-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/map")} className="rounded-full bg-primary-foreground/20 p-2 backdrop-blur-sm">
              <ArrowLeft className="h-5 w-5 text-primary-foreground" />
            </button>
            <h1 className="text-lg font-bold text-primary-foreground">My Listings</h1>
          </div>
          <Button size="sm" variant="secondary" onClick={() => navigate("/add-listing")} className="gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <div className="-mt-3 flex-1 rounded-t-3xl bg-background px-4 pt-6 pb-8 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : listings.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center pt-20 text-center">
            <Car className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground mb-4">No listings yet</p>
            <Button onClick={() => navigate("/add-listing")} className="gap-2">
              <Plus className="h-4 w-4" /> Add Your First Listing
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence>
            {listings.map((spot, i) => (
              <motion.div
                key={spot.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-card p-4 shadow-sm border border-border/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{typeEmoji[spot.listing_type] || "🅿️"}</span>
                      <h3 className="font-semibold text-foreground">{spot.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        spot.status === "available" ? "bg-available/20 text-available" : "bg-destructive/20 text-destructive"
                      }`} style={spot.status === "available" ? { color: "hsl(145, 63%, 42%)" } : {}}>
                        {spot.status}
                      </span>
                    </div>
                    {spot.address && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3" /> {spot.address}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-foreground">{spot.price_per_hour} AZN/hr</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(spot.id)}
                    disabled={deleting === spot.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default MyListingsPage;
