import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  useAccount,
  useBalance,
  useReadContract,
  usePublicClient,
  useWriteContract,
  useSendTransaction,
  useSwitchChain,
  useWalletClient,
} from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { erc20Abi, formatEther, formatUnits, parseEther, parseUnits, isAddress } from 'viem';
import { ChevronDown, ArrowDown, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useIsAGWConnected } from '@/utils/agwValidation';
import { getRelayBridgeQuote } from '@/lib/relay';
import { TokenIcon, ChainIcon } from '@/components/ui/CoinIcon';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey, type VersionedTransaction, type SendOptions } from '@solana/web3.js';
import { getSolToRetsbaQuote, quoteRetsbaOut, executeSolToRetsba } from '@/lib/relaySolana';
import { getEvmTokenQuote, executeEvmBuy } from '@/lib/relayEvm';
import { useUsdPrices, usdValue, fmtUsd } from '@/lib/prices';

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
// address is 'native', a 0x EVM token address, or a base58 SPL mint (Solana).
interface TokenOption { symbol: string; name: string; address: string; decimals: number; }

const CHAINS: ChainOption[] = [
  { id: ABSTRACT_ID, name: 'Abstract' },
  { id: 1, name: 'Ethereum' },
  { id: 8453, name: 'Base' },
  { id: 56, name: 'BNB Chain' },
  { id: 43114, name: 'Avalanche' },
  { id: 'solana', name: 'Solana', needsCustomRecipient: true },
  { id: 4326, name: 'MegaETH' },
  { id: 143, name: 'Monad' },
  { id: 4663, name: 'Robinhood' },
];

// USDC addresses + decimals are Relay-verified per chain. NOTE: BNB USDC is 18 decimals
// (Binance-Peg), every other USDC is 6. MegaETH has no USDC (MEGA only). amounts always use
// parseUnits(amount, token.decimals).
const TOKENS_BY_CHAIN: Record<string, TokenOption[]> = {
  [ABSTRACT_ID]: [
    { symbol: 'ETH', name: 'Abstract ETH', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin (bridged)', address: '0x84a71ccd554cc1b02749b35d22f684cc8ec987e1', decimals: 6 },
  ],
  '1': [
    { symbol: 'ETH', name: 'Ethereum', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6 },
  ],
  '8453': [
    { symbol: 'ETH', name: 'Base ETH', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', decimals: 6 },
  ],
  '56': [
    { symbol: 'BNB', name: 'BNB', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin (Binance-Peg)', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18 },
  ],
  '43114': [
    { symbol: 'AVAX', name: 'Avalanche', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', decimals: 6 },
  ],
  solana: [
    { symbol: 'SOL', name: 'Solana', address: 'native', decimals: 9 },
    { symbol: 'USDC', name: 'USD Coin', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  ],
  '4326': [
    { symbol: 'ETH', name: 'MegaETH', address: 'native', decimals: 18 },
    { symbol: 'MEGA', name: 'MegaETH Token', address: '0x0c833bcdd2dc74d7a8dca82ed011e32d04fe5843', decimals: 18 },
  ],
  '143': [
    { symbol: 'MON', name: 'Monad', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0x754704bc059f8c67012fed69bc8a327a5aafb603', decimals: 6 },
  ],
  // Robinhood Chain (Arbitrum-stack L2, ETH gas). USDG = Global Dollar, its native
  // stablecoin — address + 6 decimals Relay-verified, bridging enabled.
  '4663': [
    { symbol: 'ETH', name: 'Robinhood ETH', address: 'native', decimals: 18 },
    { symbol: 'USDG', name: 'Global Dollar', address: '0x5fc5360d0400a0fd4f2af552add042d716f1d168', decimals: 6 },
  ],
};

const fmt = (n: number, max = 4) => (n === 0 ? '0' : n.toLocaleString(undefined, { maximumFractionDigits: max }));
// Clean decimal string for an input field (no commas, capped precision).
const trimNum = (s: string) => { const n = Number(s); return !n || isNaN(n) ? '' : String(Number(n.toPrecision(8))); };

type Step = 'idle' | 'switching' | 'bridging' | 'waiting' | 'swapping' | 'sol-signing' | 'sol-pending' | 'erc20-approving' | 'erc20-executing';

export const BuyBox = ({ onBalanceRefresh }: { onBalanceRefresh?: () => void }) => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const isAGW = useIsAGWConnected();
  const abstractClient = usePublicClient({ chainId: ABSTRACT_ID });
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();

  // Solana wallet (parallel context; hooks must run unconditionally).
  const { connection } = useConnection();
  const { publicKey, sendTransaction: solSendTransaction, connected: solConnected } = useWallet();

  const [chainId, setChainId] = useState<ChainId>(ABSTRACT_ID);
  const [token, setToken] = useState<TokenOption>(TOKENS_BY_CHAIN[ABSTRACT_ID][0]);
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [lastEdited, setLastEdited] = useState<'in' | 'out'>('in');
  const [recipient, setRecipient] = useState('');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorChain, setSelectorChain] = useState<ChainId>(ABSTRACT_ID);
  const [step, setStep] = useState<Step>('idle');
  const [solBalance, setSolBalance] = useState(0);
  const [solBalNonce, setSolBalNonce] = useState(0);
  const solQuoteRef = useRef<Awaited<ReturnType<typeof getSolToRetsbaQuote>> | null>(null);
  const evmQuoteRef = useRef<Awaited<ReturnType<typeof getEvmTokenQuote>> | null>(null);
  const [solUsdcBalance, setSolUsdcBalance] = useState(0);

  const isAbstractInput = chainId === ABSTRACT_ID;
  const isSolana = chainId === 'solana';
  const isErc20 = token.address !== 'native'; // USDC (any chain) or MEGA — Relay SDK path
  const busy = step !== 'idle';

  const isChainSelectable = (c: ChainOption) => c.id === ABSTRACT_ID || !isAGW;

  // ---- Balances ----
  const { data: inputBalance, refetch: refetchInput } = useBalance({
    address,
    token: (!isSolana && isErc20) ? (token.address as `0x${string}`) : undefined,
    chainId: typeof chainId === 'number' ? chainId : undefined,
    query: { enabled: !!address && typeof chainId === 'number' },
  });
  const { data: retsbaBalanceRaw, refetch: refetchRetsba } = useReadContract({
    address: RETSBA, abi: erc20Abi, functionName: 'balanceOf',
    args: address ? [address] : undefined, chainId: ABSTRACT_ID, query: { enabled: !!address },
  });
  const { data: retsbaDecimals } = useReadContract({ address: RETSBA, abi: erc20Abi, functionName: 'decimals', chainId: ABSTRACT_ID });
  const decimals = retsbaDecimals ?? 18;

  // useBalance returns the right decimals for native AND ERC20 (6 for most USDC, 18 for BNB USDC).
  const evmBal = inputBalance ? Number(formatUnits(inputBalance.value, inputBalance.decimals)) : 0;
  const inputBal = isSolana ? (isErc20 ? solUsdcBalance : solBalance) : evmBal;
  const retsbaBal = retsbaBalanceRaw ? Number(formatUnits(retsbaBalanceRaw, decimals)) : 0;

  // ---- USD markers (spot prices; non-critical, hidden if unavailable) ----
  const { data: usdPrices } = useUsdPrices();
  const inputUsd = usdValue(inputAmount, token.symbol, usdPrices);
  const outputUsd = usdValue(outputAmount, 'RETSBA', usdPrices);

  // ---- Solana SOL balance (separate wallet/RPC; bump solBalNonce to refetch) ----
  useEffect(() => {
    if (!isSolana || !solConnected || !publicKey) return;
    let cancelled = false;
    (async () => {
      try {
        const lamports = await connection.getBalance(publicKey);
        if (!cancelled) setSolBalance(lamports / LAMPORTS_PER_SOL);
      } catch {
        if (!cancelled) setSolBalance(0);
      }
    })();
    return () => { cancelled = true; };
  }, [isSolana, solConnected, publicKey, connection, solBalNonce]);

  // ---- Solana SPL token balance (e.g. USDC) ----
  useEffect(() => {
    if (!isSolana || !isErc20 || !solConnected || !publicKey) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: new PublicKey(token.address) });
        const amt = res.value.reduce((s, a) => s + ((a.account.data as any).parsed?.info?.tokenAmount?.uiAmount || 0), 0);
        if (!cancelled) setSolUsdcBalance(amt);
      } catch {
        if (!cancelled) setSolUsdcBalance(0);
      }
    })();
    return () => { cancelled = true; };
  }, [isSolana, isErc20, solConnected, publicKey, connection, token.address, solBalNonce]);

  // ---- Quoting ----
  // Same-chain (Abstract): bidirectional V2. Cross-chain: exact-input only (Relay bridge
  // estimate -> V2), with the RETSBA output shown read-only as an estimate.
  useEffect(() => {
    if (!abstractClient) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        if (isSolana) {
          const sv = Number(inputAmount);
          const recip = (recipient.trim() || address || '');
          if (!inputAmount || isNaN(sv) || sv <= 0 || !publicKey || !recip || !isAddress(recip)) {
            solQuoteRef.current = null;
            if (!cancelled) setOutputAmount('');
            return;
          }
          const quote = await getSolToRetsbaQuote({
            user: publicKey.toBase58(),
            recipient: recip,
            amount: parseUnits(inputAmount, token.decimals),
            mint: isErc20 ? token.address : undefined,
          });
          if (cancelled) return;
          solQuoteRef.current = quote;
          setOutputAmount(trimNum(quoteRetsbaOut(quote) ?? ''));
          return;
        }

        // EVM ERC20 (USDC any chain, MEGA on MegaETH, USDC same-chain on Abstract): Relay SDK
        // direct -> RETSBA. MUST come before isAbstractInput so Abstract USDC isn't sent down
        // the native parseEther V2 path.
        if (isErc20) {
          const v = Number(inputAmount);
          const recip = (recipient.trim() || address || '');
          if (!inputAmount || isNaN(v) || v <= 0 || !address || !recip || !isAddress(recip)) {
            evmQuoteRef.current = null;
            if (!cancelled) setOutputAmount('');
            return;
          }
          const quote = await getEvmTokenQuote({
            user: address,
            recipient: recip as `0x${string}`,
            originChainId: chainId as number,
            tokenAddress: token.address,
            amount: parseUnits(inputAmount, token.decimals),
          });
          if (cancelled) return;
          evmQuoteRef.current = quote;
          setOutputAmount(trimNum(quoteRetsbaOut(quote) ?? ''));
          return;
        }

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
    }, (isAbstractInput && !isErc20) ? 350 : 600);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [inputAmount, outputAmount, lastEdited, abstractClient, decimals, chainId, isAbstractInput, isSolana, isErc20, token.address, token.decimals, address, publicKey, recipient]);

  const recipientInvalid = recipient.trim().length > 0 && !isAddress(recipient.trim());
  const insufficient = !!inputAmount && Number(inputAmount) > inputBal;
  // Solana requires an Abstract 0x recipient (auto-filled from a connected EVM wallet).
  const solRecipient = recipient.trim() || address || '';
  const solRecipientInvalid = isSolana && !(solRecipient && isAddress(solRecipient));

  const selectChain = (c: ChainOption) => {
    const tk = (TOKENS_BY_CHAIN[String(c.id)] ?? [])[0];
    setChainId(c.id); if (tk) setToken(tk);
    setInputAmount(''); setOutputAmount(''); setLastEdited('in');
    solQuoteRef.current = null;
    // Solana delivers RETSBA to an Abstract 0x address — prefill from the EVM wallet if present.
    if (c.id === 'solana' && address && !recipient.trim()) setRecipient(address);
    setSelectorOpen(false);
  };

  const handleMax = () => {
    setLastEdited('in');
    // Leave gas headroom unless AGW is paying (sponsored, Abstract-only).
    const max = isAGW && isAbstractInput ? inputBal : inputBal * 0.99;
    setInputAmount(max > 0 ? trimNum(String(max)) : '');
  };

  const doAbstractSwap = async (to: `0x${string}`) => {
    // A regular EVM wallet may be on another chain; make sure we're on Abstract before the
    // swap (writeContract pinned to ABSTRACT_ID throws "wrong chain" otherwise). No-op for AGW.
    setStep('switching');
    await switchChainAsync({ chainId: ABSTRACT_ID });
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

  const doSolanaBuy = async (to: `0x${string}`) => {
    if (!publicKey || !solConnected) throw new Error('Connect a Solana wallet first.');
    setStep('sol-signing');
    // Fresh quote at click time so price + recipient are current.
    const quote = await getSolToRetsbaQuote({
      user: publicKey.toBase58(),
      recipient: to,
      amount: parseUnits(inputAmount, token.decimals),
      mint: isErc20 ? token.address : undefined,
    });
    await executeSolToRetsba({
      quote,
      walletAddress: publicKey.toBase58(),
      connection,
      sendTransaction: (tx: VersionedTransaction, options?: SendOptions) => solSendTransaction(tx, connection, options),
      onProgress: () => setStep('sol-pending'),
    });
    toast({ title: 'Buy complete 🎉', description: 'Bridged from Solana — RETSBA delivered to Abstract.' });
  };

  const doErc20Buy = async (to: `0x${string}`) => {
    if (!walletClient) throw new Error('Connect an EVM wallet first.');
    const originId = chainId as number;
    setStep('switching');
    await switchChainAsync({ chainId: originId });
    setStep('erc20-approving');
    // Fresh quote at click time. Relay's execute auto-submits the ERC20 approve (if allowance
    // is needed) then the deposit/swap, delivering RETSBA to `to` on Abstract — no own V2 leg.
    const quote = await getEvmTokenQuote({
      user: address!,
      recipient: to,
      originChainId: originId,
      tokenAddress: token.address,
      amount: parseUnits(inputAmount, token.decimals),
    });
    await executeEvmBuy({ quote, wallet: walletClient, onProgress: () => setStep('erc20-executing') });
    toast({ title: 'Buy complete 🎉', description: `Swapped ${token.symbol} into RETSBA on Abstract.` });
  };

  const handleAction = async () => {
    // ---- Solana path: separate wallet, Relay handles SOL -> RETSBA end-to-end ----
    if (isSolana) {
      if (!solConnected) return; // WalletMultiButton handles connecting
      if (solRecipientInvalid) { toast({ title: 'Abstract address needed', description: 'Enter the Abstract (0x) address that should receive your RETSBA.', variant: 'destructive' }); return; }
      if (!inputAmount || Number(inputAmount) <= 0) return;
      if (insufficient) { toast({ title: `Insufficient ${token.symbol}`, description: `You only have ${fmt(inputBal)} ${token.symbol}.`, variant: 'destructive' }); return; }
      const to = solRecipient as `0x${string}`;
      try {
        await doSolanaBuy(to);
        setInputAmount(''); setOutputAmount(''); solQuoteRef.current = null;
        setSolBalNonce((n) => n + 1);
        setTimeout(() => { refetchRetsba(); onBalanceRefresh?.(); }, 2500);
      } catch (err: any) {
        const msg = err?.shortMessage || err?.message || '';
        if (/reject|denied|cancel|user refused/i.test(msg)) toast({ title: 'Cancelled', description: 'You declined the transaction.' });
        else { console.error('Solana buy error:', err); toast({ title: 'Buy failed', description: msg || 'Something went wrong.', variant: 'destructive' }); }
      } finally {
        setStep('idle');
      }
      return;
    }

    // ---- EVM path ----
    if (!isConnected) { openConnectModal?.(); return; }
    if (recipientInvalid) { toast({ title: 'Invalid address', description: 'That recipient address isn’t valid.', variant: 'destructive' }); return; }
    if (!inputAmount || Number(inputAmount) <= 0 || !abstractClient) return;
    if (insufficient) { toast({ title: 'Insufficient balance', description: `You only have ${fmt(inputBal)} ${token.symbol}.`, variant: 'destructive' }); return; }

    const to = (recipient.trim() ? recipient.trim() : address) as `0x${string}`;
    try {
      if (isErc20) await doErc20Buy(to);
      else if (isAbstractInput) await doAbstractSwap(to);
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
    if (step === 'switching') return 'Switch network in your wallet…';
    if (step === 'bridging') return 'Confirm the bridge in your wallet…';
    if (step === 'waiting') return 'Bridging to Abstract — this can take a minute…';
    if (step === 'swapping') return 'Confirm the swap in your wallet…';
    if (step === 'erc20-approving') return 'Approve the token in your wallet…';
    if (step === 'erc20-executing') return 'Confirm the buy in your wallet…';
    if (step === 'sol-signing') return 'Approve the transaction in your Solana wallet…';
    if (step === 'sol-pending') return 'Bridging from Solana — delivering RETSBA to Abstract…';
    return '';
  }, [step]);

  const buttonText = useMemo(() => {
    if (busy) return (step === 'waiting' || step === 'sol-pending') ? 'Bridging…' : 'Confirm in wallet…';
    if (isSolana) {
      if (!solConnected) return 'Connect Solana Wallet';
      if (solRecipientInvalid) return 'Enter Abstract address';
      if (!inputAmount || Number(inputAmount) <= 0) return 'Enter an amount';
      if (insufficient) return `Insufficient ${token.symbol}`;
      return 'Bridge & Buy';
    }
    if (!isConnected) return 'Connect a Wallet';
    if (recipientInvalid) return 'Invalid recipient address';
    if (!inputAmount || Number(inputAmount) <= 0) return 'Enter an amount';
    if (insufficient) return `Insufficient ${token.symbol}`;
    return isAbstractInput ? 'Buy RETSBA' : 'Bridge & Buy';
  }, [isConnected, busy, step, isSolana, solConnected, solRecipientInvalid, recipientInvalid, inputAmount, insufficient, token.symbol, isAbstractInput]);

  const actionDisabled = busy
    || (isSolana
        ? (solRecipientInvalid || !inputAmount || Number(inputAmount) <= 0 || insufficient)
        : (recipientInvalid || !inputAmount || Number(inputAmount) <= 0 || insufficient));

  const selectorTokens = TOKENS_BY_CHAIN[String(selectorChain)] ?? [];
  const chainName = CHAINS.find((c) => c.id === chainId)?.name ?? '';

  // Always render the swap UI (Uniswap-style); connecting happens in the action area so a
  // Solana-only user can reach the Solana flow without an EVM wallet first.
  return (
    <div className="space-y-2">
      <h3 className="flex items-center justify-center gap-2 text-black font-display text-2xl mb-2">
        Buy <img src="/logos/logo-bordered.png" alt="RETSBA" className="h-8" />
      </h3>

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
          {inputUsd !== undefined && <span className="shrink-0 text-sm text-gray-400">({fmtUsd(inputUsd)})</span>}
          <button onClick={() => { setSelectorChain(chainId); setSelectorOpen(true); }} disabled={busy}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white border border-black/10 px-3 py-1.5 text-black font-medium hover:bg-gray-100 transition-colors disabled:opacity-60">
            <TokenIcon symbol={token.symbol} className="h-5 w-5" />
            {token.symbol}
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
          <span>{chainName}</span>
          <span>
            Balance: {fmt(inputBal)} {token.symbol}
            {inputBal > 0 && <button onClick={handleMax} disabled={busy} className="ml-1.5 font-semibold text-red-600 hover:text-red-700">MAX</button>}
          </span>
        </div>
      </div>

      {/* divider */}
      <div className="flex justify-center -my-1">
        <div className="rounded-full border border-black/10 bg-white p-1.5 shadow-sm"><ArrowDown className="h-4 w-4 text-gray-500" /></div>
      </div>

      {/* OUTPUT slot */}
      <div className="rounded-xl border border-black/10 bg-gray-50 p-4">
        <p className="text-xs font-medium text-gray-500">You receive{(!isAbstractInput || isErc20) && ' (estimated)'}</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <input
            inputMode="decimal" placeholder="0.000"
            readOnly={!isAbstractInput || isErc20} disabled={busy}
            value={outputAmount}
            onChange={(e) => { if (isAbstractInput && !isErc20) { setLastEdited('out'); setOutputAmount(e.target.value.replace(/[^0-9.]/g, '')); } }}
            className={`w-0 flex-1 bg-transparent text-2xl font-semibold text-black outline-none placeholder:text-gray-300 ${(!isAbstractInput || isErc20) ? 'cursor-default' : ''}`}
          />
          {outputUsd !== undefined && <span className="shrink-0 text-sm text-gray-400">({fmtUsd(outputUsd)})</span>}
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white border border-black/10 px-3 py-1.5 text-black font-medium"><TokenIcon symbol="RETSBA" className="h-5 w-5" />RETSBA</div>
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
          className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-black outline-none placeholder:text-gray-400 ${(recipientInvalid || (isSolana && solRecipientInvalid)) ? 'border-red-500' : 'border-black/10 focus:border-black/30'}`}
        />
        {recipientInvalid && <p className="mt-1 text-xs text-red-500">Enter a valid 0x wallet address.</p>}
        {isSolana && solRecipientInvalid && !recipientInvalid && <p className="mt-1 text-xs text-red-500">Enter the Abstract (0x) address that will receive your RETSBA.</p>}
      </div>

      {/* Status line during a cross-chain buy */}
      {statusText && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {statusText}
        </div>
      )}

      {/* Action — connect affordance depends on which chain's wallet is needed */}
      {isSolana && !solConnected ? (
        <div className="mt-1 flex justify-center [&_button]:!w-full [&_button]:!justify-center [&_button]:!rounded-xl [&_button]:!bg-red-600 [&_button]:!py-3 [&_button]:!h-auto [&_button]:!font-bold">
          <WalletMultiButton>Connect Solana Wallet</WalletMultiButton>
        </div>
      ) : (!isSolana && !isConnected) ? (
        <button onClick={() => openConnectModal?.()}
          className="mt-1 w-full rounded-xl bg-red-600 py-3 font-bold text-white transition-colors hover:bg-red-700">
          Connect a Wallet
        </button>
      ) : (
        <button onClick={handleAction} disabled={actionDisabled}
          className="mt-1 w-full rounded-xl bg-red-600 py-3 font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
          {buttonText}
        </button>
      )}

      {/* Chain + token selector */}
      <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
        <DialogContent className="max-w-md bg-white p-0 overflow-hidden">
          {/* DialogContent renders its own close X (top-right) — don't add a second one. */}
          <div className="border-b border-black/10 px-4 py-3">
            <DialogTitle className="font-semibold text-black">Select network &amp; token</DialogTitle>
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
                    <span className="flex items-center gap-2"><ChainIcon id={c.id} name={c.name} className="h-5 w-5" />{c.name}</span>
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
                    <span className="flex items-center gap-2.5">
                      <TokenIcon symbol={tk.symbol} className="h-6 w-6" />
                      <span className="flex flex-col">
                        <span className="font-medium text-black">{tk.symbol}</span>
                        <span className="text-xs text-gray-400">{tk.name}</span>
                      </span>
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
