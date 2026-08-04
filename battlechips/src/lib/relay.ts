/* Relay Protocol (https://relay.link) — the whole of the funding flow.
 *
 * Unlike retsba.com, which bridged to native ETH on Abstract and then ran its own
 * Uniswap V2 leg to reach RETSBA, everything here goes through Relay end to end:
 * `toCurrency` is the token we actually want, so Relay does the bridge AND the swap
 * and delivers USDG or LUCKY straight to the recipient on Robinhood Chain. One quote,
 * one execute, and the SDK submits any ERC-20 approve itself.
 */
import {
  createClient,
  getClient,
  MAINNET_RELAY_API,
  convertViemChainToRelayChain,
  type Execute,
} from '@relayprotocol/relay-sdk';
import { adaptSolanaWallet } from '@relayprotocol/relay-svm-wallet-adapter';
import { abstract, mainnet, base, bsc, avalanche, megaeth, monad } from 'viem/chains';
import type { WalletClient } from 'viem';
import type { Connection, VersionedTransaction, SendOptions } from '@solana/web3.js';
import { robinhood } from './chains';
import { GAME_TOKENS, ROBINHOOD_ID } from './tokens';

export { ROBINHOOD_ID };

/** Relay's own numeric id for Solana mainnet. */
export const SOLANA_RELAY_CHAIN_ID = 792703809;
/** SystemProgram id doubles as the "native SOL" currency. */
const NATIVE_SOL = '11111111111111111111111111111111';
export const NATIVE_EVM = '0x0000000000000000000000000000000000000000';

/* ---------- what you can pay with ---------- */

export type OriginChainId = number | 'solana';

export interface ChainOption {
  id: OriginChainId;
  name: string;
  /** Solana can't receive on Robinhood, so it needs an explicit 0x destination. */
  needsRecipient?: boolean;
}

/** `address` is 'native', a 0x EVM token, or a base58 SPL mint. */
export interface TokenOption {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

/** The same origins retsba.com offers. */
export const CHAINS: ChainOption[] = [
  { id: 1, name: 'Ethereum' },
  { id: 8453, name: 'Base' },
  { id: 56, name: 'BNB Chain' },
  { id: 43114, name: 'Avalanche' },
  { id: 'solana', name: 'Solana', needsRecipient: true },
  { id: 2741, name: 'Abstract' },
  { id: 4326, name: 'MegaETH' },
  { id: 143, name: 'Monad' },
  { id: ROBINHOOD_ID, name: 'Robinhood' },
];

/* USDC decimals are 6 everywhere except BNB Chain, where Binance-Peg USDC is 18.
   Amounts always go through parseUnits(amount, token.decimals) rather than
   parseEther, so an 18-decimal assumption can't creep back in. */
export const TOKENS: Record<string, TokenOption[]> = {
  '1': [
    { symbol: 'ETH', name: 'Ethereum', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6 },
  ],
  '8453': [
    { symbol: 'ETH', name: 'Base ETH', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', decimals: 6 },
  ],
  '56': [
    { symbol: 'BNB', name: 'BNB', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin (Binance-Peg)', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18 },
  ],
  '43114': [
    { symbol: 'AVAX', name: 'Avalanche', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', decimals: 6 },
  ],
  solana: [
    { symbol: 'SOL', name: 'Solana', address: 'native', decimals: 9 },
    { symbol: 'USDC', name: 'USD Coin', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  ],
  '2741': [
    { symbol: 'ETH', name: 'Abstract ETH', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin (bridged)', address: '0x84a71ccd554cc1b02749b35d22f684cc8ec987e1', decimals: 6 },
  ],
  '4326': [
    { symbol: 'ETH', name: 'MegaETH', address: 'native', decimals: 18 },
    { symbol: 'MEGA', name: 'MegaETH Token', address: '0x0c833bcdd2dc74d7a8dca82ed011e32d04fe5843', decimals: 18 },
  ],
  '143': [
    { symbol: 'MON', name: 'Monad', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0x754704bc059f8c67012fed69bc8a327a5aafb603', decimals: 6 },
  ],
  [ROBINHOOD_ID]: [
    { symbol: 'ETH', name: 'Robinhood ETH', address: 'native', decimals: 18 },
  ],
};

/* ---------- what you get ---------- */

export interface Destination extends TokenOption {
  blurb: string;
}

const BLURBS: Record<string, string> = {
  USDG: "Robinhood Chain's dollar stablecoin.",
  LUCKY: 'The Lucky Jack Games token.',
};
/** Both live on Robinhood Chain; nothing else is offered. */
export const DESTINATIONS: Destination[] = GAME_TOKENS.map((t) => ({ ...t, blurb: BLURBS[t.symbol] ?? '' }));

/* ---------- client ---------- */

let made = false;
/** Shared client. EVM execute() needs `chains` populated or it throws "chain not found". */
export function relayClient() {
  if (!made) {
    createClient({
      baseApiUrl: MAINNET_RELAY_API,
      source: 'battlechips.app',
      chains: [mainnet, base, bsc, avalanche, abstract, megaeth, monad, robinhood]
        .map(convertViemChainToRelayChain),
    });
    made = true;
  }
  return getClient();
}

const currencyFor = (t: TokenOption, solana: boolean) =>
  t.address !== 'native' ? t.address : solana ? NATIVE_SOL : NATIVE_EVM;

/** Quote `amount` (base units of `from`) into `to` on Robinhood Chain. */
export function getQuote(params: {
  user: string;
  recipient: `0x${string}`;
  originChainId: OriginChainId;
  from: TokenOption;
  to: Destination;
  amount: bigint;
}): Promise<Execute> {
  const solana = params.originChainId === 'solana';
  return relayClient().actions.getQuote({
    chainId: solana ? SOLANA_RELAY_CHAIN_ID : (params.originChainId as number),
    currency: currencyFor(params.from, solana),
    toChainId: ROBINHOOD_ID,
    toCurrency: params.to.address,
    tradeType: 'EXACT_INPUT',
    user: params.user,
    recipient: params.recipient,
    amount: params.amount.toString(),
  });
}

/** Human-readable output amount from a quote, for display only. */
export const quoteOut = (q: Execute): string | undefined =>
  (q as { details?: { currencyOut?: { amountFormatted?: string } } })?.details?.currencyOut?.amountFormatted;

/** What Relay says the route costs, in USD, for display only. */
export const quoteFeeUsd = (q: Execute): string | undefined =>
  (q as { fees?: { relayer?: { amountUsd?: string } } })?.fees?.relayer?.amountUsd;

/** Run an EVM quote. The wallet must already be on the origin chain — the SDK adapts the
 *  viem client and submits any ERC-20 approve before the deposit itself. */
export function executeEvm(params: {
  quote: Execute;
  wallet: WalletClient;
  onProgress?: (d: unknown) => void;
}) {
  return relayClient().actions.execute({
    quote: params.quote,
    wallet: params.wallet,
    onProgress: params.onProgress as never,
  });
}

type SolanaSend = (tx: VersionedTransaction, options?: SendOptions) => Promise<string>;

/** Run a Solana quote. One approval; the adapter wants `{ signature }` back. */
export function executeSolana(params: {
  quote: Execute;
  walletAddress: string;
  connection: Connection;
  sendTransaction: SolanaSend;
  onProgress?: (d: unknown) => void;
}) {
  const wallet = adaptSolanaWallet(
    params.walletAddress,
    SOLANA_RELAY_CHAIN_ID,
    params.connection,
    async (tx, options) => ({ signature: await params.sendTransaction(tx, options) }),
  );
  return relayClient().actions.execute({
    quote: params.quote,
    wallet,
    onProgress: params.onProgress as never,
  });
}
