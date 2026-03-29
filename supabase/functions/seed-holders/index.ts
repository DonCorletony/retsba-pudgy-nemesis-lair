import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOP_N = 1250;
const DEAD_ADDRESS = "0x000000000000000000000000000000000000dead";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ABSCAN_API_URL = "https://api.etherscan.io/v2/api";
const ABSCAN_CHAIN_ID = 2741; // Abstract mainnet chain ID

const TOKEN_CONTRACTS: Record<string, string> = {
  retsba: "0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A",
  abster: "0xc325b7e2736A5202bd860F5974D0AA375E57EdE5",
  god: "0x3D72DDD35cadb4e5B22CDB20b36f98077BE84284",
  polly: "0x987CF44F3F5d854eC0703123d7fD003a8b56eBb4",
};

function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing Supabase config");
  return createClient(url, key);
}

interface AbscanHolder {
  TokenHolderAddress: string;
  TokenHolderQuantity: string;
}

async function fetchHoldersFromAbscan(contractAddress: string, apiKey: string): Promise<AbscanHolder[]> {
  const allHolders: AbscanHolder[] = [];
  let page = 1;
  const perPage = 1000;

  while (allHolders.length < TOP_N) {
    const url = `${ABSCAN_API_URL}?chainid=${ABSCAN_CHAIN_ID}&module=token&action=tokenholderlist&contractaddress=${contractAddress}&page=${page}&offset=${perPage}&apikey=${apiKey}`;
    console.log(`Fetching page ${page} from Abscan...`);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Abscan API failed: ${response.status}`);

    const data = await response.json();
    if (data.status !== "1" || !Array.isArray(data.result)) {
      console.log(`Abscan response: ${JSON.stringify(data)}`);
      // If no more results, break
      if (data.message === "No token holder found" || data.result?.length === 0) break;
      throw new Error(`Abscan API error: ${data.message || "Unknown"}`);
    }

    const holders = data.result as AbscanHolder[];
    if (holders.length === 0) break;

    // Filter out dead/zero addresses and zero balances
    const excluded = new Set([DEAD_ADDRESS, ZERO_ADDRESS]);
    for (const h of holders) {
      const addr = h.TokenHolderAddress.toLowerCase();
      if (!excluded.has(addr) && h.TokenHolderQuantity !== "0") {
        allHolders.push(h);
      }
    }

    if (holders.length < perPage) break;
    page++;

    // Rate limit: Abscan typically allows 5 calls/sec
    await new Promise(r => setTimeout(r, 250));
  }

  return allHolders.slice(0, TOP_N);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const password = typeof body?.password === "string" ? body.password : "";
    const tokenId = typeof body?.tokenId === "string" ? body.tokenId.toLowerCase() : "retsba";
    const storedPassword = Deno.env.get("COMMAND_CENTER_PASSWORD");
    const abscanApiKey = Deno.env.get("ABSCAN_API_KEY");

    if (!password || password !== storedPassword) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!abscanApiKey) {
      throw new Error("ABSCAN_API_KEY not configured");
    }

    const contractAddress = TOKEN_CONTRACTS[tokenId];
    if (!contractAddress) {
      return new Response(JSON.stringify({ error: "Unsupported token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Seeding holder cache for ${tokenId} (${contractAddress}) via Abscan API`);

    const holders = await fetchHoldersFromAbscan(contractAddress, abscanApiKey);
    console.log(`Fetched ${holders.length} holders from Abscan`);

    if (holders.length === 0) {
      throw new Error("No holders returned from Abscan API");
    }

    const supabase = getSupabase();

    // Delete existing cache for this token
    const { error: deleteError } = await supabase
      .from("holder_cache")
      .delete()
      .eq("token_id", tokenId);

    if (deleteError) {
      throw new Error(`Failed to clear cache: ${deleteError.message}`);
    }

    // Insert in batches of 100
    const rows = holders.map((h, index) => ({
      token_id: tokenId,
      address: h.TokenHolderAddress.toLowerCase(),
      rank: index + 1,
      balance: h.TokenHolderQuantity,
      tx_count: 0,
      updated_at: new Date(0).toISOString(), // Force tx count refresh on next fetch
    }));

    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error: insertError } = await supabase.from("holder_cache").insert(batch);
      if (insertError) {
        throw new Error(`Failed to insert batch at ${i}: ${insertError.message}`);
      }
    }

    console.log(`Seeded ${rows.length} holders for ${tokenId}`);

    return new Response(JSON.stringify({
      success: true,
      holdersSeeded: rows.length,
      topBalance: holders[0]?.TokenHolderQuantity,
      bottomBalance: holders[holders.length - 1]?.TokenHolderQuantity,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
