import React from 'react';
import { motion } from 'framer-motion';
import { UnifiedTradingInterface } from './UnifiedTradingInterface';

const HowToBuySection = () => {
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
          <img src="/logos/buy now.png" alt="Buy Now" className="mx-auto h-16 md:h-20" />
          <div className="w-24 h-1.5 rounded-full bg-white mx-auto mt-5"></div>
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
