
import React from 'react';
import { motion } from 'framer-motion';

const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-retsba relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-stroke text-white text-5xl mb-4">ABOUT RETSBA</h2>
          <div className="w-24 h-1 bg-black mx-auto"></div>
        </motion.div>
        
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div 
            className="lg:w-1/2"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <img 
              src="/lovable-uploads/fe66252f-0718-42f0-9df7-0043243cb901.png" 
              alt="Retsba Villain" 
              className="w-full max-w-md mx-auto rounded-lg villain-shadow hover-float"
            />
          </motion.div>
          
          <motion.div 
            className="lg:w-1/2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-stroke text-white text-3xl mb-6">THE ULTIMATE NEMESIS</h3>
            <p className="text-stroke text-white text-xl mb-6">
              Retsba is no ordinary memecoin. Born in the shadows of the Abstract blockchain, 
              Retsba has emerged as the sworn enemy of the Pudgy Penguins.
            </p>
            <p className="text-stroke text-white text-xl mb-6">
              With his fierce red appearance and menacing scowl, Retsba is here to challenge 
              the cute and cuddly world of penguin tokens and establish his villainous empire.
            </p>
            <p className="text-stroke text-white text-xl">
              Join Retsba's army of villains and embrace the chaos that's about to unfold 
              in the crypto universe. The reign of the cute is over - it's time for the villain era!
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
