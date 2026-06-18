import React from 'react';
import { motion } from 'framer-motion';
import FooterDiorama from '../components/FooterDiorama';
import PageTitleLogo from '../components/PageTitleLogo';
import PFPConverter from '../components/PFPConverter';

const PFP = () => {
  return (
    <div className="min-h-screen bg-retsba text-white overflow-hidden">
      <section className="pt-28 md:pt-36 pb-20">
        <div className="container mx-auto px-4">
          <PageTitleLogo src="/logos/PFP converter.png" alt="Profile Picture Converter" />

          <motion.div
            className="bg-white dark:bg-retsba rounded-2xl p-6 md:p-8 max-w-5xl mx-auto border border-transparent dark:border-white/20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PFPConverter />
          </motion.div>
        </div>
      </section>

      <FooterDiorama />
    </div>
  );
};

export default PFP;
