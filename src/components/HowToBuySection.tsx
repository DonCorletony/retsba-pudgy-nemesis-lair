
import React from 'react';
import { motion } from 'framer-motion';

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
    <section id="how-to-buy" className="py-20 bg-retsba relative">
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
          <h2 className="text-stroke text-white text-5xl mb-4">HOW TO BUY</h2>
          <div className="w-24 h-1 bg-black mx-auto"></div>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="space-y-8">
              {steps.map((step, index) => (
                <motion.div 
                  key={step.id}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <div className="bg-black text-stroke text-white text-3xl w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    {step.id}
                  </div>
                  <div>
                    <h3 className="text-stroke text-white text-3xl mb-2">{step.title}</h3>
                    <p className="text-white text-xl">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              className="mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <a 
                href="https://abs.xyz" 
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black hover:bg-opacity-80 transition-all px-8 py-4 rounded-lg text-stroke text-3xl inline-block"
              >
                BUY NOW
              </a>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-center"
          >
            <img 
              src="/lovable-uploads/d2d19891-1719-49bb-9d84-2bc89aadbae6.png" 
              alt="Abstract Trading Interface" 
              className="w-full sm:w-4/5 md:w-3/4 lg:max-w-md rounded-lg border-4 border-black shadow-xl villain-shadow hover-float"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowToBuySection;
