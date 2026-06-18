import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// Each door previews what the tool actually MAKES, using the uploaded promo art.
const DOORS = [
  { label: 'PFP CONVERTER', href: '/pfp', art: '/Site pieces/PFP converter.png', caption: 'Retsbafy any Pudgy Penguins NFT' },
  { label: 'XP CARD', href: '/xp', art: '/Site pieces/XP Card.png', caption: 'Customize your own Abstract XP card' },
  { label: 'WALLPAPERS', href: '/wallpapers', art: '/Site pieces/Wallpapers.png', caption: 'Download an HD wallpaper for your mobile device' },
];

const CollectionsSection = () => (
  <section className="pt-14 md:pt-16 pb-24 md:pb-28 bg-retsba">
    <div className="container mx-auto px-4">
      <div className="text-center">
        <img
          src="/Site pieces/become the villain.png"
          alt="Become the Villain"
          className="mx-auto w-full max-w-[600px]"
        />
        <div className="mx-auto mt-5 h-1.5 w-24 rounded-full bg-ink dark:bg-white" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-[1000px] mx-auto mt-14">
        {DOORS.map((d, i) => (
          <motion.a
            key={d.label}
            href={d.href}
            className="group block rounded-[20px] bg-white dark:bg-[#1b1d20] border-[3px] border-ink dark:border-white/20 p-4 shadow-[0_6px_0_rgba(18,20,22,0.25)] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_12px_0_rgba(18,20,22,0.25)]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.1 }}
          >
            <div className="rounded-[14px] bg-black/5 dark:bg-white/5 aspect-square flex items-center justify-center overflow-hidden">
              <img
                src={d.art}
                alt={`${d.label} preview`}
                className="w-full h-full object-contain p-2 transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display text-2xl text-ink dark:text-white leading-tight">{d.label}</h3>
                <span className="font-body text-sm text-ink/60 dark:text-white/60">{d.caption}</span>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 bg-ink text-white px-4 py-1.5 rounded-full font-display text-sm transition-transform group-hover:scale-105">
                OPEN <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  </section>
);

export default CollectionsSection;
