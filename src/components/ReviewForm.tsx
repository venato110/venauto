import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ReviewFormProps {
  reservationId: string;
  parkingId: string;
  onSubmitted: () => void;
}

const ReviewForm = ({ reservationId, parkingId, onSubmitted }: ReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    setSubmitting(true);

    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      parking_id: parkingId,
      reservation_id: reservationId,
      rating,
      comment: comment || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already reviewed", description: "You've already reviewed this spot." });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Thanks!", description: "Your review has been submitted." });
      onSubmitted();
    }
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-3 rounded-xl bg-muted p-3"
    >
      <p className="text-xs font-medium text-foreground mb-2">Rate your experience</p>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${
                star <= (hoverRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        placeholder="Leave a comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none"
        rows={2}
      />
      <Button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        size="sm"
        className="mt-2 w-full"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </motion.div>
  );
};

export default ReviewForm;
