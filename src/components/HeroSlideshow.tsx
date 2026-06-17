import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Slide {
  srcDesktop: string;
  srcMobile: string;
  href: string;
  alt: string;
}

// Ad 1 shows first; auto-advances to Ad 2. Each slide has a desktop (16:9) and a
// mobile (~square) image; the browser picks one at the 768px breakpoint.
const SLIDES: Slide[] = [
  { srcDesktop: '/ads/ad-1.jpg', srcMobile: '/ads/ad-1-mobile.jpg', href: '#merch', alt: 'The Retsba Shop is live' },
  { srcDesktop: '/ads/summer-2026.jpg', srcMobile: '/ads/summer-2026-mobile.jpg', href: '#merch', alt: 'Shop Summer 2026 merch' },
];

const AUTO_MS = 6000;    // normal auto-advance interval
const RESUME_MS = 30000; // one longer interval right after a manual interaction

const FALLBACK = '/art/feature-dominion.png';

const HeroSlideshow = () => {
  const [idx, setIdx] = useState(0);
  const manualRef = useRef(false);
  const touch = useRef({ x: 0 });
  const n = SLIDES.length;

  useEffect(() => {
    if (n < 2) return;
    const delay = manualRef.current ? RESUME_MS : AUTO_MS;
    manualRef.current = false;
    const t = setTimeout(() => setIdx((i) => (i + 1) % n), delay);
    return () => clearTimeout(t);
  }, [idx, n]);

  const go = (d: number) => { manualRef.current = true; setIdx((i) => (i + d + n) % n); };
  const jump = (i: number) => { if (i === idx) return; manualRef.current = true; setIdx(i); };

  return (
    <div
      className="relative w-full overflow-hidden"
      onTouchStart={(e) => { touch.current.x = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touch.current.x;
        if (n > 1 && Math.abs(dx) > 40) { if (dx < 0) go(1); else go(-1); }
      }}
    >
      {/* Mobile ads are ~square; desktop ads are 16:9 — match the container so neither crops. */}
      <div className="relative aspect-[721/683] md:aspect-[16/9]">
        {SLIDES.map((s, i) => (
          <a
            key={i}
            href={s.href}
            className={cn(
              'absolute inset-0 transition-opacity duration-500',
              i === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            <picture>
              <source media="(max-width: 767px)" srcSet={s.srcMobile} />
              <img
                src={s.srcDesktop}
                alt={s.alt}
                onError={(e) => { e.currentTarget.src = FALLBACK; }}
                className="w-full h-full object-cover"
              />
            </picture>
          </a>
        ))}
      </div>

      {n > 1 && (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]">
          <button
            onClick={() => go(-1)}
            aria-label="Previous ad"
            className="text-white hover:scale-110 transition-transform"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          <div className="flex items-center gap-2.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => jump(i)}
                aria-label={`Ad ${i + 1}`}
                className={cn(
                  'w-3 h-3 rounded-full transition-colors',
                  i === idx ? 'bg-gray-400' : 'bg-white'
                )}
              />
            ))}
          </div>

          <button
            onClick={() => go(1)}
            aria-label="Next ad"
            className="text-white hover:scale-110 transition-transform"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>
      )}
    </div>
  );
};

export default HeroSlideshow;
