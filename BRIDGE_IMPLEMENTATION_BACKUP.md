# RETSBA Bridge Implementation Documentation

## Overview
This document provides a complete backup of the bridge functionality before removal. This implementation allows users to bridge tokens from various chains to Abstract Network and optionally swap them to RETSBA tokens.

## Architecture

### Main Components

#### 1. UnifiedTradingInterface.tsx
**Purpose**: Main container that toggles between Bridge and Trading interfaces
```typescript
// Key Features:
- Switch toggle: "Need Abstract ETH?" to enable bridge mode
- Shared balance refresh mechanism via callbacks
- Single card container with dynamic content
```

#### 2. BridgeInterface.tsx 
**Purpose**: Complete cross-chain bridging interface

**Supported Source Chains:**
- Ethereum Mainnet (Chain ID: 1)
- Arbitrum (Chain ID: 42161)  
- Optimism (Chain ID: 10)
- Base (Chain ID: 8453)
- BNB Smart Chain (Chain ID: 56)
- Polygon (Chain ID: 137)
- Avalanche C-Chain (Chain ID: 43114)

**Key Features:**
```typescript
// Cross-chain balance fetching via RPC calls
const fetchCrossChainBalance = async (chainId: number, rpcUrl: string) => {
  // Uses eth_getBalance RPC method for each supported chain
}

// Source token dropdown with live balances
const SOURCE_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum ETH', chainId: 1 },
  { symbol: 'ETH', name: 'Arbitrum ETH', chainId: 42161 },
  // ... other chains
]

// Bridge execution via Relay Protocol
const handleBridge = async () => {
  await bridgeAndSwap.executeBridgeOnly(selectedToken.chainId, bridgeAmount)
}
```

#### 3. useBridgeAndSwap.tsx Hook
**Purpose**: Core bridging and swapping logic using Relay Protocol

**Key Constants:**
```typescript
const WETH_ADDRESS = '0x3439153EB7AF838Ad19d56E1571FBD09333C2809' // Abstract WETH
const RETSBA_TOKEN_ADDRESS = '0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A' // RETSBA Token
const V2_ROUTER_ADDRESS = '0xad1eCa41E6F772bE3cb5A48A6141f9bcc1AF9F7c' // Uniswap V2 Router
```

**Bridge Process Flow:**
1. **Quote Request**: Get Relay Protocol quote for cross-chain bridge
2. **Bridge Execution**: Execute bridge transaction using Relay's transaction data
3. **WETH Detection**: Poll for WETH balance on Abstract to confirm bridge completion
4. **Auto-Approval**: Approve WETH for Uniswap V2 router (if in bridge+swap mode)
5. **Auto-Swap**: Execute WETH to RETSBA swap (if in bridge+swap mode)

**Relay Protocol Integration:**
```typescript
const getRelayQuote = async (fromChainId: number, amount: string) => {
  const requestBody = {
    user: address,
    originChainId: fromChainId,
    destinationChainId: 2741, // Abstract
    originCurrency: '0x0000000000000000000000000000000000000000', // ETH
    destinationCurrency: '0x0000000000000000000000000000000000000000', // ETH on Abstract
    amount: parseEther(amount).toString(),
    tradeType: 'EXACT_INPUT'
  }
  
  const response = await fetch('https://api.relay.link/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  })
}
```

**WETH Balance Polling:**
```typescript
// Polls WETH balance every 3 seconds to detect bridge completion
useEffect(() => {
  if (currentStep === 'bridging' && bridgeTxHash) {
    const pollInterval = setInterval(async () => {
      const result = await refetchWethBalance()
      if (balance && balance > 0n) {
        // Bridge completed, proceed to approval/swap
        clearInterval(pollInterval)
        setCurrentStep('bridge-confirmed')
        approveWethForSwap()
      }
    }, 3000)
    
    // 5-minute timeout
    setTimeout(() => clearInterval(pollInterval), 300000)
  }
}, [currentStep, bridgeTxHash])
```

#### 4. BridgeStatus.tsx
**Purpose**: Real-time status display during bridge operations
```typescript
// Shows current step: bridging -> approving -> swapping -> complete
// Displays transaction hashes for verification
// Progress indicators for user feedback
```

### Integration Points

#### TradingInterface.tsx Updates
- Modified to support both Abstract native swaps and cross-chain bridge+swap
- Maintains existing Abstract ETH to RETSBA swapping functionality
- Added bridge+swap flow for non-Abstract tokens

#### Key State Management
```typescript
// Bridge tracking states
const [isProcessing, setIsProcessing] = useState(false)
const [bridgeTxHash, setBridgeTxHash] = useState<string>()
const [swapTxHash, setSwapTxHash] = useState<string>()
const [currentStep, setCurrentStep] = useState<'idle' | 'bridging' | 'bridge-confirmed' | 'approving' | 'swapping' | 'complete'>('idle')
```

### RPC Endpoints Used
```typescript
const RPC_URLS = {
  1: 'https://eth.llamarpc.com',           // Ethereum
  42161: 'https://arb1.arbitrum.io/rpc',   // Arbitrum
  10: 'https://mainnet.optimism.io',       // Optimism
  8453: 'https://mainnet.base.org',        // Base
  56: 'https://bsc-dataseed.binance.org/', // BSC
  137: 'https://polygon-rpc.com/',         // Polygon
  43114: 'https://api.avax.network/ext/bc/C/rpc' // Avalanche
}
```

## User Experience Flow

### Bridge-Only Mode
1. User selects source chain and token
2. User enters bridge amount
3. System fetches live balance from source chain
4. User clicks "Bridge [TOKEN] to Abstract"
5. Relay Protocol quote retrieved
6. Bridge transaction submitted to source chain
7. System polls for WETH on Abstract
8. Bridge completion confirmed
9. User receives Abstract ETH/WETH

### Bridge + Swap Mode (via TradingInterface)
1. User selects non-Abstract token from dropdown
2. System detects cross-chain requirement
3. Bridge + swap process automatically triggered
4. Bridge → Auto-approval → Auto-swap to RETSBA
5. User receives RETSBA tokens

## Technical Dependencies

### External APIs
- **Relay Protocol**: `https://api.relay.link/quote` for cross-chain bridging
- **RPC Providers**: Various public RPC endpoints for balance fetching

### Smart Contracts
- **WETH Contract**: `0x3439153EB7AF838Ad19d56E1571FBD09333C2809`
- **RETSBA Token**: `0x52629ddBf28AA01Aa22B994Ec9c80273e4Eb5B0A`
- **Uniswap V2 Router**: `0xad1eCa41E6F772bE3cb5A48A6141f9bcc1AF9F7c`
- **V2 Pair (for pricing)**: `0x26E7f241Fc81Bb168F9f81401184CDe74dcC8f31`

### Wagmi Hooks Used
- `useSendTransaction` - Bridge transaction execution
- `useWriteContract` - WETH approval and swap execution  
- `useReadContract` - Balance and reserves reading
- `useWaitForTransactionReceipt` - Transaction confirmation

## Error Handling

### Bridge Failures
- Relay API errors (quote/execution)
- Insufficient balance validation
- Transaction timeout handling (5-minute limit)
- RPC endpoint failures

### Swap Failures  
- WETH approval failures
- Insufficient WETH balance after bridge
- Slippage protection (5% default)
- Uniswap router errors

## Balance Refresh System
```typescript
// Coordinated balance refresh across components
const handleBalanceRefresh = useCallback(() => {
  setRefreshTrigger(prev => prev + 1);
}, []);

// Triggers refetch in both Bridge and Trading interfaces
useEffect(() => {
  if (refreshTrigger > 0) {
    refetchAbstractEthBalance();
    refetchWethBalance();
    refetchRetsbaBalance();
    // Also refetch cross-chain balances
  }
}, [refreshTrigger]);
```

## Security Considerations

### Cross-Chain Validation
- Balance checks before bridge execution
- Transaction data validation from Relay Protocol
- Slippage protection on swaps
- Deadline enforcement (10-minute max)

### User Protection
- Clear error messages for failed operations
- Transaction hash display for verification
- Balance polling to confirm completion
- Automatic process cleanup on errors

---

**Note**: This implementation was removed on [DATE] to simplify the interface to Abstract ETH → RETSBA swaps only. All functionality documented above was working and can be restored by re-implementing these components and hooks.

## Files That Were Modified/Removed
1. `src/components/UnifiedTradingInterface.tsx` - Toggle functionality removed
2. `src/components/BridgeInterface.tsx` - Entire component removed
3. `src/hooks/useBridgeAndSwap.tsx` - Bridge functions removed, swap functions kept
4. `src/components/BridgeStatus.tsx` - Status component removed
5. `src/components/TradingInterface.tsx` - Cross-chain support removed

## Re-enabling Instructions
To restore bridging functionality:
1. Restore the above files from this documentation
2. Update `UnifiedTradingInterface.tsx` to include bridge toggle
3. Re-add bridge-related imports and state management
4. Test cross-chain balance fetching and Relay Protocol integration
5. Verify WETH polling and auto-swap functionality
