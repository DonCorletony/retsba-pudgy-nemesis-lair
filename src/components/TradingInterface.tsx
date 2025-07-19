import React, { useState, useEffect } from 'react'
import { useAccount, useBalance, useReadContract, useWriteContract } from 'wagmi'
import { formatEther, parseEther, erc20Abi } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const RETSBA_TOKEN_ADDRESS = '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A' as `0x${string}` // RETSBA token on Abstract
const ABSETH_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}` // AbsETH (zero address for native ETH)

export const TradingInterface = () => {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [swapAmount, setSwapAmount] = useState('')
  
  // Get native ETH balance for AbsETH (zero address)
  const { data: ethBalance } = useBalance({
    address: address,
  })

  // Get RETSBA token balance 
  const { data: retsbaBalance, error: retsbaError, isLoading: retsbaLoading } = useReadContract({
    address: RETSBA_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Debug logging
  useEffect(() => {
    console.log('=== BALANCE DEBUG INFO ===')
    console.log('Connected Address:', address)
    console.log('AbsETH (Native ETH):', ABSETH_ADDRESS)
    console.log('ETH Balance:', ethBalance)
    console.log('RETSBA Contract:', RETSBA_TOKEN_ADDRESS)
    console.log('RETSBA Balance:', retsbaBalance)
    console.log('RETSBA Error:', retsbaError)
    console.log('RETSBA Loading:', retsbaLoading)
    console.log('========================')
  }, [address, ethBalance, retsbaBalance, retsbaError, retsbaLoading])

  // Get RETSBA token decimals
  const { data: retsbaDecimals } = useReadContract({
    address: RETSBA_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'decimals',
  })

  const { writeContract, isPending } = useWriteContract()

  // Listen for account changes and refresh interface
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0 && accounts[0] !== address) {
        toast({
          title: "Account Updated",
          description: "Refreshing balances for new account...",
        })
        setSwapAmount('') // Clear any pending swap amount
        // The useReadContract hooks will automatically refresh with the new address
      }
    }

    if (typeof window !== 'undefined' && window.ethereum && isConnected) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [address, isConnected, toast])

  const handleSwap = async () => {
    if (!swapAmount || !address) {
      toast({
        title: "Error",
        description: "Please enter an amount and connect your wallet",
        variant: "destructive"
      })
      return
    }

    try {
      // Interact with the DEX contract for swapping
      toast({
        title: "Swap Initiated", 
        description: `Swapping ${swapAmount} AbsETH for RETSBA via contract ${RETSBA_TOKEN_ADDRESS}`,
      })
      
      // Note: This would require the actual DEX contract ABI and proper implementation
      // For now, we're showing the interface structure
      console.log('Swap parameters:', {
        retsbaContract: RETSBA_TOKEN_ADDRESS,
        amount: parseEther(swapAmount),
        tokenIn: ABSETH_ADDRESS, // Native ETH
        tokenOut: RETSBA_TOKEN_ADDRESS
      })
      
    } catch (error) {
      toast({
        title: "Swap Failed",
        description: "There was an error processing your swap",
        variant: "destructive"
      })
    }
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Buy Retsba</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">Please connect your wallet to continue</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-foreground">Buy Retsba</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AbsETH Balance (Native ETH) */}
        <div className="p-4 border rounded-lg bg-background">
          <Label className="text-sm font-medium text-muted-foreground">AbsETH Balance</Label>
          <p className="text-lg font-semibold text-foreground">
            {ethBalance ? `${parseFloat(formatEther(ethBalance.value)).toFixed(4)} AbsETH` : '0 AbsETH'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Native ETH on Abstract
          </p>
        </div>

        {/* RETSBA Balance */}
        <div className="p-4 border rounded-lg bg-background">
          <Label className="text-sm font-medium text-muted-foreground">RETSBA Balance</Label>
          {retsbaLoading ? (
            <p className="text-lg font-semibold text-foreground">Loading...</p>
          ) : retsbaError ? (
            <div>
              <p className="text-lg font-semibold text-destructive">Error loading RETSBA balance</p>
              <p className="text-xs text-destructive mt-1">{retsbaError.message || 'Unknown error'}</p>
            </div>
          ) : (
            <p className="text-lg font-semibold text-foreground">
              {retsbaBalance && retsbaDecimals 
                ? `${parseFloat(formatEther(retsbaBalance)).toFixed(4)} RETSBA`
                : '0 RETSBA'
              }
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Contract: {RETSBA_TOKEN_ADDRESS.slice(0, 8)}...{RETSBA_TOKEN_ADDRESS.slice(-6)}
          </p>
        </div>

        {/* Swap Interface */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="swap-amount" className="text-sm font-medium">
              Amount of AbsETH to swap
            </Label>
            <Input
              id="swap-amount"
              type="number"
              placeholder="0.0"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              className="mt-1"
              step="0.001"
              min="0"
            />
          </div>

          <Button 
            onClick={handleSwap}
            disabled={isPending || !swapAmount}
            className="w-full"
          >
            {isPending ? 'Swapping...' : 'Swap AbsETH for RETSBA'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          RETSBA Contract: {RETSBA_TOKEN_ADDRESS.slice(0, 6)}...{RETSBA_TOKEN_ADDRESS.slice(-4)}
          <br />
          AbsETH: Native ETH on Abstract
        </p>
      </CardContent>
    </Card>
  )
}