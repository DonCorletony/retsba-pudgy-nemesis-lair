import React, { useState, useEffect } from 'react'
import { useAccount, useBalance, useReadContract, useWriteContract } from 'wagmi'
import { formatEther, parseEther, erc20Abi } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const RETSBA_TOKEN_ADDRESS = '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A' as `0x${string}`

export const TradingInterface = () => {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [swapAmount, setSwapAmount] = useState('')
  
  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
  })

  // Get Retsba token balance
  const { data: retsbaBalance } = useReadContract({
    address: RETSBA_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Get token decimals
  const { data: tokenDecimals } = useReadContract({
    address: RETSBA_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'decimals',
  })

  const { writeContract, isPending } = useWriteContract()

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
      // This is a placeholder - in a real app you'd interact with a DEX or swap contract
      // For demonstration, we'll show how you might call a swap function
      toast({
        title: "Swap Initiated",
        description: `Attempting to swap ${swapAmount} ETH for Retsba`,
      })
      
      // Example contract call (you'd replace this with actual swap contract)
      // writeContract({
      //   address: SWAP_CONTRACT_ADDRESS,
      //   abi: swapAbi,
      //   functionName: 'swapETHForTokens',
      //   args: [RETSBA_TOKEN_ADDRESS],
      //   value: parseEther(swapAmount),
      // })
      
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
        {/* ETH Balance */}
        <div className="p-4 border rounded-lg bg-background">
          <Label className="text-sm font-medium text-muted-foreground">Abstract ETH Balance</Label>
          <p className="text-lg font-semibold text-foreground">
            {ethBalance ? `${parseFloat(formatEther(ethBalance.value)).toFixed(4)} ETH` : '0 ETH'}
          </p>
        </div>

        {/* Retsba Balance */}
        <div className="p-4 border rounded-lg bg-background">
          <Label className="text-sm font-medium text-muted-foreground">Retsba Balance</Label>
          <p className="text-lg font-semibold text-foreground">
            {retsbaBalance && tokenDecimals 
              ? `${parseFloat(formatEther(retsbaBalance)).toFixed(4)} RETSBA`
              : '0 RETSBA'
            }
          </p>
        </div>

        {/* Swap Interface */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="swap-amount" className="text-sm font-medium">
              Amount of ETH to swap
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
            {isPending ? 'Swapping...' : 'Swap ETH for Retsba'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Note: This is a demo interface. Actual swapping requires integration with a DEX contract.
        </p>
      </CardContent>
    </Card>
  )
}