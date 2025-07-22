import React from 'react';
import { useLoginWithAbstract } from '@abstract-foundation/agw-react';
import { useAccount, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const AGWConnect = () => {
  const { login } = useLoginWithAbstract();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();

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
        variant="outline"
        className="text-white border-white hover:bg-white hover:text-primary"
      >
        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      className="bg-primary hover:bg-primary/90 text-white"
    >
      Connect AGW
    </Button>
  );
};