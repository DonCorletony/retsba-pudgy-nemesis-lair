import React from 'react';
import { motion } from 'framer-motion';

/** Full-width cinematic banner — villain looming over Earth, text on the dark side. */
const FeatureBannerSection = () => (
  <section className="py-12 md:py-16 bg-retsba">
    <div className="container mx-auto px-4">
      <motion.div
        className="relative overflow-hidden rounded-[28px] border-[3px] border-ink shadow-[0_10px_0_rgba(0,0,0,0.30)] min-h-[380px] md:min-h-[480px] flex items-center"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <img
          src="/art/feature-dominion.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="relative z-10 p-8 md:p-14 max-w-lg">
          <h2 className="font-display text-outline text-5xl md:text-7xl leading-none uppercase">
            Total Dominion
          </h2>
          <p className="font-body text-white text-lg md:text-xl mt-5 max-w-sm">
            They built Abstract. Retsba takes it — one block at a time.
          </p>
        </div>
      </motion.div>
    </div>
  </section>
);

export default FeatureBannerSection;
