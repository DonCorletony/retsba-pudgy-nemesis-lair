import React from 'react';

// Central registry for token + chain artwork (public/coin images/). Several chains'
// native coin shares the chain logo (the asset is named accordingly), so the same file
// can appear under both a token symbol and a chain id.
const DIR = '/coin images';

const TOKEN_IMAGES: Record<string, string> = {
  ETH: `${DIR}/eth coin image and ethereum logo.png`,
  RETSBA: `${DIR}/retsba coin image.png`,
  USDC: `${DIR}/usdc coin image.png`,
  BNB: `${DIR}/bnb coin image.png`,
  AVAX: `${DIR}/avax coin image and avalanche logo.png`,
  SOL: `${DIR}/SOL coin image and solana logo.png`,
  MEGA: `${DIR}/megaeth logo.png`,
  MON: `${DIR}/monad logo.ico`,
};

// Chain id -> logo.
const CHAIN_IMAGES: Record<string, string> = {
  '2741': `${DIR}/abstract blockchain logo.jpg`,
  '1': `${DIR}/eth coin image and ethereum logo.png`,
  '8453': `${DIR}/base logo.png`,
  '56': `${DIR}/binance logo.png`,
  '43114': `${DIR}/avax coin image and avalanche logo.png`,
  solana: `${DIR}/SOL coin image and solana logo.png`,
  '4326': `${DIR}/megaeth logo.png`,
  '143': `${DIR}/monad logo.ico`,
  '4663': `${DIR}/robinhood logo.png`,
};

export const tokenImage = (symbol: string): string | undefined => TOKEN_IMAGES[symbol];
export const chainImage = (id: number | string): string | undefined => CHAIN_IMAGES[String(id)];

const Fallback = ({ label, className }: { label: string; className?: string }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold shrink-0 ${className ?? ''}`}
    aria-hidden
  >
    {label.slice(0, 1).toUpperCase()}
  </span>
);

/** Circular token icon (cropped). Falls back to the symbol's first letter if no art exists. */
export const TokenIcon = ({ symbol, className = 'h-5 w-5' }: { symbol: string; className?: string }) => {
  const src = tokenImage(symbol);
  if (!src) return <Fallback label={symbol} className={className} />;
  return <img src={src} alt={symbol} className={`${className} rounded-full object-cover shrink-0`} />;
};

/** Circular chain logo (cropped). Falls back to the chain name's first letter if no art exists. */
export const ChainIcon = ({ id, name, className = 'h-5 w-5' }: { id: number | string; name: string; className?: string }) => {
  const src = chainImage(id);
  if (!src) return <Fallback label={name} className={className} />;
  return <img src={src} alt={name} className={`${className} rounded-full object-cover shrink-0`} />;
};
