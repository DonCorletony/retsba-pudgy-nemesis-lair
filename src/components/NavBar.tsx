
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WalletConnect } from './WalletConnect';
import TokenBalanceCounter from './TokenBalanceCounter';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { formatUnits, erc20Abi, formatEther } from 'viem';

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { address, isConnected } = useAccount();
  
  // Abstract ETH balance
  const { data: abstractEthBalance, error: ethError, isLoading: ethLoading } = useBalance({
    address,
    chainId: 11124, // Abstract Testnet
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });
  
  // RETSBA token balance - using same approach as TradingInterface
  const { data: retsbaBalanceData, error: retsbaError, isLoading: retsbaLoading } = useReadContract({
    address: '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A',
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: 11124,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 5000,
    },
  });

  // Get RETSBA decimals
  const { data: retsbaDecimals } = useReadContract({
    address: '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A',
    abi: erc20Abi,
    functionName: 'decimals',
    chainId: 11124,
  });
  
  // Format balances the same way as TradingInterface
  const retsbaBalance = retsbaBalanceData && retsbaDecimals 
    ? formatEther(retsbaBalanceData)
    : "0";
  const ethBalance = abstractEthBalance 
    ? formatUnits(abstractEthBalance.value, abstractEthBalance.decimals) 
    : "0";
  
  // Debug logging
  console.log("=== NAVBAR DEBUG ===");
  console.log("Address:", address);
  console.log("IsConnected:", isConnected);
  console.log("Abstract ETH Balance Data:", abstractEthBalance);
  console.log("ETH Error:", ethError);
  console.log("ETH Loading:", ethLoading);
  console.log("RETSBA Balance Data:", retsbaBalanceData);
  console.log("RETSBA Error:", retsbaError);
  console.log("RETSBA Loading:", retsbaLoading);
  console.log("Formatted ETH Balance:", ethBalance);
  console.log("Formatted RETSBA Balance:", retsbaBalance);
  console.log("====================");
  
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
          <div className="hidden md:flex items-center space-x-4">
            <a href="#about" className="text-stroke text-white hover:text-black transition-colors text-xl">ABOUT</a>
            <a href="#buy-now" className="text-stroke text-white hover:text-black transition-colors text-xl">BUY NOW</a>
            
            {/* Token Balance Counters */}
            <TokenBalanceCounter
              balance={retsbaBalance}
              isConnected={isConnected}
              tokenImage="/lovable-uploads/c8028943-ca48-47ea-9dbd-8378147d5a96.png"
              alt="RETSBA Token"
            />
            
            <TokenBalanceCounter
              balance={ethBalance}
              isConnected={isConnected}
              tokenImage="/lovable-uploads/e836e80c-7019-443e-bdf3-bafb4f35aa92.png"
              badgeImage="/lovable-uploads/de3bec85-f2dd-46c7-a561-22069040d3ee.png"
              alt="Abstract ETH"
            />
            
            <WalletConnect />
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
              <TokenBalanceCounter
                balance={retsbaBalance}
                isConnected={isConnected}
                tokenImage="/lovable-uploads/c8028943-ca48-47ea-9dbd-8378147d5a96.png"
                alt="RETSBA Token"
              />
              
              <TokenBalanceCounter
                balance={ethBalance}
                isConnected={isConnected}
                tokenImage="/lovable-uploads/e836e80c-7019-443e-bdf3-bafb4f35aa92.png"
                badgeImage="/lovable-uploads/de3bec85-f2dd-46c7-a561-22069040d3ee.png"
                alt="Abstract ETH"
              />
            </div>
            
            <div className="pt-2">
              <WalletConnect />
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default NavBar;
