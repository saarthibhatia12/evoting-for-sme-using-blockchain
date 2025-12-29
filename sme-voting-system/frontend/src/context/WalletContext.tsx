import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import '../types/global.d.ts';

// Expected chain ID for the application (e.g., Hardhat local = 31337, Sepolia = 11155111)
const EXPECTED_CHAIN_ID = import.meta.env.VITE_CHAIN_ID || '31337';

interface WalletContextType {
  account: string | null;
  chainId: string | null;
  isConnecting: boolean;
  isMetaMaskInstalled: boolean;
  isCorrectNetwork: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if on correct network
  const isCorrectNetwork = chainId === EXPECTED_CHAIN_ID || chainId === `0x${parseInt(EXPECTED_CHAIN_ID).toString(16)}`;

  // Check if MetaMask is installed
  useEffect(() => {
    const checkMetaMask = () => {
      const installed = typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
      setIsMetaMaskInstalled(installed);
      return installed;
    };
    checkMetaMask();
  }, []);

  // Handle account changes - triggers when user switches account in MetaMask
  const handleAccountsChanged = useCallback((accounts: unknown) => {
    const accountsArray = accounts as string[];
    if (accountsArray.length === 0) {
      // User disconnected their wallet in MetaMask
      setAccount(null);
      setError('Wallet disconnected');
    } else {
      const newAccount = accountsArray[0].toLowerCase();
      // If account changed, update it and clear error
      // Note: Auth context will handle logout when account changes
      setAccount(newAccount);
      setError(null);
      console.log('Account switched to:', newAccount);
    }
  }, []);

  // Handle chain/network changes
  const handleChainChanged = useCallback((newChainId: unknown) => {
    const chainIdStr = newChainId as string;
    setChainId(chainIdStr);
    // Reload page on chain change as recommended by MetaMask
    // window.location.reload();
  }, []);

  // Get current chain ID
  const getChainId = async (): Promise<string | null> => {
    if (!window.ethereum) return null;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      return chainId;
    } catch {
      return null;
    }
  };

  // Don't auto-reconnect - force user to connect manually each time
  useEffect(() => {
    const setupListeners = async () => {
      if (window.ethereum) {
        // Check current chain only
        const currentChainId = await getChainId();
        if (currentChainId) {
          setChainId(currentChainId);
        }

        // DO NOT auto-connect - user must click "Connect Wallet" button
        // This ensures MetaMask popup with account selector appears
      }
    };

    setupListeners();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged]);

  const connectWallet = async (): Promise<void> => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to use this application.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Important: eth_requestAccounts will show account selector only if:
      // 1. First time connecting to this site, OR
      // 2. User manually revoked permissions
      // If MetaMask already has permission, it will auto-select the default account
      // User must manually switch accounts in MetaMask extension to use different account
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length > 0) {
        const selectedAccount = accounts[0].toLowerCase();
        setAccount(selectedAccount);
        
        console.log('✅ Connected to account:', selectedAccount);
        console.log('💡 To use a different account, switch it in MetaMask extension and reconnect');
        
        // Get and set chain ID
        const currentChainId = await getChainId();
        if (currentChainId) {
          setChainId(currentChainId);
        }
      }
    } catch (err) {
      const error = err as { code?: number; message?: string };
      if (error.code === 4001) {
        // User rejected the request
        setError('Connection request was rejected. Please approve the connection in MetaMask.');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
      console.error('Failed to connect wallet:', err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = (): void => {
    setAccount(null);
    setChainId(null);
    setError(null);
    // Note: MetaMask doesn't have a programmatic disconnect
    // We just clear the local state
  };

  const switchNetwork = async (): Promise<void> => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return;
    }

    const chainIdHex = `0x${parseInt(EXPECTED_CHAIN_ID).toString(16)}`;

    try {
      // Try to switch to the expected network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (err) {
      const error = err as { code?: number };
      // Error code 4902 means the chain hasn't been added to MetaMask
      if (error.code === 4902) {
        try {
          // Add the Hardhat local network to MetaMask
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: 'Hardhat Local',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['http://127.0.0.1:8545'],
                blockExplorerUrls: null,
              },
            ],
          });
          setError(null);
        } catch (addError) {
          console.error('Failed to add network:', addError);
          setError('Failed to add Hardhat network. Please add it manually in MetaMask.');
        }
      } else {
        setError('Failed to switch network. Please try manually in MetaMask.');
      }
      console.error('Failed to switch network:', err);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: WalletContextType = {
    account,
    chainId,
    isConnecting,
    isMetaMaskInstalled,
    isCorrectNetwork,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    clearError,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export default WalletContext;
