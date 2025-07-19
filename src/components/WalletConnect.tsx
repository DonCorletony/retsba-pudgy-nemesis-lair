import React, { useEffect } from 'react'
import { useConnect, useDisconnect, useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Wallet } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export const WalletConnect = () => {
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { isConnected, address } = useAccount()
  const { toast } = useToast()

  // Complete disconnect function that clears all cached data
  const handleDisconnect = async () => {
    try {
      // Disconnect from wagmi
      await disconnect()
      
      // Clear all possible localStorage/sessionStorage keys
      const keysToRemove = [
        'wagmi.store',
        'wagmi.cache', 
        'wagmi.connected',
        'wagmi.connector',
        'wagmi.recentConnectorId',
        'okx-wallet.isConnected',
        'okx-wallet.selectedAddress',
        'walletconnect',
        'wc@2',
        '-walletlink',
        'metamask.isConnected'
      ]
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      })
      
      // Clear all localStorage keys that start with wallet-related prefixes
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('wagmi') || key.startsWith('okx') || key.startsWith('wc@') || key.startsWith('walletconnect')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear OKX specific connection state and revoke permissions
      if (typeof window !== 'undefined') {
        // Try to revoke OKX permissions specifically
        if ((window as any).okxwallet) {
          try {
            // Revoke all permissions for this site
            await (window as any).okxwallet.request({
              method: 'wallet_revokePermissions',
              params: [{ eth_accounts: {} }]
            }).catch(() => {})
            
            // Disconnect explicitly
            await (window as any).okxwallet.request({
              method: 'eth_requestAccounts',
              params: []
            }).catch(() => {})
          } catch (e) {}
        }
        
        // General ethereum provider disconnect
        if (window.ethereum) {
          try {
            await window.ethereum.request({
              method: 'wallet_revokePermissions', 
              params: [{ eth_accounts: {} }]
            }).catch(() => {})
          } catch (e) {}
        }
      }
      
      toast({
        title: "Wallet Disconnected", 
        description: "All wallet data cleared. Refresh the page and reconnect with your current account.",
      })
      
      // Force page reload for clean state
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('Disconnect error:', error)
      toast({
        title: "Disconnect Error",
        description: "Please manually refresh the page to clear wallet state.",
        variant: "destructive"
      })
    }
  }

  // Listen for account changes in the wallet extension
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected all accounts - clear everything
        handleDisconnect()
      } else if (isConnected && accounts[0] !== address) {
        // Account changed, show notification and refresh
        toast({
          title: "Account Changed",
          description: `Detected new account: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}. Refreshing...`,
        })
        // Force page reload to ensure clean state with new account
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    }

    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [isConnected, address, disconnect, toast])

  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Wallet className="h-4 w-4" />
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDisconnect}>
            Disconnect & Clear Cache
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isPending} className="gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {connectors
          .filter(connector => 
            connector.name === 'MetaMask' || 
            connector.name === 'WalletConnect' ||
            connector.name === 'OKX Wallet'
          )
          .map((connector) => (
          <DropdownMenuItem
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending}
          >
            {connector.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}