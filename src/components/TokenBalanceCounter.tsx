import React from 'react';

interface TokenBalanceCounterProps {
  balance: string | null;
  isConnected: boolean;
  tokenImage: string;
  badgeImage?: string;
  alt: string;
}

const formatBalance = (balance: string): string => {
  const num = parseFloat(balance);
  
  if (num === 0) return "0.0000";
  
  if (num < 1000) {
    // For numbers less than 1000, show 2 decimal places but ensure 5 total characters
    return num.toFixed(4);
  } else if (num < 1000000) {
    const thousands = num / 1000;
    return `${thousands.toFixed(4).slice(0, 6)}K`;
  } else {
    const millions = num / 1000000;
    return `${millions.toFixed(4).slice(0, 6)}M`;
  }
};

const TokenBalanceCounter: React.FC<TokenBalanceCounterProps> = ({
  balance,
  isConnected,
  tokenImage,
  badgeImage,
  alt
}) => {
  const displayValue = !isConnected ? "-" : formatBalance(balance || "0");

  return (
    <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
      <div className="relative mr-2">
        <img 
          src={tokenImage} 
          alt={alt}
          className="w-6 h-6 rounded-full"
        />
        {badgeImage && (
          <img 
            src={badgeImage}
            alt="Abstract badge"
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          />
        )}
      </div>
      <span className="text-white font-medium text-sm min-w-[50px] text-right">
        {displayValue}
      </span>
    </div>
  );
};

export default TokenBalanceCounter;