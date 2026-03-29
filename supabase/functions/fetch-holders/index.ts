import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOP_N = 1250;
const ABSTRACT_RPC_URL = "https://api.mainnet.abs.xyz";
const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;
const CACHE_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
const TX_COUNT_BATCH_SIZE = 100;
const SUPPORTED_TOKEN_IDS = new Set(["retsba", "abster", "god", "polly"]);

type CacheRow = {
  rank: number;
  address: string;
  balance: string;
  tx_count: number;
  updated_at: string;
};

type Holder = {
  rank: number;
  address: string;
  balance: string;
  txCount: number;
};

function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing Supabase config");
  return createClient(url, key);
}

function toHex(value: number) {
  return `0x${value.toString(16)}`;
}

function parseHexNumber(value: string | null | undefined) {
  if (!value) return 0;
  return Number.parseInt(value, 16);
}

function toHolder(row: CacheRow): Holder {
  return {
    rank: row.rank,
    address: row.address,
    balance: row.balance,
    txCount: row.tx_count,
  };
}

async function rpcRequest<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(ABSTRACT_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  if (!response.ok) {
    throw new Error(`RPC request failed for ${method}: ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message ?? `RPC error for ${method}`);
  }

  return payload.result as T;
}

async function fetchTransactionCounts(addresses: string[], blockTag: string): Promise<number[]> {
  const counts: number[] = [];

  for (let i = 0; i < addresses.length; i += TX_COUNT_BATCH_SIZE) {
    const chunk = addresses.slice(i, i + TX_COUNT_BATCH_SIZE);
    const payload = chunk.map((address, index) => ({
      jsonrpc: "2.0",
      id: i + index,
      method: "eth_getTransactionCount",
      params: [address, blockTag],
    }));

    const response = await fetch(ABSTRACT_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Batch tx count request failed: ${response.status}`);
    }

    const batch = await response.json() as Array<{
      id: number;
      result?: string;
      error?: { message?: string };
    }>;

    const resultMap = new Map<number, number>();
    for (const item of batch) {
      if (item.error) {
        throw new Error(item.error.message ?? "RPC batch request failed");
      }
      resultMap.set(item.id, parseHexNumber(item.result));
    }

    chunk.forEach((_, index) => {
      counts.push(resultMap.get(i + index) ?? 0);
    });
  }

  return counts;
}

async function findBlockAtOrAfterTimestamp(targetTimestamp: number, latestBlockNumber: number): Promise<number> {
  const timestampCache = new Map<number, number>();

  const getBlockTimestamp = async (blockNumber: number) => {
    const cached = timestampCache.get(blockNumber);
    if (cached !== undefined) return cached;

    const block = await rpcRequest<{ timestamp: string }>("eth_getBlockByNumber", [toHex(blockNumber), false]);
    const timestamp = parseHexNumber(block.timestamp);
    timestampCache.set(blockNumber, timestamp);
    return timestamp;
  };

  let low = 1;
  let high = latestBlockNumber;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const timestamp = await getBlockTimestamp(mid);

    if (timestamp < targetTimestamp) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

async function refreshTokenCacheIfNeeded(supabase: ReturnType<typeof getSupabase>, tokenId: string): Promise<Holder[]> {
  const { data: cached, error } = await supabase
    .from("holder_cache")
    .select("rank, address, balance, tx_count, updated_at")
    .eq("token_id", tokenId)
    .order("rank", { ascending: true })
    .limit(TOP_N);

  if (error || !cached || cached.length === 0) {
    throw new Error(`No cached holder data for ${tokenId}. Data needs to be seeded first.`);
  }

  const cacheRows = cached as CacheRow[];
  const latestUpdatedAt = Math.max(...cacheRows.map((row) => new Date(row.updated_at).getTime()));
  const shouldRefresh = Number.isNaN(latestUpdatedAt) || (Date.now() - latestUpdatedAt) >= CACHE_REFRESH_INTERVAL_MS;

  if (!shouldRefresh) {
    return cacheRows.map(toHolder);
  }

  console.log(`Refreshing holder tx counts for ${tokenId}`);

  const latestBlockHex = await rpcRequest<string>("eth_blockNumber", []);
  const latestBlockNumber = parseHexNumber(latestBlockHex);
  const latestBlock = await rpcRequest<{ timestamp: string }>("eth_getBlockByNumber", [latestBlockHex, false]);
  const targetTimestamp = parseHexNumber(latestBlock.timestamp) - THIRTY_DAYS_IN_SECONDS;
  const lookbackBlockNumber = await findBlockAtOrAfterTimestamp(targetTimestamp, latestBlockNumber);
  const addresses = cacheRows.map((row) => row.address);

  const [latestCounts, historicalCounts] = await Promise.all([
    fetchTransactionCounts(addresses, "latest"),
    fetchTransactionCounts(addresses, toHex(lookbackBlockNumber)),
  ]);

  const refreshedRows = cacheRows.map((row, index) => ({
    ...row,
    tx_count: Math.max(latestCounts[index] - historicalCounts[index], 0),
    updated_at: new Date().toISOString(),
  }));

  const { error: upsertError } = await supabase.from("holder_cache").upsert(
    refreshedRows.map((row) => ({
      token_id: tokenId,
      address: row.address,
      rank: row.rank,
      balance: row.balance,
      tx_count: row.tx_count,
      updated_at: row.updated_at,
    })),
    { onConflict: "token_id,address" },
  );

  if (upsertError) {
    throw new Error(`Failed to refresh holder cache for ${tokenId}: ${upsertError.message}`);
  }

  console.log(`Refreshed ${refreshedRows.length} holders for ${tokenId} using block ${lookbackBlockNumber}`);
  return refreshedRows.map(toHolder);
}

async function upsertTodaySnapshot(
  supabase: ReturnType<typeof getSupabase>,
  tokenId: string,
  holders: Holder[],
) {
  const today = new Date().toISOString().split("T")[0];
  const totalTxns = holders.reduce((sum, holder) => sum + holder.txCount, 0);

  const { error } = await supabase.from("holder_snapshots").upsert(
    { snapshot_date: today, total_holders: holders.length, total_txns: totalTxns, token_id: tokenId },
    { onConflict: "token_id,snapshot_date" },
  );

  if (error) {
    throw new Error(`Failed to update snapshot for ${tokenId}: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const password = typeof body?.password === "string" ? body.password : "";
    const snapshotsOnly = Boolean(body?.snapshotsOnly);
    const tokenId = typeof body?.tokenId === "string" ? body.tokenId.toLowerCase() : "retsba";
    const storedPassword = Deno.env.get("COMMAND_CENTER_PASSWORD");

    // Allow either the command center password or the abstract txns marker
    if (!password || (password !== storedPassword && password !== "__abstract_txns__")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!SUPPORTED_TOKEN_IDS.has(tokenId)) {
      return new Response(JSON.stringify({ error: "Unsupported token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getSupabase();
    const holders = await refreshTokenCacheIfNeeded(supabase, tokenId);
    await upsertTodaySnapshot(supabase, tokenId, holders);

    // Return snapshots for line chart
    if (snapshotsOnly) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data } = await supabase
        .from("holder_snapshots")
        .select("snapshot_date, total_holders, total_txns")
        .eq("token_id", tokenId)
        .gte("snapshot_date", thirtyDaysAgo)
        .order("snapshot_date", { ascending: true });

      return new Response(JSON.stringify({ snapshots: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      holders,
      totalPositiveBalanceHolders: holders.length,
      cachedAt: null,
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
