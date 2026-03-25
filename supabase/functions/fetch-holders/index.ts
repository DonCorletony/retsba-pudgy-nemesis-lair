import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOP_N = 250;

function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing Supabase config");
  return createClient(url, key);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { password, snapshotsOnly } = body;
    const storedPassword = Deno.env.get("COMMAND_CENTER_PASSWORD");

    if (!password || password !== storedPassword) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getSupabase();

    // Return snapshots for line chart
    if (snapshotsOnly) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data } = await supabase
        .from("holder_snapshots")
        .select("snapshot_date, total_holders, total_txns")
        .gte("snapshot_date", thirtyDaysAgo)
        .order("snapshot_date", { ascending: true });

      return new Response(JSON.stringify({ snapshots: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch cached holders
    const { data: cached, error: cacheError } = await supabase
      .from("holder_cache")
      .select("rank, address, balance, tx_count")
      .order("rank", { ascending: true })
      .limit(TOP_N);

    if (cacheError || !cached || cached.length === 0) {
      return new Response(JSON.stringify({ error: "No cached holder data available" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const holders = cached.map((row) => ({
      rank: row.rank,
      address: row.address,
      balance: row.balance,
      txCount: row.tx_count,
    }));

    // Save daily snapshot
    const totalTxns = holders.reduce((sum, h) => sum + h.txCount, 0);
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("holder_snapshots").upsert(
      { snapshot_date: today, total_holders: holders.length, total_txns: totalTxns },
      { onConflict: "snapshot_date" }
    );

    return new Response(JSON.stringify({
      holders,
      totalPositiveBalanceHolders: holders.length,
      cachedAt: cached[0]?.updated_at ?? null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
