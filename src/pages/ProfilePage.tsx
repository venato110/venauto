import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut, Mail, User as UserIcon, MapPin, Calendar, Edit2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";

type ParkingSpot = Tables<"parking_spots">;
type Reservation = Tables<"reservations">;

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listings, setListings] = useState<ParkingSpot[]>([]);
  const [reservations, setReservations] = useState<(Reservation & { parking_spots?: { name: string } | null })[]>([]);
  const [activeTab, setActiveTab] = useState<"listings" | "reservations">("listings");

  useEffect(() => {
    if (!user) return;
    // Load profile name
    supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setFullName(data?.full_name || user.user_metadata?.full_name || "");
      });

    // Load user's listings
    supabase
      .from("parking_spots")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setListings(data || []));

    // Load user's reservations
    supabase
      .from("reservations")
      .select("*, parking_spots(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setReservations((data as any) || []));
  }, [user]);

  const handleSaveName = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: user.id, full_name: fullName, email: user.email }, { onConflict: "user_id" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Name updated successfully" });
      setEditing(false);
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const typeEmoji: Record<string, string> = {
    garage: "🏠", parking_lot: "🅿️", arena: "🏟️", mall: "🏬",
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <div className="venato-gradient px-4 pb-10 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/map")} className="rounded-full bg-primary-foreground/20 p-2 backdrop-blur-sm">
              <ArrowLeft className="h-5 w-5 text-primary-foreground" />
            </button>
            <h1 className="text-lg font-bold text-primary-foreground">Profile</h1>
          </div>
          <button onClick={handleSignOut} className="rounded-full bg-primary-foreground/20 p-2 backdrop-blur-sm">
            <LogOut className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
      </div>

      <div className="-mt-6 flex-1 rounded-t-3xl bg-background px-4 pt-6">
        {/* Avatar & name */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <UserIcon className="h-8 w-8 text-primary" />
          </div>
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-48 text-center"
                autoFocus
              />
              <button onClick={handleSaveName} disabled={saving} className="rounded-full bg-primary p-2 text-primary-foreground">
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{fullName || "No name set"}</h2>
              <button onClick={() => setEditing(true)} className="p-1 text-muted-foreground hover:text-foreground">
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            {user?.email}
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-4 flex rounded-xl bg-muted p-1">
          <button
            onClick={() => setActiveTab("listings")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === "listings" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            My Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab("reservations")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === "reservations" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Reservations ({reservations.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === "listings" ? (
          <div className="space-y-3">
            {listings.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No listings yet</p>
            ) : (
              listings.map((spot, i) => (
                <motion.div
                  key={spot.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <span className="text-xl">{typeEmoji[spot.listing_type] || "🅿️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{spot.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{spot.address || "No address"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{spot.price_per_hour} ₼/hr</p>
                    <span className={`text-xs ${spot.status === "available" ? "text-available" : "text-destructive"}`} style={spot.status === "available" ? { color: "hsl(145, 63%, 42%)" } : {}}>
                      {spot.status}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No reservations yet</p>
            ) : (
              reservations.map((res, i) => (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{(res as any).parking_spots?.name || "Spot"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(res.start_time).toLocaleDateString()} · {res.duration}h
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{res.total_price} ₼</p>
                    <span className={`text-xs capitalize ${res.status === "active" ? "text-primary" : "text-muted-foreground"}`}>
                      {res.status}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
