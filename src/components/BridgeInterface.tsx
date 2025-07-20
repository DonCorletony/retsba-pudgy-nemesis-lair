import React, { useState, useEffect } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { formatEther } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { useBridgeAndSwap } from '@/hooks/useBridgeAndSwap'
import { BridgeStatus } from '@/components/BridgeStatus'

// Define source tokens for bridging
const SOURCE_TOKENS = [
  {
    symbol: 'ETH',
    name: 'Ethereum ETH',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    chainId: 1, // Ethereum Mainnet
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    chainId: 43114, // Avalanche C-Chain
  }
]

export const BridgeInterface = () => {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  
  // State for selected source token and bridge amount
  const [selectedToken, setSelectedToken] = useState(SOURCE_TOKENS[0])
  const [bridgeAmount, setBridgeAmount] = useState('')
  
  // Bridge functionality
  const bridgeAndSwap = useBridgeAndSwap()
  
  // Cross-chain balances
  const [mainnetEthBalance, setMainnetEthBalance] = useState<{ value: bigint; decimals: number; formatted: string; symbol: string } | null>(null)
  const [avaxBalance, setAvaxBalance] = useState<{ value: bigint; decimals: number; formatted: string; symbol: string } | null>(null)
  
  // Get Abstract ETH balance to show destination
  const { data: abstractEthBalance } = useBalance({
    address: address,
    chainId: 2741, // Abstract chain
  })
  
  // Function to fetch cross-chain balances using RPC
  const fetchCrossChainBalance = async (chainId: number, rpcUrl: string) => {
    if (!address) return null
    
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1
        })
      })
      
      const data = await response.json()
      if (data.result) {
        const balanceWei = BigInt(data.result)
        return {
          value: balanceWei,
          decimals: 18,
          formatted: formatEther(balanceWei),
          symbol: 'ETH'
        }
      }
    } catch (error) {
      console.error(`Error fetching balance for chain ${chainId}:`, error)
    }
    return null
  }
  
  // Fetch cross-chain balances when address changes
  useEffect(() => {
    const fetchBalances = async () => {
      if (!address) {
        setMainnetEthBalance(null)
        setAvaxBalance(null)
        return
      }
      
      // Fetch Ethereum mainnet balance
      const ethBalance = await fetchCrossChainBalance(1, 'https://eth.llamarpc.com')
      setMainnetEthBalance(ethBalance)
      
      // Fetch Avalanche balance  
      const avaxBal = await fetchCrossChainBalance(43114, 'https://api.avax.network/ext/bc/C/rpc')
      setAvaxBalance(avaxBal)
    }
    
    fetchBalances()
  }, [address])

  // Helper function to get the current balance for the selected token
  const getCurrentTokenBalance = () => {
    switch (selectedToken.chainId) {
      case 1: // Ethereum mainnet
        return mainnetEthBalance
      case 43114: // Avalanche
        return avaxBalance
      default:
        return null
    }
  }

  const handleBridge = async () => {
    console.log('🌉 handleBridge called!')
    console.log('Selected Token:', selectedToken)
    console.log('Bridge Amount:', bridgeAmount)
    console.log('Address:', address)
    
    if (!bridgeAmount || !address) {
      toast({
        title: "Error",
        description: "Please enter an amount and connect your wallet",
        variant: "destructive"
      })
      return
    }

    const currentBalance = getCurrentTokenBalance()
    if (!currentBalance || Number(formatEther(currentBalance.value)) < parseFloat(bridgeAmount)) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${selectedToken.symbol} for this bridge.`,
        variant: "destructive"
      })
      return
    }

    try {
      console.log('🚀 Starting bridge process...')
      await bridgeAndSwap.executeBridgeAndSwap(selectedToken.chainId, bridgeAmount, 1) // Price not needed for bridge-only
      console.log('✅ Bridge process started')
    } catch (error: any) {
      console.error('❌ Bridge error:', error)
      toast({
        title: "Bridge Failed",
        description: error.message || "There was an error with the bridge process",
        variant: "destructive"
      })
    }
  }

  const isProcessing = bridgeAndSwap.isProcessing || bridgeAndSwap.currentStep !== 'idle'

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Bridge to Abstract</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Please connect your wallet to bridge tokens to Abstract Network
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Bridge to Abstract</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Bridge your tokens to Abstract Network
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source Token Selection */}
          <div className="space-y-2">
            <Label htmlFor="token-select">From (Source Chain)</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between" id="token-select">
                  <span>{selectedToken.name} ({selectedToken.symbol})</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {SOURCE_TOKENS.map((token) => (
                  <DropdownMenuItem
                    key={`${token.chainId}-${token.symbol}`}
                    onClick={() => setSelectedToken(token)}
                  >
                    {token.name} ({token.symbol})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bridge Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="bridge-amount">Amount to Bridge</Label>
            <Input
              id="bridge-amount"
              type="number"
              placeholder="0.0"
              value={bridgeAmount}
              onChange={(e) => setBridgeAmount(e.target.value)}
              step="0.001"
              min="0"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Available: {getCurrentTokenBalance()?.formatted || '0'} {selectedToken.symbol}</span>
              <button
                onClick={() => {
                  const balance = getCurrentTokenBalance()
                  if (balance) {
                    setBridgeAmount(balance.formatted)
                  }
                }}
                className="text-primary hover:underline"
              >
                Max
              </button>
            </div>
          </div>

          {/* Destination Info */}
          <div className="space-y-2">
            <Label>To (Abstract Network)</Label>
            <div className="p-3 bg-muted rounded-md">
              <div className="flex justify-between items-center">
                <span>Abstract ETH</span>
                <span className="text-sm text-muted-foreground">
                  Balance: {abstractEthBalance?.formatted || '0'} ETH
                </span>
              </div>
              {bridgeAmount && (
                <div className="text-sm text-muted-foreground mt-1">
                  You will receive: ~{bridgeAmount} ETH
                </div>
              )}
            </div>
          </div>

          {/* Bridge Button */}
          <Button 
            onClick={handleBridge}
            disabled={!bridgeAmount || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Bridging...' : `Bridge ${selectedToken.symbol} to Abstract`}
          </Button>

          {/* Bridge Status */}
          {isProcessing && (
            <BridgeStatus
              currentStep={bridgeAndSwap.currentStep}
              bridgeTxHash={bridgeAndSwap.bridgeTxHash}
              swapTxHash={bridgeAndSwap.swapTxHash}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}