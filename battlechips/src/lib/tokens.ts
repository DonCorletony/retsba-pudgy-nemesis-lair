/* The two tokens the game cares about, both on Robinhood Chain.
 *
 * Kept apart from lib/relay.ts on purpose: the wallet menu shows these balances on
 * every screen, and importing them from the relay module would drag the Relay SDK
 * and the Solana stack into the main bundle — the very thing the funding window's
 * lazy import exists to avoid. */

export const ROBINHOOD_ID = 4663;

export interface Token {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
}

export const USDG: Token = {
  symbol: 'USDG',
  name: 'Global Dollar',
  address: '0x5fc5360d0400a0fd4f2af552add042d716f1d168',
  decimals: 6,
};

export const LUCKY: Token = {
  symbol: 'LUCKY',
  name: 'Lucky',
  address: '0x6d35df127Dc8eccB63531B9c2C93D0ce0D27C1f5',
  decimals: 18,
};

/** What the wallet menu lists, and what the funding window can buy. */
export const GAME_TOKENS: Token[] = [USDG, LUCKY];

/* The house bank. Paid house wagers transfer here on Battle!; payouts from it
   are not automated yet — that needs a signer the client must never hold. */
export const BANK = '0xeD4328E20e72a87B2564C54a803Fa21d9BeBd28F' as const;

/* ---------- the economics, in one place ----------
   House games pay even money: wager W, win, receive 2W back — profit W.
   Online games rake 2.5% from EACH stake: both wager W, the winner receives
   1.95W (their W back plus 0.95W profit), the house keeps 0.05W. */
export const ONLINE_FEE_RATE = 0.025;
export const housePayout = (w: number) => 2 * w;
export const houseProfit = (w: number) => w;
export const onlinePot = (w: number) => 2 * w * (1 - ONLINE_FEE_RATE);
export const onlineProfit = (w: number) => onlinePot(w) - w;
export const onlineRake = (w: number) => 2 * w * ONLINE_FEE_RATE;
