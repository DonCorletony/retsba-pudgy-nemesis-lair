
import React from 'react';
import { motion } from 'framer-motion';

const HeroSection = () => {
  return <section className="pt-16 pb-24 md:pt-24 md:pb-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-retsba z-0"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center">
          <motion.img src="/lovable-uploads/c194c553-4308-4953-85e4-fc967b5dbacd.png" alt="RETSBA" className="w-full max-w-3xl mx-auto pulse-animation villain-shadow" initial={{
          y: -50,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          duration: 0.8
        }} />
          
          <motion.div className="mt-12 text-center" initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: 0.3,
          duration: 0.6
        }}>
            <h2 className="text-stroke text-white text-4xl md:text-6xl mb-4">Evil. On Chain.</h2>
            <p className="text-stroke text-white md:text-2xl max-w-2xl mx-auto text-3xl">Crypto has a villain. And his name is Retsba.</p>
            
            <div className="mt-10">
              <a href="https://abs.xyz" target="_blank" rel="noopener noreferrer" className="bg-black hover:bg-opacity-80 transition-all px-8 py-4 rounded-lg text-stroke text-3xl inline-block hover:translate-y-1">
                BE THE VILLAIN
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>;
};

export default HeroSection;
