import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MerchItem } from '@/data/merch';

interface MerchLightboxProps {
  item: MerchItem;
  index: number;
  onClose: () => void;
}

/** Fullscreen merch viewer: large image, thumbnail carousel, VIEW → Dyli. */
export const MerchLightbox = ({ item, index, onClose }: MerchLightboxProps) => {
  const [idx, setIdx] = useState(index);
  const touch = useRef({ x: 0 });
  const multi = item.images.length > 1;

  const next = () => setIdx((i) => (i + 1) % item.images.length);
  const prev = () => setIdx((i) => (i - 1 + item.images.length) % item.images.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative z-10 w-full max-w-lg"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white text-ink shadow-lg hover:scale-110 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Large image — white window, black outline (matches the card) */}
        <div
          className="rounded-[20px] bg-white border-[3px] border-ink p-4 shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
          onTouchStart={(e) => { touch.current.x = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touch.current.x;
            if (multi && Math.abs(dx) > 40) { if (dx < 0) next(); else prev(); }
          }}
        >
          <img
            src={item.images[idx]}
            alt={item.name}
            draggable={false}
            className="w-full aspect-square object-contain select-none"
          />
        </div>

        {/* Thumbnail carousel with side arrows */}
        {multi && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={prev}
              aria-label="Previous"
              className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-white text-ink shadow-md hover:scale-110 transition-transform"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2 overflow-x-auto scrollbar-none flex-1 justify-center">
              {item.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Photo ${i + 1}`}
                  className={cn(
                    'shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 bg-white transition-all',
                    i === idx ? 'border-white ring-2 ring-white' : 'border-white/30 opacity-60 hover:opacity-100'
                  )}
                >
                  <img src={src} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
            <button
              onClick={next}
              aria-label="Next"
              className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-white text-ink shadow-md hover:scale-110 transition-transform"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Title + VIEW (both → Dyli) */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-2xl md:text-3xl text-white hover:text-white/80 transition-colors"
          >
            {item.name}
          </a>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1 bg-white text-ink px-5 py-2 rounded-full font-display text-base shadow-md hover:scale-105 transition-transform"
          >
            VIEW <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MerchLightbox;
