/* "Fund your account" — pay from any supported chain, receive USDG or LUCKY on
   Robinhood Chain. Dressed as a Win98 window to match the rest of the game.

   This whole module is loaded on demand: the Relay SDK and the Solana wallet
   stack together are larger than the game itself, and nobody should pay for
   them just to look at the title screen. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Loader2, X } from 'lucide-react';
import { useAccount, useBalance, useSwitchChain, useWalletClient } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { isAddress, parseUnits } from 'viem';
import type { Execute } from '@relayprotocol/relay-sdk';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import {
  CHAINS, DESTINATIONS, TOKENS, ROBINHOOD_ID,
  getQuote, quoteOut, quoteFeeUsd, executeEvm, executeSolana,
  type ChainOption, type Destination, type TokenOption,
} from './lib/relay';

/* Win98 chrome, same strings the game uses. */
const raised =
  'bg-[#c3c3c3] border-2 border-t-white border-l-white border-b-[#5c5c5c] border-r-[#5c5c5c] ' +
  'shadow-[inset_1px_1px_0_#e6e6e6,inset_-1px_-1px_0_#8a8a8a]';
const sunken =
  'border-2 border-t-[#5c5c5c] border-l-[#5c5c5c] border-b-white border-r-white ' +
  'shadow-[inset_1px_1px_0_#8a8a8a]';
const btn98 =
  `${raised} px-5 py-1.5 font-bold text-black text-sm active:border-t-[#5c5c5c] active:border-l-[#5c5c5c] ` +
  'active:border-b-white active:border-r-white select-none disabled:text-[#7a7a7a] ' +
  'disabled:active:border-t-white disabled:active:border-l-white';

const fmt = (n: number, max = 6) =>
  n === 0 ? '0' : n.toLocaleString(undefined, { maximumFractionDigits: max });
/** Tidy a number for an input field: no commas, sane precision. */
const trim = (s: string) => {
  const n = Number(s);
  return !n || isNaN(n) ? '' : String(Number(n.toPrecision(8)));
};

type Step = 'idle' | 'switching' | 'quoting' | 'signing' | 'sending' | 'done';

/** A raised panel with a title bar, the way the game's Settings window looks. */
const Panel = ({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) => (
  <div className={`${raised} w-full max-w-md p-1`} onClick={(e) => e.stopPropagation()}>
    <div className="bg-[#000080] text-white font-bold text-sm px-2 py-1 flex items-center justify-between">
      <span>{title}</span>
      <button onClick={onClose} aria-label="Close" className="hover:bg-white/20 px-1">
        <X className="h-4 w-4" strokeWidth={3} />
      </button>
    </div>
    <div className="p-3 space-y-3">{children}</div>
  </div>
);

/** Win98 combo box: a sunken field that drops a list. */
const Picker = <T,>({ label, value, options, render, onPick }: {
  label: string; value: T; options: T[]; render: (o: T) => string; onPick: (o: T) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <span className="block font-mono text-[10px] tracking-widest text-black/60 mb-1">{label}</span>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`${sunken} bg-white w-full flex items-center justify-between px-2 py-1.5 text-left text-sm`}
      >
        <span className="truncate">{render(value)}</span>
        <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={2.5} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[1]" onClick={() => setOpen(false)} />
          <ul className={`${raised} absolute left-0 right-0 top-full mt-0.5 z-[2] max-h-56 overflow-y-auto p-0.5`}>
            {options.map((o, i) => (
              <li key={i}>
                <button
                  onClick={() => { onPick(o); setOpen(false); }}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-[#000080] hover:text-white"
                >
                  {render(o)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export const SwapWindow = ({ onClose, chirp }: {
  onClose: () => void;
  /** Hover/click sounds, handed in so this file needn't reach into the game's audio. */
  chirp?: { hover: () => void; press: () => void };
}) => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected: solConnected } = useWallet();
  const { setVisible: openSolanaModal } = useWalletModal();

  const [chain, setChain] = useState<ChainOption>(CHAINS[0]);
  const [token, setToken] = useState<TokenOption>(TOKENS[String(CHAINS[0].id)][0]);
  const [dest, setDest] = useState<Destination>(DESTINATIONS[0]);
  const [amount, setAmount] = useState('');
  const [out, setOut] = useState('');
  const [fee, setFee] = useState<string>();
  const [recipient, setRecipient] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string>();
  const [note, setNote] = useState<string>();
  const [solBal, setSolBal] = useState(0);
  const quoteRef = useRef<Execute | null>(null);

  const isSolana = chain.id === 'solana';
  const tokens = TOKENS[String(chain.id)] ?? [];

  /* Where the tokens land. Solana can't receive on Robinhood, so it needs a 0x
     address typed in (prefilled from a connected EVM wallet). */
  const to = (recipient.trim() || address || '') as `0x${string}`;
  const toValid = !!to && isAddress(to);
  const recipientBad = recipient.trim().length > 0 && !isAddress(recipient.trim());

  /* ---- balances ---- */
  const { data: evmBal } = useBalance({
    address,
    chainId: isSolana ? undefined : (chain.id as number),
    token: token.address === 'native' ? undefined : (token.address as `0x${string}`),
    query: { enabled: !isSolana && !!address },
  });
  useEffect(() => {
    if (!isSolana || !publicKey) { setSolBal(0); return; }
    let stop = false;
    (async () => {
      try {
        if (token.address === 'native') {
          const l = await connection.getBalance(publicKey);
          if (!stop) setSolBal(l / LAMPORTS_PER_SOL);
        } else {
          const res = await connection.getParsedTokenAccountsByOwner(publicKey, {
            mint: new PublicKey(token.address),
          });
          const ui = res.value[0]?.account.data.parsed.info.tokenAmount.uiAmount ?? 0;
          if (!stop) setSolBal(Number(ui));
        }
      } catch { if (!stop) setSolBal(0); }
    })();
    return () => { stop = true; };
  }, [isSolana, publicKey, connection, token.address]);

  const balance = isSolana ? solBal : Number(evmBal?.formatted ?? 0);
  const overBalance = !!amount && Number(amount) > balance;

  /* ---- quoting ---- */
  useEffect(() => {
    const n = Number(amount);
    const payer = isSolana ? publicKey?.toBase58() : address;
    if (!amount || isNaN(n) || n <= 0 || !payer || !toValid) {
      quoteRef.current = null; setOut(''); setFee(undefined); setError(undefined);
      return;
    }
    let stop = false;
    setStep('quoting');
    const id = setTimeout(async () => {
      try {
        const q = await getQuote({
          user: payer,
          recipient: to,
          originChainId: chain.id,
          from: token,
          to: dest,
          amount: parseUnits(amount, token.decimals),
        });
        if (stop) return;
        quoteRef.current = q;
        setOut(trim(quoteOut(q) ?? ''));
        setFee(quoteFeeUsd(q));
        setError(undefined);
      } catch (e) {
        if (stop) return;
        quoteRef.current = null; setOut(''); setFee(undefined);
        setError(routeError(e, dest.symbol));
      } finally {
        if (!stop) setStep('idle');
      }
    }, 500);
    return () => { stop = true; clearTimeout(id); };
  }, [amount, chain.id, token, dest, address, publicKey, to, toValid, isSolana]);

  const pickChain = (c: ChainOption) => {
    setChain(c);
    setToken((TOKENS[String(c.id)] ?? [])[0]);
    setAmount(''); setOut(''); setFee(undefined); setError(undefined);
    quoteRef.current = null;
    if (c.needsRecipient && address && !recipient.trim()) setRecipient(address);
  };

  /* Leave a little native gas behind, or the deposit itself can't be paid for. */
  const useMax = () => {
    const max = token.address === 'native' ? balance * 0.99 : balance;
    setAmount(max > 0 ? trim(String(max)) : '');
  };

  const busy = step === 'switching' || step === 'signing' || step === 'sending';
  const ready = !!quoteRef.current && !overBalance && !busy && toValid;

  const fund = useCallback(async () => {
    const quote = quoteRef.current;
    if (!quote) return;
    setError(undefined); setNote(undefined);
    try {
      if (isSolana) {
        if (!publicKey) throw new Error('Connect a Solana wallet first.');
        setStep('signing');
        await executeSolana({
          quote,
          walletAddress: publicKey.toBase58(),
          connection,
          sendTransaction: (tx, o) => sendTransaction(tx, connection, o),
          onProgress: () => setStep('sending'),
        });
      } else {
        if (!walletClient) throw new Error('Connect a wallet first.');
        setStep('switching');
        await switchChainAsync({ chainId: chain.id as number });
        setStep('signing');
        await executeEvm({ quote, wallet: walletClient, onProgress: () => setStep('sending') });
      }
      setStep('done');
      setNote(`Sent. ${dest.symbol} will land on Robinhood Chain shortly.`);
      setAmount(''); setOut(''); quoteRef.current = null;
    } catch (e) {
      setStep('idle');
      setError(humanError(e));
    }
  }, [isSolana, publicKey, connection, sendTransaction, walletClient, switchChainAsync, chain.id, dest.symbol]);

  const label = useMemo(() => {
    if (step === 'switching') return 'SWITCHING CHAIN…';
    if (step === 'signing') return 'CONFIRM IN WALLET…';
    if (step === 'sending') return 'SENDING…';
    if (isSolana && !solConnected) return 'CONNECT SOLANA WALLET';
    if (!isConnected) return 'CONNECT WALLET';
    if (overBalance) return 'NOT ENOUGH BALANCE';
    return `BUY ${dest.symbol}`;
  }, [step, isSolana, solConnected, isConnected, overBalance, dest.symbol]);

  const press = () => {
    chirp?.press();
    // Two wallet stacks: Solana pays from its own, everything else from wagmi's.
    if (isSolana && !solConnected) { openSolanaModal(true); return; }
    if (!isSolana && !isConnected) { openConnectModal?.(); return; }
    fund();
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onClick={onClose}>
      <Panel title="Fund your account" onClose={() => { chirp?.press(); onClose(); }}>
        {/* what you're paying with */}
        <div className="grid grid-cols-2 gap-2">
          <Picker label="PAY FROM" value={chain} options={CHAINS} render={(c) => c.name} onPick={pickChain} />
          <Picker label="WITH" value={token} options={tokens} render={(t) => t.symbol} onPick={(t) => { setToken(t); setAmount(''); setOut(''); }} />
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="font-mono text-[10px] tracking-widest text-black/60">AMOUNT</span>
            <button
              onClick={useMax}
              className="font-mono text-[10px] text-[#000080] hover:underline"
            >
              balance {fmt(balance)} {token.symbol} · max
            </button>
          </div>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.0"
            className={`${sunken} bg-white w-full px-2 py-1.5 text-sm font-mono outline-none`}
          />
        </div>

        {/* what you're getting */}
        <Picker label="RECEIVE ON ROBINHOOD CHAIN" value={dest} options={DESTINATIONS}
          render={(d) => `${d.symbol} — ${d.name}`} onPick={(d) => { setDest(d); setOut(''); }} />

        <div className={`${sunken} bg-[#efefef] px-2 py-1.5 flex items-baseline justify-between`}>
          <span className="font-mono text-[11px] text-black/60">You receive</span>
          <span className="font-mono text-sm">
            {step === 'quoting' ? <Loader2 className="h-4 w-4 animate-spin inline" />
              : out ? `${out} ${dest.symbol}` : '—'}
          </span>
        </div>
        <p className="font-mono text-[10px] text-black/50 -mt-1">
          {dest.blurb}{fee ? ` · route fee ≈ $${fee}` : ''}
        </p>

        {/* Solana can't receive on Robinhood, so say where it should go */}
        {chain.needsRecipient && (
          <div>
            <span className="block font-mono text-[10px] tracking-widest text-black/60 mb-1">
              SEND TO (ROBINHOOD ADDRESS)
            </span>
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x…"
              className={`${sunken} bg-white w-full px-2 py-1.5 text-xs font-mono outline-none ${recipientBad ? 'text-[#a30000]' : ''}`}
            />
            <p className="font-mono text-[10px] text-black/50 mt-1">
              {recipientBad ? "That doesn't look like a 0x address."
                : 'Paying from Solana, so your tokens need an address to land on.'}
            </p>
          </div>
        )}

        {error && (
          <div className={`${sunken} bg-[#efefef] px-2 py-1.5 font-mono text-[11px] text-[#a30000]`}>{error}</div>
        )}
        {note && (
          <div className={`${sunken} bg-[#efefef] px-2 py-1.5 font-mono text-[11px] text-[#006000]`}>{note}</div>
        )}

        <div className="flex justify-center gap-3 pt-1">
          <button
            onMouseEnter={chirp?.hover}
            onClick={press}
            disabled={(isSolana ? solConnected : isConnected) && !ready}
            className={`${btn98} !px-6 tracking-[0.12em]`}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin inline mr-1.5" />}
            {label}
          </button>
          <button onMouseEnter={chirp?.hover} onClick={() => { chirp?.press(); onClose(); }} className={btn98}>
            CLOSE
          </button>
        </div>
      </Panel>
    </div>
  );
};

/** Relay says "no routes" when a pair isn't supported; make that legible. */
function routeError(e: unknown, symbol: string): string {
  const m = String((e as Error)?.message ?? e);
  if (/no routes|not supported|unsupported/i.test(m)) {
    return `No route to ${symbol} from that chain and token right now. Try another pairing.`;
  }
  if (/amount|minimum|too small/i.test(m)) return 'That amount is below the route minimum.';
  return 'Could not price that route. Try again in a moment.';
}

function humanError(e: unknown): string {
  const m = String((e as Error)?.message ?? e);
  if (/user rejected|denied|rejected the request/i.test(m)) return 'Cancelled in your wallet.';
  if (/insufficient/i.test(m)) return 'Not enough balance to cover the amount plus gas.';
  return m.length > 160 ? `${m.slice(0, 157)}…` : m;
}

export default SwapWindow;
