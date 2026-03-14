import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    const { parking_id, duration } = await req.json();
    if (!parking_id || !duration) throw new Error("Missing parking_id or duration");

    // Get spot
    const { data: spot, error: spotErr } = await supabase
      .from("parking_spots")
      .select("*")
      .eq("id", parking_id)
      .single();
    if (spotErr || !spot) throw new Error("Spot not found");
    if (spot.status !== "available") throw new Error("Spot is not available");
    if (spot.owner_id === user.id) throw new Error("Cannot reserve your own spot");

    const totalPrice = Number(spot.price_per_hour) * duration;
    const commission = totalPrice * 0.1;
    const ownerEarning = totalPrice - commission;

    // Check buyer wallet
    const { data: wallet, error: walletErr } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (walletErr || !wallet) throw new Error("Wallet not found. Please reload.");
    if (Number(wallet.balance) < totalPrice) throw new Error(`Insufficient balance. Need ${totalPrice} AZN, have ${wallet.balance} AZN.`);

    // Deduct from buyer
    await supabase
      .from("wallets")
      .update({ balance: Number(wallet.balance) - totalPrice, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    // Credit owner
    if (spot.owner_id) {
      const { data: ownerWallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", spot.owner_id)
        .single();
      if (ownerWallet) {
        await supabase
          .from("wallets")
          .update({ balance: Number(ownerWallet.balance) + ownerEarning, updated_at: new Date().toISOString() })
          .eq("user_id", spot.owner_id);
      }
    }

    // Create reservation
    const { data: reservation, error: resErr } = await supabase
      .from("reservations")
      .insert({
        user_id: user.id,
        parking_id,
        duration,
        total_price: totalPrice,
        platform_commission: commission,
        status: "active",
      })
      .select()
      .single();
    if (resErr) throw new Error(resErr.message);

    // Mark spot reserved
    await supabase.from("parking_spots").update({ status: "reserved" }).eq("id", parking_id);

    // Log transactions
    await supabase.from("wallet_transactions").insert([
      { user_id: user.id, amount: -totalPrice, type: "payment", description: `Parking: ${spot.name}`, reservation_id: reservation.id },
      ...(spot.owner_id ? [{ user_id: spot.owner_id, amount: ownerEarning, type: "earning", description: `Earning: ${spot.name}`, reservation_id: reservation.id }] : []),
    ]);

    return new Response(JSON.stringify({ success: true, reservation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
