import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDisconnect, useReadContracts } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';
import { GAME_TOKENS, ROBINHOOD_ID } from './lib/tokens';

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
        <ConnectedPill
          className={className}
          size={sizeOf(big)}
          label={account.displayName}
          address={account.address as `0x${string}`}
          onHover={onHover}
          onPress={onPress}
          onManage={openAccountModal}
        />
      );
    }}
  </ConnectButton.Custom>
);

const fmtBal = (v: bigint | undefined, decimals: number) => {
  if (v === undefined) return '—';
  const n = Number(formatUnits(v, decimals));
  // Small balances still deserve to be visible rather than rounding to zero.
  return n === 0 ? '0' : n.toLocaleString(undefined, { maximumFractionDigits: n < 1 ? 6 : 2 });
};

/** The connected pill, and the drop-down of what you hold on Robinhood Chain. */
const ConnectedPill = ({ className, size, label, address, onHover, onPress, onManage }: {
  className: string; size: string; label: string; address: `0x${string}`;
  onHover?: () => void; onPress?: () => void; onManage: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const { disconnect } = useDisconnect();

  /* Balances are read on Robinhood Chain regardless of which chain the wallet is
     pointed at — these are the game's tokens, and they only live there. */
  const { data, isLoading } = useReadContracts({
    contracts: GAME_TOKENS.map((t) => ({
      address: t.address,
      abi: erc20Abi,
      functionName: 'balanceOf' as const,
      args: [address],
      chainId: ROBINHOOD_ID,
    })),
    query: { enabled: open, refetchInterval: open ? 15_000 : false },
  });

  return (
    /* The caller positions the outer box (fixed, top-right on the title screen).
       Anchoring is a separate, inner box: putting `relative` on the outer one
       overrides that `fixed` — Tailwind emits .relative after .fixed, so it wins
       regardless of class order — and drops the pill into normal flow. */
    <div className={className}>
      <div className="relative">
        <button
        onMouseEnter={onHover}
        onClick={() => { onPress?.(); setOpen((o) => !o); }}
        className={`${base} ${size}`}
        title={address}
        aria-expanded={open}
      >
        {label}
      </button>

      {open && (
        <>
          {/* click-away */}
          <div className="fixed inset-0 z-[1]" onClick={() => setOpen(false)} />
          <div className={`${base} absolute right-0 top-full mt-1 z-[2] w-56 !p-0 cursor-default`} role="menu">
            <div className="bg-[#000080] text-white font-bold text-[11px] px-2 py-1">On Robinhood Chain</div>
            <ul className="p-2 space-y-1">
              {GAME_TOKENS.map((t, i) => (
                <li key={t.symbol} className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[11px] text-black/70">{t.symbol}</span>
                  <span className="font-mono text-[13px]">
                    {isLoading ? '…' : fmtBal(data?.[i]?.result as bigint | undefined, t.decimals)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="px-2 pb-2 space-y-1">
              <button
                onMouseEnter={onHover}
                onClick={() => { onPress?.(); setOpen(false); onManage(); }}
                className={`${base} w-full px-2 py-1 text-[11px] font-bold`}
              >
                WALLET DETAILS
              </button>
              <button
                onMouseEnter={onHover}
                onClick={() => { onPress?.(); setOpen(false); disconnect(); }}
                className={`${base} w-full px-2 py-1 text-[11px] font-bold !text-[#a30000]`}
              >
                DISCONNECT
              </button>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
};
