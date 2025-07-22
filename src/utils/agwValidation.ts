import { useAbstractClient } from '@abstract-foundation/agw-react';

/**
 * Hook to check if the current wallet connection is from Abstract Global Wallet (AGW)
 * @returns boolean indicating if connected wallet is AGW
 */
export const useIsAGWConnected = (): boolean => {
  const { data: abstractClient } = useAbstractClient();
  
  // If we have an Abstract client, then we're connected via AGW
  return !!abstractClient;
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