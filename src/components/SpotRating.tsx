import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SpotRatingProps {
  parkingId: string;
  compact?: boolean;
}

const SpotRating = ({ parkingId, compact = false }: SpotRatingProps) => {
  const [avg, setAvg] = useState<number | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("rating")
        .eq("parking_id", parkingId);
      if (data && data.length > 0) {
        const sum = data.reduce((a, r) => a + r.rating, 0);
        setAvg(sum / data.length);
        setCount(data.length);
      }
    };
    fetch();
  }, [parkingId]);

  if (avg === null) return null;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="font-medium text-foreground">{avg.toFixed(1)}</span>
        <span className="text-muted-foreground">({count})</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.round(avg) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">
        {avg.toFixed(1)} ({count})
      </span>
    </div>
  );
};

export default SpotRating;
