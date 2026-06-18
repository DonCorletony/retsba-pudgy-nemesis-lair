import React from 'react';
import { motion } from 'framer-motion';

interface PageTitleLogoProps {
  /** Path to the wordmark image (in /public). */
  src: string;
  /** Accessible text equivalent of the wordmark. */
  alt: string;
  /**
   * Tailwind height classes. Defaults to the single-line benchmark.
   * Override for multi-line wordmarks (e.g. "Transaction Spammer 3000") so the
   * lettering renders at the same scale as the single-line titles.
   */
  heightClass?: string;
}

/**
 * Standard subpage title wordmark.
 *
 * Sized by HEIGHT (not width) so wordmarks of different lengths all render at the
 * same height — a short title like "Wallpapers" no longer balloons to fill the
 * width. The "Profile Picture Converter" title is the benchmark height.
 * `w-auto max-w-full` lets long titles shrink to fit narrow screens instead of
 * overflowing. Always use this for subpage titles so they stay consistent.
 *
 * Multi-line wordmarks have taller native art, so they pass a larger `heightClass`
 * chosen to keep their lettering at the same on-screen scale as the single-line ones.
 */
const PageTitleLogo = ({ src, alt, heightClass = 'h-[78px] md:h-[162px]' }: PageTitleLogoProps) => (
  <motion.div
    className="text-center mb-8"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <img
      src={src}
      alt={alt}
      className={`mx-auto w-auto max-w-full object-contain ${heightClass}`}
    />
  </motion.div>
);

export default PageTitleLogo;
