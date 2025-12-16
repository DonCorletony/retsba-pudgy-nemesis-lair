import React from 'react';
import { motion } from 'framer-motion';
import { UnifiedTradingInterface } from './UnifiedTradingInterface';
import { useLanguage } from '@/contexts/LanguageContext';

const HowToBuySection = () => {
  const { t } = useLanguage();
  
  return (
    <section id="buy-now" className="py-20 bg-retsba relative">
      <div className="container mx-auto px-4">
        <motion.div
          className="flex justify-center mb-12"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img 
            src="/lovable-uploads/76f2f823-eb8a-488a-b531-c00101fa6d9d.png" 
            alt="RETSBA Villain Penguin" 
            className="w-48 md:w-64 lg:w-80 villain-shadow hover-float"
          />
        </motion.div>
        
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-stroke text-white text-5xl mb-4">{t('buyNowTitle')}</h2>
          <div className="w-24 h-1 bg-black mx-auto"></div>
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
