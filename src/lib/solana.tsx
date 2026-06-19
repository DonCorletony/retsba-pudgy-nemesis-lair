import '@solana/wallet-adapter-react-ui/styles.css';
import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

/**
 * Parallel Solana wallet context, mounted alongside (not inside) the EVM wagmi/RainbowKit
 * stack. It shares no React context with wagmi, so it does NOT reintroduce the
 * double-WagmiProvider "only one wallet works" bug documented in src/lib/wagmi.ts.
 *
 * `wallets={[]}` is intentional: Phantom/Solflare/Backpack/OKX register via the Solana
 * Wallet Standard and are auto-detected, so no per-wallet adapter packages are needed.
 *
 * Public mainnet-beta RPC is rate-limited — set VITE_SOLANA_RPC_URL to a dedicated
 * provider (Helius/QuickNode/Triton) for production, same as the EVM RPCs in wagmi.ts.
 */
const SOLANA_RPC =
  (import.meta.env.VITE_SOLANA_RPC_URL as string | undefined) || 'https://api.mainnet-beta.solana.com';

export const SolanaProvider = ({ children }: { children: React.ReactNode }) => {
  const endpoint = useMemo(() => SOLANA_RPC, []);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
