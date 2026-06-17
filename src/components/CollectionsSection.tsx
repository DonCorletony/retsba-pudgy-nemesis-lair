import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionHeading from './ui/SectionHeading';

// Each door previews what the tool actually MAKES (real PFP output, real XP card,
// real wallpaper) — not thematic art.
const DOORS = [
  { label: 'PFP', href: '/pfp', art: '/art/door-pfp.png', caption: 'Make your villain' },
  { label: 'XP CARD', href: '/xp', art: '/art/door-xp.png', caption: 'Flex your stats' },
  { label: 'WALLPAPERS', href: '/wallpapers', art: '/art/door-wallpapers.png', caption: 'Deck your screen' },
];

const CollectionsSection = () => (
  <section className="py-24 md:py-28 bg-retsba">
    <div className="container mx-auto px-4">
      <SectionHeading>GEAR UP</SectionHeading>

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
