/* ---------- Battle Chips: the account ledger ----------
   NOT YET DEPLOYED:  supabase functions deploy bc-ledger
   (no secrets needed — this function only ever credits what the chain proves)

   deposit: the client sends the hash of its transfer to the bank. The function
   reads that transaction from Robinhood Chain itself and credits the SENDER —
   the tx is its own authentication, since only the real depositor's wallet can
   appear as its signer. A hash can only ever credit once (unique ledger ref).

   balance: anyone may read any wallet's balance; the ledger is public.

   Stakes, settlement and withdrawals are the next slice — withdrawals will
   demand a signed challenge from the wallet's key before the bank pays out. */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";
import { createPublicClient, http, defineChain, decodeFunctionData, erc20Abi, formatUnits } from "https://esm.sh/viem@2.21.19";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BANK = "0xed4328e20e72a87b2564c54a803fa21d9bebd28f";
const TOKENS: Record<string, { symbol: string; decimals: number }> = {
  "0x5fc5360d0400a0fd4f2af552add042d716f1d168": { symbol: "USDG", decimals: 6 },
  "0x6d35df127dc8eccb63531b9c2c93d0ce0d27c1f5": { symbol: "LUCKY", decimals: 18 },
};

const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "content-type": "application/json" } });

  try {
    const { action, tx_hash, wallet } = await req.json();
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (action === "balance") {
      if (!wallet) return json(400, { error: "wallet required" });
      const { data, error } = await db.from("bc_balances").select("token, balance")
        .eq("wallet", String(wallet).toLowerCase());
      if (error) return json(500, { error: error.message });
      return json(200, { balances: Object.fromEntries((data ?? []).map((r) => [r.token, Number(r.balance)])) });
    }

    if (action === "deposit") {
      if (!tx_hash) return json(400, { error: "tx_hash required" });
      const chain = createPublicClient({ chain: robinhood, transport: http() });
      const [tx, receipt] = await Promise.all([
        chain.getTransaction({ hash: tx_hash }),
        chain.getTransactionReceipt({ hash: tx_hash }),
      ]);
      if (receipt.status !== "success") return json(409, { error: "transaction did not succeed" });
      const token = TOKENS[(tx.to ?? "").toLowerCase()];
      if (!token) return json(409, { error: "not a transfer of a game token" });
      const call = decodeFunctionData({ abi: erc20Abi, data: tx.input });
      if (call.functionName !== "transfer" || String(call.args[0]).toLowerCase() !== BANK)
        return json(409, { error: "not a transfer to the bank" });
      const amount = Number(formatUnits(call.args[1] as bigint, token.decimals));
      const from = tx.from.toLowerCase();

      // one hash, one credit — the unique (kind, ref) pair enforces it
      const { error } = await db.from("bc_ledger").insert({
        wallet: from, token: token.symbol, delta: amount, kind: "deposit", ref: tx_hash.toLowerCase(),
      });
      if (error) return json(409, { error: `already credited or rejected: ${error.message}` });
      return json(200, { credited: amount, token: token.symbol, wallet: from });
    }

    return json(400, { error: "unknown action" });
  } catch (e) {
    return json(500, { error: (e as Error).message });
  }
});
