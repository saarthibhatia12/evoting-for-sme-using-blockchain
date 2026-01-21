// =============================================================================
// SHAREHOLDER SERVICE - Task 4.6
// Handles shareholder registration, share management, and retrieval
// =============================================================================

import api from './api';

// Share object from backend (matches Prisma Share model)
export interface ShareRecord {
  id: number;
  shareholderId: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
}

// Types matching backend responses
export interface Shareholder {
  id: number;
  walletAddress: string;
  name: string;
  email: string;
  shares: ShareRecord | null;  // Backend returns Share object, not a number
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper function to get the actual share count from a Shareholder
export const getShareCount = (shareholder: Shareholder): number => {
  if (shareholder.shares === null || shareholder.shares === undefined) {
    return 0;
  }
  // Handle both cases: shares as object or shares as number (for backward compatibility)
  if (typeof shareholder.shares === 'number') {
    return shareholder.shares;
  }
  return shareholder.shares.shares || 0;
};

export interface ShareholdersResponse {
  success: boolean;
  data: {
    shareholders: Shareholder[];
    count: number;
  };
}

export interface ShareholderResponse {
  success: boolean;
  data: Shareholder;
}

export interface RegisterShareholderRequest {
  walletAddress: string;
  name: string;
  email: string;
  shares: number;
  isAdmin?: boolean;
}

export interface RegisterShareholderResponse {
  success: boolean;
  data: {
    shareholder: Shareholder;
    blockchainTx: string;
  };
  message: string;
}

export interface UpdateSharesResponse {
  success: boolean;
  data: Shareholder;
  message: string;
}

export interface TotalSharesResponse {
  success: boolean;
  data: {
    totalShares: number;
  };
}

// Get all shareholders (Admin only)
export const getAllShareholders = async (includeInactive: boolean = false): Promise<ShareholdersResponse> => {
  const response = await api.get(`/shareholders?includeInactive=${includeInactive}`);
  return response.data;
};

// Get shareholder by wallet address
export const getShareholderByAddress = async (walletAddress: string): Promise<ShareholderResponse> => {
  const response = await api.get(`/shareholders/${walletAddress}`);
  return response.data;
};

// Register a new shareholder (Admin only)
export const registerShareholder = async (data: RegisterShareholderRequest): Promise<RegisterShareholderResponse> => {
  const response = await api.post('/shareholders/register', data);
  return response.data;
};

// Update shareholder shares (Admin only)
export const updateShares = async (walletAddress: string, shares: number): Promise<UpdateSharesResponse> => {
  const response = await api.put(`/shareholders/${walletAddress}/shares`, { shares });
  return response.data;
};

// Deactivate a shareholder (Admin only)
export const deactivateShareholder = async (walletAddress: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/shareholders/${walletAddress}`);
  return response.data;
};

// Get total shares count
export const getTotalShares = async (): Promise<TotalSharesResponse> => {
  const response = await api.get('/shareholders/stats/total-shares');
  return response.data;
};

export default {
  getAllShareholders,
  getShareholderByAddress,
  registerShareholder,
  updateShares,
  deactivateShareholder,
  getTotalShares,
};
