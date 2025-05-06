
import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Coins, Link } from 'lucide-react';

const TokenomicsSection = () => {
  return (
    <section id="tokenomics" className="py-20 bg-retsba text-white relative">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-stroke text-white text-5xl mb-4">TOKENOMICS</h2>
          <div className="w-24 h-1 bg-black mx-auto"></div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div 
            className="bg-black rounded-lg p-8 text-center hover-float"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex justify-center mb-6">
              <Coins size={60} className="text-retsba" />
            </div>
            <h3 className="text-stroke text-white text-3xl mb-4">TOTAL SUPPLY</h3>
            <p className="text-stroke text-white text-2xl mb-2">1,000,000,000</p>
            <p className="text-stroke text-white text-xl">RETSBA Tokens</p>
          </motion.div>
          
          <motion.div 
            className="bg-black rounded-lg p-8 text-center hover-float"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex justify-center mb-6">
              <DollarSign size={60} className="text-retsba" />
            </div>
            <h3 className="text-stroke text-white text-3xl mb-4">TAX</h3>
            <p className="text-stroke text-white text-2xl mb-2">0% Buy / 0% Sell</p>
            <p className="text-stroke text-white text-xl">No hidden fees</p>
          </motion.div>
          
          <motion.div 
            className="bg-black rounded-lg p-8 text-center hover-float md:col-span-2 lg:col-span-1"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex justify-center mb-6">
              <Link size={60} className="text-retsba" />
            </div>
            <h3 className="text-stroke text-white text-3xl mb-4">CONTRACT</h3>
            <p className="text-stroke text-white text-lg mb-2 break-all">0xRETSBA...VILLAIN</p>
            <p className="text-stroke text-white text-xl">Verified & Renounced</p>
          </motion.div>
        </div>
        
        <motion.div 
          className="mt-16 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <img 
            src="/lovable-uploads/76403efb-8e4d-4a9b-bfaa-c4e4454f5902.png" 
            alt="Retsba Character" 
            className="max-w-xs villain-shadow animate-float"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default TokenomicsSection;
