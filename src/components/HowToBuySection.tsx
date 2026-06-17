import React from 'react';
import { motion } from 'framer-motion';
import { UnifiedTradingInterface } from './UnifiedTradingInterface';
import { useLanguage } from '@/contexts/LanguageContext';

const HowToBuySection = () => {
  const { t } = useLanguage();
  
  return (
    <section id="buy-now" className="pt-32 pb-10 relative">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-outline text-5xl md:text-6xl mb-5 uppercase">{t('buyNowTitle')}</h2>
          <div className="w-24 h-1.5 rounded-full bg-white mx-auto"></div>
        </motion.div>
        
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <UnifiedTradingInterface />
        </motion.div>
      </div>
    </section>
  );
};

export default HowToBuySection;
