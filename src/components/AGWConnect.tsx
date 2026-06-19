import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { useLoginWithAbstract } from '@abstract-foundation/agw-react';
import { ChevronDown, Copy, LogOut, ArrowLeftRight, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ChainIcon } from '@/components/ui/CoinIcon';
import { useToast } from '@/hooks/use-toast';

/**
 * Single compressed wallet button: [selected chain logo] [address] ▾.
 * Clicking opens one menu to switch network, copy the address, or disconnect —
 * replacing RainbowKit's default two-pill (chain + account) layout.
 */
// Matches the token-balance pills on the other side of the navbar.
const pill =
  'flex items-center gap-2 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 px-3 py-1.5 text-ink dark:text-white font-medium text-sm hover:bg-black/10 dark:hover:bg-white/15 transition-colors';

export const AGWConnect = () => {
  const { disconnect } = useDisconnect();
  const { connector } = useAccount();
  const { logout } = useLoginWithAbstract();
  const { toast } = useToast();

  // AGW (Privy cross-app connector) keeps its own session — wagmi disconnect() alone
  // leaves it logged in / silently reconnects. Use AGW's logout() for AGW, wagmi for EVM.
  const handleDisconnect = () => {
    if (connector?.id === 'xyz.abs.privy') logout();
    else disconnect();
  };

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openChainModal, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

        // Avoid hydration/layout flash before RainbowKit is mounted.
        if (!ready) {
          return (
            <div aria-hidden className="pointer-events-none opacity-0">
              <button className={pill}>Connect Wallet</button>
            </div>
          );
        }

        if (!connected) {
          return (
            <button onClick={openConnectModal} className={pill}>
              Connect Wallet
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button onClick={openChainModal} className={`${pill} text-red-600 dark:text-red-400`}>
              <AlertTriangle className="h-4 w-4" /> Wrong network
            </button>
          );
        }

        const copyAddress = async () => {
          try {
            await navigator.clipboard.writeText(account.address);
            toast({ title: 'Address copied', description: account.displayName });
          } catch {
            toast({ title: 'Copy failed', variant: 'destructive' });
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={pill}>
                {chain.hasIcon && chain.iconUrl ? (
                  <img
                    src={chain.iconUrl}
                    alt={chain.name ?? 'chain'}
                    className="h-6 w-6 rounded-full"
                    style={chain.iconBackground ? { background: chain.iconBackground } : undefined}
                  />
                ) : (
                  <ChainIcon id={chain.id} name={chain.name ?? ''} className="h-6 w-6" />
                )}
                <span className="max-w-[120px] truncate">{account.displayName}</span>
                <ChevronDown className="h-4 w-4 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-[#1b1d20] border border-black/10 dark:border-white/20">
              <DropdownMenuItem onClick={openChainModal} className="cursor-pointer gap-2 text-ink dark:text-white">
                <ArrowLeftRight className="h-4 w-4" /> Switch network
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyAddress} className="cursor-pointer gap-2 text-ink dark:text-white">
                <Copy className="h-4 w-4" /> Copy address
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDisconnect}
                className="cursor-pointer gap-2 text-red-600 focus:text-red-600 dark:text-red-400"
              >
                <LogOut className="h-4 w-4" /> Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }}
    </ConnectButton.Custom>
  );
};
