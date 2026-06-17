import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Button3D from './ui/Button3D';
import ProductCard from './ProductCard';
import MerchLightbox from './MerchLightbox';
import { MERCH_ITEMS, DYLI_SHOP_URL, type MerchItem } from '@/data/merch';

const MerchSection = () => {
  const [lightbox, setLightbox] = useState<{ item: MerchItem; index: number } | null>(null);

  return (
    <section id="merch" className="py-24 md:py-28 bg-retsba relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <img
            src="/logos/retsba-shop.png"
            alt="The Retsba Shop"
            className="mx-auto w-full max-w-[600px]"
          />
          <div className="mx-auto mt-5 h-1.5 w-24 rounded-full bg-ink dark:bg-white" />
        </div>
        <p className="font-body text-ink dark:text-white text-[1.625rem] text-center max-w-2xl mx-auto mt-6">
          Standard-issue gear from the depths of Anti-Abstract.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-[1320px] mx-auto mt-14">
          {MERCH_ITEMS.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <ProductCard item={item} onOpen={(it, ix) => setLightbox({ item: it, index: ix })} />
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-center mt-14">
          <Button3D as="a" href={DYLI_SHOP_URL} target="_blank" rel="noopener noreferrer" variant="white" className="text-[1.875rem] md:text-[2.34rem]">
            SHOP ALL <ArrowUpRight className="w-7 h-7" />
          </Button3D>
          <p className="font-body text-ink/70 dark:text-white/80 text-[1.09rem] mt-4">
            Opens dyli.io · ships worldwide.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <MerchLightbox
            item={lightbox.item}
            index={lightbox.index}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default MerchSection;
