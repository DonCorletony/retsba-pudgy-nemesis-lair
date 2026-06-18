// Relay Protocol (https://relay.link) cross-chain bridging helper.
// We use Relay only for the bridge leg: origin native token -> native ETH on Abstract.
// The Abstract ETH -> RETSBA leg is handled by our own Uniswap V2 swap (see BuyBox).
// This mirrors the proven flow from the legacy useBridgeAndSwap.tsx.

const RELAY_API = 'https://api.relay.link';
const NATIVE = '0x0000000000000000000000000000000000000000';
export const ABSTRACT_CHAIN_ID = 2741;

export interface RelayBridgeQuote {
  bridgeTx: { to: `0x${string}`; data: `0x${string}`; value: bigint };
  /** Estimated native ETH that will land on Abstract (for display only). */
  expectedEthOut: bigint;
  requestId?: string;
}

/**
 * Quote a bridge of `amount` of the origin chain's NATIVE token into native ETH on
 * Abstract. EXACT_INPUT — the user specifies how much they send.
 * `recipient` is where the bridged ETH lands on Abstract (we bridge to the user's own
 * address, then our V2 swap directs the resulting RETSBA to the final recipient).
 */
export async function getRelayBridgeQuote(params: {
  user: `0x${string}`;
  recipient: `0x${string}`;
  originChainId: number;
  amount: bigint;
}): Promise<RelayBridgeQuote> {
  const body = {
    user: params.user,
    recipient: params.recipient,
    originChainId: params.originChainId,
    destinationChainId: ABSTRACT_CHAIN_ID,
    originCurrency: NATIVE,
    destinationCurrency: NATIVE,
    amount: params.amount.toString(),
    tradeType: 'EXACT_INPUT',
  };

  const res = await fetch(`${RELAY_API}/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Relay quote failed (${res.status}): ${await res.text()}`);
  }
  const q = await res.json();

  const txData = q?.steps?.[0]?.items?.[0]?.data;
  if (!txData?.to) {
    throw new Error('Relay quote returned no transaction data for this route.');
  }

  // Output amount lives at details.currencyOut.amount in the current API; be defensive.
  const outRaw =
    q?.details?.currencyOut?.amount ??
    q?.details?.currencyOut?.amountRaw ??
    '0';

  return {
    bridgeTx: {
      to: txData.to as `0x${string}`,
      data: (txData.data ?? '0x') as `0x${string}`,
      value: BigInt(txData.value ?? '0'),
    },
    expectedEthOut: BigInt(outRaw),
    requestId: q?.steps?.[0]?.requestId ?? q?.requestId,
  };
}
