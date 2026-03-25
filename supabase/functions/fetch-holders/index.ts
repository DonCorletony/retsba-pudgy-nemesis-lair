import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONTRACT_ADDRESS = '0x52629ddbf28aa01aa22b994ec9c80273e4eb5b0a';
const ABSCAN_API_URL = 'https://api.abscan.org/api';
const ABSTRACT_RPC_URL = 'https://api.mainnet.abs.xyz';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify command center password
    const { password } = await req.json();
    const storedPassword = Deno.env.get('COMMAND_CENTER_PASSWORD');
    if (!password || password !== storedPassword) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ABSCAN_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch top 100 token holders from Abscan
    const holdersUrl = `${ABSCAN_API_URL}?module=token&action=getTokenHolders&contractaddress=${CONTRACT_ADDRESS}&page=1&offset=100&apikey=${apiKey}`;
    const holdersRes = await fetch(holdersUrl);
    const holdersData = await holdersRes.json();

    if (holdersData.status !== '1' || !holdersData.result) {
      return new Response(JSON.stringify({ error: 'Failed to fetch holders', details: holdersData }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const holders = holdersData.result;

    // Batch fetch tx counts via Abstract RPC
    const batchPayload = holders.map((holder: any, i: number) => ({
      jsonrpc: '2.0',
      method: 'eth_getTransactionCount',
      params: [holder.TokenHolderAddress, 'latest'],
      id: i,
    }));

    const rpcRes = await fetch(ABSTRACT_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchPayload),
    });
    const rpcData = await rpcRes.json();

    // Build a map of address -> tx count
    const txCountMap: Record<string, number> = {};
    if (Array.isArray(rpcData)) {
      for (const item of rpcData) {
        const address = holders[item.id]?.TokenHolderAddress?.toLowerCase();
        if (address && item.result) {
          txCountMap[address] = parseInt(item.result, 16);
        }
      }
    }

    // Combine data
    const result = holders.map((holder: any, i: number) => ({
      rank: i + 1,
      address: holder.TokenHolderAddress,
      balance: holder.TokenHolderQuantity,
      txCount: txCountMap[holder.TokenHolderAddress?.toLowerCase()] || 0,
    }));

    return new Response(JSON.stringify({ holders: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
