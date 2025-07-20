import React from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import { TradingInterface } from '@/components/TradingInterface';
import { BridgeInterface } from '@/components/BridgeInterface';

const Test = () => {
  return (
    <div className="min-h-screen bg-retsba text-foreground">
      {/* Header with wallet connection */}
      <div className="flex justify-end p-4">
        <WalletConnect />
      </div>
      
      {/* Main content - Two interfaces side by side */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center min-h-[calc(100vh-100px)] p-4">
        {/* Bridge Interface */}
        <div className="w-full max-w-md">
          <h2 className="text-xl font-bold text-center mb-4">Step 1: Bridge to Abstract</h2>
          <BridgeInterface />
        </div>
        
        {/* Trading Interface */}
        <div className="w-full max-w-md">
          <h2 className="text-xl font-bold text-center mb-4">Step 2: Swap to RETSBA</h2>
          <TradingInterface />
        </div>
      </div>
    </div>
  );
};

export default Test;