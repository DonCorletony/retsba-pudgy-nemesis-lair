import React, { useState, useEffect } from 'react'
import { useAccount, useBalance, useReadContract, useWriteContract } from 'wagmi'
import { formatEther, parseEther, erc20Abi } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const RETSBA_DEX_ADDRESS = '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A' as `0x${string}`
const ABSETH_TOKEN_ADDRESS = '0xa8726bD058Bea1973B61a9BC2a5E0e605B797307' as `0x${string}`

export const TradingInterface = () => {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [swapAmount, setSwapAmount] = useState('')
  
  // Get AbsETH balance
  const { data: absEthBalance, error: absEthError, isLoading: absEthLoading } = useReadContract({
    address: ABSETH_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Get Retsba token balance from DEX
  const { data: retsbaBalance, error: retsbaError, isLoading: retsbaLoading } = useReadContract({
    address: RETSBA_DEX_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Debug logging
  useEffect(() => {
    console.log('=== BALANCE DEBUG INFO ===')
    console.log('Connected Address:', address)
    console.log('AbsETH Contract:', ABSETH_TOKEN_ADDRESS)
    console.log('AbsETH Balance:', absEthBalance)
    console.log('AbsETH Error:', absEthError)
    console.log('AbsETH Loading:', absEthLoading)
    console.log('Retsba Balance:', retsbaBalance)
    console.log('Retsba Error:', retsbaError)
    console.log('========================')
  }, [address, absEthBalance, absEthError, absEthLoading, retsbaBalance, retsbaError])

  // Get AbsETH token decimals
  const { data: absEthDecimals } = useReadContract({
    address: ABSETH_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'decimals',
  })

  // Get Retsba token decimals
  const { data: retsbaDecimals } = useReadContract({
    address: RETSBA_DEX_ADDRESS,
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
        description: `Swapping ${swapAmount} AbsETH for Retsba via DEX contract ${RETSBA_DEX_ADDRESS}`,
      })
      
      // Note: This would require the actual DEX contract ABI and proper implementation
      // For now, we're showing the interface structure
      console.log('Swap parameters:', {
        dexAddress: RETSBA_DEX_ADDRESS,
        amount: parseEther(swapAmount),
        tokenIn: ABSETH_TOKEN_ADDRESS,
        tokenOut: RETSBA_DEX_ADDRESS
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
        {/* AbsETH Balance */}
        <div className="p-4 border rounded-lg bg-background">
          <Label className="text-sm font-medium text-muted-foreground">AbsETH Balance</Label>
          {absEthLoading ? (
            <p className="text-lg font-semibold text-foreground">Loading...</p>
          ) : absEthError ? (
            <p className="text-lg font-semibold text-destructive">Error loading balance</p>
          ) : (
            <p className="text-lg font-semibold text-foreground">
              {absEthBalance && absEthDecimals 
                ? `${parseFloat(formatEther(absEthBalance)).toFixed(4)} AbsETH` 
                : '0 AbsETH'
              }
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Contract: {ABSETH_TOKEN_ADDRESS.slice(0, 8)}...{ABSETH_TOKEN_ADDRESS.slice(-6)}
          </p>
        </div>

        {/* Retsba Balance */}
        <div className="p-4 border rounded-lg bg-background">
          <Label className="text-sm font-medium text-muted-foreground">Retsba Balance</Label>
          <p className="text-lg font-semibold text-foreground">
            {retsbaBalance && retsbaDecimals 
              ? `${parseFloat(formatEther(retsbaBalance)).toFixed(4)} RETSBA`
              : '0 RETSBA'
            }
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
            {isPending ? 'Swapping...' : 'Swap AbsETH for Retsba'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          DEX Contract: {RETSBA_DEX_ADDRESS.slice(0, 6)}...{RETSBA_DEX_ADDRESS.slice(-4)}
          <br />
          AbsETH Token: {ABSETH_TOKEN_ADDRESS.slice(0, 6)}...{ABSETH_TOKEN_ADDRESS.slice(-4)}
        </p>
      </CardContent>
    </Card>
  )
}