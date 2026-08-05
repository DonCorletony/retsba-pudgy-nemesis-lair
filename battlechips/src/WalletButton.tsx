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
    {({ account, chain, openConnectModal, openChainModal, authenticationStatus, mounted }) => {
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
        />
      );
    }}
  </ConnectButton.Custom>
);

/** Win98 account window, in place of RainbowKit's own dark rounded modal. */
export const AccountWindow = ({ address, onClose }: {
  address: `0x${string}`; onClose: () => void;
}) => {
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);
  const { data } = useReadContracts({
    contracts: GAME_TOKENS.map((t) => ({
      address: t.address, abi: erc20Abi, functionName: 'balanceOf' as const,
      args: [address], chainId: ROBINHOOD_ID,
    })),
  });
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-xs p-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040]"
        onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#000080] text-white font-bold text-sm px-2 py-1 flex items-center justify-between">
          <span>Wallet</span>
          <button onClick={onClose} className="px-1 leading-none">X</button>
        </div>
        <div className="p-3 space-y-3">
          <div className="text-center">
            <div className="font-bold text-lg text-black">{short}</div>
            <div className="font-mono text-[10px] text-black/60 break-all">{address}</div>
          </div>
          <div className="border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-[#e8e8e8] p-2 space-y-1">
            {GAME_TOKENS.map((t, i) => (
              <div key={t.symbol} className="flex justify-between font-mono text-[11px] text-black">
                <span>{t.symbol}</span>
                <span className="font-bold">{fmtBal(data?.[i]?.result as bigint | undefined, t.decimals)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { navigator.clipboard?.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
              className="flex-1 px-2 py-1 text-[12px] font-bold text-black bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white"
            >
              {copied ? 'Copied' : 'Copy Address'}
            </button>
            <button
              onClick={() => { disconnect(); onClose(); }}
              className="flex-1 px-2 py-1 text-[12px] font-bold text-black bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const fmtBal = (v: bigint | undefined, decimals: number) => {
  if (v === undefined) return '—';
  const n = Number(formatUnits(v, decimals));
  // Small balances still deserve to be visible rather than rounding to zero.
  return n === 0 ? '0' : n.toLocaleString(undefined, { maximumFractionDigits: n < 1 ? 6 : 2 });
};

/** The connected pill, and the drop-down of what you hold on Robinhood Chain. */
const ConnectedPill = ({ className, size, label, address, onHover, onPress, onManage }: {
  className: string; size: string; label: string; address: `0x${string}`;
  onHover?: () => void; onPress?: () => void; onManage?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
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
                /* Our own window, not RainbowKit's — theirs is a dark rounded
                   sheet that has nothing to do with the rest of the game. */
                onClick={() => { onPress?.(); setOpen(false); setDetails(true); }}
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
      {details && <AccountWindow address={address} onClose={() => setDetails(false)} />}
    </div>
  );
};
