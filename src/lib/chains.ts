import { defineChain } from 'viem';

// Robinhood Chain — Robinhood's L2 (Arbitrum stack, ETH as gas). Too new to be in
// viem/chains, so defined here. Params verified against docs.robinhood.com/chain and
// Relay's live chains API (id 4663, deposits + bridging enabled; USDG bridgeable).
// Swap the explorer for a branded URL if Robinhood publishes one.
export const robinhood = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.chain.robinhood.com'] },
  },
  blockExplorers: {
    default: { name: 'Robinhood Explorer', url: 'https://8crv4vmq6tiu1yqr.blockscout.com' },
  },
});
