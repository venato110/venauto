import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Car, DollarSign, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const EarningsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalEarnings: 0, totalReservations: 0, activeListings: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Earnings from wallet transactions
      const { data: txns } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "earning")
        .order("created_at", { ascending: false });

      const earnings = txns || [];
      const totalEarnings = earnings.reduce((sum, t) => sum + Number(t.amount), 0);

      // Count active listings
      const { count: listingCount } = await supabase
        .from("parking_spots")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id);

      // Count reservations on owner's spots
      const { data: ownerSpots } = await supabase
        .from("parking_spots")
        .select("id")
        .eq("owner_id", user.id);

      let totalReservations = 0;
      if (ownerSpots && ownerSpots.length > 0) {
        const ids = ownerSpots.map((s) => s.id);
        const { count } = await supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .in("parking_id", ids);
        totalReservations = count || 0;
      }

      setStats({
        totalEarnings,
        totalReservations,
        activeListings: listingCount || 0,
      });
      setTransactions(earnings);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const statCards = [
    { label: "Total Earnings", value: `${stats.totalEarnings.toFixed(2)} ₼`, icon: TrendingUp, color: "bg-available/10 text-available" },
    { label: "Reservations", value: stats.totalReservations, icon: Car, color: "bg-primary/10 text-primary" },
    { label: "Active Listings", value: stats.activeListings, icon: BarChart3, color: "bg-accent text-accent-foreground" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="venato-gradient px-4 pb-6 pt-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/map")} className="rounded-full bg-primary-foreground/20 p-2 backdrop-blur-sm">
            <ArrowLeft className="h-5 w-5 text-primary-foreground" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">Earnings Dashboard</h1>
        </div>
      </div>

      <div className="-mt-3 flex-1 rounded-t-3xl bg-background px-4 pt-6 pb-8">
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {statCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl bg-card p-4 border border-border/50 shadow-sm text-center"
                >
                  <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full ${card.color}`}>
                    <card.icon className="h-5 w-5" style={card.label === "Total Earnings" ? { color: "hsl(145, 63%, 42%)" } : {}} />
                  </div>
                  <p className="text-lg font-bold text-foreground">{card.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{card.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Earnings chart placeholder + history */}
            <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Earnings History
            </h3>

            {transactions.length === 0 ? (
              <div className="flex flex-col items-center pt-10 text-center">
                <TrendingUp className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No earnings yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start by adding a parking listing!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((txn, i) => (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between rounded-xl bg-card p-3 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-available/10">
                        <TrendingUp className="h-4 w-4" style={{ color: "hsl(145, 63%, 42%)" }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{txn.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(txn.created_at)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold" style={{ color: "hsl(145, 63%, 42%)" }}>
                      +{Number(txn.amount).toFixed(2)} ₼
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EarningsPage;
