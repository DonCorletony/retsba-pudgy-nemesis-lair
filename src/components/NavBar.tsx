import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AGWConnect } from './AGWConnect';
import { AuthModal } from './AuthModal';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { erc20Abi, formatEther, formatUnits } from 'viem';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Supabase authentication state
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  
  // Search state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Helper function to handle navigation to home sections
  const navigateToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      // If not on home page, navigate to home first, then scroll to section
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // If already on home page, just scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
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

  // Supabase authentication effect
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile data
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Search function
  const searchProfiles = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching profiles:', error);
        return;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchProfiles(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Profile Button Component
  const ProfileButton = ({ className, onClick }: { className?: string, onClick?: () => void }) => {
    const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'User';
    const avatarUrl = profile?.avatar_url;

    return (
      <button
        onClick={onClick}
        className={`flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors px-3 py-2 rounded-lg border border-white/20 ${className}`}
      >
        <Avatar className="w-6 h-6">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="text-xs bg-white/20 text-white">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium truncate max-w-24">{displayName}</span>
      </button>
    );
  };

  // Auth Button Component  
  const AuthButton = ({ className, onClick }: { className?: string, onClick?: () => void }) => (
    <button
      onClick={(e) => {
        console.log('Auth button clicked!', { authModalOpen });
        if (onClick) onClick();
      }}
      className={`bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors px-4 py-2 rounded-lg border border-white/20 ${className}`}
    >
      Sign In / Sign Up
    </button>
  );

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);
  
  return (
    <>
      <motion.nav 
        className="fixed top-0 left-0 w-full z-50 bg-retsba py-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => {
                  if (location.pathname === '/') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    navigate('/');
                  }
                }}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <img 
                  src="/lovable-uploads/c194c553-4308-4953-85e4-fc967b5dbacd.png" 
                  alt="RETSBA" 
                  className="h-10"
                />
              </button>
              
              {/* Search Icon */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="text-white hover:text-gray-300 transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
            
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
              
              <AGWConnect />
              
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
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-2">
              <a 
                href="/" 
                className="text-stroke text-white hover:text-black transition-colors py-2 text-xl text-left"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                HOME
              </a>
              <button 
                className="text-stroke text-white hover:text-black transition-colors py-2 text-xl text-left"
                onClick={() => {
                  navigateToSection('about');
                  setIsMobileMenuOpen(false);
                }}
              >
                ABOUT
              </button>
              <a 
                href="https://giphy.com/channel/Retsba" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-stroke text-white hover:text-black transition-colors py-2 text-xl text-left"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                GIPHY
              </a>
              <a 
                href="/memes" 
                className="text-stroke text-white hover:text-black transition-colors py-2 text-xl text-left"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                MEMES
              </a>
              <a 
                href="/xp-card" 
                className="text-stroke text-white hover:text-black transition-colors py-2 text-xl text-left"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                XP CARD
              </a>
              <a 
                href="/pfp" 
                className="text-stroke text-white hover:text-black transition-colors py-2 text-xl text-left"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                PFP
              </a>
              <button 
                className="text-stroke text-white hover:text-black transition-colors py-2 text-xl text-left"
                onClick={() => {
                  navigateToSection('buy-now');
                  setIsMobileMenuOpen(false);
                }}
              >
                BUY NOW
              </button>
              
              {/* Auth/Profile Button for Mobile */}
              {user ? (
                <ProfileButton 
                  className="text-left"
                  onClick={() => {
                    navigate('/profile');
                    setIsMobileMenuOpen(false);
                  }}
                />
              ) : (
                <AuthButton 
                  className="text-left"
                  onClick={() => {
                    setAuthModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                />
              )}
              
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
                <AGWConnect />
              </div>
              
              {/* Dark Mode Toggle for Mobile */}
              <div className="flex items-center justify-between py-4 mt-4 border-t border-white/20">
                <Label htmlFor="mobile-dark-mode" className="text-white text-lg">
                  Dark Mode
                </Label>
                <Switch
                  id="mobile-dark-mode"
                  checked={isDarkMode}
                  onCheckedChange={setIsDarkMode}
                />
              </div>
              
              {/* Sign Out Button for Mobile */}
              {user && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-white/70 hover:text-white text-sm transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
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
        {/* Close Button */}
        <button
          onClick={() => setIsDropdownOpen(false)}
          className="absolute top-4 left-4 text-white hover:text-gray-300 transition-colors p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Auth/Profile Button */}
        {user ? (
          <ProfileButton 
            className="absolute top-4 right-4"
            onClick={() => {
              navigate('/profile');
              setIsDropdownOpen(false);
            }}
          />
        ) : (
          <AuthButton 
            className="absolute top-4 right-4"
            onClick={() => {
              setAuthModalOpen(true);
              setIsDropdownOpen(false);
            }}
          />
        )}
        
        <div className="p-6 pt-20">
          <div className="flex flex-col space-y-3">
            <a 
              href="/" 
              className="text-stroke text-white text-2xl font-bold hover:text-gray-300 transition-colors py-2 border-b border-white/20"
              onClick={() => setIsDropdownOpen(false)}
            >
              Home
            </a>
            <button 
              className="text-stroke text-white text-2xl font-bold hover:text-gray-300 transition-colors py-2 border-b border-white/20 text-left"
              onClick={() => {
                navigateToSection('about');
                setIsDropdownOpen(false);
              }}
            >
              About
            </button>
            <a 
              href="https://giphy.com/channel/Retsba" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-stroke text-white text-2xl font-bold hover:text-gray-300 transition-colors py-2 border-b border-white/20"
              onClick={() => setIsDropdownOpen(false)}
            >
              Giphy
            </a>
            <a 
              href="/memes" 
              className="text-stroke text-white text-2xl font-bold hover:text-gray-300 transition-colors py-2 border-b border-white/20"
              onClick={() => setIsDropdownOpen(false)}
            >
              Memes
            </a>
            <a 
              href="/xp-card" 
              className="text-stroke text-white text-2xl font-bold hover:text-gray-300 transition-colors py-2 border-b border-white/20"
              onClick={() => setIsDropdownOpen(false)}
            >
              XP Card
            </a>
            <a 
              href="/pfp" 
              className="text-stroke text-white text-2xl font-bold hover:text-gray-300 transition-colors py-2 border-b border-white/20"
              onClick={() => setIsDropdownOpen(false)}
            >
              PFP
            </a>
            <button 
              className="text-stroke text-white text-2xl font-bold hover:text-gray-300 transition-colors py-2 border-b border-white/20 text-left"
              onClick={() => {
                navigateToSection('buy-now');
                setIsDropdownOpen(false);
              }}
            >
              Buy Now
            </button>
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between py-4 mt-8">
              <Label htmlFor="dark-mode" className="text-white text-lg">
                Dark Mode
              </Label>
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
              />
            </div>
            
            {/* Sign Out Button - Bottom Right */}
            {user && (
              <div className="flex justify-end mt-auto pt-8">
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setIsDropdownOpen(false);
                  }}
                  className="text-white/70 hover:text-white text-sm transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      {/* Search Modal */}
      <Dialog open={searchModalOpen} onOpenChange={setSearchModalOpen}>
        <DialogContent className="max-w-md bg-retsba border border-white/20">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Search Profiles</h2>
            
            <Input
              placeholder="Search by username or display name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              autoFocus
            />
            
            {/* Search Results */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {searching && (
                <div className="text-center py-4 text-white/70">
                  Searching...
                </div>
              )}
              
              {!searching && searchQuery && searchResults.length === 0 && (
                <div className="text-center py-4 text-white/70">
                  No profiles found
                </div>
              )}
              
              {searchResults.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => {
                    navigate(`/profile/${profile.username || profile.id}`);
                    setSearchModalOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-white/10 rounded-lg transition-colors text-left"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={profile.avatar_url} alt={profile.display_name || profile.username} />
                    <AvatarFallback className="bg-white/20 text-white">
                      {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {profile.display_name || profile.username || 'Anonymous User'}
                    </p>
                    {profile.username && (
                      <p className="text-white/70 text-sm truncate">
                        @{profile.username}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NavBar;