import '@rainbow-me/rainbowkit/styles.css';
import { createConfig, http } from 'wagmi';
import { QueryClient } from '@tanstack/react-query';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  okxWallet,
  phantomWallet,
  rabbyWallet,
  trustWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { robinhood } from './chains';

/**
 * Wallet connectivity for battlechips.app.
 *
 * Ported from retsba.com minus Abstract Global Wallet: this site is
 * Robinhood-native, so there's no AGW connector and no bridge-origin chains.
 * That also removes the reason retsba's config carries its long warning about
 * two competing WagmiProviders — there's only ever one here.
 */

// WalletConnect/Reown project id. PUBLIC client-side identifier (it ships in the
// bundle either way), so embedding a default is fine; override per environment
// with VITE_WC_PROJECT_ID. RainbowKit 2.x's WC-backed wallets throw at load
// without a valid one.
const projectId =
  (import.meta.env.VITE_WC_PROJECT_ID as string | undefined) || '407a4cb72b0def0fe8c3ae7ef8c2fbfc';

const connectors = connectorsForWallets(
  [
    { groupName: 'Popular', wallets: [metaMaskWallet, okxWallet, phantomWallet, walletConnectWallet] },
    { groupName: 'More', wallets: [rabbyWallet, trustWallet] },
  ],
  { appName: 'Battle Chips', projectId },
);

// Robinhood's own RPC can be swapped for a dedicated endpoint per environment.
const robinhoodRpcUrl = import.meta.env.VITE_ROBINHOOD_RPC_URL as string | undefined;

export const wagmiConfig = createConfig({
  connectors,
  // Single-chain dapp: Robinhood is the native chain, so a wallet on anything
  // else reads as an unsupported network and RainbowKit offers the switch.
  chains: [robinhood],
  transports: { [robinhood.id]: http(robinhoodRpcUrl) },
  ssr: false,
  // multiInjectedProviderDiscovery defaults to true → EIP-6963 auto-detect,
  // which is what surfaces an installed wallet that isn't in the list above.
});

export const queryClient = new QueryClient();
