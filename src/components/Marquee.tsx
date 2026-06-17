import React from 'react';

const SEGMENTS = ['SHOP THE SUMMER 2026 DROP', 'OUT NOW'];

/** Full-width scrolling ticker, placed directly under the hero (Pudgy-style). */
const Marquee = () => {
  // Repeat enough to fill wide screens, then duplicate for a seamless -50% loop.
  const base = Array.from({ length: 6 }, () => SEGMENTS).flat();
  const loop = [...base, ...base];

  return (
    <div className="overflow-hidden bg-ink py-3.5 select-none">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {loop.map((seg, i) => (
          <span key={i} className="flex items-center font-display text-white text-2xl md:text-3xl tracking-wide">
            <span className="mx-6">{seg}</span>
            <span className="text-white/40 text-xl">•</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
