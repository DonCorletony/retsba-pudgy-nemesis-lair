// Relay Protocol — SOLANA-origin leg. Unlike the EVM bridge helper in relay.ts (origin
// native -> Abstract ETH, then our own V2 swap), the Solana path uses Relay end-to-end:
// destinationCurrency = RETSBA, so Relay bridges SOL AND swaps to RETSBA, delivering it to
// the Abstract recipient in a single signable Solana transaction. We therefore use the
// official Relay SDK (getQuote + execute + adaptSolanaWallet) rather than hand-assembling
// the VersionedTransaction from the quote's raw instructions + address-lookup-tables.
import { createClient, getClient, MAINNET_RELAY_API, type Execute } from '@relayprotocol/relay-sdk';
import { adaptSolanaWallet } from '@relayprotocol/relay-svm-wallet-adapter';
import type { Connection, VersionedTransaction, SendOptions } from '@solana/web3.js';

export const SOLANA_RELAY_CHAIN_ID = 792703809; // Relay's numeric id for Solana mainnet
const ABSTRACT_ID = 2741;
const RETSBA = '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A';
const NATIVE_SOL = '11111111111111111111111111111111'; // SystemProgram id = native SOL (9 decimals)

let _client: ReturnType<typeof createClient> | null = null;
function relayClient() {
  if (!_client) {
    _client = createClient({ baseApiUrl: MAINNET_RELAY_API, source: 'retsba.com' });
  }
  return getClient();
}

/** Quote a SOL -> RETSBA(on Abstract) route. `recipient` is the EVM 0x address on Abstract. */
export async function getSolToRetsbaQuote(params: {
  user: string;        // base58 Solana pubkey
  recipient: string;   // 0x EVM address on Abstract
  lamports: bigint;
}): Promise<Execute> {
  const client = relayClient();
  return client.actions.getQuote({
    chainId: SOLANA_RELAY_CHAIN_ID,
    currency: NATIVE_SOL,
    toChainId: ABSTRACT_ID,
    toCurrency: RETSBA,
    tradeType: 'EXACT_INPUT',
    user: params.user,
    recipient: params.recipient,
    amount: params.lamports.toString(),
  });
}

/** Pull the estimated RETSBA output (formatted) from a quote, for display. */
export function quoteRetsbaOut(quote: Execute): string | undefined {
  // details.currencyOut.amountFormatted is the human-readable RETSBA amount.
  return (quote as any)?.details?.currencyOut?.amountFormatted;
}

type WalletSendFn = (tx: VersionedTransaction, options?: SendOptions) => Promise<string>;

/**
 * Execute the quote. `walletAddress` is the base58 pubkey; `sendTransaction` is the
 * wallet-adapter send fn (already bound to the connection) returning a base58 signature —
 * we wrap it to the { signature } shape adaptSolanaWallet expects. One wallet approval.
 */
export async function executeSolToRetsba(params: {
  quote: Execute;
  walletAddress: string;
  connection: Connection;
  sendTransaction: WalletSendFn;
  onProgress?: (data: unknown) => void;
}) {
  const client = relayClient();
  const wallet = adaptSolanaWallet(
    params.walletAddress,
    SOLANA_RELAY_CHAIN_ID,
    params.connection,
    async (tx, options) => ({ signature: await params.sendTransaction(tx, options) }),
  );
  return client.actions.execute({
    quote: params.quote,
    wallet,
    onProgress: params.onProgress as never,
  });
}
