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
/** `big` mirrors `titleBtn` in BattleChips: the title-screen buttons all fill a
 *  shared column, so PLAY, CONNECT WALLET and SETTINGS come out the same size
 *  and the connect -> play swap doesn't shift the layout. */
const sizeOf = (big: boolean) =>
  big ? 'w-full px-3 py-3 text-lg md:text-xl tracking-[0.2em]' : 'px-4 py-1.5 text-sm';

/** `onHover`/`onPress` let the caller chirp without this file reaching into the
 *  game's audio module, which imports this one. */
export const WalletButton = ({ className = '', big = false, onHover, onPress }: {
  className?: string; big?: boolean; onHover?: () => void; onPress?: () => void;
}) => (
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
            <button onMouseEnter={onHover} onClick={() => { onPress?.(); openConnectModal(); }} className={`${base} ${sizeOf(big)}`}>CONNECT WALLET</button>
          </div>
        );
      }

      // Anything that isn't Robinhood Chain: the only useful action is switching.
      if (chain.unsupported) {
        return (
          <div className={className}>
            <button onMouseEnter={onHover} onClick={() => { onPress?.(); openChainModal(); }} className={`${base} ${sizeOf(big)} !text-[#a30000]`}>WRONG NETWORK</button>
          </div>
        );
      }

      return (
        <div className={className}>
          <button onMouseEnter={onHover} onClick={() => { onPress?.(); openAccountModal(); }} className={`${base} ${sizeOf(big)}`} title={account.address}>
            {account.displayName}
          </button>
        </div>
      );
    }}
  </ConnectButton.Custom>
);
