import React, { useEffect } from 'react'
import { useConnect, useDisconnect, useAccount } from 'wagmi'
import { useLoginWithAbstract } from '@abstract-foundation/agw-react'
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
  const { connectors, connect, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { isConnected, address } = useAccount()
  const { login: loginWithAbstract } = useLoginWithAbstract()
  const { toast } = useToast()

  // Abstract Global Wallet handler
  const handleAbstractWallet = async () => {
    try {
      await loginWithAbstract()
      toast({
        title: "Success",
        description: "Connected to Abstract Global Wallet!",
      })
    } catch (error) {
      console.error('AGW connection error:', error)
      toast({
        title: "Connection Failed", 
        description: "Failed to connect to Abstract Global Wallet. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Add connection timeout
  useEffect(() => {
    if (isPending) {
      const timeout = setTimeout(() => {
        toast({
          title: "Connection Timeout",
          description: "Connection took too long. Please try again.",
          variant: "destructive"
        })
        // Force reset pending state by disconnecting
        disconnect()
      }, 10000) // 10 second timeout

      return () => clearTimeout(timeout)
    }
  }, [isPending, toast, disconnect])

  // Handle connection errors
  useEffect(() => {
    if (error) {
      console.error('Connection error:', error)
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet. Please try again.",
        variant: "destructive"
      })
    }
  }, [error, toast])

  // Debug logging
  console.log('=== CONNECTOR DEBUG ===')
  console.log('Available connectors:', connectors.map(c => ({ name: c.name, id: c.id, uid: c.uid })))
  console.log('Is connected:', isConnected)
  console.log('Address:', address)
  console.log('========================')


  // Filter connectors - avoid duplicates and only show relevant ones
  const filteredConnectors = connectors.filter(connector => {
    // Only show MetaMask, WalletConnect, and ONE OKX option (prefer "OKX Wallet" over "Injected")
    if (connector.name === 'MetaMask' || connector.name === 'WalletConnect') return true
    if (connector.name === 'OKX Wallet') return true
    // Only show Injected if no OKX Wallet exists
    if (connector.name === 'Injected') {
      return !connectors.some(c => c.name === 'OKX Wallet')
    }
    return false
  })

  // Simple disconnect function
  const handleDisconnect = async () => {
    try {
      await disconnect()
      toast({
        title: "Disconnected",
        description: "Wallet disconnected successfully.",
      })
    } catch (error) {
      console.error('Disconnect error:', error)
      toast({
        title: "Disconnect Failed", 
        description: "Failed to disconnect wallet.",
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
  }, [isConnected, address, toast])

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
            Disconnect
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
          {isPending ? 'Connecting...' : 'Connect Wallet'}
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
            {connector.name === 'Injected' ? 'OKX' : connector.name}
          </DropdownMenuItem>
        ))}
        
        {/* Abstract Global Wallet option */}
        <DropdownMenuItem
          onClick={handleAbstractWallet}
          disabled={isPending}
        >
          Abstract Global Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}