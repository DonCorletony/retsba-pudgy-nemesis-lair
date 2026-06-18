import React from 'react';
import { motion } from 'framer-motion';

interface PageTitleLogoProps {
  /** Path to the wordmark image (in /public). */
  src: string;
  /** Accessible text equivalent of the wordmark. */
  alt: string;
}

/**
 * Standard subpage title wordmark.
 *
 * Sized by HEIGHT (not width) so wordmarks of different lengths all render at the
 * same height — a short title like "Wallpapers" no longer balloons to fill the
 * width. The "Profile Picture Converter" title is the benchmark height.
 * `w-auto max-w-full` lets long titles shrink to fit narrow screens instead of
 * overflowing. Always use this for subpage titles so they stay consistent.
 */
const PageTitleLogo = ({ src, alt }: PageTitleLogoProps) => (
  <motion.div
    className="text-center mb-8"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <img
      src={src}
      alt={alt}
      className="mx-auto h-[78px] md:h-[162px] w-auto max-w-full"
    />
  </motion.div>
);

export default PageTitleLogo;
