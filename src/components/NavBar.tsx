import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WalletConnect } from './WalletConnect';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { erc20Abi, formatEther, formatUnits } from 'viem';

const RETSBA_TOKEN_ADDRESS = '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A' as const;

// Format balance to 5-digit display without rounding
const formatBalanceDisplay = (balance: string): string => {
  const num = parseFloat(balance);
  
  if (num === 0) return "0.0000";
  
  if (num < 1000) {
    // For small numbers, truncate to 4 decimal places without rounding
    const str = num.toString();
    const dotIndex = str.indexOf('.');
    if (dotIndex === -1) return str + ".0000";
    const truncated = str.substring(0, dotIndex + 5); // Keep 4 decimal places
    return truncated.padEnd(dotIndex + 5, '0'); // Pad with zeros if needed
  } else if (num < 1000000) {
    const thousands = num / 1000;
    const str = thousands.toString();
    const dotIndex = str.indexOf('.');
    if (dotIndex === -1) return str + ".000K";
    const truncated = str.substring(0, dotIndex + 4); // Keep 3 decimal places for K
    return truncated + "K";
  } else {
    const millions = num / 1000000;
    const str = millions.toString();
    const dotIndex = str.indexOf('.');
    if (dotIndex === -1) return str + ".000M";
    const truncated = str.substring(0, dotIndex + 4); // Keep 3 decimal places for M
    return truncated + "M";
  }
};

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const { address, isConnected } = useAccount();

  // Copy exact balance logic from TradingInterface
  const { data: abstractEthBalance, refetch: refetchAbstractEthBalance } = useBalance({
    address,
    chainId: 2741, // Abstract chain - same as TradingInterface
  });

  const { data: retsbaBalance, refetch: refetchRetsbaBalance } = useReadContract({
    address: RETSBA_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: retsbaDecimals } = useReadContract({
    address: RETSBA_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'decimals',
  });

  // Format balances exactly like TradingInterface
  const formattedRetsbaBalance = retsbaBalance && retsbaDecimals 
    ? formatBalanceDisplay(parseFloat(formatEther(retsbaBalance)).toString())
    : isConnected ? "0.0000" : "-";

  const formattedEthBalance = abstractEthBalance 
    ? formatBalanceDisplay(parseFloat(formatUnits(abstractEthBalance.value, abstractEthBalance.decimals)).toString())
    : isConnected ? "0.0000" : "-";
  
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
    <>
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
            <div className="hidden md:flex items-center space-x-4">
              {/* Token Balance Counters */}
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                <div className="relative mr-2">
                  <img 
                    src="/lovable-uploads/c8028943-ca48-47ea-9dbd-8378147d5a96.png" 
                    alt="RETSBA Token"
                    className="w-6 h-6 rounded-full"
                  />
                </div>
                <span className="text-white font-medium text-sm min-w-[50px] text-right">
                  {formattedRetsbaBalance}
                </span>
              </div>
              
              {/* Abstract ETH Balance Counter */}
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                <div className="relative mr-2">
                  <img 
                    src="/lovable-uploads/e836e80c-7019-443e-bdf3-bafb4f35aa92.png" 
                    alt="Abstract ETH"
                    className="w-6 h-6 rounded-full"
                  />
                  <img 
                    src="/lovable-uploads/de3bec85-f2dd-46c7-a561-22069040d3ee.png"
                    alt="Abstract badge"
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  />
                </div>
                <span className="text-white font-medium text-sm min-w-[50px] text-right">
                  {formattedEthBalance}
                </span>
              </div>
              
              <WalletConnect />
              
              {/* Hamburger Menu Button */}
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-white focus:outline-none p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="flex flex-col space-y-1">
                  <div className="w-5 h-0.5 bg-white"></div>
                  <div className="w-5 h-0.5 bg-white"></div>
                  <div className="w-5 h-0.5 bg-white"></div>
                </div>
              </button>
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
                className="text-stroke text-white hover:text-black transition-colors py-2 text-xl"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ABOUT
              </a>
              <a 
                href="#buy-now" 
                className="text-stroke text-white hover:text-black transition-colors py-2 text-xl"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                BUY NOW
              </a>
              
              {/* Mobile Token Balance Counters */}
              <div className="flex flex-col space-y-2 pt-2">
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                  <div className="relative mr-2">
                    <img 
                      src="/lovable-uploads/c8028943-ca48-47ea-9dbd-8378147d5a96.png" 
                      alt="RETSBA Token"
                      className="w-6 h-6 rounded-full"
                    />
                  </div>
                  <span className="text-white font-medium text-sm min-w-[50px] text-right">
                    {formattedRetsbaBalance}
                  </span>
                </div>
                
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                  <div className="relative mr-2">
                    <img 
                      src="/lovable-uploads/e836e80c-7019-443e-bdf3-bafb4f35aa92.png" 
                      alt="Abstract ETH"
                      className="w-6 h-6 rounded-full"
                    />
                    <img 
                      src="/lovable-uploads/de3bec85-f2dd-46c7-a561-22069040d3ee.png"
                      alt="Abstract badge"
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                    />
                  </div>
                  <span className="text-white font-medium text-sm min-w-[50px] text-right">
                    {formattedEthBalance}
                  </span>
                </div>
              </div>
              
              <div className="pt-2">
                <WalletConnect />
              </div>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Backdrop Overlay */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* Slide-out Sidebar */}
      <motion.div
        className="fixed top-0 right-0 h-full w-80 bg-retsba z-50 shadow-2xl"
        initial={{ x: '100%' }}
        animate={{ x: isDropdownOpen ? 0 : '100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="p-6 pt-20">
          <div className="flex flex-col space-y-6">
            <a 
              href="#about" 
              className="text-white text-2xl font-bold hover:text-gray-300 transition-colors py-4 border-b border-white/20"
              onClick={() => setIsDropdownOpen(false)}
            >
              About
            </a>
            <a 
              href="#buy-now" 
              className="text-white text-2xl font-bold hover:text-gray-300 transition-colors py-4 border-b border-white/20"
              onClick={() => setIsDropdownOpen(false)}
            >
              Buy Now
            </a>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default NavBar;