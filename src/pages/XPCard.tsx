import React from 'react';
import NavBar from '../components/NavBar';
import FooterSection from '../components/FooterSection';
import { motion } from 'framer-motion';

const XPCard = () => {
  return (
    <div className="min-h-screen bg-retsba text-white overflow-hidden">
      <NavBar />
      
      <section className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-stroke text-white text-5xl md:text-7xl mb-6">XP Card</h1>
            <p className="text-stroke text-white text-xl md:text-2xl max-w-2xl mx-auto">
              Coming soon...
            </p>
          </motion.div>
        </div>
      </section>
      
      <FooterSection />
    </div>
  );
};

export default XPCard;
