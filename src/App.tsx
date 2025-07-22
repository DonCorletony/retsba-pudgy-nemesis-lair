import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { metaMask, injected, walletConnect } from 'wagmi/connectors'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { abstractWallet } from '@abstract-foundation/agw-react/connectors'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import FreeMoney from "./pages/FreeMoney";
import Test from "./pages/Test";
import Memes from "./pages/Memes";
import CreateAccount from "./pages/CreateAccount";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

import '@rainbow-me/rainbowkit/styles.css';

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
    public: {
      http: ['https://api.mainnet.abs.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Abstract Explorer', url: 'https://abscan.org' },
  },
  testnet: false,
} as const

const queryClient = new QueryClient();

// RainbowKit + AGW configuration
const wagmiConfig = getDefaultConfig({
  appName: 'RETSBA Trading',
  projectId: 'demo',
  chains: [abstractMainnet],
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [abstractWallet],
    },
  ],
})

const App = () => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/freemoney" element={<FreeMoney />} />
                <Route path="/test" element={<Test />} />
                <Route path="/memes" element={<Memes />} />
                <Route path="/createaccount" element={<CreateAccount />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;