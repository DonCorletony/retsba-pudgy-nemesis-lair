import React, { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { encodeFunctionData, parseAbi, isAddress } from 'viem';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, CheckCircle2, AlertCircle, Wallet } from 'lucide-react';

const ERC1155_ABI = parseAbi([
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
]);

const BATCH_SIZE = 50;

type AirdropStatus = 'idle' | 'loading-holders' | 'previewing' | 'confirming' | 'sending' | 'done' | 'error';

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
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();

  const [nftContract, setNftContract] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [holderCount, setHolderCount] = useState('');
  const [selectedToken, setSelectedToken] = useState('retsba');
  const [status, setStatus] = useState<AirdropStatus>('idle');
  const [holders, setHolders] = useState<HolderEntry[]>([]);
  const [nftBalance, setNftBalance] = useState<bigint | null>(null);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState('');
  const [txHashes, setTxHashes] = useState<string[]>([]);

  const resetState = () => {
    setStatus('idle');
    setHolders([]);
    setNftBalance(null);
    setProgress({ sent: 0, total: 0 });
    setErrorMsg('');
    setTxHashes([]);
  };

  const fetchHolders = useCallback(async () => {
    if (!nftContract || !tokenId || !holderCount || !isConnected || !address || !publicClient) return;

    if (!isAddress(nftContract)) {
      setErrorMsg('Invalid NFT contract address');
      setStatus('error');
      return;
    }

    const count = parseInt(holderCount);
    if (isNaN(count) || count < 1 || count > 1000) {
      setErrorMsg('Holder count must be between 1 and 1,000');
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

      const topHolders: HolderEntry[] = (data.holders as HolderEntry[]).slice(0, count);
      if (topHolders.length === 0) throw new Error('No holders found');

      const balance = await publicClient.readContract({
        address: nftContract as `0x${string}`,
        abi: ERC1155_ABI,
        functionName: 'balanceOf',
        args: [address, BigInt(tokenId)],
      });

      setNftBalance(balance as bigint);
      setHolders(topHolders);
      setProgress({ sent: 0, total: topHolders.length });
      setStatus('previewing');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
      setStatus('error');
    }
  }, [nftContract, tokenId, holderCount, isConnected, address, publicClient, password, selectedToken]);

  const executeBatchSend = useCallback(async () => {
    if (!walletClient || !address || holders.length === 0) return;

    const count = holders.length;
    const needed = BigInt(count);

    if (nftBalance === null || nftBalance < needed) {
      setErrorMsg(`Insufficient NFT balance. You have ${nftBalance?.toString() ?? '0'} but need ${count}.`);
      setStatus('error');
      return;
    }

    setStatus('sending');
    setTxHashes([]);
    let totalSent = 0;

    try {
      for (let i = 0; i < holders.length; i += BATCH_SIZE) {
        const chunk = holders.slice(i, i + BATCH_SIZE);

        const calls = chunk.map((holder) => ({
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

        // Use sendCalls for EIP-5792 batch (supported by AGW)
        const txHash = await (walletClient as any).sendTransactionBatch({
          calls,
        });

        setTxHashes((prev) => [...prev, txHash]);
        totalSent += chunk.length;
        setProgress({ sent: totalSent, total: count });
      }

      setStatus('done');
      toast({
        title: 'Airdrop Complete',
        description: `Successfully sent NFTs to ${totalSent} holders`,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Transaction failed');
      setStatus('error');
      if (totalSent > 0) {
        toast({
          title: 'Airdrop Partially Complete',
          description: `Sent to ${totalSent}/${count} holders before error`,
          variant: 'destructive',
        });
      }
    }
  }, [walletClient, address, holders, nftBalance, nftContract, tokenId, toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">NFT Airdrop Tool</h2>
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
          {(status === 'idle' || status === 'error') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nft-contract" className="text-muted-foreground">
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
                <Label htmlFor="token-id" className="text-muted-foreground">
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
                <Label htmlFor="holder-token" className="text-muted-foreground">
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
                <Label htmlFor="holder-count" className="text-muted-foreground">
                  Number of top holders
                </Label>
                <Input
                  id="holder-count"
                  placeholder="e.g. 100"
                  value={holderCount}
                  onChange={(e) => setHolderCount(e.target.value)}
                  type="number"
                  min="1"
                  max="1000"
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
                  disabled={!nftContract || !tokenId || !holderCount}
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

          {status === 'previewing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground">Recipients</p>
                  <p className="text-2xl font-bold text-foreground">{holders.length}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground">NFTs per holder</p>
                  <p className="text-2xl font-bold text-foreground">1</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total NFTs needed</p>
                  <p className="text-2xl font-bold text-foreground">{holders.length}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground">Your balance</p>
                  <p className={`text-2xl font-bold ${nftBalance !== null && nftBalance >= BigInt(holders.length) ? 'text-green-600' : 'text-destructive'}`}>
                    {nftBalance?.toString() ?? '0'}
                  </p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4 max-h-60 overflow-y-auto">
                <p className="text-sm font-medium text-muted-foreground mb-2">Recipient addresses (top {holders.length}):</p>
                <div className="space-y-1">
                  {holders.slice(0, 20).map((h) => (
                    <div key={h.address} className="flex justify-between text-xs font-mono text-foreground/80">
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

              <p className="text-sm text-muted-foreground text-center">
                This will send in {Math.ceil(holders.length / BATCH_SIZE)} batch transaction(s) of up to {BATCH_SIZE} transfers each.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" onClick={resetState} className="flex-1">
                  Cancel
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
              <p className="text-lg font-bold text-foreground">Are you sure?</p>
              <p className="text-muted-foreground">
                You are about to send <strong>{holders.length}</strong> NFTs to the top {holders.length} holders of{' '}
                <strong>{TOKEN_OPTIONS.find((t) => t.id === selectedToken)?.label}</strong>.
                This action cannot be undone.
              </p>
              <div className="flex gap-3 max-w-md mx-auto">
                <Button variant="outline" onClick={resetState} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={executeBatchSend}
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
              <p className="text-lg font-bold text-foreground">Sending NFTs...</p>
              <p className="text-muted-foreground">
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
              <p className="text-lg font-bold text-foreground">Airdrop Complete!</p>
              <p className="text-muted-foreground">
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
