import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'

// Abstract Testnet configuration
const abstractTestnet = {
  id: 11124,
  name: 'Abstract Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://api.testnet.abs.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Abstract Explorer', url: 'https://explorer.testnet.abs.xyz' },
  },
} as const

export const config = createConfig({
  chains: [abstractTestnet],
  connectors: [
    injected(),
  ],
  transports: {
    [abstractTestnet.id]: http(),
  },
})