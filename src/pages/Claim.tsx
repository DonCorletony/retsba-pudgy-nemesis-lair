import React, { useState, useEffect } from 'react';
import FooterDiorama from '../components/FooterDiorama';
import PageTitleLogo from '../components/PageTitleLogo';
import { useAccount, useReadContract, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useIsAGWConnected } from '@/utils/agwValidation';
import { erc20Abi, formatUnits } from 'viem';
import { useToast } from '@/hooks/use-toast';

const RETSBA_TOKEN_ADDRESS = '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A' as `0x${string}`;
const MIN_BALANCE = 25_000; // must hold strictly MORE than this
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const COOLDOWN_KEY_PREFIX = 'retsba_spam_last_';

const Claim = () => {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const isAGW = useIsAGWConnected();
  const { toast } = useToast();
  const [cooldownRemaining, setCooldownRemaining] = useState<string | null>(null);

  // Read RETSBA balance
  const { data: retsbaBalance } = useReadContract({
    address: RETSBA_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: retsbaDecimals } = useReadContract({
    address: RETSBA_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: !!address },
  });

  const { sendTransaction, data: txHash, isPending } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Cooldown timer — per wallet (1 hour)
  useEffect(() => {
    const update = () => {
      if (!address) { setCooldownRemaining(null); return; }
      const last = localStorage.getItem(COOLDOWN_KEY_PREFIX + address.toLowerCase());
      if (!last) { setCooldownRemaining(null); return; }
      const elapsed = Date.now() - parseInt(last);
      if (elapsed >= COOLDOWN_MS) { setCooldownRemaining(null); return; }
      const totalSec = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      setCooldownRemaining(`${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [address]);

  // On confirmation, start the 1-hour cooldown for this wallet
  useEffect(() => {
    if (isConfirmed && txHash && address) {
      localStorage.setItem(COOLDOWN_KEY_PREFIX + address.toLowerCase(), Date.now().toString());
      toast({
        title: 'Transaction confirmed!',
        description: 'Your transaction is on Abstract. Come back in an hour for another.',
      });
    }
  }, [isConfirmed, txHash, address, toast]);

  const getBalance = (): number => {
    if (!retsbaBalance || retsbaDecimals === undefined) return 0;
    return parseFloat(formatUnits(retsbaBalance, retsbaDecimals));
  };

  const handleClick = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    // The transaction only works through Abstract Global Wallet.
    // A non-AGW EVM wallet can connect for trading/balances, but not here.
    if (!isAGW) {
      toast({
        title: 'Abstract Global Wallet required',
        description: 'The Transaction Spammer only works when connected with Abstract Global Wallet (AGW).',
        variant: 'destructive',
      });
      return;
    }

    const balance = getBalance();
    if (balance <= MIN_BALANCE) {
      toast({
        title: 'Not enough $RETSBA',
        description: `You need more than ${MIN_BALANCE.toLocaleString()} $RETSBA. You have ${Math.floor(balance).toLocaleString()}.`,
        variant: 'destructive',
      });
      return;
    }

    if (cooldownRemaining) {
      toast({
        title: 'Cooldown active',
        description: `Please wait ${cooldownRemaining} before your next transaction.`,
        variant: 'destructive',
      });
      return;
    }

    // A single zero-value self-transfer — the most basic transaction on Abstract.
    sendTransaction({
      to: address!,
      value: 0n,
    });
  };

  const isLoading = isPending || isConfirming;
  const isDisabled = isLoading || !!cooldownRemaining;

  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet';
    if (!isAGW) return 'Use Abstract Global Wallet';
    if (isPending) return 'Confirm in wallet...';
    if (isConfirming) return 'Confirming...';
    if (cooldownRemaining) return `Cooldown: ${cooldownRemaining}`;
    return 'Spam Transaction';
  };

  return (
    <div className="min-h-screen flex flex-col bg-retsba dark:bg-black">
      <div className="flex-1 pt-28 md:pt-36 pb-8">
        <div className="container mx-auto px-4">
          <PageTitleLogo
            src="/logos/transaction spammer 3000.png"
            alt="Transaction Spammer 3000"
            heightClass="h-[190px] md:h-[393px]"
          />

          <div className="max-w-md mx-auto bg-white dark:bg-black/90 dark:border dark:border-white/10 rounded-2xl shadow-lg p-10 flex items-center justify-center">
            <button
              onClick={handleClick}
              disabled={isDisabled}
              className={`font-bold text-lg px-10 py-3 rounded-xl transition-colors ${
                cooldownRemaining
                  ? 'bg-gray-400 dark:bg-gray-600 text-white/80 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white'
              }`}
            >
              {getButtonText()}
            </button>
          </div>

          <p className="max-w-md mx-auto text-center text-white/80 text-base mt-6">
            Holders of more than {MIN_BALANCE.toLocaleString()} $RETSBA can spam one free transaction
            onto the Abstract blockchain every hour.
          </p>
        </div>
      </div>
      <FooterDiorama />
    </div>
  );
};

export default Claim;
