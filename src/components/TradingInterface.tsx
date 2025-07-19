import React, { useState, useEffect } from 'react'
import { useAccount, useBalance, useReadContract, useWriteContract, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther, parseEther, erc20Abi } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'

const RETSBA_TOKEN_ADDRESS = '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A' as `0x${string}` // RETSBA token on Abstract
const WETH_ADDRESS = '0x3439153EB7AF838Ad19d56E1571FBD09333C2809' as `0x${string}` // WETH (AbsETH) on Abstract
const V2_PAIR_ADDRESS = '0x26E7f241Fc81Bb168F9f81401184CDe74dcC8f31' as `0x${string}` // V2 Pair for price data
const V3_PAIR_ADDRESS = '0x1176Bf6483763c9fc74F80a575497e17cAe9ca18' as `0x${string}` // V3 Pair for swaps
const V2_ROUTER_ADDRESS = '0xad1eCa41E6F772bE3cb5A48A6141f9bcc1AF9F7c' as `0x${string}` // UniswapV2Router02 on Abstract
const V3_ROUTER_ADDRESS = '0x7712FA47387542819d4E35A23f8116C90C18767C' as `0x${string}` // SwapRouter02 on Abstract

// Define available tokens with network info
const TOKENS = [
  {
    symbol: 'ETH',
    name: 'Abstract ETH',
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    decimals: 18,
    chainId: 2741, // Abstract
    isAbstractNative: true
  },
  {
    symbol: 'ETH',
    name: 'Ethereum ETH',
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    decimals: 18,
    chainId: 1, // Ethereum Mainnet
    isAbstractNative: false
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    address: '0x0000000000000000000000000000000000000000', // Native AVAX
    decimals: 18,
    chainId: 43114, // Avalanche C-Chain - CONFIRMED SUPPORTED
    isAbstractNative: false
  }
]

// DeBridge configuration
const DEBRIDGE_API_URL = 'https://dln.debridge.finance/v1.0'

// Uniswap V2 Pair ABI (minimal)
const uniswapV2PairAbi = [
  {
    constant: true,
    inputs: [],
    name: 'getReserves',
    outputs: [
      { name: '_reserve0', type: 'uint112' },
      { name: '_reserve1', type: 'uint112' },
      { name: '_blockTimestampLast', type: 'uint32' }
    ],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'token0',
    outputs: [{ name: '', type: 'address' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'token1',
    outputs: [{ name: '', type: 'address' }],
    type: 'function'
  }
] as const

// Uniswap V2 Router ABI (minimal)
const uniswapV2RouterAbi = [
  {
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactETHForTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'payable',
    type: 'function'
  },
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

// Uniswap V3 Router ABI (minimal)  
const uniswapV3RouterAbi = [
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' }
        ],
        name: 'params',
        type: 'tuple'
      }
    ],
    name: 'exactInputSingle',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  }
] as const

export const TradingInterface = () => {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  
  // State for selected token, swap amount and estimated RETSBA output
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]) // Default to ETH
  const [swapAmount, setSwapAmount] = useState('')
  const [estimatedRetsba, setEstimatedRetsba] = useState('')
  const [currentPrice, setCurrentPrice] = useState<number>(0) // Price of RETSBA in WETH
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)
  
  // Track swap transaction hash for waiting
  const [swapTxHash, setSwapTxHash] = useState<string | undefined>()
  
  // Contract interactions
  const { writeContract, data: writeData, isPending } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        setSwapTxHash(hash)
        toast({
          title: "Transaction Submitted",
          description: "Please wait for confirmation...",
        })
      },
      onError: (error) => {
        console.error('Transaction error:', error)
        toast({
          title: "Transaction Failed",
          description: error.message || "There was an error processing your swap",
          variant: "destructive"
        })
      }
    }
  })

  // Send raw transaction (for bridge)
  const { sendTransaction, data: sendTxData, isPending: isSendPending } = useSendTransaction({
    mutation: {
      onSuccess: (hash) => {
        setSwapTxHash(hash)
        toast({
          title: "Bridge Transaction Submitted",
          description: "Please wait for confirmation...",
        })
      },
      onError: (error) => {
        console.error('Bridge transaction error:', error)
        toast({
          title: "Bridge Transaction Failed",
          description: error.message || "There was an error with the bridge transaction",
          variant: "destructive"
        })
      }
    }
  })
  
  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: swapTxHash as `0x${string}`,
  })
  
  // Get native ETH balance on Abstract (current chain) with refetch capability
  const { data: abstractEthBalance, refetch: refetchAbstractEthBalance } = useBalance({
    address: address,
    chainId: 2741, // Abstract chain
  })
  
  // For cross-chain balances, we'll need to use RPC calls directly
  const [mainnetEthBalance, setMainnetEthBalance] = useState<{ value: bigint; decimals: number; formatted: string; symbol: string } | null>(null)
  const [avaxBalance, setAvaxBalance] = useState<{ value: bigint; decimals: number; formatted: string; symbol: string } | null>(null)
  
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
  
  // Get WETH balance for swapping with refetch capability
  const { data: wethBalance, refetch: refetchWethBalance } = useReadContract({
    address: WETH_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Get RETSBA token balance with refetch capability
  const { data: retsbaBalance, error: retsbaError, isLoading: retsbaLoading, refetch: refetchRetsbaBalance } = useReadContract({
    address: RETSBA_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Get RETSBA token decimals
  const { data: retsbaDecimals, error: retsbaDecimalsError } = useReadContract({
    address: RETSBA_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'decimals',
  })

  // Check if RETSBA contract exists by trying to get total supply
  const { data: retsbaTotalSupply, error: retsbaTotalSupplyError } = useReadContract({
    address: RETSBA_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'totalSupply',
  })

  // Try to get the token name to verify it's an ERC20
  const { data: retsbaName, error: retsbaNameError } = useReadContract({
    address: RETSBA_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'name',
  })

  // Get V2 pair reserves for price calculation
  const { data: pairReserves, error: pairReservesError } = useReadContract({
    address: V2_PAIR_ADDRESS,
    abi: uniswapV2PairAbi,
    functionName: 'getReserves',
  })

  // Get token order in the pair
  const { data: token0 } = useReadContract({
    address: V2_PAIR_ADDRESS,
    abi: uniswapV2PairAbi,
    functionName: 'token0',
  })

  const { data: token1 } = useReadContract({
    address: V2_PAIR_ADDRESS,
    abi: uniswapV2PairAbi,
    functionName: 'token1',
  })

  // Calculate current RETSBA price from V2 pair reserves
  useEffect(() => {
    if (pairReserves && token0 && token1) {
      setIsLoadingPrice(true)
      try {
        // Type assertion for the reserves array
        const reserves = pairReserves as [bigint, bigint, number]
        const [reserve0, reserve1] = reserves
        
        // Type assertion for token addresses
        const token0Address = token0 as string
        const token1Address = token1 as string
        
        // Determine which token is RETSBA and which is WETH
        const isRetsbaToken0 = token0Address.toLowerCase() === RETSBA_TOKEN_ADDRESS.toLowerCase()
        const retsbaReserve = isRetsbaToken0 ? reserve0 : reserve1
        const wethReserve = isRetsbaToken0 ? reserve1 : reserve0
        
        // Calculate price: RETSBA price in WETH = wethReserve / retsbaReserve
        const price = Number(formatEther(wethReserve)) / Number(formatEther(retsbaReserve))
        setCurrentPrice(price)
        
        console.log('=== PRICE CALCULATION ===')
        console.log('Token0:', token0Address)
        console.log('Token1:', token1Address)
        console.log('RETSBA Reserve:', formatEther(retsbaReserve))
        console.log('WETH Reserve:', formatEther(wethReserve))
        console.log('RETSBA Price in WETH:', price)
        console.log('========================')
      } catch (error) {
        console.error('Error calculating price:', error)
      } finally {
        setIsLoadingPrice(false)
      }
    }
  }, [pairReserves, token0, token1])

  // Helper function to get the current balance for the selected token
  const getCurrentTokenBalance = () => {
    switch (selectedToken.chainId) {
      case 2741: // Abstract
        return abstractEthBalance
      case 1: // Ethereum mainnet
        return mainnetEthBalance
      case 43114: // Avalanche
        return avaxBalance
      default:
        return null
    }
  }

  // Debug logging
  useEffect(() => {
    console.log('=== BALANCE DEBUG INFO ===')
    console.log('Connected Address:', address)
    console.log('Abstract ETH Balance:', abstractEthBalance)
    console.log('Mainnet ETH Balance:', mainnetEthBalance)
    console.log('AVAX Balance:', avaxBalance)
    console.log('WETH Balance:', wethBalance)
    console.log('RETSBA Contract:', RETSBA_TOKEN_ADDRESS)
    console.log('RETSBA Balance:', retsbaBalance)
    console.log('RETSBA Balance Error:', retsbaError)
    console.log('RETSBA Loading:', retsbaLoading)
    console.log('RETSBA Decimals:', retsbaDecimals)
    console.log('RETSBA Decimals Error:', retsbaDecimalsError)
    console.log('RETSBA Total Supply:', retsbaTotalSupply)
    console.log('RETSBA Total Supply Error:', retsbaTotalSupplyError)
    console.log('RETSBA Name:', retsbaName)
    console.log('RETSBA Name Error:', retsbaNameError)
    console.log('Current Price:', currentPrice)
    console.log('========================')
  }, [address, abstractEthBalance, mainnetEthBalance, avaxBalance, wethBalance, retsbaBalance, retsbaError, retsbaLoading, retsbaDecimals, retsbaDecimalsError, retsbaTotalSupply, retsbaTotalSupplyError, retsbaName, retsbaNameError, currentPrice])

  // Calculate estimated RETSBA output when swap amount changes
  useEffect(() => {
    if (swapAmount && !isNaN(parseFloat(swapAmount)) && currentPrice > 0) {
      const wethAmount = parseFloat(swapAmount)
      // Calculate RETSBA output: WETH amount / RETSBA price in WETH
      const retsbaOutput = wethAmount / currentPrice
      // Apply 0.5% slippage tolerance
      const slippageAdjusted = retsbaOutput * 0.995
      setEstimatedRetsba(slippageAdjusted.toFixed(4))
    } else {
      setEstimatedRetsba('')
    }
  }, [swapAmount, currentPrice])
  
  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && swapTxHash) {
      toast({
        title: "Swap Successful!",
        description: "Your RETSBA balance has been updated.",
      })
      
      // Refresh all balances after successful swap
      refetchAbstractEthBalance()
      // Re-fetch cross-chain balances
      if (address) {
        fetchCrossChainBalance(1, 'https://eth.llamarpc.com').then(setMainnetEthBalance)
        fetchCrossChainBalance(43114, 'https://api.avax.network/ext/bc/C/rpc').then(setAvaxBalance)
      }
      refetchWethBalance()
      refetchRetsbaBalance()
      
      // Clear swap amount and transaction hash
      setSwapAmount('')
      setSwapTxHash(undefined)
    }
  }, [isConfirmed, swapTxHash, toast, refetchAbstractEthBalance, refetchWethBalance, refetchRetsbaBalance, address, fetchCrossChainBalance])

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

  // Cross-chain bridge handler
  const handleCrossChainSwap = async () => {
    if (!selectedToken.isAbstractNative) {
      toast({
        title: "Cross-Chain Bridge",
        description: `Step 1: Bridging ${selectedToken.symbol} to WETH on Abstract`,
      })
      
      try {
        // Step 1: Get Relay Bridge quote to bridge to WETH on Abstract
        const bridgeQuote = await getRelayQuote()
        
        toast({
          title: "Bridge Quote Received",
          description: `Will receive ${bridgeQuote.details.currencyOut.amountFormatted} WETH on Abstract`,
        })
        
        // Step 2: Execute the bridge transaction
        if (bridgeQuote.steps && bridgeQuote.steps.length > 0) {
          const step = bridgeQuote.steps[0]
          if (step.items && step.items.length > 0) {
            const txData = step.items[0].data
            
            // Execute the bridge transaction using wagmi's sendTransaction for raw data
            sendTransaction({
              to: txData.to as `0x${string}`,
              value: BigInt(txData.value || '0'),
              data: txData.data as `0x${string}`,
              gas: BigInt(txData.gasLimit || '300000'),
              maxFeePerGas: BigInt(txData.maxFeePerGas || '0'),
              maxPriorityFeePerGas: BigInt(txData.maxPriorityFeePerGas || '0'),
            })
            
            toast({
              title: "Bridge Transaction Sent",
              description: "Step 1: Bridging to WETH on Abstract. After confirmation, switch to Abstract network and swap WETH to RETSBA.",
            })
          }
        }
        
      } catch (error: any) {
        console.error('Cross-chain bridge error:', error)
        toast({
          title: "Bridge Failed",
          description: error.message || "There was an error with the cross-chain bridge",
          variant: "destructive"
        })
      }
    }
  }

  // Relay Bridge helper function
  const getRelayQuote = async () => {
    if (!address || !swapAmount) {
      throw new Error('Missing required parameters')
    }

    // Ensure minimum amount (0.01 ETH minimum)
    const amount = parseEther(swapAmount);
    if (amount < parseEther('0.01')) {
      throw new Error('Minimum bridge amount is 0.01 ETH')
    }

    const requestBody = {
      user: address,
      recipient: address,
      originChainId: selectedToken.chainId,
      destinationChainId: 2741, // Abstract
      originCurrency: selectedToken.address, // ETH = 0x0000000000000000000000000000000000000000
      destinationCurrency: WETH_ADDRESS, // WETH on Abstract
      amount: amount.toString(),
      tradeType: "EXACT_INPUT"
    }

    console.log('Relay request body:', JSON.stringify(requestBody, null, 2))

    const response = await fetch('https://api.relay.link/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })
    
    console.log('Relay response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('Relay error response:', errorText)
      throw new Error(`Relay API error: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    console.log('Relay quote result:', result)
    return result
  }

  // New function to swap WETH to RETSBA after cross-chain bridge
  const swapWethToRetsba = async (wethAmount: string) => {
    if (!address || !currentPrice) {
      throw new Error('Missing required parameters for WETH swap')
    }

    try {
      const deadline = Math.floor(Date.now() / 1000) + 600 // 10 minutes from now
      
      // Calculate expected RETSBA output for WETH input
      const wethAmountBigInt = parseEther(wethAmount)
      const expectedRetsba = (Number(wethAmount) * currentPrice * 0.995).toFixed(6) // 0.5% slippage
      const amountOutMin = parseEther(expectedRetsba)

      toast({
        title: "Swapping WETH to RETSBA", 
        description: `Converting ${wethAmount} WETH to ${expectedRetsba} RETSBA`,
      })

      // First approve WETH spending if needed
      // Note: This would need to be implemented with proper WETH approval logic
      
      // Swap WETH for RETSBA using V2 router
      // This would use swapExactTokensForTokens instead of swapExactETHForTokens
      writeContract({
        address: V2_ROUTER_ADDRESS,
        abi: uniswapV2RouterAbi,
        functionName: 'swapExactTokensForTokens',
        args: [
          wethAmountBigInt,
          amountOutMin,
          [WETH_ADDRESS, RETSBA_TOKEN_ADDRESS], // Path: WETH -> RETSBA
          address,
          BigInt(deadline)
        ],
      } as any)

    } catch (error: any) {
      console.error('WETH to RETSBA swap error:', error)
      toast({
        title: "WETH Swap Failed",
        description: error.message || "There was an error swapping WETH to RETSBA",
        variant: "destructive"
      })
    }
  }

  const handleSwap = async () => {
    if (!swapAmount || !address || !currentPrice) {
      toast({
        title: "Error",
        description: "Please enter an amount, connect your wallet, and wait for price data",
        variant: "destructive"
      })
      return
    }

    // Check if this is a cross-chain swap
    if (!selectedToken.isAbstractNative) {
      return handleCrossChainSwap()
    }

    // For Abstract native tokens (ETH), continue with existing swap logic
    const currentBalance = getCurrentTokenBalance()
    if (!currentBalance || Number(formatEther(currentBalance.value)) < parseFloat(swapAmount)) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${selectedToken.symbol} for this swap.`,
        variant: "destructive"
      })
      return
    }

    try {
      const deadline = Math.floor(Date.now() / 1000) + 600 // 10 minutes from now
      const amountOutMin = parseEther(estimatedRetsba) // Using our calculated estimate with slippage
      const amountIn = parseEther(swapAmount)

      toast({
        title: "Swap Initiated", 
        description: `Swapping ${swapAmount} ETH for ${estimatedRetsba} RETSBA`,
      })

      // Submit the swap transaction
      writeContract({
        address: V2_ROUTER_ADDRESS,
        abi: uniswapV2RouterAbi,
        functionName: 'swapExactETHForTokens',
        args: [
          amountOutMin,
          [WETH_ADDRESS, RETSBA_TOKEN_ADDRESS], // Path: ETH -> WETH -> RETSBA
          address,
          BigInt(deadline)
        ],
        value: amountIn,
      } as any)

      
    } catch (error: any) {
      console.error('Swap error:', error)
      toast({
        title: "Swap Failed",
        description: error.message || "There was an error processing your swap",
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
        <CardTitle className="text-center text-black">Buy RETSBA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Selection Balance */}
        <div className="p-4 border rounded-lg bg-white">
          <Label className="text-sm font-medium text-muted-foreground">Token Balance</Label>
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
                {TOKENS.map((token) => (
                  <DropdownMenuItem 
                    key={token.symbol}
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

        {/* RETSBA Balance */}
        <div className="p-4 border rounded-lg bg-white">
          <Label className="text-sm font-medium text-muted-foreground">RETSBA Balance</Label>
          {retsbaLoading ? (
            <p className="text-lg font-semibold text-black">Loading...</p>
          ) : retsbaError ? (
            <div>
              <p className="text-lg font-semibold text-destructive">Contract Error</p>
              <p className="text-xs text-destructive mt-1">
                {retsbaError.message?.includes('not a contract') 
                  ? 'Contract does not exist on this network'
                  : 'Error calling balanceOf function'
                }
              </p>
              {retsbaName ? (
                <p className="text-xs text-muted-foreground mt-1">Token: {retsbaName}</p>
              ) : (
                <p className="text-xs text-destructive mt-1">
                  Contract verification failed - may not be ERC20
                </p>
              )}
            </div>
          ) : (
            <p className="text-lg font-semibold text-black">
              {retsbaBalance && retsbaDecimals 
                ? `${parseFloat(formatEther(retsbaBalance)).toFixed(4)} RETSBA`
                : '0 RETSBA'
              }
            </p>
          )}
        </div>


        {/* Swap Interface */}
        <div className="space-y-3">
          <div className="p-4 border rounded-lg bg-white">
            <Label htmlFor="swap-amount" className="text-sm font-medium">
              Amount of {selectedToken.symbol} to corrupt
            </Label>
            <Input
              id="swap-amount"
              type="number"
              placeholder="0.0"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              className="mt-1 text-black placeholder:text-gray-400 bg-white"
              step="0.001"
              min="0"
            />
          </div>

          {/* Estimated RETSBA Output */}
          {swapAmount && estimatedRetsba && currentPrice > 0 && (
            <div className="p-3 border rounded-lg bg-accent/50">
              <Label className="text-sm font-medium text-muted-foreground">
                You will receive (estimated)
              </Label>
              <p className="text-lg font-semibold text-black">
                {estimatedRetsba} RETSBA
              </p>
              <p className="text-xs text-muted-foreground">
                Rate: 1 ETH = {(1 / currentPrice).toFixed(2)} RETSBA (0.5% slippage applied)
              </p>
            </div>
          )}

          {/* Loading state for price */}
          {(isLoadingPrice || currentPrice === 0) && swapAmount && (
            <div className="p-3 border rounded-lg bg-muted/50">
              <Label className="text-sm font-medium text-muted-foreground">
                Loading price data...
              </Label>
            </div>
          )}

          <Button 
            onClick={handleSwap}
            disabled={isPending || isConfirming || !swapAmount || currentPrice === 0 || isLoadingPrice}
            className="w-full text-white" style={{ backgroundColor: '#FF0000' }}
          >
            {isPending ? 'Submitting...' : 
             isConfirming ? 'Confirming...' :
             currentPrice === 0 ? 'Loading Price...' : 
             'Become the Villain'}
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}