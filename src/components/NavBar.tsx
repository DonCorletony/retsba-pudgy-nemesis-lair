
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <motion.nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-retsba py-2' : 'bg-transparent py-4'
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <a href="#" className="flex items-center">
            <img 
              src="/lovable-uploads/c194c553-4308-4953-85e4-fc967b5dbacd.png" 
              alt="RETSBA" 
              className="h-10"
            />
          </a>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#about" className="text-stroke text-white hover:text-black transition-colors">ABOUT</a>
            <a href="#tokenomics" className="text-stroke text-white hover:text-black transition-colors">TOKENOMICS</a>
            <a href="#how-to-buy" className="text-stroke text-white hover:text-black transition-colors">HOW TO BUY</a>
            <a 
              href="#how-to-buy" 
              className="bg-black hover:bg-opacity-80 transition-all px-6 py-2 rounded-lg text-stroke"
            >
              BUY NOW
            </a>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div 
          className="md:hidden bg-retsba mt-2"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <a 
              href="#about" 
              className="text-stroke text-white hover:text-black transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ABOUT
            </a>
            <a 
              href="#tokenomics" 
              className="text-stroke text-white hover:text-black transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              TOKENOMICS
            </a>
            <a 
              href="#how-to-buy" 
              className="text-stroke text-white hover:text-black transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              HOW TO BUY
            </a>
            <a 
              href="#how-to-buy" 
              className="bg-black hover:bg-opacity-80 transition-all px-6 py-2 rounded-lg text-center text-stroke"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              BUY NOW
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default NavBar;
