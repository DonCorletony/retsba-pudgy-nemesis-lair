import React, { useState, useEffect, useMemo } from 'react';
import {
  useAccount,
  useBalance,
  useReadContract,
  usePublicClient,
  useWriteContract,
  useSendTransaction,
  useSwitchChain,
} from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { erc20Abi, formatEther, formatUnits, parseEther, parseUnits, isAddress } from 'viem';
import { ChevronDown, ArrowDown, X, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useIsAGWConnected } from '@/utils/agwValidation';
import { getRelayBridgeQuote } from '@/lib/relay';

// ---- Abstract contracts (the on-Abstract swap leg) ----
const RETSBA = '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A' as `0x${string}`;
const WETH = '0x3439153EB7AF838Ad19d56E1571FBD09333C2809' as `0x${string}`;
const V2_ROUTER = '0xad1eCa41E6F772bE3cb5A48A6141f9bcc1AF9F7c' as `0x${string}`;
const ABSTRACT_ID = 2741;
const SLIPPAGE_BPS = 50n; // 0.5%
const BRIDGE_POLL_MS = 4000;
const BRIDGE_TIMEOUT_MS = 5 * 60 * 1000;

const routerAbi = [
  { inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'path', type: 'address[]' }], name: 'getAmountsOut', outputs: [{ name: 'amounts', type: 'uint256[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'amountOut', type: 'uint256' }, { name: 'path', type: 'address[]' }], name: 'getAmountsIn', outputs: [{ name: 'amounts', type: 'uint256[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'amountOutMin', type: 'uint256' }, { name: 'path', type: 'address[]' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }], name: 'swapExactETHForTokens', outputs: [{ name: 'amounts', type: 'uint256[]' }], stateMutability: 'payable', type: 'function' },
] as const;

// ---- Chain & token catalog ----
// Non-Abstract chains are origins for cross-chain bridging via Relay. They're disabled
// only when an AGW is connected (AGW is Abstract-only). Solana needs a separate wallet
// stack (Phase 3) so its action is gated.
type ChainId = number | 'solana';
interface ChainOption { id: ChainId; name: string; needsCustomRecipient?: boolean; }
interface TokenOption { symbol: string; name: string; address: `0x${string}` | 'native'; decimals: number; }

const CHAINS: ChainOption[] = [
  { id: ABSTRACT_ID, name: 'Abstract' },
  { id: 1, name: 'Ethereum' },
  { id: 8453, name: 'Base' },
  { id: 56, name: 'BNB Chain' },
  { id: 43114, name: 'Avalanche' },
  { id: 'solana', name: 'Solana', needsCustomRecipient: true },
  { id: 4326, name: 'MegaETH' },
  { id: 143, name: 'Monad' },
];

const TOKENS_BY_CHAIN: Record<string, TokenOption[]> = {
  [ABSTRACT_ID]: [{ symbol: 'ETH', name: 'Abstract ETH', address: 'native', decimals: 18 }],
  '1': [{ symbol: 'ETH', name: 'Ethereum', address: 'native', decimals: 18 }],
  '8453': [{ symbol: 'ETH', name: 'Base ETH', address: 'native', decimals: 18 }],
  '56': [{ symbol: 'BNB', name: 'BNB', address: 'native', decimals: 18 }],
  '43114': [{ symbol: 'AVAX', name: 'Avalanche', address: 'native', decimals: 18 }],
  solana: [{ symbol: 'SOL', name: 'Solana', address: 'native', decimals: 9 }],
  '4326': [{ symbol: 'ETH', name: 'MegaETH', address: 'native', decimals: 18 }],
  '143': [{ symbol: 'MON', name: 'Monad', address: 'native', decimals: 18 }],
};

const fmt = (n: number, max = 4) => (n === 0 ? '0' : n.toLocaleString(undefined, { maximumFractionDigits: max }));
// Clean decimal string for an input field (no commas, capped precision).
const trimNum = (s: string) => { const n = Number(s); return !n || isNaN(n) ? '' : String(Number(n.toPrecision(8))); };

type Step = 'idle' | 'bridging' | 'waiting' | 'swapping';

export const BuyBox = ({ onBalanceRefresh }: { onBalanceRefresh?: () => void }) => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const isAGW = useIsAGWConnected();
  const abstractClient = usePublicClient({ chainId: ABSTRACT_ID });
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const { toast } = useToast();

  const [chainId, setChainId] = useState<ChainId>(ABSTRACT_ID);
  const [token, setToken] = useState<TokenOption>(TOKENS_BY_CHAIN[ABSTRACT_ID][0]);
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [lastEdited, setLastEdited] = useState<'in' | 'out'>('in');
  const [recipient, setRecipient] = useState('');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorChain, setSelectorChain] = useState<ChainId>(ABSTRACT_ID);
  const [step, setStep] = useState<Step>('idle');

  const isAbstractInput = chainId === ABSTRACT_ID;
  const isSolana = chainId === 'solana';
  const busy = step !== 'idle';

  const isChainSelectable = (c: ChainOption) => c.id === ABSTRACT_ID || !isAGW;

  // ---- Balances ----
  const { data: inputBalance, refetch: refetchInput } = useBalance({
    address,
    chainId: typeof chainId === 'number' ? chainId : undefined,
    query: { enabled: !!address && typeof chainId === 'number' },
  });
  const { data: retsbaBalanceRaw, refetch: refetchRetsba } = useReadContract({
    address: RETSBA, abi: erc20Abi, functionName: 'balanceOf',
    args: address ? [address] : undefined, query: { enabled: !!address },
  });
  const { data: retsbaDecimals } = useReadContract({ address: RETSBA, abi: erc20Abi, functionName: 'decimals' });
  const decimals = retsbaDecimals ?? 18;

  const inputBal = inputBalance ? Number(formatEther(inputBalance.value)) : 0;
  const retsbaBal = retsbaBalanceRaw ? Number(formatUnits(retsbaBalanceRaw, decimals)) : 0;

  // ---- Quoting ----
  // Same-chain (Abstract): bidirectional V2. Cross-chain: exact-input only (Relay bridge
  // estimate -> V2), with the RETSBA output shown read-only as an estimate.
  useEffect(() => {
    if (!abstractClient) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        if (isSolana) { if (!cancelled) setOutputAmount(''); return; }

        if (isAbstractInput) {
          if (lastEdited === 'in') {
            const v = Number(inputAmount);
            if (!inputAmount || isNaN(v) || v <= 0) { if (!cancelled) setOutputAmount(''); return; }
            const amounts = await abstractClient.readContract({ address: V2_ROUTER, abi: routerAbi, functionName: 'getAmountsOut', args: [parseEther(inputAmount), [WETH, RETSBA]] });
            if (!cancelled) setOutputAmount(trimNum(formatUnits(amounts[1], decimals)));
          } else {
            const v = Number(outputAmount);
            if (!outputAmount || isNaN(v) || v <= 0) { if (!cancelled) setInputAmount(''); return; }
            const amounts = await abstractClient.readContract({ address: V2_ROUTER, abi: routerAbi, functionName: 'getAmountsIn', args: [parseUnits(outputAmount, decimals), [WETH, RETSBA]] });
            if (!cancelled) setInputAmount(trimNum(formatEther(amounts[0])));
          }
          return;
        }

        // Cross-chain (EVM): exact-input estimate.
        const v = Number(inputAmount);
        if (!inputAmount || isNaN(v) || v <= 0 || !address) { if (!cancelled) setOutputAmount(''); return; }
        const quote = await getRelayBridgeQuote({ user: address, recipient: address, originChainId: chainId as number, amount: parseEther(inputAmount) });
        if (cancelled) return;
        if (quote.expectedEthOut <= 0n) { setOutputAmount(''); return; }
        const amounts = await abstractClient.readContract({ address: V2_ROUTER, abi: routerAbi, functionName: 'getAmountsOut', args: [quote.expectedEthOut, [WETH, RETSBA]] });
        if (!cancelled) setOutputAmount(trimNum(formatUnits(amounts[1], decimals)));
      } catch {
        if (!cancelled) (lastEdited === 'in' || !isAbstractInput) ? setOutputAmount('') : setInputAmount('');
      }
    }, isAbstractInput ? 350 : 600);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [inputAmount, outputAmount, lastEdited, abstractClient, decimals, chainId, isAbstractInput, isSolana, address]);

  const recipientInvalid = recipient.trim().length > 0 && !isAddress(recipient.trim());
  const insufficient = !!inputAmount && Number(inputAmount) > inputBal;

  const selectChain = (c: ChainOption) => {
    const tk = (TOKENS_BY_CHAIN[String(c.id)] ?? [])[0];
    setChainId(c.id); if (tk) setToken(tk);
    setInputAmount(''); setOutputAmount(''); setLastEdited('in');
    setSelectorOpen(false);
  };

  const handleMax = () => {
    setLastEdited('in');
    // Leave gas headroom unless AGW is paying (sponsored, Abstract-only).
    const max = isAGW && isAbstractInput ? inputBal : inputBal * 0.99;
    setInputAmount(max > 0 ? trimNum(String(max)) : '');
  };

  const doAbstractSwap = async (to: `0x${string}`) => {
    const value = parseEther(inputAmount);
    const amounts = await abstractClient!.readContract({ address: V2_ROUTER, abi: routerAbi, functionName: 'getAmountsOut', args: [value, [WETH, RETSBA]] });
    const amountOutMin = (amounts[1] * (10000n - SLIPPAGE_BPS)) / 10000n;
    setStep('swapping');
    await writeContractAsync({
      address: V2_ROUTER, abi: routerAbi, functionName: 'swapExactETHForTokens',
      args: [amountOutMin, [WETH, RETSBA], to, BigInt(Math.floor(Date.now() / 1000) + 600)],
      value, chainId: ABSTRACT_ID,
    });
    toast({ title: 'Swap submitted', description: `Buying RETSBA with ${fmt(Number(inputAmount))} ETH.` });
  };

  const doCrossChainBuy = async (to: `0x${string}`) => {
    const originId = chainId as number;
    // 1. Quote the bridge (origin native -> Abstract ETH), bridged to the user's own address.
    const quote = await getRelayBridgeQuote({ user: address!, recipient: address!, originChainId: originId, amount: parseEther(inputAmount) });
    // 2. Snapshot Abstract ETH balance to detect arrival.
    const before = await abstractClient!.getBalance({ address: address! });
    // 3. Switch to origin + send the bridge tx.
    setStep('bridging');
    await switchChainAsync({ chainId: originId });
    await sendTransactionAsync({ to: quote.bridgeTx.to, value: quote.bridgeTx.value, data: quote.bridgeTx.data, chainId: originId });
    toast({ title: 'Bridge submitted', description: 'Waiting for funds to arrive on Abstract…' });
    // 4. Poll for arrival.
    setStep('waiting');
    let delta = 0n;
    const deadline = Date.now() + BRIDGE_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, BRIDGE_POLL_MS));
      const now = await abstractClient!.getBalance({ address: address! });
      if (now > before) { delta = now - before; break; }
    }
    if (delta === 0n) {
      throw new Error('Funds not detected on Abstract yet — they may still be in transit. Once they arrive, switch the input to Abstract and finish the buy.');
    }
    // 5. Switch to Abstract + swap (leave 2% native for gas; EVM wallets pay their own).
    await switchChainAsync({ chainId: ABSTRACT_ID });
    const value = (delta * 98n) / 100n;
    const amounts = await abstractClient!.readContract({ address: V2_ROUTER, abi: routerAbi, functionName: 'getAmountsOut', args: [value, [WETH, RETSBA]] });
    const amountOutMin = (amounts[1] * (10000n - SLIPPAGE_BPS)) / 10000n;
    setStep('swapping');
    await writeContractAsync({
      address: V2_ROUTER, abi: routerAbi, functionName: 'swapExactETHForTokens',
      args: [amountOutMin, [WETH, RETSBA], to, BigInt(Math.floor(Date.now() / 1000) + 600)],
      value, chainId: ABSTRACT_ID,
    });
    toast({ title: 'Buy complete 🎉', description: 'Bridged and swapped into RETSBA.' });
  };

  const handleAction = async () => {
    if (!isConnected) { openConnectModal?.(); return; }
    if (isSolana) {
      toast({ title: 'Solana coming next', description: 'Solana support needs a Solana wallet — it’s coming in a later update. For now use Abstract or an EVM chain.' });
      return;
    }
    if (recipientInvalid) { toast({ title: 'Invalid address', description: 'That recipient address isn’t valid.', variant: 'destructive' }); return; }
    if (!inputAmount || Number(inputAmount) <= 0 || !abstractClient) return;
    if (insufficient) { toast({ title: 'Insufficient balance', description: `You only have ${fmt(inputBal)} ${token.symbol}.`, variant: 'destructive' }); return; }

    const to = (recipient.trim() ? recipient.trim() : address) as `0x${string}`;
    try {
      if (isAbstractInput) await doAbstractSwap(to);
      else await doCrossChainBuy(to);
      setInputAmount(''); setOutputAmount('');
      setTimeout(() => { refetchInput(); refetchRetsba(); onBalanceRefresh?.(); }, 2500);
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || '';
      if (/reject|denied|cancel|user refused/i.test(msg)) toast({ title: 'Cancelled', description: 'You declined the transaction.' });
      else { console.error('Buy error:', err); toast({ title: 'Buy failed', description: msg || 'Something went wrong.', variant: 'destructive' }); }
    } finally {
      setStep('idle');
    }
  };

  const statusText = useMemo(() => {
    if (step === 'bridging') return 'Confirm the bridge in your wallet…';
    if (step === 'waiting') return 'Bridging to Abstract — this can take a minute…';
    if (step === 'swapping') return 'Confirm the swap in your wallet…';
    return '';
  }, [step]);

  const buttonText = useMemo(() => {
    if (!isConnected) return 'Connect a Wallet';
    if (busy) return step === 'waiting' ? 'Bridging…' : 'Confirm in wallet…';
    if (isSolana) return 'Solana coming soon';
    if (recipientInvalid) return 'Invalid recipient address';
    if (!inputAmount || Number(inputAmount) <= 0) return 'Enter an amount';
    if (insufficient) return `Insufficient ${token.symbol}`;
    return isAbstractInput ? 'Buy RETSBA' : 'Bridge & Buy';
  }, [isConnected, busy, step, isSolana, recipientInvalid, inputAmount, insufficient, token.symbol, isAbstractInput]);

  const actionDisabled = busy || recipientInvalid || (!isSolana && (!inputAmount || Number(inputAmount) <= 0 || insufficient));

  const selectorTokens = TOKENS_BY_CHAIN[String(selectorChain)] ?? [];
  const chainName = CHAINS.find((c) => c.id === chainId)?.name ?? '';

  // Disconnected: show nothing but a connect prompt.
  if (!isConnected) {
    return (
      <div className="py-6">
        <button onClick={() => openConnectModal?.()} className="w-full rounded-xl bg-red-600 py-3 font-bold text-white transition-colors hover:bg-red-700">
          Connect a Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-center text-black font-display text-2xl mb-2">Buy RETSBA</h3>

      {/* INPUT slot */}
      <div className="rounded-xl border border-black/10 bg-gray-50 p-4">
        <p className="text-xs font-medium text-gray-500">You pay</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <input
            inputMode="decimal" placeholder="0.000" disabled={busy}
            value={inputAmount}
            onChange={(e) => { setLastEdited('in'); setInputAmount(e.target.value.replace(/[^0-9.]/g, '')); }}
            className="w-0 flex-1 bg-transparent text-2xl font-semibold text-black outline-none placeholder:text-gray-300"
          />
          <button onClick={() => { setSelectorChain(chainId); setSelectorOpen(true); }} disabled={busy}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white border border-black/10 px-3 py-1.5 text-black font-medium hover:bg-gray-100 transition-colors disabled:opacity-60">
            {token.symbol}
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
          <span>{chainName}</span>
          {!isSolana && (
            <span>
              Balance: {fmt(inputBal)} {token.symbol}
              {inputBal > 0 && <button onClick={handleMax} disabled={busy} className="ml-1.5 font-semibold text-red-600 hover:text-red-700">MAX</button>}
            </span>
          )}
        </div>
      </div>

      {/* divider */}
      <div className="flex justify-center -my-1">
        <div className="rounded-full border border-black/10 bg-white p-1.5 shadow-sm"><ArrowDown className="h-4 w-4 text-gray-500" /></div>
      </div>

      {/* OUTPUT slot */}
      <div className="rounded-xl border border-black/10 bg-gray-50 p-4">
        <p className="text-xs font-medium text-gray-500">You receive{!isAbstractInput && ' (estimated)'}</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <input
            inputMode="decimal" placeholder="0.000"
            readOnly={!isAbstractInput} disabled={busy}
            value={outputAmount}
            onChange={(e) => { if (isAbstractInput) { setLastEdited('out'); setOutputAmount(e.target.value.replace(/[^0-9.]/g, '')); } }}
            className={`w-0 flex-1 bg-transparent text-2xl font-semibold text-black outline-none placeholder:text-gray-300 ${!isAbstractInput ? 'cursor-default' : ''}`}
          />
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white border border-black/10 px-3 py-1.5 text-black font-medium">RETSBA</div>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
          <span>Abstract</span>
          <span>Balance: {fmt(retsbaBal)} RETSBA</span>
        </div>
      </div>

      {/* Send to a different wallet */}
      <div className="pt-1">
        <input
          value={recipient} disabled={busy} onChange={(e) => setRecipient(e.target.value)}
          placeholder={isSolana ? 'Abstract destination address (required for Solana)' : 'Send to a different wallet (optional)'}
          className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-black outline-none placeholder:text-gray-400 ${recipientInvalid ? 'border-red-500' : 'border-black/10 focus:border-black/30'}`}
        />
        {recipientInvalid && <p className="mt-1 text-xs text-red-500">Enter a valid 0x wallet address.</p>}
      </div>

      {/* Status line during a cross-chain buy */}
      {statusText && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {statusText}
        </div>
      )}

      {/* Action */}
      <button onClick={handleAction} disabled={actionDisabled}
        className="mt-1 w-full rounded-xl bg-red-600 py-3 font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
        {buttonText}
      </button>

      {/* Chain + token selector */}
      <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
        <DialogContent className="max-w-md bg-white p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
            <DialogTitle className="font-semibold text-black">Select network &amp; token</DialogTitle>
            <button onClick={() => setSelectorOpen(false)} className="text-gray-400 hover:text-black"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-[140px_1fr]">
            <div className="max-h-80 overflow-y-auto border-r border-black/10 py-2">
              {CHAINS.map((c) => {
                const selectable = isChainSelectable(c);
                const active = selectorChain === c.id;
                return (
                  <button key={String(c.id)} disabled={!selectable} onClick={() => selectable && setSelectorChain(c.id)}
                    className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                      active ? 'bg-red-50 text-black font-semibold' : selectable ? 'text-black hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
                    }`}>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {selectorTokens.map((tk) => {
                const active = chainId === selectorChain && token.symbol === tk.symbol;
                return (
                  <button key={tk.symbol} onClick={() => selectChain(CHAINS.find((c) => c.id === selectorChain)!)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-100">
                    <span className="flex flex-col">
                      <span className="font-medium text-black">{tk.symbol}</span>
                      <span className="text-xs text-gray-400">{tk.name}</span>
                    </span>
                    {active && <Check className="h-4 w-4 text-red-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyBox;
