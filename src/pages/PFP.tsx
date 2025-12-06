import React from 'react';
import { motion } from 'framer-motion';
import NavBar from '../components/NavBar';
import FooterSection from '../components/FooterSection';
import PFPConverter from '../components/PFPConverter';

const PFP = () => {
  return (
    <div className="min-h-screen bg-retsba text-white overflow-hidden">
      <NavBar />
      
      {/* Hero Section */}
      <section className="pt-20 pb-6">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="text-white">Profile Picture </span>
              <span className="text-primary">Converter</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl">
              Transform your Pudgy Penguin into a fearsome Retsba. 
              Upload your NFT and watch the magic happen.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Converter Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PFPConverter />
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Upload Your Pudgy</h3>
              <p className="text-white/60">
                Drop or select your Pudgy Penguin or Lil Pudgy NFT image
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Detects Traits</h3>
              <p className="text-white/60">
                Our AI analyzes your Pudgy and identifies all its unique traits
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Get Your Retsba</h3>
              <p className="text-white/60">
                Download your Retsbafied image with matching trait overlays
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default PFP;
