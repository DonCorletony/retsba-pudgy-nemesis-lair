import { useQuery } from '@tanstack/react-query';

// Token symbol -> CoinGecko id. Tokens not listed here (e.g. MON, MEGA) simply get no
// USD marker. One cached call covers every symbol the Buy UI uses.
const CG_IDS: Record<string, string> = {
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  AVAX: 'avalanche-2',
  USDC: 'usd-coin',
  USDG: 'global-dollar', // Paxos Global Dollar (Robinhood Chain's stablecoin)
  RETSBA: 'retsba',
};

async function fetchUsdPrices(): Promise<Record<string, number>> {
  const ids = [...new Set(Object.values(CG_IDS))].join(',');
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
  );
  if (!res.ok) throw new Error(`price fetch failed (${res.status})`);
  const data = await res.json();
  const out: Record<string, number> = {};
  for (const [symbol, id] of Object.entries(CG_IDS)) {
    const p = data?.[id]?.usd;
    if (typeof p === 'number') out[symbol] = p;
  }
  return out;
}

/** Cached USD spot prices, refreshed each minute. Non-critical: failures just hide markers. */
export function useUsdPrices() {
  return useQuery({
    queryKey: ['usd-prices'],
    queryFn: fetchUsdPrices,
    refetchInterval: 60_000,
    staleTime: 60_000,
    retry: 1,
  });
}

/** USD value of `amount` of `symbol`, or undefined if the amount/price is unavailable. */
export function usdValue(
  amount: string | number,
  symbol: string,
  prices?: Record<string, number>,
): number | undefined {
  const price = prices?.[symbol];
  const n = Number(amount);
  if (!price || !n || isNaN(n)) return undefined;
  return n * price;
}

/** Compact USD formatter; sub-cent values keep extra precision. */
export function fmtUsd(v: number | undefined): string {
  if (v === undefined) return '';
  if (v > 0 && v < 0.01) return `$${v.toFixed(4)}`;
  return v.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}
