import { useAccount } from 'wagmi';

// The Abstract Global Wallet connector reports this exact id (see
// @abstract-foundation/agw-react abstractWalletConnector).
const AGW_CONNECTOR_ID = 'xyz.abs.privy';

/**
 * Hook to check if the current wallet connection is from Abstract Global Wallet (AGW).
 * Detect by the active connector id — NOT useAbstractClient(), which returns a client
 * for any wallet on Abstract and so falsely reports EVM wallets as AGW.
 * @returns boolean indicating if connected wallet is AGW
 */
export const useIsAGWConnected = (): boolean => {
  const { connector, isConnected } = useAccount();
  return isConnected && connector?.id === AGW_CONNECTOR_ID;
};

/**
 * Utility function to validate that only AGW users can create accounts
 * @param isAGW - boolean indicating if user is connected with AGW
 * @returns validation result with error message if invalid
 */
export const validateAGWForAccountCreation = (isAGW: boolean) => {
  if (!isAGW) {
    return {
      isValid: false,
      errorMessage: "You must be using an Abstract Global Wallet (AGW) to create an account."
    };
  }
  
  return {
    isValid: true,
    errorMessage: null
  };
};