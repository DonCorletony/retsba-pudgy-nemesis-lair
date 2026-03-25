import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CONTRACT_ADDRESS = '0x52629ddbf28aa01aa22b994ec9c80273e4eb5b0a';
const ABSTRACT_RPC_URL = 'https://api.mainnet.abs.xyz';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ZERO_TOPIC = '0x0000000000000000000000000000000000000000000000000000000000000000';
const TOP_N = 250;

async function rpcCall(payload: unknown): Promise<unknown> {
  const res = await fetch(ABSTRACT_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function getTransferLogs(fromBlock: number, toBlock: number): Promise<any[]> {
  const data: any = await rpcCall({
    jsonrpc: '2.0', id: 1, method: 'eth_getLogs',
    params: [{ fromBlock: '0x' + fromBlock.toString(16), toBlock: '0x' + toBlock.toString(16), address: CONTRACT_ADDRESS, topics: [TRANSFER_TOPIC] }],
  });

  if (data.error) {
    if (data.error.code === -32602 && data.error.message?.includes('10000')) {
      // Split and recurse — but run halves in parallel
      const mid = Math.floor((fromBlock + toBlock) / 2);
      const [first, second] = await Promise.all([
        getTransferLogs(fromBlock, mid),
        getTransferLogs(mid + 1, toBlock),
      ]);
      return [...first, ...second];
    }
    throw new Error(data.error.message);
  }
  return data.result || [];
}

function topicToAddress(topic: string): string {
  return '0x' + topic.slice(26).toLowerCase();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();
    const storedPassword = Deno.env.get('COMMAND_CENTER_PASSWORD');
    if (!password || password !== storedPassword) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get latest block
    const blockData: any = await rpcCall({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] });
    const latestBlock = parseInt(blockData.result, 16);

    // Fetch all Transfer events with auto-splitting for large ranges
    const allLogs = await getTransferLogs(0, latestBlock);

    // Compute balances from transfer events
    const balances: Record<string, bigint> = {};
    for (const log of allLogs) {
      const from = topicToAddress(log.topics[1]);
      const to = topicToAddress(log.topics[2]);
      const value = BigInt(log.data);

      if (log.topics[1] !== ZERO_TOPIC) {
        balances[from] = (balances[from] || 0n) - value;
      }
      if (log.topics[2] !== ZERO_TOPIC) {
        balances[to] = (balances[to] || 0n) + value;
      }
    }

    // Sort by balance, take top N
    const sorted = Object.entries(balances)
      .filter(([_, bal]) => bal > 0n)
      .sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0))
      .slice(0, TOP_N);

    const addresses = sorted.map(([addr]) => addr);

    // Batch fetch tx counts (split into chunks of 100 for RPC)
    const txCounts: Record<string, number> = {};
    for (let i = 0; i < addresses.length; i += 100) {
      const chunk = addresses.slice(i, i + 100);
      const batch = chunk.map((addr, j) => ({
        jsonrpc: '2.0', method: 'eth_getTransactionCount',
        params: [addr, 'latest'], id: i + j,
      }));
      const rpcData: any = await rpcCall(batch);
      if (Array.isArray(rpcData)) {
        for (const item of rpcData) {
          if (item.result) {
            txCounts[addresses[item.id]] = parseInt(item.result, 16);
          }
        }
      }
    }

    const holders = sorted.map(([address, balance], i) => ({
      rank: i + 1,
      address,
      balance: balance.toString(),
      txCount: txCounts[address] || 0,
    }));

    return new Response(JSON.stringify({ holders, totalEvents: allLogs.length, totalHolders: Object.keys(balances).filter(k => balances[k] > 0n).length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
