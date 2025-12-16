import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const AboutSection = () => {
  const { t } = useLanguage();
  
  return <section id="about" className="py-20 bg-retsba relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div className="text-center mb-12" initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.6
      }}>
          <h2 className="text-stroke text-white text-5xl mb-4">{t('aboutTitle')}</h2>
          <div className="w-24 h-1 bg-black mx-auto"></div>
        </motion.div>
        
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div className="lg:w-1/2" initial={{
          opacity: 0,
          x: -30
        }} whileInView={{
          opacity: 1,
          x: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6,
          delay: 0.2
        }}>
            <img src="/lovable-uploads/fe66252f-0718-42f0-9df7-0043243cb901.png" alt="Retsba Villain" className="w-full max-w-md mx-auto rounded-lg villain-shadow hover-float" />
          </motion.div>
          
          <motion.div className="lg:w-1/2" initial={{
          opacity: 0,
          x: 30
        }} whileInView={{
          opacity: 1,
          x: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6,
          delay: 0.4
        }}>
            <h3 className="text-stroke text-white mb-6 text-4xl">{t('aboutSubtitle')}</h3>
            <p className="text-stroke text-white mb-6 text-2xl">{t('aboutDescription')}</p>
          </motion.div>
        </div>
      </div>
    </section>;
};
export default AboutSection;