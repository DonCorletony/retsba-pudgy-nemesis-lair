import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONTRACT_ADDRESS = "0x52629ddbf28aa01aa22b994ec9c80273e4eb5b0a";
const ABSTRACT_RPC_URL = "https://api.mainnet.abs.xyz";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO_TOPIC = "0x0000000000000000000000000000000000000000000000000000000000000000";
const TOP_N = 250;

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

async function processRange(fromBlock: number, toBlock: number, balances: Map<string, bigint>): Promise<number> {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getLogs",
    params: [{
      fromBlock: `0x${fromBlock.toString(16)}`,
      toBlock: `0x${toBlock.toString(16)}`,
      address: CONTRACT_ADDRESS,
      topics: [TRANSFER_TOPIC],
    }],
  };

  const data = await rpcCall<RpcSuccess<TransferLog[]> | RpcError>(payload);

  if ("error" in data) {
    if (data.error.code === -32602 && data.error.message.includes("10000") && fromBlock < toBlock) {
      const mid = Math.floor((fromBlock + toBlock) / 2);
      const [leftCount, rightCount] = await Promise.all([
        processRange(fromBlock, mid, balances),
        processRange(mid + 1, toBlock, balances),
      ]);
      return leftCount + rightCount;
    }

    throw new Error(data.error.message);
  }

  for (const log of data.result ?? []) {
    applyTransferLog(log, balances);
  }

  return data.result?.length ?? 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();
    const storedPassword = Deno.env.get("COMMAND_CENTER_PASSWORD");

    if (!password || password !== storedPassword) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
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

    const balances = new Map<string, bigint>();
    const processedEvents = await processRange(0, latestBlock, balances);

    const rankedHolders = Array.from(balances.entries())
      .filter(([, balance]) => balance > 0n)
      .sort((a, b) => (a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1))
      .slice(0, TOP_N);

    const txCountRequests = rankedHolders.map(([address], index) => ({
      jsonrpc: "2.0",
      id: index,
      method: "eth_getTransactionCount",
      params: [address, "latest"],
    }));

    const txCountResponses = await rpcCall<Array<RpcSuccess<string> | RpcError>>(txCountRequests);
    const txCounts = new Map<string, number>();

    for (const response of txCountResponses) {
      if ("result" in response) {
        const [address] = rankedHolders[response.id];
        txCounts.set(address, parseInt(response.result, 16));
      }
    }

    const holders = rankedHolders.map(([address, balance], index) => ({
      rank: index + 1,
      address,
      balance: balance.toString(),
      txCount: txCounts.get(address) ?? 0,
    }));

    return new Response(JSON.stringify({
      holders,
      processedEvents,
      totalPositiveBalanceHolders: Array.from(balances.values()).filter((balance) => balance > 0n).length,
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
