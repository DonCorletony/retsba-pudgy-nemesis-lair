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

  // Debug logging
  console.log('=== CONNECTOR DEBUG ===')
  console.log('Available connectors:', connectors.map(c => ({ name: c.name, id: c.id, uid: c.uid })))
  console.log('Is connected:', isConnected)
  console.log('Address:', address)
  console.log('========================')

  // Filter connectors - let's be more flexible with OKX naming
  const filteredConnectors = connectors.filter(connector => 
    connector.name === 'MetaMask' || 
    connector.name === 'WalletConnect' ||
    connector.name.toLowerCase().includes('okx') ||
    connector.id === 'injected' // This might be how OKX appears
  )

  // Nuclear disconnect - clears everything aggressively
  const handleDisconnect = async () => {
    try {
      // First disconnect from wagmi
      await disconnect()
      
      // Clear ALL localStorage and sessionStorage
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear all possible wallet-related data from indexedDB
      if ('indexedDB' in window) {
        try {
          const dbs = ['wagmi', 'walletconnect', 'okx', 'phantom', 'metamask']
          for (const dbName of dbs) {
            indexedDB.deleteDatabase(dbName)
          }
        } catch (e) {
          console.log('IndexedDB clear failed:', e)
        }
      }
      
      // Revoke permissions for all known wallet providers
      const walletProviders = [
        (window as any).ethereum,
        (window as any).okxwallet, 
        (window as any).phantom?.ethereum,
        (window as any).solana,
        (window as any).web3
      ]
      
      for (const provider of walletProviders) {
        if (provider) {
          try {
            await provider.request({
              method: 'wallet_revokePermissions',
              params: [{ eth_accounts: {} }]
            }).catch(() => {})
            
            await provider.request({
              method: 'eth_requestAccounts', 
              params: []
            }).catch(() => {})
          } catch (e) {
            console.log('Provider disconnect failed:', e)
          }
        }
      }
      
      toast({
        title: "Hard Reset Complete",
        description: "All wallet data nuked. Page will reload in 2 seconds.",
      })
      
      // Force reload after short delay
      setTimeout(() => {
        window.location.href = window.location.href // Hard reload
      }, 2000)
      
    } catch (error) {
      console.error('Nuclear disconnect error:', error)
      toast({
        title: "Reset Failed", 
        description: "Manual browser refresh required to clear wallet state.",
        variant: "destructive"
      })
    }
  }

  // Listen for account changes in the wallet extension
  useEffect(() => {
    // Completely disable auto-connection by disconnecting on mount if connected
    if (isConnected) {
      console.log('Auto-connection detected, forcing disconnect...')
      handleDisconnect()
    }

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
  }, []) // Remove isConnected, address dependencies to prevent re-runs

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
            Nuclear Disconnect (Clear Everything)
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
        {filteredConnectors.map((connector) => (
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