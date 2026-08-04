/* Everything the funding window needs that the game does not: the Relay SDK and
   the Solana wallet stack. Kept behind a lazy import and mounted only while the
   window is open, so the title screen never pays for it.

   Solana wallets are discovered through the Wallet Standard — Phantom, Solflare
   and friends register themselves — so there's no adapter list to maintain. */
import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SwapWindow } from './SwapWindow';

const SOLANA_RPC = import.meta.env.VITE_SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com';

export const SwapPortal = (props: React.ComponentProps<typeof SwapWindow>) => {
  const endpoint = useMemo(() => SOLANA_RPC, []);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect={false}>
        <WalletModalProvider>
          <SwapWindow {...props} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SwapPortal;
