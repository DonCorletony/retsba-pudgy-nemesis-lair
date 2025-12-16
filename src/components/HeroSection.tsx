import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const HeroSection = () => {
  const { t } = useLanguage();
  
  return <section className="pt-16 pb-24 md:pt-24 md:pb-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-retsba z-0"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center">
          <motion.img src="/lovable-uploads/c194c553-4308-4953-85e4-fc967b5dbacd.png" alt="RETSBA" className="w-full max-w-3xl mx-auto pulse-animation" initial={{
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
            <h2 className="text-stroke text-white text-4xl md:text-6xl mb-4">{t('heroTagline')}</h2>
            
            
            <div className="mt-10">
              <a href="#buy-now" className="bg-retsba border-2 border-white hover:opacity-80 transition-all px-8 py-4 rounded-lg text-stroke text-3xl inline-block hover:translate-y-1">
                {t('heroButton')}
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>;
};
export default HeroSection;