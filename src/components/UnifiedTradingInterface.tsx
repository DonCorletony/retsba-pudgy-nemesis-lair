import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { TradingInterface } from '@/components/TradingInterface';
import { BridgeInterface } from '@/components/BridgeInterface';

export const UnifiedTradingInterface = () => {
  const [showBridge, setShowBridge] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header with toggle */}
      <div className="flex items-center justify-end mb-4 px-2">
        <span className="text-sm text-muted-foreground mr-2">
          Need Abstract ETH?
        </span>
        <Switch
          checked={showBridge}
          onCheckedChange={setShowBridge}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {/* Dynamic content based on toggle */}
      {showBridge ? (
        <div>
          <h2 className="text-xl font-bold text-center mb-4">Bridge to Abstract</h2>
          <BridgeInterface />
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold text-center mb-4">Buy RETSBA</h2>
          <TradingInterface />
        </div>
      )}
    </div>
  );
};