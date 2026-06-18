import React, { useState, useCallback } from 'react';
import { BuyBox } from '@/components/BuyBox';

export const UnifiedTradingInterface = () => {
  // Bump to force consumers to refetch balances after a swap.
  const [, setRefreshTrigger] = useState(0);

  const handleBalanceRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <BuyBox onBalanceRefresh={handleBalanceRefresh} />
      </div>
    </div>
  );
};