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

  // Traditional wallet handler - use the same wagmi context
  const handleTraditionalWallet = async (connectorName: string) => {
    try {
      // Find the connector from the available connectors in the current wagmi context
      const connector = connectors.find(c => {
        if (connectorName === 'MetaMask') return c.name === 'MetaMask'
        if (connectorName === 'WalletConnect') return c.name === 'WalletConnect'
        if (connectorName === 'OKX') return c.name === 'OKX Wallet' || c.name === 'Injected'
        return false
      })
      
      if (connector) {
        await connect({ connector })
        toast({
          title: "Success",
          description: `Connected to ${connectorName}!`,
        })
      } else {
        // If connector not found in current context, show available options for debugging
        console.log('Available connectors:', connectors.map(c => c.name))
        toast({
          title: "Connector Not Found",
          description: `${connectorName} connector not available. Check console for available options.`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error(`${connectorName} connection error:`, error)
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${connectorName}. Please try again.`,
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
        disconnect()
      }, 10000)

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

  // Debug logging for AGW setup
  console.log('=== AGW SETUP DEBUG ===')
  console.log('Available connectors:', connectors.map(c => ({ name: c.name, id: c.id, uid: c.uid })))
  console.log('Is connected:', isConnected)
  console.log('Address:', address)
  console.log('========================')

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
        handleDisconnect()
      } else if (isConnected && accounts[0] !== address) {
        toast({
          title: "Account Changed",
          description: `Detected new account: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        })
      }
    }

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
        {/* Traditional wallet options using separate config */}
        <DropdownMenuItem
          onClick={() => handleTraditionalWallet('MetaMask')}
          disabled={isPending}
        >
          MetaMask
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleTraditionalWallet('OKX')}
          disabled={isPending}
        >
          OKX
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleTraditionalWallet('WalletConnect')}
          disabled={isPending}
        >
          WalletConnect
        </DropdownMenuItem>
        
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