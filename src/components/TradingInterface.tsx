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
import { useLanguage } from '@/contexts/LanguageContext'
// Removed useBridgeAndSwap import - only local swaps now

const RETSBA_TOKEN_ADDRESS = '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A' as `0x${string}` // RETSBA token on Abstract
const WETH_ADDRESS = '0x3439153EB7AF838Ad19d56E1571FBD09333C2809' as `0x${string}` // WETH (AbsETH) on Abstract
const V2_PAIR_ADDRESS = '0x26E7f241Fc81Bb168F9f81401184CDe74dcC8f31' as `0x${string}` // V2 Pair for price data
const V3_PAIR_ADDRESS = '0x1176Bf6483763c9fc74F80a575497e17cAe9ca18' as `0x${string}` // V3 Pair for swaps
const V2_ROUTER_ADDRESS = '0xad1eCa41E6F772bE3cb5A48A6141f9bcc1AF9F7c' as `0x${string}` // UniswapV2Router02 on Abstract
const V3_ROUTER_ADDRESS = '0x7712FA47387542819d4E35A23f8116C90C18767C' as `0x${string}` // SwapRouter02 on Abstract

// Define available tokens - only Abstract ETH for swapping
const TOKENS = [
  {
    symbol: 'ETH',
    name: 'Abstract ETH',
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    decimals: 18,
    chainId: 2741, // Abstract
    isAbstractNative: true
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

export const TradingInterface = ({ onBalanceRefresh, refreshTrigger }: { onBalanceRefresh?: () => void; refreshTrigger?: number }) => {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const { t } = useLanguage()
  
  // State for selected token, swap amount and estimated RETSBA output
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]) // Default to ETH
  const [swapAmount, setSwapAmount] = useState('')
  const [estimatedRetsba, setEstimatedRetsba] = useState('')
  const [currentPrice, setCurrentPrice] = useState<number>(0) // Price of RETSBA in WETH
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)
  
  // Removed bridge functionality - only local swap now
  
  // Contract interactions for Abstract native swaps only
  const { writeContract, data: writeData, isPending } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
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
  
  // Get native ETH balance on Abstract (current chain) with refetch capability
  const { data: abstractEthBalance, refetch: refetchAbstractEthBalance } = useBalance({
    address: address,
    chainId: 2741, // Abstract chain,
  })

  // Since we only show Abstract ETH, we don't need cross-chain balance tracking
  // Remove these state variables as they're not needed for swap-only interface
  
  // Since we only support Abstract ETH for swapping, remove cross-chain balance fetching
  
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

  // Trigger balance refetch when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('🔄 Refreshing trading interface balances...');
      refetchAbstractEthBalance();
      refetchWethBalance();
      refetchRetsbaBalance();
    }
  }, [refreshTrigger, refetchAbstractEthBalance, refetchWethBalance, refetchRetsbaBalance])

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

  // Helper function to get the current balance for the selected token (only Abstract ETH now)
  const getCurrentTokenBalance = () => {
    // Since we only support Abstract ETH, always return Abstract ETH balance
    return abstractEthBalance
  }

  // Debug logging - simplified for Abstract ETH only
  useEffect(() => {
    console.log('=== BALANCE DEBUG INFO ===')
    console.log('Connected Address:', address)
    console.log('Abstract ETH Balance:', abstractEthBalance)
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
  }, [address, abstractEthBalance, wethBalance, retsbaBalance, retsbaError, retsbaLoading, retsbaDecimals, retsbaDecimalsError, retsbaTotalSupply, retsbaTotalSupplyError, retsbaName, retsbaNameError, currentPrice])

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
  
  // Transaction confirmation for Abstract native swaps is handled by the writeContract hook

  // Removed legacy ethereum event listeners - using AGW now

  // Removed bridge monitoring - only local swaps now

  const handleSwap = async () => {
    console.log('🔴 handleSwap called!')
    console.log('Selected Token:', selectedToken)
    console.log('SwapAmount:', swapAmount)
    console.log('Address:', address)
    console.log('IsConnected:', isConnected)
    console.log('Current Price:', currentPrice)
    console.log('Is Abstract Native?:', selectedToken.isAbstractNative)
    
    if (!isConnected || !address) {
      console.log('❌ Wallet not properly connected')
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }
    
    if (!swapAmount || !currentPrice) {
      console.log('❌ Missing required data - stopping')
      toast({
        title: "Error",
        description: "Please enter an amount and wait for price data",
        variant: "destructive"
      })
      return
    }

    // Only support Abstract native ETH swaps now - removed bridge functionality

    console.log('💙 Using Abstract native swap path...')

    // For Abstract native tokens (ETH), continue with existing swap logic
    const currentBalance = getCurrentTokenBalance()
    console.log('Current Balance Object:', currentBalance)
    
    if (!currentBalance) {
      toast({
        title: "Balance Loading",
        description: "Please wait for your balance to load",
        variant: "destructive"
      })
      return
    }
    
    const balanceAmount = Number(formatEther(currentBalance.value))
    const swapAmountNumber = parseFloat(swapAmount)
    
    console.log('Balance Amount:', balanceAmount)
    console.log('Swap Amount:', swapAmountNumber)
    
    if (balanceAmount < swapAmountNumber) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${swapAmountNumber} ${selectedToken.symbol} but only have ${balanceAmount.toFixed(4)} ${selectedToken.symbol}`,
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
          <CardTitle className="text-center">{t('buyRetsbaTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">{t('connectWalletToContinue')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-black">{t('buyRetsbaTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Selection Balance */}
        <div className="p-4 border rounded-lg bg-white">
          <Label className="text-sm font-medium text-muted-foreground">{t('tokenBalance')}</Label>
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
          <Label className="text-sm font-medium text-muted-foreground">{t('retsbaBalance')}</Label>
          {retsbaLoading ? (
            <p className="text-lg font-semibold text-black">{t('loading')}</p>
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
              {t('amountToCorrupt')} ({selectedToken.symbol})
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
                {t('youWillReceive')}
              </Label>
              <p className="text-lg font-semibold text-black">
                {estimatedRetsba} RETSBA
              </p>
              <p className="text-xs text-muted-foreground">
                Rate: 1 ETH = {(1 / currentPrice).toFixed(2)} RETSBA (0.5% {t('slippageApplied')})
              </p>
            </div>
          )}

          {/* Loading state for price */}
          {(isLoadingPrice || currentPrice === 0) && swapAmount && (
            <div className="p-3 border rounded-lg bg-muted/50">
              <Label className="text-sm font-medium text-muted-foreground">
                {t('loadingPriceData')}
              </Label>
            </div>
          )}

          <Button 
            onClick={() => {
              console.log('🔴 BUTTON CLICKED!')
              handleSwap()
            }}
            disabled={isPending || !swapAmount || currentPrice === 0 || isLoadingPrice}
            className="w-full text-white" style={{ backgroundColor: '#FF0000' }}
          >
            {isPending ? t('submitting') : 
             currentPrice === 0 ? t('loadingPrice') : 
             t('becomeTheVillain')}
          </Button>
        </div>

        {/* Removed bridge status - only local swaps now */}

      </CardContent>
    </Card>
  )
}