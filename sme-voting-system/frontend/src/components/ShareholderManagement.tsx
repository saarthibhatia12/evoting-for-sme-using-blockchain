import React, { useState, useEffect, useCallback } from 'react';
import { shareholderService } from '../services';
import { Shareholder, RegisterShareholderRequest } from '../services/shareholderService';
import { useToast, LoadingSpinner } from './ui';

interface ShareholderManagementProps {
  onRefresh?: () => void;
}

const ShareholderManagement: React.FC<ShareholderManagementProps> = ({ onRefresh }) => {
  const { showToast } = useToast();
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShareholder, setSelectedShareholder] = useState<Shareholder | null>(null);
  const [editShares, setEditShares] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add shareholder form
  const [newShareholder, setNewShareholder] = useState<RegisterShareholderRequest>({
    walletAddress: '',
    name: '',
    email: '',
    shares: 0,
    isAdmin: false,
  });

  const fetchShareholders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await shareholderService.getAllShareholders(true);
      if (response.success) {
        setShareholders(response.data.shareholders);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch shareholders';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchShareholders();
  }, [fetchShareholders]);

  // Validate wallet address
  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Validate email
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle add shareholder
  const handleAddShareholder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!isValidAddress(newShareholder.walletAddress)) {
      showToast('Please enter a valid Ethereum wallet address', 'warning');
      return;
    }
    if (!newShareholder.name.trim() || newShareholder.name.length < 2) {
      showToast('Please enter a valid name (at least 2 characters)', 'warning');
      return;
    }
    if (!isValidEmail(newShareholder.email)) {
      showToast('Please enter a valid email address', 'warning');
      return;
    }
    if (newShareholder.shares < 1) {
      showToast('Shares must be at least 1', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await shareholderService.registerShareholder(newShareholder);
      if (response.success) {
        showToast(`Shareholder ${newShareholder.name} registered successfully!`, 'success');
        setNewShareholder({
          walletAddress: '',
          name: '',
          email: '',
          shares: 0,
          isAdmin: false,
        });
        setShowAddForm(false);
        await fetchShareholders();
        onRefresh?.();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to register shareholder';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update shares
  const handleUpdateShares = async () => {
    if (!selectedShareholder) return;
    
    if (editShares < 0) {
      showToast('Shares cannot be negative', 'warning');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await shareholderService.updateShares(selectedShareholder.walletAddress, editShares);
      if (response.success) {
        showToast(`Shares updated for ${selectedShareholder.name || selectedShareholder.walletAddress.slice(0, 10)}...`, 'success');
        setShowEditModal(false);
        setSelectedShareholder(null);
        await fetchShareholders();
        onRefresh?.();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update shares';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deactivate shareholder
  const handleDeactivate = async (shareholder: Shareholder) => {
    if (!confirm(`Are you sure you want to deactivate ${shareholder.name}? They will no longer be able to vote.`)) {
      return;
    }

    try {
      const response = await shareholderService.deactivateShareholder(shareholder.walletAddress);
      if (response.success) {
        showToast(`Shareholder ${shareholder.name} has been deactivated`, 'success');
        await fetchShareholders();
        onRefresh?.();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to deactivate shareholder';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      console.error(err);
    }
  };

  // Handle copy address
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    showToast('Address copied to clipboard', 'success');
  };

  // Open edit modal
  const openEditModal = (shareholder: Shareholder) => {
    setSelectedShareholder(shareholder);
    setEditShares(shareholder.shares);
    setShowEditModal(true);
    setError(null);
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Calculate total shares
  const totalShares = shareholders.filter(s => s.isActive).reduce((sum, s) => sum + s.shares, 0);
  const activeShareholders = shareholders.filter(s => s.isActive).length;

  if (loading) {
    return (
      <div className="shareholder-management">
        <div className="loading-state">
          <LoadingSpinner size="lg" />
          <p>Loading shareholders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shareholder-management">
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{activeShareholders}</span>
          <span className="stat-label">Active Shareholders</span>
        </div>
        <div className="stat">
          <span className="stat-value">{totalShares.toLocaleString()}</span>
          <span className="stat-label">Total Shares</span>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Shareholder'}
        </button>
      </div>

      {/* Add Shareholder Form */}
      {showAddForm && (
        <div className="add-form card">
          <h3>Register New Shareholder</h3>
          <form onSubmit={handleAddShareholder}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="walletAddress">Wallet Address *</label>
                <input
                  type="text"
                  id="walletAddress"
                  value={newShareholder.walletAddress}
                  onChange={(e) => setNewShareholder(prev => ({ ...prev, walletAddress: e.target.value }))}
                  placeholder="0x..."
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  value={newShareholder.name}
                  onChange={(e) => setNewShareholder(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={newShareholder.email}
                  onChange={(e) => setNewShareholder(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label htmlFor="shares">Shares *</label>
                <input
                  type="number"
                  id="shares"
                  value={newShareholder.shares || ''}
                  onChange={(e) => setNewShareholder(prev => ({ ...prev, shares: parseInt(e.target.value) || 0 }))}
                  placeholder="100"
                  min="1"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="form-checkbox">
              <input
                type="checkbox"
                id="isAdmin"
                checked={newShareholder.isAdmin}
                onChange={(e) => setNewShareholder(prev => ({ ...prev, isAdmin: e.target.checked }))}
                disabled={isSubmitting}
              />
              <label htmlFor="isAdmin">Grant admin privileges</label>
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering...' : '✓ Register Shareholder'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shareholders Table */}
      <div className="shareholders-table-container">
        <table className="shareholders-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Wallet Address</th>
              <th>Email</th>
              <th>Shares</th>
              <th>Status</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shareholders.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No shareholders found. Add your first shareholder above.
                </td>
              </tr>
            ) : (
              shareholders.map((shareholder) => (
                <tr key={shareholder.id} className={!shareholder.isActive ? 'inactive' : ''}>
                  <td className="name-cell">
                    <strong>{shareholder.name}</strong>
                  </td>
                  <td className="address-cell">
                    <code>{formatAddress(shareholder.walletAddress)}</code>
                    <button 
                      className="copy-btn"
                      onClick={() => handleCopyAddress(shareholder.walletAddress)}
                      title="Copy full address"
                    >
                      📋
                    </button>
                  </td>
                  <td>{shareholder.email}</td>
                  <td className="shares-cell">
                    <strong>{shareholder.shares.toLocaleString()}</strong>
                  </td>
                  <td>
                    {shareholder.isActive ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-error">Inactive</span>
                    )}
                  </td>
                  <td>
                    {shareholder.isAdmin ? (
                      <span className="badge badge-info">Admin</span>
                    ) : (
                      <span className="badge badge-default">User</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => openEditModal(shareholder)}
                      title="Edit shares"
                    >
                      ✏️
                    </button>
                    {shareholder.isActive && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeactivate(shareholder)}
                        title="Deactivate"
                      >
                        🚫
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Shares Modal */}
      {showEditModal && selectedShareholder && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Shares</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-info">
                Updating shares for <strong>{selectedShareholder.name}</strong>
                <br />
                <code>{formatAddress(selectedShareholder.walletAddress)}</code>
              </p>
              <div className="form-group">
                <label htmlFor="editShares">New Share Count</label>
                <input
                  type="number"
                  id="editShares"
                  value={editShares}
                  onChange={(e) => setEditShares(parseInt(e.target.value) || 0)}
                  min="0"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleUpdateShares}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Shares'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .shareholder-management {
          background: white;
          border-radius: 16px;
          padding: 1.75rem;
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .loading-state {
          text-align: center;
          padding: 3rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 1rem;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .alert {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          margin-bottom: 1.25rem;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .alert-error { 
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05)); 
          color: #991b1b; 
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .alert-success { 
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05)); 
          color: #166534; 
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .alert-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: inherit;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .alert-close:hover {
          opacity: 1;
        }

        .stats-bar {
          display: flex;
          align-items: center;
          gap: 2.5rem;
          padding: 1.25rem 1.75rem;
          background: linear-gradient(135deg, #f9fafb, #f3f4f6);
          border-radius: 14px;
          margin-bottom: 1.75rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .stats-bar .btn {
          margin-left: auto;
        }

        .add-form {
          padding: 1.75rem;
          background: linear-gradient(135deg, #f9fafb, #f3f4f6);
          border-radius: 14px;
          margin-bottom: 1.75rem;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .add-form h3 {
          margin: 0 0 1.25rem 0;
          font-size: 1.15rem;
          color: #374151;
          font-weight: 600;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }

        .form-group {
          margin-bottom: 0.75rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
          font-weight: 500;
          color: #374151;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1.5px solid #d1d5db;
          border-radius: 10px;
          font-size: 0.95rem;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }

        .form-group input:hover {
          border-color: #9ca3af;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }

        .form-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 1rem 0;
        }

        .form-checkbox input {
          width: 18px;
          height: 18px;
        }

        .form-checkbox label {
          font-size: 0.9rem;
          color: #4b5563;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        .shareholders-table-container {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .shareholders-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .shareholders-table th,
        .shareholders-table td {
          padding: 1rem 1.25rem;
          text-align: left;
          border-bottom: 1px solid #f3f4f6;
        }

        .shareholders-table th {
          background: linear-gradient(135deg, #f9fafb, #f3f4f6);
          font-weight: 600;
          color: #374151;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .shareholders-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .shareholders-table tbody tr:hover {
          background-color: rgba(59, 130, 246, 0.03);
        }

        .shareholders-table tr.inactive {
          opacity: 0.5;
        }

        .name-cell strong {
          color: #1f2937;
          font-weight: 600;
        }

        .address-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .address-cell code {
          background: #f3f4f6;
          padding: 0.35rem 0.6rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-family: 'Consolas', 'Monaco', monospace;
        }

        .copy-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          opacity: 0.5;
          transition: all 0.2s;
          padding: 0.25rem;
          border-radius: 4px;
        }

        .copy-btn:hover {
          opacity: 1;
          background: #f3f4f6;
        }

        .shares-cell strong {
          color: #059669;
          font-weight: 600;
        }

        .badge {
          display: inline-block;
          padding: 0.3rem 0.65rem;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .badge-success { 
          background: linear-gradient(135deg, #22c55e, #16a34a); 
          color: white;
          box-shadow: 0 2px 4px rgba(34, 197, 94, 0.25);
        }
        .badge-error { 
          background: #6b7280; 
          color: white; 
        }
        .badge-info { 
          background: linear-gradient(135deg, #3b82f6, #2563eb); 
          color: white;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.25);
        }
        .badge-default { 
          background: #e5e7eb; 
          color: #4b5563; 
        }

        .actions-cell {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          padding: 0.625rem 1.125rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
          border: none;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .btn-sm {
          padding: 0.5rem 0.75rem;
          font-size: 0.85rem;
          border-radius: 8px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
        }

        .btn-primary:hover:not(:disabled) {
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
        }

        .btn-outline {
          background: white;
          border: 1.5px solid #d1d5db;
          color: #374151;
        }

        .btn-outline:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .btn-danger {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .btn-danger:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.1));
        }

        .empty-state {
          text-align: center;
          padding: 2.5rem;
          color: #6b7280;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 420px;
          margin: 1rem;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 600;
        }

        .modal-close {
          background: #f3f4f6;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: #6b7280;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #e5e7eb;
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-info {
          background: linear-gradient(135deg, #f9fafb, #f3f4f6);
          padding: 1rem 1.25rem;
          border-radius: 12px;
          margin-bottom: 1.25rem;
          line-height: 1.6;
        }

        .modal-info code {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem;
          border-top: 1px solid #f3f4f6;
          background: #fafafa;
          border-radius: 0 0 20px 20px;
        }

        @media (max-width: 768px) {
          .stats-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .stats-bar .btn {
            margin-left: 0;
            width: 100%;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .shareholders-table th:nth-child(3),
          .shareholders-table td:nth-child(3) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ShareholderManagement;
