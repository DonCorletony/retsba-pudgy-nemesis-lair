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
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();

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

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username,
            display_name: displayName
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
        toast({
          variant: "destructive",
          title: "Error",
          description: signInError.message
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
      // For now, wallet auth is not fully implemented
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

  const handleWalletSignUp = async () => {
    if (!isConnected || !address) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet first"
      });
      return;
    }

    // For wallet-only signup, we'd need to create a custom flow
    // This requires backend implementation with message signing
    toast({
      variant: "destructive",
      title: "Not Implemented",
      description: "Wallet-only signup requires additional backend setup. Please use email signup for now."
    });
  };

  const resetForm = () => {
    setEmailOrUsername('');
    setPassword('');
    setUsername('');
    setDisplayName('');
    setEmail('');
    setLoading(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto bg-retsba/95 backdrop-blur-sm border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-white">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-1">
          {/* Email/Password Form */}
          <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn} className="space-y-4">
            {isSignUp && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display-name" className="text-white">Display Name</Label>
                  <Input
                    id="display-name"
                    type="text"
                    placeholder="Your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/60"
                  />
                </div>
              </div>
            )}
            
            {!isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="email-username" className="text-white">Email or Username</Label>
                <Input
                  id="email-username"
                  type="text"
                  placeholder="Enter your email or username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  required
                  className="bg-black/20 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-black/20 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="relative">
            <Separator className="bg-white/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-retsba px-2 text-white/60 text-sm">OR</span>
            </div>
          </div>

          {/* Wallet Authentication */}
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-white/80 text-sm mb-3">
                {isSignUp ? 'Sign up with EVM Wallet' : 'Sign in with EVM Wallet'}
              </p>
              
              {isConnected && address ? (
                <div className="space-y-2">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <p className="text-white/60 text-xs mb-1">Connected Wallet</p>
                    <p className="text-white font-mono text-sm">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                  </div>
                  <Button 
                    onClick={isSignUp ? handleWalletSignUp : handleWalletSignIn}
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                    disabled={loading}
                  >
                    {isSignUp ? 'Create Account with Wallet' : 'Sign In with Wallet'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-white/60 text-xs">Connect your wallet to continue</p>
                  <WalletConnect />
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-white/80 hover:text-white text-sm underline"
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