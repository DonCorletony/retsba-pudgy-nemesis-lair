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
  const { connectors, connect, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { isConnected, address } = useAccount()
  const { toast } = useToast()

  // Unified wallet handler for ALL connectors (including AGW)
  const handleWalletConnection = async (connectorName: string) => {
    try {
      console.log(`Attempting to connect to ${connectorName}`)
      console.log('Available connectors:', connectors.map(c => ({ name: c.name, id: c.id })))
      
      let connector = null
      
      if (connectorName === 'MetaMask') {
        connector = connectors.find(c => c.name === 'MetaMask' || c.id === 'metaMaskSDK')
      } else if (connectorName === 'WalletConnect') {
        connector = connectors.find(c => c.name === 'WalletConnect' || c.id === 'walletConnect')
      } else if (connectorName === 'OKX') {
        connector = connectors.find(c => c.name === 'OKX Wallet' || c.id === 'com.okex.wallet') ||
                   connectors.find(c => c.name === 'Injected' || c.id === 'injected')
      }
      
      if (connector) {
        console.log(`Found connector:`, { name: connector.name, id: connector.id })
        await connect({ connector })
        toast({
          title: "Success",
          description: `Connected to ${connectorName}!`,
        })
      } else {
        console.error(`No connector found for ${connectorName}`)
        toast({
          title: "Connector Not Found",
          description: `${connectorName} connector not available. Available: ${connectors.map(c => c.name).join(', ')}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error(`${connectorName} connection error:`, error)
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${connectorName}: ${error.message}`,
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
        <Button disabled={isPending} variant="wallet" className="gap-2">
          <Wallet className="h-4 w-4" />
          {isPending ? 'Connecting...' : 'Connect Wallet'}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* All wallet options using unified handler */}
        <DropdownMenuItem
          onClick={() => handleWalletConnection('MetaMask')}
          disabled={isPending}
        >
          MetaMask
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleWalletConnection('OKX')}
          disabled={isPending}
        >
          OKX
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleWalletConnection('WalletConnect')}
          disabled={isPending}
        >
          WalletConnect
        </DropdownMenuItem>
        
      </DropdownMenuContent>
    </DropdownMenu>
  )
}