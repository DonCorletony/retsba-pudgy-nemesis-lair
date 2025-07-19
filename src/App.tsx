
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from 'wagmi'
import { metaMask, injected, walletConnect } from 'wagmi/connectors'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import FreeMoney from "./pages/FreeMoney";
import Test from "./pages/Test";
import NotFound from "./pages/NotFound";

// Abstract Mainnet configuration
const abstractMainnet = {
  id: 2741,
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

const queryClient = new QueryClient();

// Create a fresh config each time to prevent auto-connection
const getFreshConfig = () => createConfig({
  chains: [abstractMainnet],
  connectors: [
    metaMask(),
    injected({ target: 'okxWallet' }),
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
  // Completely disable any auto-connection behavior
  multiInjectedProviderDiscovery: false,
})

const App = () => {
  // Get fresh config on each render to prevent persistence
  const wagmiConfig = getFreshConfig();
  
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/freemoney" element={<FreeMoney />} />
              <Route path="/test" element={<Test />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
