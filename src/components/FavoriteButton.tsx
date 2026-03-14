import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FavoriteButtonProps {
  parkingId: string;
  className?: string;
}

const FavoriteButton = ({ parkingId, className = "" }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("parking_id", parkingId)
      .maybeSingle()
      .then(({ data }) => setIsFav(!!data));
  }, [user, parkingId]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || loading) return;
    setLoading(true);
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("parking_id", parkingId);
      setIsFav(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, parking_id: parkingId });
      setIsFav(true);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      className={`p-1.5 rounded-full transition-colors ${className}`}
      title={isFav ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={`h-5 w-5 transition-all ${isFav ? "fill-destructive text-destructive" : "text-muted-foreground hover:text-destructive"}`}
      />
    </button>
  );
};

export default FavoriteButton;
