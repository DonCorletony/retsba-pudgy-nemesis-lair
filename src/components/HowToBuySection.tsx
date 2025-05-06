
import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    id: 1,
    title: "Create a Wallet",
    description: "Download and install a compatible wallet like MetaMask or TrustWallet to store your RETSBA tokens."
  },
  {
    id: 2,
    title: "Get Abstract Tokens",
    description: "Purchase Abstract tokens from a major exchange and transfer them to your wallet."
  },
  {
    id: 3,
    title: "Connect to DEX",
    description: "Visit an Abstract-based decentralized exchange (DEX) and connect your wallet."
  },
  {
    id: 4,
    title: "Swap for RETSBA",
    description: "Search for the RETSBA token using the contract address and swap your Abstract tokens for RETSBA."
  },
  {
    id: 5,
    title: "Join the Villain Side",
    description: "Congratulations! You're now part of Retsba's villain army ready to take on the Pudgy Penguins."
  }
];

const HowToBuySection = () => {
  return (
    <section id="how-to-buy" className="py-20 bg-retsba relative">
      <div className="container mx-auto px-4">
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
                  <div className="bg-black text-stroke text-white text-2xl w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    {step.id}
                  </div>
                  <div>
                    <h3 className="text-stroke text-white text-2xl mb-2">{step.title}</h3>
                    <p className="text-white text-lg">{step.description}</p>
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
                href="#" 
                className="bg-black hover:bg-opacity-80 transition-all px-8 py-4 rounded-lg text-stroke text-2xl inline-block"
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
              src="/lovable-uploads/b72e0ba3-037a-4f06-a099-24442c1f52c0.png" 
              alt="Retsba Character" 
              className="max-w-md villain-shadow hover-float"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowToBuySection;
