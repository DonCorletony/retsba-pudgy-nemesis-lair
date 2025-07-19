import React from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import { TradingInterface } from '@/components/TradingInterface';

const Test = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with wallet connection */}
      <div className="flex justify-end p-4">
        <WalletConnect />
      </div>
      
      {/* Main content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
        <TradingInterface />
      </div>
    </div>
  );
};

export default Test;