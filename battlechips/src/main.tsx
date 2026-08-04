import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig, queryClient } from './lib/wagmi';
import BattleChips from './BattleChips';
import './index.css';

// No StrictMode: it double-invokes effects, which would run the turn timers and
// the opponent's fire loop twice over.
createRoot(document.getElementById('root')!).render(
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider theme={darkTheme()}>
        <BattleChips />
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>,
);
