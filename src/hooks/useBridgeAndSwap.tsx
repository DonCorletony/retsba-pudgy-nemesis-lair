import { useState, useCallback } from 'react'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useWriteContract, useReadContract } from 'wagmi'
import { parseEther, erc20Abi, formatEther } from 'viem'
import { useToast } from '@/hooks/use-toast'

const WETH_ADDRESS = '0x3439153EB7AF838Ad19d56E1571FBD09333C2809' as `0x${string}`
const RETSBA_TOKEN_ADDRESS = '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A' as `0x${string}`
const V2_ROUTER_ADDRESS = '0xad1eCa41E6F772bE3cb5A48A6141f9bcc1AF9F7c' as `0x${string}`

const uniswapV2RouterAbi = [
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactTokensForTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

export const useBridgeAndSwap = () => {
  const { address } = useAccount()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [bridgeTxHash, setBridgeTxHash] = useState<string | undefined>()
  const [swapTxHash, setSwapTxHash] = useState<string | undefined>()
  const [currentStep, setCurrentStep] = useState<'idle' | 'bridging' | 'bridge-confirmed' | 'approving' | 'swapping' | 'complete'>('idle')

  // Bridge transaction
  const { sendTransaction, isPending: isBridgePending } = useSendTransaction({
    mutation: {
      onSuccess: (hash) => {
        setBridgeTxHash(hash)
        setCurrentStep('bridging')
        toast({
          title: "Bridge Transaction Submitted",
          description: "Step 1: Bridging to Abstract Network...",
        })
      },
      onError: (error) => {
        console.error('Bridge transaction error:', error)
        setIsProcessing(false)
        setCurrentStep('idle')
        toast({
          title: "Bridge Failed",
          description: error.message || "There was an error with the bridge transaction",
          variant: "destructive"
        })
      }
    }
  })

  // WETH approval transaction
  const { writeContract: approveWeth, isPending: isApprovePending } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        toast({
          title: "Approval Transaction Submitted",
          description: "Step 2: Approving WETH for swapping...",
        })
      },
      onError: (error) => {
        console.error('WETH approval error:', error)
        setIsProcessing(false)
        setCurrentStep('idle')
        toast({
          title: "Approval Failed",
          description: error.message || "Failed to approve WETH",
          variant: "destructive"
        })
      }
    }
  })

  // Swap transaction
  const { writeContract: executeSwap, isPending: isSwapPending } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        setSwapTxHash(hash)
        setCurrentStep('swapping')
        toast({
          title: "Swap Transaction Submitted",
          description: "Step 3: Converting WETH to RETSBA...",
        })
      },
      onError: (error) => {
        console.error('Swap transaction error:', error)
        setIsProcessing(false)
        setCurrentStep('idle')
        toast({
          title: "Swap Failed",
          description: error.message || "Failed to swap WETH to RETSBA",
          variant: "destructive"
        })
      }
    }
  })

  // Wait for bridge confirmation
  const { isSuccess: isBridgeConfirmed } = useWaitForTransactionReceipt({
    hash: bridgeTxHash as `0x${string}`,
  })

  // Wait for swap confirmation
  const { isSuccess: isSwapConfirmed } = useWaitForTransactionReceipt({
    hash: swapTxHash as `0x${string}`,
  })

  // Get Relay Bridge quote
  const getRelayQuote = async (fromChainId: number, amount: string) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    const requestBody = {
      user: address,
      recipient: address,
      originChainId: fromChainId,
      destinationChainId: 2741, // Abstract
      originCurrency: '0x0000000000000000000000000000000000000000', // ETH
      destinationCurrency: WETH_ADDRESS,
      amount: parseEther(amount).toString(),
      tradeType: "EXACT_INPUT"
    }

    const response = await fetch('https://api.relay.link/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Bridge API error: ${response.status} - ${errorText}`)
    }
    
    return await response.json()
  }

  // Execute seamless bridge + swap
  const executeBridgeAndSwap = useCallback(async (
    fromChainId: number, 
    amount: string, 
    currentPrice: number
  ) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    setIsProcessing(true)
    setCurrentStep('bridging')

    try {
      // Step 1: Get bridge quote and execute
      const bridgeQuote = await getRelayQuote(fromChainId, amount)
      
      if (!bridgeQuote.steps || bridgeQuote.steps.length === 0) {
        throw new Error('Invalid bridge quote received')
      }

      const step = bridgeQuote.steps[0]
      if (!step.items || step.items.length === 0) {
        throw new Error('No bridge transaction data')
      }

      const txData = step.items[0].data
      
      // Execute bridge transaction
      sendTransaction({
        to: txData.to as `0x${string}`,
        value: BigInt(txData.value || '0'),
        data: txData.data as `0x${string}`,
        gas: BigInt(txData.gas || '300000'),
        maxFeePerGas: BigInt(txData.maxFeePerGas || '0'),
        maxPriorityFeePerGas: BigInt(txData.maxPriorityFeePerGas || '0'),
      })

      // Note: The actual WETH approval and swap will be triggered by monitoring bridge completion
      // This happens in the component that uses this hook

    } catch (error: any) {
      console.error('Bridge and swap error:', error)
      setIsProcessing(false)
      setCurrentStep('idle')
      throw error
    }
  }, [address, sendTransaction])

  // Get current WETH balance
  const { data: wethBalance, refetch: refetchWethBalance } = useReadContract({
    address: WETH_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Execute WETH approval with actual balance
  const approveWethForSwap = useCallback(async () => {
    if (!address) return

    // Refetch WETH balance to get actual amount after bridge
    const balanceResult = await refetchWethBalance()
    const actualWethBalance = balanceResult.data
    
    if (!actualWethBalance || actualWethBalance === 0n) {
      console.error('No WETH balance found after bridge')
      toast({
        title: "No WETH Found",
        description: "WETH balance is 0 after bridge. Please check your wallet.",
        variant: "destructive"
      })
      setIsProcessing(false)
      setCurrentStep('idle')
      return
    }

    console.log('WETH balance after bridge:', formatEther(actualWethBalance))
    setCurrentStep('approving')
    
    approveWeth({
      address: WETH_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [V2_ROUTER_ADDRESS, actualWethBalance] // Approve full balance
    } as any)
  }, [address, approveWeth, refetchWethBalance, toast])

  // Execute WETH to RETSBA swap with actual balance
  const swapWethToRetsba = useCallback(async (currentPrice: number) => {
    if (!address || !currentPrice) return

    // Get actual WETH balance
    const balanceResult = await refetchWethBalance()
    const actualWethBalance = balanceResult.data
    
    if (!actualWethBalance || actualWethBalance === 0n) {
      console.error('No WETH balance for swap')
      toast({
        title: "Swap Failed",
        description: "No WETH balance available for swap",
        variant: "destructive"
      })
      setIsProcessing(false)
      setCurrentStep('idle')
      return
    }

    const wethAmountInEther = formatEther(actualWethBalance)
    console.log('Swapping WETH amount:', wethAmountInEther)
    console.log('Current RETSBA price:', currentPrice)
    
    setCurrentStep('swapping')

    const deadline = Math.floor(Date.now() / 1000) + 600 // 10 minutes
    // Increased slippage to 5% for better success rate
    const expectedRetsba = (Number(wethAmountInEther) / currentPrice * 0.95).toString()
    const amountOutMin = parseEther(expectedRetsba)
    
    console.log('Expected RETSBA output (with 5% slippage):', expectedRetsba)

    executeSwap({
      address: V2_ROUTER_ADDRESS,
      abi: uniswapV2RouterAbi,
      functionName: 'swapExactTokensForTokens',
      args: [
        actualWethBalance, // Use actual balance
        amountOutMin,
        [WETH_ADDRESS, RETSBA_TOKEN_ADDRESS],
        address,
        BigInt(deadline)
      ]
    } as any)
  }, [address, executeSwap, refetchWethBalance, toast])

  // Complete the process
  const completeProcess = useCallback(() => {
    setCurrentStep('complete')
    setIsProcessing(false)
    setBridgeTxHash(undefined)
    setSwapTxHash(undefined)
    
    toast({
      title: "Bridge + Swap Complete!",
      description: "Successfully bridged and swapped to RETSBA",
    })
  }, [toast])

  return {
    // State
    isProcessing,
    currentStep,
    bridgeTxHash,
    swapTxHash,
    
    // Bridge status
    isBridgePending,
    isBridgeConfirmed,
    
    // Approval status  
    isApprovePending,
    
    // Swap status
    isSwapPending,
    isSwapConfirmed,
    
    // Balances
    wethBalance,
    refetchWethBalance,
    
    // Actions
    executeBridgeAndSwap,
    approveWethForSwap,
    swapWethToRetsba,
    completeProcess
  }
}