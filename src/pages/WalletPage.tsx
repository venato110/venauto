import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Wallet, Plus, ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const WalletPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [showTopUp, setShowTopUp] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchWallet = async () => {
    if (!user) return;
    
    // Get or create wallet
    let { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!wallet) {
      const { data: newWallet } = await supabase
        .from("wallets")
        .insert({ user_id: user.id, balance: 0 })
        .select()
        .single();
      wallet = newWallet;
    }

    if (wallet) setBalance(Number(wallet.balance));

    const { data: txns } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (txns) setTransactions(txns);
    setLoading(false);
  };

  useEffect(() => {
    fetchWallet();

    const channel = supabase
      .channel("wallet_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "wallets" }, () => fetchWallet())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleTopUp = async () => {
    if (!user || !topUpAmount) return;
    const amount = parseFloat(topUpAmount);
    if (amount <= 0 || isNaN(amount)) return;

    setProcessing(true);
    
    // Update balance
    const newBalance = (balance ?? 0) + amount;
    const { error: walletErr } = await supabase
      .from("wallets")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (walletErr) {
      toast({ title: "Error", description: walletErr.message, variant: "destructive" });
      setProcessing(false);
      return;
    }

    // Log transaction
    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      amount,
      type: "top_up",
      description: "Wallet top-up",
    });

    toast({ title: "Success!", description: `Added ${amount.toFixed(2)} AZN to your wallet` });
    setTopUpAmount("");
    setShowTopUp(false);
    setProcessing(false);
    await fetchWallet();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const txnIcon = (type: string) => {
    if (type === "top_up") return <Plus className="h-4 w-4" />;
    if (type === "earning") return <ArrowDownLeft className="h-4 w-4" />;
    return <ArrowUpRight className="h-4 w-4" />;
  };

  const txnColor = (type: string) => {
    if (type === "top_up" || type === "earning" || type === "refund") return "text-available bg-available/10";
    return "text-destructive bg-destructive/10";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="venato-gradient px-4 pb-10 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/map")} className="rounded-full bg-primary-foreground/20 p-2 backdrop-blur-sm">
            <ArrowLeft className="h-5 w-5 text-primary-foreground" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">Wallet</h1>
        </div>
        <div className="text-center">
          <p className="text-primary-foreground/70 text-sm mb-1">Balance</p>
          {loading ? (
            <div className="h-10 w-24 mx-auto animate-pulse rounded-lg bg-primary-foreground/20" />
          ) : (
            <motion.p
              key={balance}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-bold text-primary-foreground"
            >
              {(balance ?? 0).toFixed(2)} <span className="text-lg">AZN</span>
            </motion.p>
          )}
        </div>
      </div>

      <div className="-mt-5 flex-1 rounded-t-3xl bg-background px-4 pt-6 pb-8">
        {/* Top up */}
        <div className="mb-6">
          {!showTopUp ? (
            <Button onClick={() => setShowTopUp(true)} className="w-full gap-2" size="lg">
              <Plus className="h-4 w-4" /> Top Up Wallet
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
              <div className="flex gap-2">
                {[5, 10, 20, 50].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTopUpAmount(String(amt))}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                      topUpAmount === String(amt)
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {amt} ₼
                  </button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Custom amount"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                min="1"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowTopUp(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleTopUp} disabled={processing || !topUpAmount} className="flex-1">
                  {processing ? "Processing..." : "Add Funds"}
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Transactions */}
        <h3 className="mb-3 text-sm font-semibold text-foreground">Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center pt-10 text-center">
            <Wallet className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {transactions.map((txn, i) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 rounded-xl bg-card p-3 border border-border/50"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${txnColor(txn.type)}`}>
                    {txnIcon(txn.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{txn.description || txn.type}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(txn.created_at)}</p>
                  </div>
                  <span className={`text-sm font-bold ${txn.amount >= 0 ? "text-available" : "text-destructive"}`}
                    style={txn.amount >= 0 ? { color: "hsl(145, 63%, 42%)" } : {}}>
                    {txn.amount >= 0 ? "+" : ""}{Number(txn.amount).toFixed(2)} ₼
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
