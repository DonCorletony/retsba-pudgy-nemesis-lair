import '@rainbow-me/rainbowkit/styles.css';
import { createConfig, http, fallback } from 'wagmi';
import { abstract, mainnet, base, bsc, avalanche, megaeth, monad } from 'viem/chains';
import { QueryClient } from '@tanstack/react-query';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  rabbyWallet,
  okxWallet,
  trustWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { abstractWallet } from '@abstract-foundation/agw-react/connectors';

/**
 * SINGLE source of truth for wallet connectivity.
 *
 * The whole point of this file: AGW and the EVM wallets live in ONE wagmi config
 * under ONE WagmiProvider. The old setup wrapped the app in <AbstractWalletProvider>,
 * which builds its own internal WagmiProvider with ONLY the AGW connector and turns
 * off EIP-6963 — so MetaMask/OKX/etc. could never be registered. Mounting a second
 * WagmiProvider for them created two React contexts and the classic "only one wallet
 * works" bug. Keeping everything in this one config is what fixes it.
 */

// Free WalletConnect/Reown projectId from https://cloud.reown.com.
// Put it in .env as VITE_WC_PROJECT_ID to enable WalletConnect + mobile deep-linking.
const projectId = import.meta.env.VITE_WC_PROJECT_ID ?? '';
const hasWalletConnect = projectId.length > 0;

// IMPORTANT: RainbowKit 2.x's walletConnectWallet (and other WC-backed wallets) throw
// synchronously at module load when projectId is empty, which would white-screen the
// whole app. So until a projectId is set we only list wallets that don't need it.
// Browser-extension wallets (MetaMask/OKX/Rabby/Trust) are still auto-detected via
// EIP-6963 and surface through injectedWallet — they just won't have WC mobile fallback.
const walletGroups = hasWalletConnect
  ? [
      { groupName: 'Abstract', wallets: [abstractWallet] },
      { groupName: 'Popular', wallets: [metaMaskWallet, coinbaseWallet, walletConnectWallet] },
      { groupName: 'More', wallets: [rabbyWallet, okxWallet, trustWallet, injectedWallet] },
    ]
  : [
      { groupName: 'Abstract', wallets: [abstractWallet] },
      { groupName: 'Popular', wallets: [coinbaseWallet, injectedWallet] },
    ];

const connectors = connectorsForWallets(walletGroups, {
  appName: 'RETSBA',
  projectId,
});

// Ethereum mainnet's viem DEFAULT rpc is a third-party (https://eth.merkle.io) that
// frequently rate-limits/blocks browser requests — so useBalance({ chainId: 1 }) silently
// returned nothing, showing native ETH as a 0 balance with no MAX button, while every other
// chain (whose viem defaults are official RPCs) worked. Use reliable public endpoints with
// failover; override with VITE_MAINNET_RPC_URL (e.g. an Alchemy/Infura key) for production.
const mainnetRpcUrl = import.meta.env.VITE_MAINNET_RPC_URL as string | undefined;
const mainnetTransport = fallback([
  ...(mainnetRpcUrl ? [http(mainnetRpcUrl)] : []),
  http('https://ethereum-rpc.publicnode.com'),
  http('https://eth.llamarpc.com'),
  http('https://cloudflare-eth.com'),
]);

// BNB Chain has the SAME problem: viem's default is the keyless third-party
// https://56.rpc.thirdweb.com, which can rate-limit/CORS-fail in the browser (same
// zero-balance / no-MAX symptom as mainnet). Use official + public endpoints with failover.
const bscRpcUrl = import.meta.env.VITE_BSC_RPC_URL as string | undefined;
const bscTransport = fallback([
  ...(bscRpcUrl ? [http(bscRpcUrl)] : []),
  http('https://bsc-dataseed.bnbchain.org'),
  http('https://bsc-rpc.publicnode.com'),
]);

// RainbowKit's "Switch Networks" list reads chain.iconUrl. mainnet/base/bsc/avalanche have
// built-in RainbowKit icons; the custom chains (Abstract/MegaETH/Monad) don't — give them our
// brand logos so they aren't blank. (Spreading keeps each chain's id/rpc; Abstract stays id 2741.)
const abstractWithIcon = { ...abstract, iconUrl: '/coin images/abstract blockchain logo.jpg', iconBackground: '#ffffff' };
const megaethWithIcon = { ...megaeth, iconUrl: '/coin images/megaeth logo.png', iconBackground: '#ffffff' };
const monadWithIcon = { ...monad, iconUrl: '/coin images/monad logo.ico', iconBackground: '#ffffff' };

export const wagmiConfig = createConfig({
  connectors,
  // `abstract` MUST stay as chains[0]: @abstract-foundation/agw-react's useAbstractClient
  // builds the AGW client for useChains()[0]. Prepending another chain would break it.
  // The rest are bridge ORIGIN chains for cross-chain buys (Relay → Abstract).
  chains: [abstractWithIcon, mainnet, base, bsc, avalanche, megaethWithIcon, monadWithIcon],
  // Use the plain transports MAP form, not viem's client({chain}) form. AGW's
  // useAbstractClient reads `config._internal.transports[chainId]` directly and throws a
  // TypeError if it's undefined — which the client() form leaves it as. AGW applies its
  // own EIP-712 / account-abstraction handling at the connector layer regardless.
  transports: {
    [abstract.id]: http(),
    [mainnet.id]: mainnetTransport,
    [base.id]: http(),
    [bsc.id]: bscTransport,
    [avalanche.id]: http(),
    [megaeth.id]: http(),
    [monad.id]: http(),
  },
  ssr: false, // Vite SPA (no SSR)
  // multiInjectedProviderDiscovery defaults to true → EIP-6963 auto-detect + RDNS dedupe.
});

export const queryClient = new QueryClient();
