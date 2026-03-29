import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ABSTRACT_RPC_URL = "https://api.mainnet.abs.xyz";
const TRANSFER_EVENT_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEAD_ADDRESS = "0x000000000000000000000000000000000000dead";
const TOP_N = 1000;
const LOG_BATCH_SIZE = 100000;

// First transfer blocks per token (to skip empty ranges)
const TOKEN_START_BLOCKS: Record<string, number> = {
  retsba: 3400000,
  abster: 3400000,
  god: 3400000,
  polly: 3400000,
};

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

function toHex(n: number) {
  return `0x${n.toString(16)}`;
}

function parseHexBigInt(hex: string): bigint {
  return BigInt(hex);
}

function parseHexNumber(hex: string | null | undefined): number {
  if (!hex) return 0;
  return Number.parseInt(hex, 16);
}

function addressFromTopic(topic: string): string {
  return "0x" + topic.slice(26).toLowerCase();
}

async function rpcRequest<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(ABSTRACT_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) throw new Error(`RPC failed: ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.message ?? "RPC error");
  return payload.result as T;
}

async function getAllTransferLogs(contractAddress: string, tokenId: string): Promise<Array<{ from: string; to: string; value: bigint }>> {
  const latestBlockHex = await rpcRequest<string>("eth_blockNumber", []);
  const latestBlock = parseHexNumber(latestBlockHex);
  const startBlock = TOKEN_START_BLOCKS[tokenId] ?? 0;
  const latestBlock = parseHexNumber(latestBlockHex);

  const transfers: Array<{ from: string; to: string; value: bigint }> = [];
  let fromBlock = startBlock;

  console.log(`Fetching transfer logs for ${contractAddress} from block ${startBlock} to ${latestBlock}`);

  while (fromBlock <= latestBlock) {
    const toBlock = Math.min(fromBlock + LOG_BATCH_SIZE - 1, latestBlock);

    try {
      const logs = await rpcRequest<Array<{
        topics: string[];
        data: string;
      }>>("eth_getLogs", [{
        address: contractAddress,
        topics: [TRANSFER_EVENT_TOPIC],
        fromBlock: toHex(fromBlock),
        toBlock: toHex(toBlock),
      }]);

      for (const log of logs) {
        if (log.topics.length < 3) continue;
        const from = addressFromTopic(log.topics[1]);
        const to = addressFromTopic(log.topics[2]);
        const value = parseHexBigInt(log.data);
        transfers.push({ from, to, value });
      }

      if ((fromBlock % (LOG_BATCH_SIZE * 10)) === 0) {
        console.log(`  Processed blocks ${fromBlock}-${toBlock}, ${transfers.length} transfers so far`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // If batch too large, halve it
      if (msg.includes("too many") || msg.includes("limit") || msg.includes("range")) {
        console.log(`  Block range too large at ${fromBlock}, trying smaller batches`);
        // Retry with smaller range
        const smallBatch = Math.floor(LOG_BATCH_SIZE / 4);
        let subFrom = fromBlock;
        while (subFrom <= toBlock) {
          const subTo = Math.min(subFrom + smallBatch - 1, toBlock);
          const logs = await rpcRequest<Array<{
            topics: string[];
            data: string;
          }>>("eth_getLogs", [{
            address: contractAddress,
            topics: [TRANSFER_EVENT_TOPIC],
            fromBlock: toHex(subFrom),
            toBlock: toHex(subTo),
          }]);
          for (const log of logs) {
            if (log.topics.length < 3) continue;
            transfers.push({
              from: addressFromTopic(log.topics[1]),
              to: addressFromTopic(log.topics[2]),
              value: parseHexBigInt(log.data),
            });
          }
          subFrom = subTo + 1;
        }
      } else {
        throw e;
      }
    }

    fromBlock = toBlock + 1;
  }

  console.log(`Total transfers found: ${transfers.length}`);
  return transfers;
}

function computeBalances(transfers: Array<{ from: string; to: string; value: bigint }>): Map<string, bigint> {
  const balances = new Map<string, bigint>();

  for (const tx of transfers) {
    const fromBal = balances.get(tx.from) ?? 0n;
    balances.set(tx.from, fromBal - tx.value);

    const toBal = balances.get(tx.to) ?? 0n;
    balances.set(tx.to, toBal + tx.value);
  }

  // Remove zero/negative, dead, and zero addresses
  const excluded = new Set([ZERO_ADDRESS, DEAD_ADDRESS]);
  for (const [addr, bal] of balances) {
    if (bal <= 0n || excluded.has(addr)) {
      balances.delete(addr);
    }
  }

  return balances;
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

    if (!password || password !== storedPassword) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contractAddress = TOKEN_CONTRACTS[tokenId];
    if (!contractAddress) {
      return new Response(JSON.stringify({ error: "Unsupported token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Seeding holder cache for ${tokenId} (${contractAddress})`);

    const transfers = await getAllTransferLogs(contractAddress);
    const balances = computeBalances(transfers);

    // Sort by balance descending, take top N
    const sorted = [...balances.entries()]
      .sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0))
      .slice(0, TOP_N);

    console.log(`Top ${sorted.length} holders computed. #1: ${sorted[0]?.[1].toString()}, #${sorted.length}: ${sorted[sorted.length - 1]?.[1].toString()}`);

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
    const rows = sorted.map(([address, balance], index) => ({
      token_id: tokenId,
      address,
      rank: index + 1,
      balance: balance.toString(),
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
      topBalance: sorted[0]?.[1].toString(),
      bottomBalance: sorted[sorted.length - 1]?.[1].toString(),
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
