// =============================================================================
// AUTH SERVICE - Task 4.6
// Handles authentication: nonce request, signature verification, JWT management
// =============================================================================

import api from './api';

// Response types matching backend API
export interface NonceResponse {
  success: boolean;
  data: {
    nonce: string;
    message: string;
  };
}

export interface VerifyResponse {
  success: boolean;
  data: {
    token: string;
    walletAddress: string;
  };
}

export interface MeResponse {
  success: boolean;
  data: {
    walletAddress: string;
    isRegistered: boolean;
    shareholder: {
      id: number;
      walletAddress: string;
      name: string;
      email: string;
      isActive: boolean;
      isAdmin: boolean;
      shares: {
        shares: number;
      } | null;
    } | null;
  };
}

export interface User {
  walletAddress: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  shares: number;
  isRegistered: boolean;
}

// Request a nonce for wallet signature
export const requestNonce = async (walletAddress: string): Promise<NonceResponse> => {
  const response = await api.post('/auth/nonce', { walletAddress });
  return response.data;
};

// Verify signature and get JWT token
export const verifySignature = async (
  walletAddress: string,
  signature: string
): Promise<VerifyResponse> => {
  const response = await api.post('/auth/verify', { walletAddress, signature });
  return response.data;
};

// Get current user info
export const getCurrentUser = async (): Promise<MeResponse> => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Store JWT token
export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// Get JWT token
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Remove JWT token (logout)
export const removeToken = (): void => {
  localStorage.removeItem('token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Parse user from MeResponse
export const parseUser = (data: MeResponse['data']): User => {
  const shareholder = data.shareholder;
  return {
    walletAddress: data.walletAddress,
    name: shareholder?.name || 'Unknown',
    email: shareholder?.email || '',
    isAdmin: shareholder?.isAdmin || false,
    isActive: shareholder?.isActive || false,
    shares: shareholder?.shares?.shares || 0,
    isRegistered: data.isRegistered,
  };
};

export default {
  requestNonce,
  verifySignature,
  getCurrentUser,
  setToken,
  getToken,
  removeToken,
  isAuthenticated,
  parseUser,
};
