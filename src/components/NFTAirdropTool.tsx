import React, { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWriteContract, useSendCalls } from 'wagmi';
import { useAbstractClient } from '@abstract-foundation/agw-react';
import { encodeFunctionData, parseAbi, isAddress } from 'viem';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, CheckCircle2, AlertCircle, Wallet, TestTube } from 'lucide-react';

const ERC1155_ABI = parseAbi([
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
]);

const FALLBACK_BATCH_SIZE = 50;
const SIMULATE_BATCH_SIZE = 20;

type AirdropStatus = 'idle' | 'loading-holders' | 'simulating' | 'previewing' | 'confirming' | 'sending' | 'testing' | 'done' | 'error';

const TOKEN_OPTIONS = [
  { id: 'retsba', label: '$RETSBA' },
  { id: 'abster', label: 'Abster' },
  { id: 'god', label: 'God' },
  { id: 'polly', label: 'Polly' },
];

interface HolderEntry {
  rank: number;
  address: string;
  balance: string;
}

export const NFTAirdropTool: React.FC<{ password: string }> = ({ password }) => {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: agwClient } = useAbstractClient();
  const { writeContractAsync } = useWriteContract();
  const { sendCallsAsync } = useSendCalls();
  const { toast } = useToast();

  const [nftContract, setNftContract] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [rankStart, setRankStart] = useState('1');
  const [rankEnd, setRankEnd] = useState('');
  const [selectedToken, setSelectedToken] = useState('retsba');
  const [status, setStatus] = useState<AirdropStatus>('idle');
  const [holders, setHolders] = useState<HolderEntry[]>([]);
  const [nftBalance, setNftBalance] = useState<bigint | null>(null);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });
  const [simulateProgress, setSimulateProgress] = useState({ checked: 0, total: 0, skipped: 0 });
  const [skippedAddresses, setSkippedAddresses] = useState<{ rank: number; address: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [txHashes, setTxHashes] = useState<string[]>([]);
  const [testResult, setTestResult] = useState('');

  const resetState = () => {
    setStatus('idle');
    setHolders([]);
    setNftBalance(null);
    setProgress({ sent: 0, total: 0 });
    setSimulateProgress({ checked: 0, total: 0, skipped: 0 });
    setSkippedAddresses([]);
    setErrorMsg('');
    setTxHashes([]);
    setTestResult('');
  };

  // Simulate transfers to filter out addresses that can't receive ERC-1155
  const simulateTransfers = useCallback(async (candidates: HolderEntry[]): Promise<HolderEntry[]> => {
    if (!address || !publicClient || !nftContract || !tokenId) return candidates;

    setStatus('simulating');
    setSimulateProgress({ checked: 0, total: candidates.length, skipped: 0 });
    setSkippedAddresses([]);

    const compatible: HolderEntry[] = [];
    const skipped: { rank: number; address: string }[] = [];

    for (let i = 0; i < candidates.length; i += SIMULATE_BATCH_SIZE) {
      const chunk = candidates.slice(i, i + SIMULATE_BATCH_SIZE);

      const results = await Promise.allSettled(
        chunk.map((holder) =>
          publicClient.simulateContract({
            address: nftContract as `0x${string}`,
            abi: ERC1155_ABI,
            functionName: 'safeTransferFrom',
            args: [
              address,
              holder.address as `0x${string}`,
              BigInt(tokenId),
              1n,
              '0x' as `0x${string}`,
            ],
            account: address,
          })
        )
      );

      results.forEach((result, idx) => {
        const holder = chunk[idx];
        if (result.status === 'fulfilled') {
          compatible.push(holder);
        } else {
          console.log(`[Airdrop Sim] Skipping #${holder.rank} (${holder.address}): ${(result.reason as any)?.shortMessage || (result.reason as Error)?.message}`);
          skipped.push({ rank: holder.rank, address: holder.address });
        }
      });

      setSimulateProgress({
        checked: Math.min(i + SIMULATE_BATCH_SIZE, candidates.length),
        total: candidates.length,
        skipped: skipped.length,
      });
    }

    setSkippedAddresses(skipped);
    console.log(`[Airdrop Sim] ${compatible.length} compatible, ${skipped.length} skipped`);
    return compatible;
  }, [address, publicClient, nftContract, tokenId]);

  // Test a single transfer to a burn address to verify the contract works
  const testSingleTransfer = useCallback(async () => {
    if (!address || !nftContract || !tokenId) return;

    setStatus('testing');
    setTestResult('');
    setErrorMsg('');

    // Send to burn address so no real holder gets it
    const testRecipient = '0x000000000000000000000000000000000000dEaD' as `0x${string}`;

    try {
      console.log('[Airdrop Test] Attempting single safeTransferFrom...');
      console.log('[Airdrop Test] From:', address);
      console.log('[Airdrop Test] To:', testRecipient);
      console.log('[Airdrop Test] Contract:', nftContract);
      console.log('[Airdrop Test] Token ID:', tokenId);

      const hash = await writeContractAsync({
        address: nftContract as `0x${string}`,
        abi: ERC1155_ABI,
        functionName: 'safeTransferFrom',
        args: [
          address,
          testRecipient,
          BigInt(tokenId),
          1n,
          '0x' as `0x${string}`,
        ],
        account: address,
        chain: (agwClient as any)?.chain ?? undefined,
      });

      setTestResult(`✅ Test transfer succeeded! TX: ${hash}`);
      setStatus('previewing');
      toast({
        title: 'Test Transfer Succeeded',
        description: `Sent 1 NFT to ${testRecipient.slice(0, 8)}...`,
      });

      // Refresh balance after test
      if (publicClient) {
        const newBalance = await publicClient.readContract({
          address: nftContract as `0x${string}`,
          abi: ERC1155_ABI,
          functionName: 'balanceOf',
          args: [address, BigInt(tokenId)],
        });
        setNftBalance(newBalance as bigint);
      }
    } catch (err: any) {
      console.error('[Airdrop Test] Single transfer failed:', err);
      const msg = err.shortMessage || err.message || 'Unknown error';
      setTestResult(`❌ Test transfer failed: ${msg}`);
      setErrorMsg(`Single transfer failed: ${msg}. This means the NFT contract may have transfer restrictions or compatibility issues on Abstract.`);
      setStatus('previewing');
    }
  }, [address, nftContract, tokenId, writeContractAsync, publicClient, toast]);

  const buildTransferCalls = useCallback((batchHolders: HolderEntry[]) => {
    if (!address) return [];

    return batchHolders.map((holder) => ({
      to: nftContract as `0x${string}`,
      data: encodeFunctionData({
        abi: ERC1155_ABI,
        functionName: 'safeTransferFrom',
        args: [
          address,
          holder.address as `0x${string}`,
          BigInt(tokenId),
          1n,
          '0x' as `0x${string}`,
        ],
      }),
    }));
  }, [address, nftContract, tokenId]);

  const fetchHolders = useCallback(async () => {
    if (!nftContract || !tokenId || !rankEnd || !isConnected || !address || !publicClient) return;

    if (!isAddress(nftContract)) {
      setErrorMsg('Invalid NFT contract address');
      setStatus('error');
      return;
    }

    const start = parseInt(rankStart);
    const end = parseInt(rankEnd);
    if (isNaN(start) || isNaN(end) || start < 1 || end > 1250 || start > end) {
      setErrorMsg('Invalid rank range. Start must be ≤ end, both between 1 and 1,250');
      setStatus('error');
      return;
    }

    setStatus('loading-holders');
    setErrorMsg('');

    try {
      const { data, error } = await supabase.functions.invoke('fetch-holders', {
        body: { password, tokenId: selectedToken },
      });

      if (error || !data?.holders) {
        throw new Error(error?.message || 'Failed to fetch holders');
      }

      // Slice by rank range (ranks are 1-indexed, array is 0-indexed)
      const allHolders = data.holders as HolderEntry[];
      const rangeHolders = allHolders.slice(start - 1, end);
      if (rangeHolders.length === 0) throw new Error('No holders found in that range');

      const balance = await publicClient.readContract({
        address: nftContract as `0x${string}`,
        abi: ERC1155_ABI,
        functionName: 'balanceOf',
        args: [address, BigInt(tokenId)],
      });

      setNftBalance(balance as bigint);

      // Simulate all transfers to filter out incompatible addresses
      const compatibleHolders = await simulateTransfers(rangeHolders);

      if (compatibleHolders.length === 0) {
        throw new Error('No compatible recipients found. All addresses in this range rejected the ERC-1155 transfer.');
      }

      setHolders(compatibleHolders);
      setProgress({ sent: 0, total: compatibleHolders.length });
      setStatus('previewing');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
      setStatus('error');
    }
  }, [nftContract, tokenId, rankStart, rankEnd, isConnected, address, publicClient, password, selectedToken, simulateTransfers]);

  const executeBatchSend = useCallback(async (resumeFromIndex = 0) => {
    if (!address || holders.length === 0) return;

    const count = holders.length;
    const remaining = count - resumeFromIndex;
    const needed = BigInt(remaining);

    if (nftBalance === null || nftBalance < needed) {
      setErrorMsg(`Insufficient NFT balance. You have ${nftBalance?.toString() ?? '0'} but need ${needed.toString()}.`);
      setStatus('error');
      return;
    }

    setStatus('sending');
    if (resumeFromIndex === 0) {
      setTxHashes([]);
    }
    setProgress({ sent: resumeFromIndex, total: count });

    const remainingHolders = holders.slice(resumeFromIndex);
    const submitCalls = async (calls: Array<{ to: `0x${string}`; data: `0x${string}` }>) => {
      const result = await (sendCallsAsync as any)({ calls });
      return typeof result === 'string' ? result : result?.id ?? 'unknown';
    };

    const singleApprovalCalls = buildTransferCalls(remainingHolders);

    try {
      console.log(`[Airdrop] Attempting single wallet approval for ${singleApprovalCalls.length} transfer(s)...`);
      const batchId = await submitCalls(singleApprovalCalls);

      setTxHashes((prev) => (resumeFromIndex === 0 ? [batchId] : [...prev, batchId]));
      setProgress({ sent: count, total: count });
      setStatus('done');
      toast({
        title: 'Airdrop Complete',
        description: `Submitted ${remaining} transfer(s) in one wallet approval.`,
      });
      return;
    } catch (singleApprovalError: any) {
      console.error('[Airdrop] Single approval attempt failed, falling back to smaller batches:', singleApprovalError);
      toast({
        title: 'Large batch not accepted',
        description: `Falling back to ${Math.ceil(remaining / FALLBACK_BATCH_SIZE)} smaller wallet approval(s).`,
      });
    }

    const batches: Array<{ calls: Array<{ to: `0x${string}`; data: `0x${string}` }>; startIdx: number }> = [];
    for (let i = resumeFromIndex; i < holders.length; i += FALLBACK_BATCH_SIZE) {
      const chunk = holders.slice(i, i + FALLBACK_BATCH_SIZE);
      batches.push({ calls: buildTransferCalls(chunk), startIdx: i });
    }

    console.log(`[Airdrop] Sending ${batches.length} fallback batch(es)...`);

    let totalSent = resumeFromIndex;
    const newHashes: string[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      try {
        const batchId = await submitCalls(batch.calls);
        totalSent += batch.calls.length;
        newHashes.push(batchId);
        setTxHashes((prev) => [...prev, batchId]);
        setProgress({ sent: totalSent, total: count });
        console.log(`[Airdrop] Fallback batch ${i + 1} confirmed: ${batchId}`);
      } catch (batchError) {
        console.error(`[Airdrop] Fallback batch ${i + 1} failed:`, batchError);
        setErrorMsg(`Batch ${i + 1} failed after ${totalSent}/${count} NFTs were submitted.`);
        setProgress({ sent: totalSent, total: count });
        setStatus('error');
        toast({
          title: 'Airdrop Paused',
          description: `Submitted ${totalSent}/${count}. Use "Resume" to continue from the next unsent holder.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setTxHashes((prev) => [...prev, ...newHashes.filter((hash) => !prev.includes(hash))]);
    setProgress({ sent: totalSent, total: count });
    setStatus('done');
    toast({
      title: 'Airdrop Complete',
      description: `Successfully sent NFTs to ${totalSent} holders.`,
    });
  }, [address, holders, nftBalance, buildTransferCalls, toast, sendCallsAsync]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-black">NFT Airdrop Tool</h2>
        {isConnected && address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="w-4 h-4" />
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="text-center py-12 text-muted-foreground">
          <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Connect your wallet to use the airdrop tool</p>
          <p className="text-sm mt-2">Use the AGW connect button in the navigation bar</p>
        </div>
      ) : (
        <>
          {status === 'error' && progress.sent > 0 && holders.length > 0 && (
            <div className="text-center space-y-4 py-8">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
              <p className="text-lg font-bold text-black">Airdrop Paused</p>
              <p className="text-gray-700">
                Sent <strong>{progress.sent}</strong> / <strong>{progress.total}</strong> NFTs before the error occurred.
              </p>
              {errorMsg && (
                <p className="text-sm text-destructive">{errorMsg}</p>
              )}
              <div className="flex gap-3 max-w-md mx-auto">
                <Button variant="outline" onClick={resetState} className="flex-1">
                  Start Over
                </Button>
                <Button
                  onClick={() => executeBatchSend(progress.sent)}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Resume ({progress.total - progress.sent} remaining)
                </Button>
              </div>
              {txHashes.length > 0 && (
                <div className="space-y-1 pt-2">
                  <p className="text-xs text-muted-foreground">Completed batches:</p>
                  {txHashes.map((hash, i) => (
                    <a
                      key={hash}
                      href={`https://abscan.org/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-primary hover:underline font-mono"
                    >
                      Batch {i + 1}: {hash.slice(0, 10)}...{hash.slice(-8)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {(status === 'idle' || (status === 'error' && progress.sent === 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nft-contract" className="text-gray-700">
                  NFT Contract Address (ERC-1155)
                </Label>
                <Input
                  id="nft-contract"
                  placeholder="0x..."
                  value={nftContract}
                  onChange={(e) => setNftContract(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token-id" className="text-gray-700">
                  NFT Token ID
                </Label>
                <Input
                  id="token-id"
                  placeholder="e.g. 1"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  type="number"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="holder-token" className="text-gray-700">
                  Send to holders of
                </Label>
                <select
                  id="holder-token"
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
                >
                  {TOKEN_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rank-start" className="text-gray-700">
                  Holder rank start
                </Label>
                <Input
                  id="rank-start"
                  placeholder="e.g. 1"
                  value={rankStart}
                  onChange={(e) => setRankStart(e.target.value)}
                  type="number"
                  min="1"
                  max="1250"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rank-end" className="text-gray-700">
                  Holder rank end
                </Label>
                <Input
                  id="rank-end"
                  placeholder="e.g. 1001"
                  value={rankEnd}
                  onChange={(e) => setRankEnd(e.target.value)}
                  type="number"
                  min="1"
                  max="1250"
                />
              </div>

              {errorMsg && (
                <div className="col-span-full flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errorMsg}
                </div>
              )}

              <div className="col-span-full">
                <Button
                  onClick={fetchHolders}
                  disabled={!nftContract || !tokenId || !rankEnd}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Preview Airdrop
                </Button>
              </div>
            </div>
          )}

          {status === 'loading-holders' && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading holder data & checking NFT balance...</p>
            </div>
          )}

          {status === 'simulating' && (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-lg font-bold text-black">Simulating transfers...</p>
              <p className="text-gray-700">
                Checking {simulateProgress.checked} / {simulateProgress.total} addresses
              </p>
              {simulateProgress.skipped > 0 && (
                <p className="text-sm text-yellow-600">
                  ⚠️ {simulateProgress.skipped} incompatible address(es) found — will be skipped
                </p>
              )}
              <div className="w-full max-w-md mx-auto bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${simulateProgress.total ? (simulateProgress.checked / simulateProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {(status === 'previewing' || status === 'testing') && (
            <div className="space-y-4">
              {skippedAddresses.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-yellow-800">
                    ⚠️ {skippedAddresses.length} address(es) auto-excluded (can't receive ERC-1155):
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {skippedAddresses.map((s) => (
                      <div key={s.address} className="text-xs font-mono text-yellow-700">
                        #{s.rank} — {s.address}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600">Recipients</p>
                  <p className="text-2xl font-bold text-black">{holders.length}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600">NFTs per holder</p>
                  <p className="text-2xl font-bold text-black">1</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600">Total NFTs needed</p>
                  <p className="text-2xl font-bold text-black">{holders.length}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600">Your balance</p>
                  <p className={`text-2xl font-bold ${nftBalance !== null && nftBalance >= BigInt(holders.length) ? 'text-green-600' : 'text-destructive'}`}>
                    {nftBalance?.toString() ?? '0'}
                  </p>
                </div>
              </div>

              {testResult && (
                <div className={`p-3 rounded-lg text-sm font-mono ${testResult.startsWith('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {testResult}
                </div>
              )}

              <div className="bg-muted/30 rounded-xl p-4 max-h-60 overflow-y-auto">
                <p className="text-sm font-medium text-gray-600 mb-2">Recipient addresses (ranks {holders[0]?.rank}–{holders[holders.length - 1]?.rank}):</p>
                <div className="space-y-1">
                  {holders.slice(0, 20).map((h) => (
                    <div key={h.address} className="flex justify-between text-xs font-mono text-black/80">
                      <span>#{h.rank}</span>
                      <span>{h.address}</span>
                    </div>
                  ))}
                  {holders.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      ...and {holders.length - 20} more
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 text-center">
                This will try 1 wallet approval for all {holders.length} transfers first. If the wallet rejects the request size, it will fall back to {Math.ceil(holders.length / FALLBACK_BATCH_SIZE)} smaller batch transaction(s) of up to {FALLBACK_BATCH_SIZE} transfers.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" onClick={resetState} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={testSingleTransfer}
                  variant="outline"
                  className="flex-1 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                  disabled={status === 'testing'}
                >
                  {status === 'testing' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Test 1 Transfer (to burn)
                </Button>
                <Button
                  onClick={() => setStatus('confirming')}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={nftBalance === null || nftBalance < BigInt(holders.length)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Confirm & Send
                </Button>
              </div>
            </div>
          )}

          {status === 'confirming' && (
            <div className="text-center space-y-4 py-8">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
              <p className="text-lg font-bold text-black">Are you sure?</p>
              <p className="text-gray-700">
                You are about to send <strong>{holders.length}</strong> NFTs to the top {holders.length} holders of{' '}
                <strong>{TOKEN_OPTIONS.find((t) => t.id === selectedToken)?.label}</strong>.
                This action cannot be undone.
              </p>
              <div className="flex gap-3 max-w-md mx-auto">
                <Button variant="outline" onClick={resetState} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() => executeBatchSend(0)}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Send {holders.length} NFTs
                </Button>
              </div>
            </div>
          )}

          {status === 'sending' && (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
              <p className="text-lg font-bold text-black">Sending NFTs...</p>
              <p className="text-gray-700">
                {progress.sent} / {progress.total} transferred
              </p>
              <div className="w-full max-w-md mx-auto bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.sent / progress.total) * 100}%` }}
                />
              </div>
              {txHashes.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {txHashes.length} batch(es) confirmed
                </div>
              )}
            </div>
          )}

          {status === 'done' && (
            <div className="text-center py-12 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-lg font-bold text-black">Airdrop Complete!</p>
              <p className="text-gray-700">
                Successfully sent {progress.total} NFTs across {txHashes.length} transaction(s).
              </p>
              {txHashes.length > 0 && (
                <div className="space-y-1">
                  {txHashes.map((hash, i) => (
                    <a
                      key={hash}
                      href={`https://abscan.org/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-primary hover:underline font-mono"
                    >
                      Batch {i + 1}: {hash.slice(0, 10)}...{hash.slice(-8)}
                    </a>
                  ))}
                </div>
              )}
              <Button onClick={resetState} variant="outline">
                Start New Airdrop
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
