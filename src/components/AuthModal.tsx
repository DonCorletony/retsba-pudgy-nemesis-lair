import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAccount } from 'wagmi';
import { WalletConnect } from './WalletConnect';
import { Separator } from '@/components/ui/separator';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();

  // Generate random display name
  const generateRandomDisplayName = (): string => {
    const adjectives = ['Cool', 'Swift', 'Bright', 'Noble', 'Sharp', 'Quick', 'Bold', 'Smart', 'Wise', 'Lucky'];
    const nouns = ['Trader', 'Explorer', 'Pioneer', 'Voyager', 'Navigator', 'Builder', 'Creator', 'Innovator', 'Artist', 'Sage'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    return `${randomAdjective}${randomNoun}${randomNumber}`;
  };

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        onOpenChange(false);
        navigate('/');
      }
    };
    
    if (open) {
      checkUser();
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        onOpenChange(false);
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, onOpenChange, open]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check if passwords match
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match."
      });
      setLoading(false);
      return;
    }

    try {
      // Check if username already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingProfile) {
        toast({
          variant: "destructive",
          title: "Username Taken",
          description: "This username is already taken. Please choose a different one."
        });
        setLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      const randomDisplayName = generateRandomDisplayName();
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username,
            display_name: randomDisplayName
          }
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
      } else {
        toast({
          title: "Success!",
          description: "Please check your email to confirm your account."
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Try to sign in with email first
      let signInError = null;
      
      if (emailOrUsername.includes('@')) {
        // It's an email
        const { error } = await supabase.auth.signInWithPassword({
          email: emailOrUsername,
          password
        });
        signInError = error;
      } else {
        // It's a username - find the user's email first
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('username', emailOrUsername)
          .single();

        if (profileError || !profiles) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Username not found"
          });
          setLoading(false);
          return;
        }

        // Get the user's email from auth.users (this won't work directly, so we need another approach)
        // For now, show error - username login needs additional backend setup
        toast({
          variant: "destructive",
          title: "Error",
          description: "Username login not yet implemented. Please use your email address."
        });
        setLoading(false);
        return;
      }

      if (signInError) {
        // Provide specific error messages
        let errorMessage = signInError.message;
        
        if (signInError.message.includes('Invalid login credentials')) {
          errorMessage = "The password you've entered is incorrect.";
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = "Please check your email and click the confirmation link.";
        } else if (signInError.message.includes('User not found')) {
          errorMessage = "An account with this email does not exist.";
        }
        
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSignIn = async () => {
    if (!isConnected || !address) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet first"
      });
      return;
    }

    setLoading(true);

    try {
      // Check if wallet address exists in profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('wallet_address', address);

      if (profileError || !profiles || profiles.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "This wallet address is not associated with an existing account."
        });
        setLoading(false);
        return;
      }

      // For now, wallet auth needs message signing implementation
      toast({
        variant: "destructive",
        title: "Not Implemented",
        description: "Wallet authentication requires additional backend setup"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!isConnected || !address) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet first"
      });
      return;
    }

    if (!username.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Username is required for wallet signup"
      });
      return;
    }

    setLoading(true);

    try {
      // Check if username already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingProfile) {
        toast({
          variant: "destructive",
          title: "Username Taken",
          description: "This username is already taken. Please choose a different one."
        });
        setLoading(false);
        return;
      }

      // Check if wallet address already exists
      const { data: existingWallet } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('wallet_address', address)
        .single();

      if (existingWallet) {
        toast({
          variant: "destructive",
          title: "Wallet Already Registered",
          description: "This wallet address is already associated with an account."
        });
        setLoading(false);
        return;
      }

      // For now, wallet signup needs backend implementation
      toast({
        variant: "destructive",
        title: "Not Implemented",
        description: "Wallet signup requires additional backend setup for message signing and authentication."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmailOrUsername('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setEmail('');
    setLoading(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto bg-white border-gray-200 text-gray-900" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="flex flex-col items-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/c194c553-4308-4953-85e4-fc967b5dbacd.png" 
              alt="RETSBA" 
              className="h-10"
            />
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-1">
          {/* Email/Password Form */}
          <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn} className="space-y-4">
            {isSignUp && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>
            )}
            
            {!isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="email-username" className="text-gray-700">Email or Username</Label>
                <Input
                  id="email-username"
                  type="text"
                  placeholder="Enter your email or username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  required
                  className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-700">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="relative">
            <Separator className="bg-gray-200" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-2 text-gray-500 text-sm">OR</span>
            </div>
          </div>

          {/* Wallet Authentication */}
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-3">
                {isSignUp ? 'Sign up with EVM Wallet' : 'Sign in with EVM Wallet'}
              </p>
              
              {isConnected && address ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-gray-500 text-xs mb-1">Connected Wallet</p>
                    <p className="text-gray-900 font-mono text-sm">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                  </div>
                  
                  {isSignUp && (
                    <form onSubmit={handleWalletSignUp} className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="wallet-username" className="text-gray-700">Username</Label>
                        <Input
                          id="wallet-username"
                          type="text"
                          placeholder="Choose a username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                        />
                      </div>
                      <Button 
                        type="submit"
                        variant="outline"
                        className="w-full bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200"
                        disabled={loading}
                      >
                        {loading ? 'Creating Account...' : 'Create Account with Wallet'}
                      </Button>
                    </form>
                  )}
                  
                  {!isSignUp && (
                    <Button 
                      onClick={handleWalletSignIn}
                      variant="outline"
                      className="w-full bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200"
                      disabled={loading}
                    >
                      {loading ? 'Signing In...' : 'Sign In with Wallet'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-500 text-xs">Connect your wallet to continue</p>
                  <WalletConnect />
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-gray-600 hover:text-gray-900 text-sm underline"
            >
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};