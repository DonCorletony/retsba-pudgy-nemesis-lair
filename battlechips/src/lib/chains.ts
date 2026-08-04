import { defineChain } from 'viem';

/* Robinhood Chain — Robinhood's L2 (Arbitrum stack, ETH for gas). Not in
   viem/chains yet, so defined here. Same definition retsba.com uses. */
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
