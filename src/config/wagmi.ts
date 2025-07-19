import { createConfig, http } from 'wagmi'
import { metaMask, walletConnect } from 'wagmi/connectors'

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
    metaMask(),
    walletConnect({
      projectId: 'demo', // You should replace this with your actual WalletConnect project ID
      metadata: {
        name: 'RETSBA Trading',
        description: 'Trade RETSBA tokens',
        url: 'https://retsba.com',
        icons: ['https://retsba.com/icon.png']
      }
    }),
  ],
  transports: {
    [abstractMainnet.id]: http(),
  },
})