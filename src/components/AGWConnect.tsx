import { ConnectButton } from '@rainbow-me/rainbowkit';

/**
 * Unified wallet connect button.
 *
 * Same export name as before (so NavBar / mobile menu render it unchanged), but it now
 * opens RainbowKit's single modal that lists Abstract Global Wallet alongside the EVM
 * wallets (MetaMask/OKX/Rabby/Trust via EIP-6963, Coinbase, and WalletConnect once a
 * projectId is configured). All from the one wagmi config in src/lib/wagmi.ts.
 *
 * Using RainbowKit's default dark-themed button for now; the exact RETSBA black/white
 * outline look can be reapplied later via <ConnectButton.Custom>.
 */
export const AGWConnect = () => {
  return (
    <ConnectButton
      showBalance={false}
      chainStatus="icon"
      accountStatus={{ smallScreen: 'avatar', largeScreen: 'address' }}
    />
  );
};
