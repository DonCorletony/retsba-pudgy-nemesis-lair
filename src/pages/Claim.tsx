import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import FooterDiorama from '../components/FooterDiorama';
import { useAccount, useReadContract, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { useLoginWithAbstract } from '@abstract-foundation/agw-react';
import { erc20Abi, formatUnits } from 'viem';
import { useToast } from '@/hooks/use-toast';

const RETSBA_TOKEN_ADDRESS = '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A' as `0x${string}`;
const MIN_BALANCE = 10_000;
const COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 hours
const COOLDOWN_KEY_PREFIX = 'retsba_claim_last_';

const Claim = () => {
  const { t } = useLanguage();
  const { isConnected, address } = useAccount();
  const { login } = useLoginWithAbstract();
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

  // Cooldown timer - per wallet
  useEffect(() => {
    const update = () => {
      if (!address) { setCooldownRemaining(null); return; }
      const last = localStorage.getItem(COOLDOWN_KEY_PREFIX + address.toLowerCase());
      if (!last) { setCooldownRemaining(null); return; }
      const elapsed = Date.now() - parseInt(last);
      if (elapsed >= COOLDOWN_MS) { setCooldownRemaining(null); return; }
      const remaining = COOLDOWN_MS - elapsed;
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCooldownRemaining(`${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [address]);

  // Handle successful confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      localStorage.setItem(COOLDOWN_KEY_PREFIX + address!.toLowerCase(), Date.now().toString());
      toast({
        title: 'Transaction confirmed!',
        description: 'Your claim transaction has been recorded on Abstract.',
      });
    }
  }, [isConfirmed, txHash, toast]);

  const getBalance = (): number => {
    if (!retsbaBalance || retsbaDecimals === undefined) return 0;
    return parseFloat(formatUnits(retsbaBalance, retsbaDecimals));
  };

  const handleClick = async () => {
    if (!isConnected) {
      await login();
      return;
    }

    const balance = getBalance();
    if (balance < MIN_BALANCE) {
      toast({
        title: 'Insufficient balance',
        description: `You need at least 10,000 $RETSBA to claim. You have ${Math.floor(balance).toLocaleString()}.`,
        variant: 'destructive',
      });
      return;
    }

    if (cooldownRemaining) {
      toast({
        title: 'Cooldown active',
        description: `Please wait ${cooldownRemaining} before claiming again.`,
        variant: 'destructive',
      });
      return;
    }

    // Send zero-value self-transfer (gas sponsored by AGW)
    sendTransaction({
      to: address!,
      value: BigInt(0),
    });
  };

  const isLoading = isPending || isConfirming;
  const isDisabled = isLoading || !!cooldownRemaining;

  const getButtonText = () => {
    if (!isConnected) return 'Connect AGW';
    if (isPending) return 'Confirm in wallet...';
    if (isConfirming) return 'Confirming...';
    if (cooldownRemaining) return `Cooldown: ${cooldownRemaining}`;
    return t('claim');
  };

  return (
    <div className="min-h-screen flex flex-col bg-retsba dark:bg-black">
      <div className="flex-1 pt-20 pb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-white">
            {t('claim')}
          </h1>

          <div className="max-w-md mx-auto bg-white dark:bg-black/90 dark:border dark:border-white/10 rounded-2xl shadow-lg p-10 flex items-center justify-center">
            <button
              onClick={cooldownRemaining ? undefined : handleClick}
              disabled={isDisabled}
              className={`font-bold text-lg px-10 py-3 rounded-xl transition-colors ${
                cooldownRemaining
                  ? 'bg-retsba dark:bg-gray-600 text-white/70 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white'
              }`}
            >
              {getButtonText()}
            </button>
          </div>

          <p className="max-w-md mx-auto text-center text-white/80 text-base mt-6">
            Users holding 10,000 $RETSBA or more can push this button once every 3 hours to generate
            a transaction on the Abstract blockchain.
          </p>
        </div>
      </div>
      <FooterDiorama />
    </div>
  );
};

export default Claim;
