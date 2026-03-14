import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, MapPin, X, Car, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReviewForm from "@/components/ReviewForm";

interface ReservationWithSpot {
  id: string;
  start_time: string;
  duration: number;
  total_price: number;
  status: string;
  created_at: string;
  parking_id: string;
  parking_spots: {
    name: string;
    address: string | null;
  } | null;
}

const CountdownTimer = ({ startTime, duration }: { startTime: string; duration: number }) => {
  const [remaining, setRemaining] = useState("");
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const update = () => {
      const start = new Date(startTime).getTime();
      const end = start + duration * 60 * 60 * 1000;
      const now = Date.now();
      const diff = end - now;
      const total = end - start;

      if (diff <= 0) {
        setRemaining("Expired");
        setProgress(0);
        return;
      }

      setProgress(Math.max(0, (diff / total) * 100));

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      if (h > 0) {
        setRemaining(`${h}h ${m}m ${s}s`);
      } else if (m > 0) {
        setRemaining(`${m}m ${s}s`);
      } else {
        setRemaining(`${s}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime, duration]);

  const isLow = progress < 20;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          Time remaining
        </span>
        <span className={`text-sm font-bold tabular-nums ${isLow ? "text-destructive" : "text-primary"}`}>
          {remaining}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isLow ? "bg-destructive" : "bg-primary"}`}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

const ReservationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<ReservationWithSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "past">("active");
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [showReviewFor, setShowReviewFor] = useState<string | null>(null);

  const fetchReservations = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("reservations")
      .select("id, start_time, duration, total_price, status, created_at, parking_id, parking_spots(name, address)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReservations(data as unknown as ReservationWithSpot[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReservations();
  }, [user]);

  const handleCancel = async (reservation: ReservationWithSpot) => {
    setCancelling(reservation.id);
    const { error } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", reservation.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const { data: res } = await supabase
        .from("reservations")
        .select("parking_id")
        .eq("id", reservation.id)
        .single();
      if (res) {
        await supabase.from("parking_spots").update({ status: "available" }).eq("id", res.parking_id);
      }
      toast({ title: "Cancelled", description: "Reservation has been cancelled." });
      await fetchReservations();
    }
    setCancelling(null);
  };

  const active = reservations.filter((r) => r.status === "active");
  const past = reservations.filter((r) => r.status !== "active");
  const current = tab === "active" ? active : past;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const statusColor = (status: string) => {
    if (status === "active") return "bg-available/20 text-available";
    if (status === "cancelled") return "bg-destructive/20 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="venato-gradient px-4 pb-6 pt-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/map")} className="rounded-full bg-primary-foreground/20 p-2 backdrop-blur-sm">
            <ArrowLeft className="h-5 w-5 text-primary-foreground" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">My Reservations</h1>
        </div>
      </div>

      <div className="flex gap-2 px-4 -mt-3 z-10">
        {(["active", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              tab === t ? "bg-card text-foreground shadow-md" : "bg-transparent text-muted-foreground"
            }`}
          >
            {t === "active" ? `Active (${active.length})` : `Past (${past.length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 px-4 pt-4 pb-6 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : current.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center pt-20 text-center">
            <Car className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              {tab === "active" ? "No active reservations" : "No past reservations"}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {current.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-card p-4 shadow-sm border border-border/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{r.parking_spots?.name ?? "Unknown"}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusColor(r.status)}`}>
                        {r.status}
                      </span>
                    </div>
                    {r.parking_spots?.address && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        {r.parking_spots.address}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {r.duration}h
                      </span>
                      <span className="font-semibold text-foreground">₼{r.total_price.toFixed(2)}</span>
                      <span>{formatDate(r.start_time)}</span>
                    </div>
                  </div>
                  {r.status === "active" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleCancel(r)}
                      disabled={cancelling === r.id}
                    >
                      <X className="h-4 w-4 mr-1" />
                      {cancelling === r.id ? "..." : "Cancel"}
                    </Button>
                  )}
                </div>
                {r.status === "active" && (
                  <CountdownTimer startTime={r.start_time} duration={r.duration} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ReservationsPage;
