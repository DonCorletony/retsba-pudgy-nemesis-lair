import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'

// Abstract Mainnet configuration
const abstractMainnet = {
  id: 2741, // Abstract mainnet chain ID
  name: 'Abstract',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://api.mainnet.abs.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Abstract Explorer', url: 'https://abscan.org' },
  },
} as const

export const config = createConfig({
  chains: [abstractMainnet],
  connectors: [
    injected(),
  ],
  transports: {
    [abstractMainnet.id]: http(),
  },
})