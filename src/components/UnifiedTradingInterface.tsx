import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { TradingInterface } from '@/components/TradingInterface';
import { BridgeInterface } from '@/components/BridgeInterface';

export const UnifiedTradingInterface = () => {
  const [showBridge, setShowBridge] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        {/* Header with toggle in top right */}
        <div className="flex items-center justify-end mb-6">
          <span className="text-sm text-gray-600 mr-2">
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
          <BridgeInterface />
        ) : (
          <TradingInterface />
        )}
      </div>
    </div>
  );
};