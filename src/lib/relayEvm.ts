// Relay Protocol — EVM ERC20 origin leg (USDC on each chain, MEGA on MegaETH). Like the
// Solana path, this uses Relay end-to-end with destinationCurrency = RETSBA, so Relay does
// the bridge AND the swap and delivers RETSBA on Abstract — no own Uniswap V2 leg. The SDK's
// execute() auto-detects the viem WalletClient (adaptViemWallet) and AUTO-SUBMITS the ERC20
// approve step before the deposit/swap (no hand-rolled approve). Reuses the shared client
// (whose chains are configured in relaySolana.ts) so EVM execute can resolve the origin chain.
import { type Execute } from '@relayprotocol/relay-sdk';
import type { WalletClient } from 'viem';
import { relayClient, quoteRetsbaOut } from './relaySolana';

const ABSTRACT_ID = 2741;
const RETSBA = '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A';

export { quoteRetsbaOut };

/** Quote an ERC20 (USDC/MEGA) -> RETSBA route. `amount` is in the token's base units. */
export async function getEvmTokenQuote(params: {
  user: `0x${string}`;
  recipient: `0x${string}`;
  originChainId: number;
  tokenAddress: string;
  amount: bigint;
}): Promise<Execute> {
  const client = relayClient();
  return client.actions.getQuote({
    chainId: params.originChainId,
    currency: params.tokenAddress,
    toChainId: ABSTRACT_ID,
    toCurrency: RETSBA,
    tradeType: 'EXACT_INPUT',
    user: params.user,
    recipient: params.recipient,
    amount: params.amount.toString(),
  });
}

/**
 * Execute the quote with the connected EVM wallet. `wallet` is a viem WalletClient (from
 * wagmi useWalletClient()); the SDK adapts it and runs approve -> deposit/swap automatically.
 * The wallet must already be on the origin chain (caller does switchChainAsync first).
 */
export async function executeEvmBuy(params: {
  quote: Execute;
  wallet: WalletClient;
  onProgress?: (data: unknown) => void;
}) {
  const client = relayClient();
  return client.actions.execute({
    quote: params.quote,
    wallet: params.wallet,
    onProgress: params.onProgress as never,
  });
}
