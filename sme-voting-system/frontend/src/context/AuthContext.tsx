import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ethers } from 'ethers';
import { authService, User } from '../services';
import { useWallet } from './WalletContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  login: () => Promise<void>;
  logout: () => void;
  clearAuthError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const { account } = useWallet();

  // Fetch user info from backend
  const fetchUserInfo = useCallback(async (): Promise<User | null> => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success) {
        return authService.parseUser(response.data);
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      return null;
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async (): Promise<void> => {
    const storedToken = authService.getToken();
    if (storedToken) {
      const userInfo = await fetchUserInfo();
      if (userInfo) {
        setUser(userInfo);
      }
    }
  }, [fetchUserInfo]);

  // Clear any existing auth on mount - force fresh authentication
  useEffect(() => {
    // Always clear auth state on app load/refresh
    authService.removeToken();
    setToken(null);
    setUser(null);
    setAuthError(null);
    setIsLoading(false);
  }, []);

  // Clear auth when wallet disconnects OR when account changes
  useEffect(() => {
    if (!account && token) {
      // Wallet disconnected - clear auth
      authService.removeToken();
      setToken(null);
      setUser(null);
      setAuthError(null);
    } else if (account && user && account.toLowerCase() !== user.walletAddress.toLowerCase()) {
      // Account switched - force logout
      console.log('Account switched, logging out...');
      authService.removeToken();
      setToken(null);
      setUser(null);
      setAuthError('Account changed. Please sign in again.');
    }
  }, [account, token, user]); // Watch account, token, and user

  const login = async (): Promise<void> => {
    if (!account) {
      setAuthError('Please connect your wallet first');
      return;
    }

    if (!window.ethereum) {
      setAuthError('MetaMask is not installed');
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Step 1: Request nonce from backend
      const nonceResponse = await authService.requestNonce(account);
      
      if (!nonceResponse.success) {
        throw new Error('Failed to get authentication nonce');
      }

      const { message } = nonceResponse.data;

      // Step 2: Sign the message with MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // Step 3: Verify signature with backend
      const verifyResponse = await authService.verifySignature(account, signature);
      
      if (!verifyResponse.success) {
        throw new Error('Signature verification failed');
      }

      // Step 4: Store token and fetch user info
      const { token: jwtToken } = verifyResponse.data;
      authService.setToken(jwtToken);
      setToken(jwtToken);

      // Step 5: Fetch user details
      const userInfo = await fetchUserInfo();
      if (userInfo) {
        setUser(userInfo);
      }

    } catch (error) {
      console.error('Login failed:', error);
      const err = error as { code?: number; message?: string };
      
      if (err.code === 4001) {
        setAuthError('You rejected the signature request');
      } else if (err.message?.includes('not registered')) {
        setAuthError('Your wallet is not registered as a shareholder. Please contact the admin.');
      } else {
        setAuthError(err.message || 'Authentication failed. Please try again.');
      }
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = (): void => {
    authService.removeToken();
    setToken(null);
    setUser(null);
    setAuthError(null);
  };

  const clearAuthError = (): void => {
    setAuthError(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    isAuthenticating,
    authError,
    login,
    logout,
    clearAuthError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
