import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, X, Check, Car, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";

type ParkingSpot = Tables<"parking_spots">;

interface ParkingBottomSheetProps {
  spot: ParkingSpot | null;
  onClose: () => void;
  onReserve: (spot: ParkingSpot, duration: number) => Promise<void>;
  walletBalance?: number;
}

const COMMISSION_RATE = 0.1;

const ParkingBottomSheet = ({ spot, onClose, onReserve, walletBalance = 0 }: ParkingBottomSheetProps) => {
  const [duration, setDuration] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const totalPrice = spot ? Number(spot.price_per_hour) * duration : 0;
  const canAfford = walletBalance >= totalPrice;

  const handleReserve = async () => {
    if (!spot) return;
    setReserving(true);
    try {
      await onReserve(spot, duration);
      setConfirmed(true);
      setTimeout(() => {
        setConfirmed(false);
        onClose();
      }, 2500);
    } catch {
      // handled upstream
    } finally {
      setReserving(false);
    }
  };

  const handleClose = () => {
    setConfirmed(false);
    setDuration(1);
    onClose();
  };

  const typeEmoji: Record<string, string> = {
    garage: "🏠",
    parking_lot: "🅿️",
    arena: "🏟️",
    mall: "🏬",
  };

  return (
    <AnimatePresence>
      {spot && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-foreground/20"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[1001] rounded-t-3xl bg-card p-6 shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />

            <button onClick={handleClose} className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>

            {confirmed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-6"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-available/10">
                  <Check className="h-8 w-8" style={{ color: "hsl(145, 63%, 42%)" }} />
                </div>
                <h3 className="text-xl font-bold text-foreground">Reserved!</h3>
                <p className="mt-1 text-muted-foreground">Paid from wallet</p>
              </motion.div>
            ) : (
              <>
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
                    {typeEmoji[(spot as any).listing_type] || "🅿️"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{spot.name}</h3>
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {spot.address || "No address"}
                    </div>
                  </div>
                </div>

                <div className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  spot.status === "available"
                    ? "bg-available/10"
                    : "bg-destructive/10 text-destructive"
                }`} style={spot.status === "available" ? { color: "hsl(145, 63%, 42%)" } : {}}>
                  <span className={`h-2 w-2 rounded-full ${
                    spot.status === "available" ? "bg-available" : "bg-destructive"
                  }`} style={spot.status === "available" ? { background: "hsl(145, 63%, 42%)" } : {}} />
                  {spot.status === "available" ? "Available" : "Reserved"}
                </div>

                <div className="mb-4 rounded-xl bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Duration (hours)
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setDuration(Math.max(1, duration - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-card text-foreground shadow-sm"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-bold text-foreground">{duration}</span>
                      <button
                        onClick={() => setDuration(Math.min(12, duration + 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-card text-foreground shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-xl font-bold text-foreground">{totalPrice.toFixed(2)} AZN</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Wallet className="h-3 w-3" /> Wallet balance
                    </span>
                    <span className={`text-xs font-semibold ${canAfford ? "text-foreground" : "text-destructive"}`}>
                      {walletBalance.toFixed(2)} AZN
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleReserve}
                  disabled={spot.status === "reserved" || reserving || !canAfford}
                  className="w-full"
                  size="lg"
                >
                  {reserving
                    ? "Processing..."
                    : spot.status === "reserved"
                    ? "Already Reserved"
                    : !canAfford
                    ? "Insufficient Balance"
                    : `Pay ${totalPrice.toFixed(2)} AZN from Wallet`}
                </Button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ParkingBottomSheet;
