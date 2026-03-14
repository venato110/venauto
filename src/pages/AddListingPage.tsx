import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, DollarSign, FileText, Tag, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LISTING_TYPES = [
  { value: "garage", label: "Private Garage", emoji: "🏠" },
  { value: "parking_lot", label: "Parking Lot", emoji: "🅿️" },
  { value: "arena", label: "Arena / Stadium", emoji: "🏟️" },
  { value: "mall", label: "Mall / Shopping Center", emoji: "🏬" },
];

const AddListingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [listingType, setListingType] = useState("garage");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const handleUseMyLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          if (data.display_name) setAddress(data.display_name.split(",").slice(0, 3).join(","));
        } catch {}
        setLocating(false);
      },
      () => {
        toast({ title: "Location error", description: "Could not get your location", variant: "destructive" });
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!latitude || !longitude) {
      toast({ title: "Location required", description: "Please set the location", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("parking_spots").insert({
      name,
      address,
      description,
      price_per_hour: parseFloat(pricePerHour),
      listing_type: listingType,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      owner_id: user.id,
      status: "available",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Listed!", description: "Your parking spot is now live on the map." });
      navigate("/map");
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="venato-gradient px-4 pb-6 pt-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/map")} className="rounded-full bg-primary-foreground/20 p-2 backdrop-blur-sm">
            <ArrowLeft className="h-5 w-5 text-primary-foreground" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">Add Parking Listing</h1>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="-mt-3 flex-1 rounded-t-3xl bg-background px-6 pt-6 pb-8 space-y-4"
      >
        {/* Listing type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {LISTING_TYPES.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => setListingType(t.value)}
                className={`rounded-xl border px-3 py-3 text-left text-sm transition-all ${
                  listingType === t.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <span className="mr-2">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
          <div className="relative">
            <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="e.g. My Garage" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" required />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Price per hour (AZN)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              step="0.5"
              min="0.5"
              placeholder="2.00"
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Description (optional)</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Covered, 24/7 access..." value={description} onChange={(e) => setDescription(e.target.value)} className="pl-10" />
          </div>
        </div>

        {/* Location */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Location</label>
            <Button type="button" variant="ghost" size="sm" onClick={handleUseMyLocation} disabled={locating} className="text-xs gap-1">
              <Locate className="h-3.5 w-3.5" />
              {locating ? "Locating..." : "Use my location"}
            </Button>
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10" required />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Input type="number" step="any" placeholder="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} required />
            <Input type="number" step="any" placeholder="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} required />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Publishing..." : "Publish Listing"}
        </Button>
      </motion.form>
    </div>
  );
};

export default AddListingPage;
