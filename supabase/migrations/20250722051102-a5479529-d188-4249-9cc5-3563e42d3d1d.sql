-- Add wallet_address column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN wallet_address TEXT;

-- Create unique index for wallet addresses
CREATE UNIQUE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address)
WHERE wallet_address IS NOT NULL;