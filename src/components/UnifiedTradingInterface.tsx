import React, { useState, useCallback } from 'react';
import { TradingInterface } from '@/components/TradingInterface';

export const UnifiedTradingInterface = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Callback to trigger balance refresh
  const handleBalanceRefresh = useCallback(() => {
    console.log('🔄 Triggering balance refresh...');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        {/* Simplified to only show trading interface */}
        <TradingInterface 
          onBalanceRefresh={handleBalanceRefresh}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
};