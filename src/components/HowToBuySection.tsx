
import React from 'react';
import { motion } from 'framer-motion';
import { TradingInterface } from './TradingInterface';

const steps = [
  {
    id: 1,
    title: "Get on Abstract",
    description: "Go to abs.xyz."
  },
  {
    id: 2,
    title: "Fund your account",
    description: "Click the \"Fund\" button and bridge Abstract ETH, or transfer straight from another wallet."
  },
  {
    id: 3,
    title: "Click \"Trade\"",
    description: "Navigate to the trading section on Abstract."
  },
  {
    id: 4,
    title: "Buy $RETSBA",
    description: "Search for and purchase RETSBA tokens."
  }
];

const HowToBuySection = () => {
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
          <h2 className="text-stroke text-white text-5xl mb-4">BUY NOW</h2>
          <div className="w-24 h-1 bg-black mx-auto"></div>
        </motion.div>
        
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <TradingInterface />
        </motion.div>
      </div>
    </section>
  );
};

export default HowToBuySection;
