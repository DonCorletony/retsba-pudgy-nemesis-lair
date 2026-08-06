/* ---------- Battle Chips: the bank's payer ----------
   The ONLY place payouts come from, and the only place the bank's key lives —
   as the BC_BANK_KEY secret, never in any client.

   NOT YET DEPLOYED. Deploy with:
     supabase secrets set BC_BANK_KEY=<private key of the bank wallet>
     supabase functions deploy bc-payout

   What it enforces before a single token leaves the bank:
   1. AGREEMENT — the match has exactly two reports, from different reporters,
      naming the same winner and the same wager. One client's claim is not a
      result. Disagreement pays nobody and leaves the rows for review.
   2. ONE PAYOUT PER MATCH — a bc_payouts row is claimed (unique match_id)
      BEFORE the transfer is attempted, so replaying the request cannot pay
      twice.
   3. THE ECONOMICS — online winners receive 2W minus the 2.5% rake from each
      stake: 1.95W. House-game payouts (2W) will route through here too once
      house verdicts are server-checkable; until then they stay manual.

   Not yet enforced, by honesty: stake verification. Online wagers are not
   escrowed yet; when they are, both reports will carry the stake tx hashes and
   this function will confirm each Transfer to the bank on-chain before paying.
   Until then this function should only be pointed at matches whose stakes have
   been confirmed by hand. */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";
import {
  createWalletClient, http, defineChain, erc20Abi, parseUnits,
} from "https://esm.sh/viem@2.21.19";
import { privateKeyToAccount } from "https://esm.sh/viem@2.21.19/accounts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
});

const TOKENS: Record<string, { address: `0x${string}`; decimals: number }> = {
  USDG: { address: "0x5fc5360d0400a0fd4f2af552add042d716f1d168", decimals: 6 },
  LUCKY: { address: "0x6d35df127Dc8eccB63531B9c2C93D0ce0D27C1f5", decimals: 18 },
};
const ONLINE_FEE_RATE = 0.025;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const bad = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), { status, headers: { ...corsHeaders, "content-type": "application/json" } });

  try {
    const { match_id } = await req.json();
    if (!match_id) return bad(400, "match_id required");

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. agreement
    const { data: reports, error } = await db
      .from("bc_match_reports").select("*").eq("match_id", match_id);
    if (error) return bad(500, error.message);
    if (!reports || reports.length !== 2) return bad(409, `need exactly 2 reports, have ${reports?.length ?? 0}`);
    const [a, b] = reports;
    if (a.reporter === b.reporter) return bad(409, "both reports from one client");
    if (a.winner !== b.winner) return bad(409, "reports disagree on the winner — held for review");
    if (a.wager_token !== b.wager_token || Number(a.wager_amount) !== Number(b.wager_amount))
      return bad(409, "reports disagree on the wager — held for review");
    if (!a.wager_token || !a.wager_amount) return bad(409, "free match — nothing to pay");

    const winnerReport = [a, b].find((r) => r.reporter === r.winner);
    if (!winnerReport?.wallet) return bad(409, "winner has no wallet on file");
    const token = TOKENS[a.wager_token];
    if (!token) return bad(400, `unknown token ${a.wager_token}`);

    // 2. one payout per match — claim before paying
    const amount = Number(a.wager_amount) * 2 * (1 - ONLINE_FEE_RATE);
    const { error: claim } = await db.from("bc_payouts").insert({
      match_id, wallet: winnerReport.wallet, token: a.wager_token, amount,
    });
    if (claim) return bad(409, `already paid or claim failed: ${claim.message}`);

    // 3. the transfer, from the bank
    const account = privateKeyToAccount(Deno.env.get("BC_BANK_KEY")! as `0x${string}`);
    const bank = createWalletClient({ account, chain: robinhood, transport: http() });
    const hash = await bank.writeContract({
      address: token.address,
      abi: erc20Abi,
      functionName: "transfer",
      args: [winnerReport.wallet as `0x${string}`, parseUnits(String(amount), token.decimals)],
    });
    await db.from("bc_payouts").update({ tx_hash: hash }).eq("match_id", match_id);

    return new Response(JSON.stringify({ paid: amount, to: winnerReport.wallet, tx: hash }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    return bad(500, (e as Error).message);
  }
});
