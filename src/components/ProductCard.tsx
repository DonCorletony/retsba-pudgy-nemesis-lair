import React, { useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { MerchItem } from '@/data/merch';
import VillainBadge from './ui/VillainBadge';

const LOGO_FALLBACK = '/lovable-uploads/c194c553-4308-4953-85e4-fc967b5dbacd.png';
const isPlaceholderPrice = (p: string) => !p || /^\$?\s*0(\.0+)?$/.test(p.trim());

interface ProductCardProps {
  item: MerchItem;
  /** Open the fullscreen lightbox at the given image index. */
  onOpen: (item: MerchItem, index: number) => void;
}

/** Pudgy-style product card with a per-item photo gallery. */
export const ProductCard = ({ item, onOpen }: ProductCardProps) => {
  const [idx, setIdx] = useState(0);
  const touch = useRef({ x: 0, moved: false });
  const multi = item.images.length > 1;

  const next = () => setIdx((i) => (i + 1) % item.images.length);
  const prev = () => setIdx((i) => (i - 1 + item.images.length) % item.images.length);

  return (
    <div className="group relative flex h-full flex-col rounded-[20px] bg-white dark:bg-[#1b1d20] border-[3px] border-ink dark:border-white/20 p-4 shadow-[0_6px_0_rgba(18,20,22,0.25)] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_12px_0_rgba(18,20,22,0.25)]">
      <VillainBadge kind={item.badge ?? ''} />

      <div className="relative rounded-[14px] bg-black/5 dark:bg-white/5 aspect-square overflow-hidden">
        <button
          type="button"
          aria-label={`View ${item.name} photos`}
          onClick={() => {
            if (touch.current.moved) { touch.current.moved = false; return; } // ignore swipe-end taps
            onOpen(item, idx);
          }}
          onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, moved: false }; }}
          onTouchMove={(e) => { if (Math.abs(e.touches[0].clientX - touch.current.x) > 10) touch.current.moved = true; }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touch.current.x;
            if (multi && Math.abs(dx) > 40) { if (dx < 0) next(); else prev(); touch.current.moved = true; }
          }}
          className="flex h-full w-full items-center justify-center cursor-zoom-in"
        >
          <img
            src={item.images[idx]}
            alt={item.name}
            loading="lazy"
            draggable={false}
            onError={(e) => { const t = e.currentTarget; if (t.dataset.fb) return; t.dataset.fb = '1'; t.src = LOGO_FALLBACK; t.style.opacity = '0.3'; }}
            className="w-[82%] h-[82%] object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.30)]"
          />
        </button>

        {multi && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-9 h-9 rounded-full bg-white text-ink shadow-[0_2px_8px_rgba(0,0,0,0.35)] opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-9 h-9 rounded-full bg-white text-ink shadow-[0_2px_8px_rgba(0,0,0,0.35)] opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            <h3 className="font-display text-2xl text-ink dark:text-white leading-tight truncate">{item.name}</h3>
          </a>
          <span className="font-body text-base text-ink/60 dark:text-white/60">
            {isPlaceholderPrice(item.price) ? 'View on Dyli' : item.price}
          </span>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1 bg-ink text-white px-4 py-1.5 rounded-full font-display text-sm transition-transform hover:scale-105"
        >
          VIEW <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default ProductCard;
