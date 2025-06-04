
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const FreeMoney = () => {
  return (
    <div className="min-h-screen bg-retsba text-white flex items-center justify-center">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <img 
            src="/lovable-uploads/76f2f823-eb8a-488a-b531-c00101fa6d9d.png" 
            alt="RETSBA Villain Penguin" 
            className="w-64 md:w-80 lg:w-96 mx-auto villain-shadow hover-float mb-8"
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6"
        >
          <h1 className="text-stroke text-white text-6xl md:text-8xl mb-4">
            FREE MONEY?
          </h1>
          
          <div className="text-2xl md:text-3xl space-y-4 max-w-3xl mx-auto">
            <p className="text-stroke text-white">
              You found the secret page! 🎉
            </p>
            <p className="text-white">
              But RETSBA doesn't give away free money...
            </p>
            <p className="text-white">
              You have to EARN it by joining the villain side!
            </p>
          </div>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <a 
              href="https://abs.xyz" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black hover:bg-opacity-80 transition-all px-8 py-4 rounded-lg text-stroke text-2xl"
            >
              BUY $RETSBA
            </a>
            
            <Link 
              to="/"
              className="bg-transparent border-2 border-black hover:bg-black hover:bg-opacity-20 transition-all px-8 py-4 rounded-lg text-stroke text-2xl"
            >
              BACK TO HOME
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default FreeMoney;
