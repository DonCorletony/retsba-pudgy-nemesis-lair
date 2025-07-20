import React, { useState, useEffect } from 'react'
import { useAccount, useBalance, useSwitchChain, useChainId } from 'wagmi'
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

export const BridgeInterface = ({ onBalanceRefresh, refreshTrigger }: { onBalanceRefresh?: () => void; refreshTrigger?: number }) => {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const { switchChain } = useSwitchChain()
  const currentChainId = useChainId()
  
  // State for selected source token and bridge amount
  const [selectedToken, setSelectedToken] = useState(SOURCE_TOKENS[0])
  const [bridgeAmount, setBridgeAmount] = useState('')
  
  // Bridge functionality
  const bridgeAndSwap = useBridgeAndSwap(onBalanceRefresh)
  
  // Cross-chain balances
  const [mainnetEthBalance, setMainnetEthBalance] = useState<{ value: bigint; decimals: number; formatted: string; symbol: string } | null>(null)
  const [avaxBalance, setAvaxBalance] = useState<{ value: bigint; decimals: number; formatted: string; symbol: string } | null>(null)
  
  // Get Abstract ETH balance to show destination with refetch capability
  const { data: abstractEthBalance, refetch: refetchAbstractBalance } = useBalance({
    address: address,
    chainId: 2741, // Abstract chain
  })

  // Trigger balance refetch when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('🔄 Refreshing bridge interface balances...');
      refetchAbstractBalance();
      // Trigger re-fetch of cross-chain balances too
      if (address) {
        const fetchBalances = async () => {
          const ethBalance = await fetchCrossChainBalance(1, 'https://eth.llamarpc.com')
          setMainnetEthBalance(ethBalance)
          
          const avaxBal = await fetchCrossChainBalance(43114, 'https://api.avax.network/ext/bc/C/rpc')
          setAvaxBalance(avaxBal)
        }
        fetchBalances()
      }
    }
  }, [refreshTrigger, refetchAbstractBalance, address])
  
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

   // Auto-switch network when token selection changes
   useEffect(() => {
     const switchToTokenChain = async () => {
       if (!isConnected || !selectedToken) return
       
       console.log('🔄 Token changed to:', selectedToken.symbol, 'Chain ID:', selectedToken.chainId)
       console.log('🔄 Current chain ID:', currentChainId)
       
       // Only switch if we're not already on the correct chain
       if (currentChainId !== selectedToken.chainId) {
         console.log('🔄 Switching to chain:', selectedToken.chainId)
         try {
           await switchChain({ chainId: selectedToken.chainId })
           toast({
             title: "Network Switched",
             description: `Switched to ${selectedToken.name}`,
           })
         } catch (error: any) {
           console.error('❌ Failed to switch chain:', error)
           toast({
             title: "Network Switch Failed",
             description: error?.message || `Failed to switch to ${selectedToken.name}`,
             variant: "destructive"
           })
         }
       }
     }

     switchToTokenChain()
   }, [selectedToken, currentChainId, isConnected, switchChain, toast])

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

    // Verify we're on the correct chain before bridging
    console.log('🔍 Chain verification:')
    console.log('Current chain ID:', currentChainId)
    console.log('Selected token chain ID:', selectedToken.chainId)
    console.log('Selected token:', selectedToken.symbol)
    
    if (currentChainId !== selectedToken.chainId) {
      console.log('❌ Chain mismatch detected!')
      toast({
        title: "Wrong Network",
        description: `Please switch to ${selectedToken.name} to bridge. Current: ${currentChainId}, Required: ${selectedToken.chainId}`,
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
        <CardContent className="text-center">
          <p className="text-muted-foreground">Please connect your wallet to bridge tokens to Abstract Network</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-black">Bridge to Abstract</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source Token Balance */}
        <div className="p-4 border rounded-lg bg-white">
          <Label className="text-sm font-medium text-muted-foreground">Source Token Balance</Label>
          <div className="mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-0 h-auto text-left hover:bg-transparent"
                >
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                       <span className="text-lg font-semibold text-black">
                         {(() => {
                           const balance = getCurrentTokenBalance()
                           if (balance) {
                             return `${parseFloat(formatEther(balance.value)).toFixed(4)} ${selectedToken.symbol}`
                           }
                           return `0 ${selectedToken.symbol}`
                         })()}
                       </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">{selectedToken.name}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full min-w-[200px] bg-white border shadow-lg z-50">
                {SOURCE_TOKENS.map((token) => (
                  <DropdownMenuItem 
                    key={`${token.chainId}-${token.symbol}`}
                    onClick={() => setSelectedToken(token)}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{token.symbol}</span>
                      <span className="text-sm text-muted-foreground">{token.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Abstract ETH Balance */}
        <div className="p-4 border rounded-lg bg-white">
          <Label className="text-sm font-medium text-muted-foreground">Abstract ETH Balance</Label>
          <p className="text-lg font-semibold text-black">
            {abstractEthBalance?.formatted ? `${parseFloat(abstractEthBalance.formatted).toFixed(4)} ETH` : '0 ETH'}
          </p>
        </div>

        {/* Bridge Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="bridge-amount" className="text-black">Amount to Bridge</Label>
          <Input
            id="bridge-amount"
            type="number"
            placeholder="0.0"
            value={bridgeAmount}
            onChange={(e) => setBridgeAmount(e.target.value)}
            step="0.001"
            min="0"
            className="bg-white border text-black"
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

        {/* Estimated Output */}
        {bridgeAmount && (
          <div className="p-4 border rounded-lg bg-white">
            <Label className="text-sm font-medium text-muted-foreground">You will receive</Label>
            <p className="text-lg font-semibold text-black">
              ~{bridgeAmount} ETH on Abstract
            </p>
          </div>
        )}

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
  )
}