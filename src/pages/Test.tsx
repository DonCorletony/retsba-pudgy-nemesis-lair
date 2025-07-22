import React from 'react';
import { AGWConnect } from '@/components/AGWConnect';
import { UnifiedTradingInterface } from '@/components/UnifiedTradingInterface';

const Test = () => {
  return (
    <div className="min-h-screen bg-retsba text-foreground">
      {/* Header with wallet connection */}
      <div className="flex justify-end p-4">
        <AGWConnect />
      </div>
      
      {/* Main content - Unified interface */}
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-4">
        <UnifiedTradingInterface />
      </div>
    </div>
  );
};

export default Test;