import { ConnectButton } from '@rainbow-me/rainbowkit';

/**
 * Win98-styled wallet control. Wraps RainbowKit's headless ConnectButton so the
 * pill matches the game's chrome instead of RainbowKit's default two-button
 * layout: one button that connects, warns about the wrong network, or shows the
 * account and opens the account menu.
 */
const base =
  'bg-[#c3c3c3] border-2 border-t-white border-l-white border-b-[#5c5c5c] border-r-[#5c5c5c] ' +
  'shadow-[inset_1px_1px_0_#e6e6e6,inset_-1px_-1px_0_#8a8a8a] font-bold text-black ' +
  'active:border-t-[#5c5c5c] active:border-l-[#5c5c5c] active:border-b-white active:border-r-white select-none';
/** `big` matches the PLAY button it turns into, so the swap doesn't shift the layout. */
const sizeOf = (big: boolean) =>
  big ? 'px-8 py-4 md:px-10 md:py-6 text-xl md:text-3xl tracking-[0.2em]' : 'px-4 py-1.5 text-sm';

export const WalletButton = ({ className = '', big = false }: { className?: string; big?: boolean }) => (
  <ConnectButton.Custom>
    {({ account, chain, openConnectModal, openChainModal, openAccountModal, authenticationStatus, mounted }) => {
      const ready = mounted && authenticationStatus !== 'loading';
      const connected =
        ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

      // Hold the space before RainbowKit mounts so the layout doesn't jump.
      if (!ready) {
        return (
          <div aria-hidden className={`pointer-events-none opacity-0 ${className}`}>
            <button className={`${base} ${sizeOf(big)}`}>CONNECT WALLET</button>
          </div>
        );
      }

      if (!connected) {
        return (
          <div className={className}>
            <button onClick={openConnectModal} className={`${base} ${sizeOf(big)}`}>CONNECT WALLET</button>
          </div>
        );
      }

      // Anything that isn't Robinhood Chain: the only useful action is switching.
      if (chain.unsupported) {
        return (
          <div className={className}>
            <button onClick={openChainModal} className={`${base} ${sizeOf(big)} !text-[#a30000]`}>WRONG NETWORK</button>
          </div>
        );
      }

      return (
        <div className={className}>
          <button onClick={openAccountModal} className={`${base} ${sizeOf(big)}`} title={account.address}>
            {account.displayName}
          </button>
        </div>
      );
    }}
  </ConnectButton.Custom>
);
