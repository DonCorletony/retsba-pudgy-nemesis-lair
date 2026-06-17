import React from 'react';
import { useLoginWithAbstract } from '@abstract-foundation/agw-react';
import { useAccount, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export const AGWConnect = () => {
  const { login } = useLoginWithAbstract();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleConnect = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('AGW connection error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Abstract Global Wallet",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Disconnected",
      description: "Wallet disconnected successfully",
    });
  };

  if (isConnected) {
    return (
      <Button
        onClick={handleDisconnect}
        className="bg-white dark:bg-[#0a0a0a] text-ink dark:text-white border-2 border-ink dark:border-white shadow-md hover:opacity-90 transition-opacity"
      >
        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      className="bg-white dark:bg-[#0a0a0a] text-ink dark:text-white border-2 border-ink dark:border-white shadow-md hover:opacity-90 transition-opacity"
    >
      {t('connectAGW')} AGW
    </Button>
  );
};