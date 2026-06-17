import React from 'react';

type BadgeKind = 'NEW' | 'POPULAR' | 'LIMITED' | '';

const STAR_CLIP =
  'polygon(50% 0%, 61% 15%, 79% 9%, 78% 28%, 96% 30%, 85% 45%, 100% 55%, 83% 62%, 91% 80%, 72% 78%, 68% 97%, 54% 84%, 39% 98%, 33% 79%, 14% 84%, 21% 65%, 3% 60%, 18% 47%, 6% 33%, 24% 31%, 22% 12%, 40% 18%)';

/** Corner product badge — inline CSS shapes only, never emoji. */
export const VillainBadge = ({ kind }: { kind: BadgeKind }) => {
  if (!kind) return null;
  const wrap = 'absolute -top-3 -left-3 z-10 select-none';

  if (kind === 'NEW') {
    return (
      <div className={wrap}>
        <div
          className="flex items-center justify-center w-16 h-16 bg-[#4787FF] -rotate-6"
          style={{ clipPath: STAR_CLIP }}
        >
          <span className="font-display text-outline-sm text-[1.52rem]">NEW</span>
        </div>
      </div>
    );
  }

  if (kind === 'POPULAR') {
    return (
      <div className={wrap}>
        <div className="flex items-center gap-1 bg-[#FF0000] rounded-full px-3 py-1 -rotate-6">
          <span aria-hidden className="text-sm leading-none">🔥</span>
          <span className="font-display text-white text-[1.14rem]">POPULAR</span>
        </div>
      </div>
    );
  }

  return (
    <div className={wrap}>
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-ink border-[3px] border-white -rotate-6">
        <span className="font-display text-outline-sm text-base">LTD</span>
      </div>
    </div>
  );
};

export default VillainBadge;
