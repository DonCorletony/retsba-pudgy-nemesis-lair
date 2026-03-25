import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONTRACT_ADDRESS = "0x52629ddbf28aa01aa22b994ec9c80273e4eb5b0a";
const ABSTRACT_RPC_URL = "https://api.mainnet.abs.xyz";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO_TOPIC = "0x0000000000000000000000000000000000000000000000000000000000000000";
const TOP_N = 250;
const INITIAL_BLOCK_SPAN = 2_000_000;
const MIN_BLOCK_SPAN = 2_000;
const MAX_BLOCK_SPAN = 4_000_000;
const THIRTY_DAYS_BLOCKS = 30 * 24 * 60 * 60;

type RpcSuccess<T> = { jsonrpc: string; id: number; result: T };
type RpcError = { jsonrpc: string; id: number; error: { code: number; message: string } };
type TransferLog = {
  topics: string[];
  data: string;
};

async function rpcCall<T>(payload: unknown): Promise<T> {
  const response = await fetch(ABSTRACT_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`RPC request failed with ${response.status}`);
  }
  return response.json();
}

function topicToAddress(topic: string): string {
  return `0x${topic.slice(-40).toLowerCase()}`;
}

function applyTransferLog(log: TransferLog, balances: Map<string, bigint>) {
  const fromTopic = log.topics[1];
  const toTopic = log.topics[2];
  const value = BigInt(log.data);

  if (fromTopic !== ZERO_TOPIC) {
    const fromAddress = topicToAddress(fromTopic);
    balances.set(fromAddress, (balances.get(fromAddress) ?? 0n) - value);
  }
  if (toTopic !== ZERO_TOPIC) {
    const toAddress = topicToAddress(toTopic);
    balances.set(toAddress, (balances.get(toAddress) ?? 0n) + value);
  }
}

async function fetchLogsForRange(fromBlock: number, toBlock: number): Promise<TransferLog[]> {
  const data = await rpcCall<RpcSuccess<TransferLog[]> | RpcError>({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getLogs",
    params: [{
      fromBlock: `0x${fromBlock.toString(16)}`,
      toBlock: `0x${toBlock.toString(16)}`,
      address: CONTRACT_ADDRESS,
      topics: [TRANSFER_TOPIC],
    }],
  });
  if ("error" in data) {
    throw new Error(data.error.message);
  }
  return data.result ?? [];
}

async function scanBalances(latestBlock: number) {
  const balances = new Map<string, bigint>();
  let processedEvents = 0;
  const startBlock = Math.max(0, latestBlock - THIRTY_DAYS_BLOCKS);
  let fromBlock = startBlock;
  let span = INITIAL_BLOCK_SPAN;

  while (fromBlock <= latestBlock) {
    const toBlock = Math.min(fromBlock + span, latestBlock);
    try {
      const logs = await fetchLogsForRange(fromBlock, toBlock);
      for (const log of logs) {
        applyTransferLog(log, balances);
      }
      processedEvents += logs.length;
      fromBlock = toBlock + 1;
      if (logs.length < 1000 && span < MAX_BLOCK_SPAN) {
        span = Math.min(MAX_BLOCK_SPAN, span * 2);
      } else if (logs.length > 8000 && span > MIN_BLOCK_SPAN) {
        span = Math.max(MIN_BLOCK_SPAN, Math.floor(span / 2));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown RPC error";
      if (message.includes("10000 results") || message.includes("more than 10000 results")) {
        if (span <= MIN_BLOCK_SPAN) {
          throw new Error(`Range still too large at minimum span near block ${fromBlock}`);
        }
        span = Math.max(MIN_BLOCK_SPAN, Math.floor(span / 2));
        continue;
      }
      throw error;
    }
  }
  return { balances, processedEvents };
}

async function saveSnapshot(totalHolders: number, totalTxns: number) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return;

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const today = new Date().toISOString().split("T")[0];

    await supabase.from("holder_snapshots").upsert(
      { snapshot_date: today, total_holders: totalHolders, total_txns: totalTxns },
      { onConflict: "snapshot_date" }
    );
  } catch {
    // Snapshot saving is non-critical; don't fail the request
  }
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

    // If only snapshots requested, return them without scanning
    if (snapshotsOnly) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!supabaseUrl || !serviceRoleKey) {
        return new Response(JSON.stringify({ snapshots: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const supabase = createClient(supabaseUrl, serviceRoleKey);
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

    const latestBlockResponse = await rpcCall<RpcSuccess<string>>({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_blockNumber",
      params: [],
    });

    const latestBlock = parseInt(latestBlockResponse.result, 16);
    const { balances, processedEvents } = await scanBalances(latestBlock);

    const rankedHolders = Array.from(balances.entries())
      .filter(([, balance]) => balance > 0n)
      .sort((a, b) => (a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1))
      .slice(0, TOP_N);

    const txCountResponses = await rpcCall<Array<RpcSuccess<string> | RpcError>>(
      rankedHolders.map(([address], index) => ({
        jsonrpc: "2.0",
        id: index,
        method: "eth_getTransactionCount",
        params: [address, "latest"],
      })),
    );

    const holders = rankedHolders.map(([address, balance], index) => {
      const response = txCountResponses.find((entry) => entry.id === index && "result" in entry);
      return {
        rank: index + 1,
        address,
        balance: balance.toString(),
        txCount: response && "result" in response ? parseInt(response.result, 16) : 0,
      };
    });

    const totalTxns = holders.reduce((sum, h) => sum + h.txCount, 0);
    await saveSnapshot(rankedHolders.length, totalTxns);

    return new Response(JSON.stringify({
      holders,
      processedEvents,
      totalPositiveBalanceHolders: rankedHolders.length,
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
