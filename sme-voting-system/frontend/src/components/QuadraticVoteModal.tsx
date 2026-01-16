import React, { useState, useEffect, useCallback } from 'react';
import { Proposal } from '../services/proposalService';
import votingService, { TokenBalance, CostPreview } from '../services/votingService';
import { LoadingSpinner } from './ui';

interface QuadraticVoteModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onVoteSuccess: () => void;
}

const QuadraticVoteModal: React.FC<QuadraticVoteModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onVoteSuccess,
}) => {
  // State
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [costPreview, setCostPreview] = useState<CostPreview | null>(null);
  const [selectedVote, setSelectedVote] = useState<boolean | null>(null);
  const [voteCount, setVoteCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch token balance on mount
  const fetchTokenBalance = useCallback(async () => {
    if (!proposal) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await votingService.getTokenBalance(proposal.proposalId);
      if (response.success) {
        setTokenBalance(response.data);
        // If direction is already locked, pre-select it
        if (response.data.isDirectionLocked && response.data.voteDirection !== null) {
          setSelectedVote(response.data.voteDirection);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch token balance:', err);
      setError(err.response?.data?.error || 'Failed to load token balance');
    } finally {
      setIsLoading(false);
    }
  }, [proposal]);

  // Fetch cost preview when vote count changes
  const fetchCostPreview = useCallback(async () => {
    if (!proposal || voteCount < 1) return;
    
    setIsPreviewLoading(true);
    
    try {
      const response = await votingService.previewVoteCost(proposal.proposalId, voteCount);
      if (response.success) {
        setCostPreview(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch cost preview:', err);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [proposal, voteCount]);

  useEffect(() => {
    if (isOpen && proposal) {
      fetchTokenBalance();
    }
  }, [isOpen, proposal, fetchTokenBalance]);

  useEffect(() => {
    if (isOpen && proposal && tokenBalance) {
      fetchCostPreview();
    }
  }, [isOpen, proposal, voteCount, tokenBalance, fetchCostPreview]);

  // Reset state on close
  const handleClose = () => {
    setSelectedVote(null);
    setVoteCount(1);
    setCostPreview(null);
    setError(null);
    onClose();
  };

  // Handle vote submission
  const handleVote = async () => {
    if (!proposal || selectedVote === null || !costPreview?.canAfford) return;
    
    setIsVoting(true);
    setError(null);
    
    try {
      // First, cast on blockchain via MetaMask
      const { blockchainService } = await import('../services');
      
      // For quadratic voting, we cast on the QuadraticVoting contract
      // The blockchain service should handle this based on proposal type
      const txHash = await blockchainService.castQuadraticVoteOnChain(
        proposal.proposalId,
        selectedVote,
        voteCount
      );
      
      console.log(`✅ Quadratic vote recorded on blockchain: ${txHash}`);
      
      // Then record in database
      const response = await votingService.castQuadraticVote(
        proposal.proposalId,
        selectedVote,
        voteCount
      );
      
      if (response.success) {
        onVoteSuccess();
        handleClose();
      }
    } catch (err: any) {
      console.error('Vote error:', err);
      let errorMessage = 'Failed to cast vote. Please try again.';
      
      if (err.message?.includes('rejected')) {
        errorMessage = 'Transaction was rejected. Please try again.';
      } else if (err.message?.includes('direction')) {
        errorMessage = 'Cannot change vote direction after first vote.';
      } else if (err.message?.includes('tokens')) {
        errorMessage = 'Insufficient tokens for this vote.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsVoting(false);
    }
  };

  // Calculate max votes user can afford
  const getMaxAffordableVotes = (): number => {
    if (!tokenBalance) return 0;
    const remaining = tokenBalance.tokensRemaining;
    const currentVotes = tokenBalance.currentVotes;
    // Solve for n: (currentVotes + n)² - currentVotes² <= remaining
    // n² + 2*currentVotes*n <= remaining
    // Using quadratic formula approximation
    let maxAdditional = 0;
    for (let n = 1; n <= 100; n++) {
      const cost = Math.pow(currentVotes + n, 2) - Math.pow(currentVotes, 2);
      if (cost <= remaining) {
        maxAdditional = n;
      } else {
        break;
      }
    }
    return maxAdditional;
  };

  if (!isOpen || !proposal) return null;

  const maxVotes = getMaxAffordableVotes();
  const isDirectionLocked = tokenBalance?.isDirectionLocked ?? false;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content quadratic-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎯 Cast Quadratic Vote</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {isLoading ? (
            <div className="loading-state">
              <LoadingSpinner size="lg" />
              <p>Loading your token balance...</p>
            </div>
          ) : error && !tokenBalance ? (
            <div className="error-state">
              <span className="error-icon">❌</span>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={fetchTokenBalance}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Proposal Info */}
              <div className="proposal-info">
                <span className="voting-type-badge quadratic">📊 Quadratic Voting</span>
                <h3>{proposal.title}</h3>
                {proposal.description && (
                  <p className="proposal-desc">{proposal.description}</p>
                )}
              </div>

              {/* Token Balance Display */}
              <div className="token-balance-card">
                <div className="token-header">
                  <span className="token-icon">🪙</span>
                  <span className="token-label">Your Tokens</span>
                </div>
                <div className="token-values">
                  <div className="token-remaining">
                    <span className="value">{tokenBalance?.tokensRemaining ?? 0}</span>
                    <span className="label">Remaining</span>
                  </div>
                  <div className="token-divider">/</div>
                  <div className="token-total">
                    <span className="value">{tokenBalance?.totalTokens ?? 0}</span>
                    <span className="label">Total</span>
                  </div>
                </div>
                {tokenBalance && tokenBalance.currentVotes > 0 && (
                  <div className="current-votes-info">
                    <span>Current votes: {tokenBalance.currentVotes}</span>
                    <span>({tokenBalance.tokensUsed} tokens spent)</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="vote-error">{error}</div>
              )}

              {/* Vote Direction Selection */}
              <div className="vote-direction-section">
                <label className="section-label">
                  Vote Direction
                  {isDirectionLocked && (
                    <span className="locked-badge">🔒 Locked</span>
                  )}
                </label>
                <div className="vote-options">
                  <button
                    className={`vote-option yes ${selectedVote === true ? 'selected' : ''}`}
                    onClick={() => !isDirectionLocked && setSelectedVote(true)}
                    disabled={isVoting || (isDirectionLocked && selectedVote !== true)}
                  >
                    <span className="vote-icon">👍</span>
                    <span className="vote-label">YES</span>
                  </button>

                  <button
                    className={`vote-option no ${selectedVote === false ? 'selected' : ''}`}
                    onClick={() => !isDirectionLocked && setSelectedVote(false)}
                    disabled={isVoting || (isDirectionLocked && selectedVote !== false)}
                  >
                    <span className="vote-icon">👎</span>
                    <span className="vote-label">NO</span>
                  </button>
                </div>
                {isDirectionLocked && (
                  <p className="direction-note">
                    Your vote direction is locked after your first vote.
                  </p>
                )}
              </div>

              {/* Vote Count Slider */}
              <div className="vote-count-section">
                <label className="section-label">How many votes?</label>
                <div className="slider-container">
                  <button 
                    className="slider-btn"
                    onClick={() => setVoteCount(Math.max(1, voteCount - 1))}
                    disabled={voteCount <= 1 || isVoting}
                  >
                    ◀
                  </button>
                  <input
                    type="range"
                    min="1"
                    max={Math.max(1, maxVotes)}
                    value={voteCount}
                    onChange={(e) => setVoteCount(Number(e.target.value))}
                    className="vote-slider"
                    disabled={isVoting || maxVotes === 0}
                  />
                  <button 
                    className="slider-btn"
                    onClick={() => setVoteCount(Math.min(maxVotes, voteCount + 1))}
                    disabled={voteCount >= maxVotes || isVoting}
                  >
                    ▶
                  </button>
                  <span className="vote-count-display">{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="max-votes-note">
                  You can afford up to {maxVotes} more vote{maxVotes !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="cost-breakdown-card">
                <h4>Cost Breakdown</h4>
                {isPreviewLoading ? (
                  <div className="cost-loading">
                    <LoadingSpinner size="sm" />
                    <span>Calculating...</span>
                  </div>
                ) : costPreview ? (
                  <div className="cost-details">
                    <div className="cost-row">
                      <span>Current votes:</span>
                      <span>{costPreview.currentVotes} ({tokenBalance?.tokensUsed ?? 0} tokens spent)</span>
                    </div>
                    <div className="cost-row highlight">
                      <span>+ {costPreview.additionalVotes} more vote{costPreview.additionalVotes !== 1 ? 's' : ''}:</span>
                      <span className="cost-value">{costPreview.tokenCost} tokens</span>
                    </div>
                    <div className="cost-row total">
                      <span>New total:</span>
                      <span>{costPreview.newTotalVotes} votes ({(tokenBalance?.tokensUsed ?? 0) + costPreview.tokenCost} tokens)</span>
                    </div>
                    <div className="voting-power">
                      <span className="power-icon">⚡</span>
                      <span>Voting Power: √{(tokenBalance?.tokensUsed ?? 0) + costPreview.tokenCost} = {costPreview.votingPower.toFixed(2)}</span>
                    </div>
                    {!costPreview.canAfford && (
                      <div className="cannot-afford-warning">
                        ⚠️ Insufficient tokens for this many votes
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Warning */}
              <div className="vote-warning">
                <span className="warning-icon">⚠️</span>
                <span>
                  You will be asked to sign this vote with MetaMask. 
                  Quadratic votes can be added but not removed.
                </span>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={handleClose}
            disabled={isVoting}
          >
            Cancel
          </button>
          <button
            className={`btn btn-primary ${selectedVote === true ? 'btn-success' : selectedVote === false ? 'btn-danger' : ''}`}
            onClick={handleVote}
            disabled={isVoting || selectedVote === null || !costPreview?.canAfford || isLoading}
          >
            {isVoting ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span style={{ marginLeft: '0.5rem' }}>Casting Vote...</span>
              </>
            ) : (
              `Cast ${voteCount} Vote${voteCount !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>

      <style>{`
        .quadratic-modal {
          max-width: 520px;
        }

        .loading-state,
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          gap: 1rem;
          text-align: center;
        }

        .error-icon {
          font-size: 2.5rem;
        }

        .proposal-info {
          margin-bottom: 1.5rem;
        }

        .voting-type-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .voting-type-badge.quadratic {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05));
          color: #7c3aed;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .proposal-info h3 {
          font-size: 1.1rem;
          color: #1f2937;
          margin: 0 0 0.5rem;
          font-weight: 600;
        }

        .proposal-desc {
          color: #6b7280;
          font-size: 0.9rem;
          margin: 0;
          line-height: 1.6;
        }

        .token-balance-card {
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          border: 1px solid #86efac;
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .token-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .token-icon {
          font-size: 1.25rem;
        }

        .token-label {
          font-weight: 600;
          color: #166534;
        }

        .token-values {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .token-remaining,
        .token-total {
          text-align: center;
        }

        .token-remaining .value,
        .token-total .value {
          display: block;
          font-size: 1.75rem;
          font-weight: 700;
          color: #166534;
        }

        .token-remaining .label,
        .token-total .label {
          font-size: 0.75rem;
          color: #4ade80;
          text-transform: uppercase;
        }

        .token-divider {
          font-size: 1.5rem;
          color: #86efac;
        }

        .current-votes-info {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          font-size: 0.85rem;
          color: #166534;
        }

        .vote-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .section-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
        }

        .locked-badge {
          font-size: 0.75rem;
          background: #fef3c7;
          color: #92400e;
          padding: 0.125rem 0.5rem;
          border-radius: 10px;
        }

        .vote-direction-section {
          margin-bottom: 1.5rem;
        }

        .vote-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .vote-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .vote-option:hover:not(:disabled) {
          border-color: #9ca3af;
          transform: translateY(-2px);
        }

        .vote-option.yes.selected {
          border-color: #22c55e;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.02));
        }

        .vote-option.no.selected {
          border-color: #ef4444;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02));
        }

        .vote-option:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .vote-icon {
          font-size: 1.5rem;
        }

        .vote-label {
          font-size: 0.9rem;
          font-weight: 700;
        }

        .vote-option.yes .vote-label { color: #16a34a; }
        .vote-option.no .vote-label { color: #dc2626; }

        .direction-note {
          font-size: 0.8rem;
          color: #92400e;
          margin-top: 0.5rem;
          text-align: center;
        }

        .vote-count-section {
          margin-bottom: 1.5rem;
        }

        .slider-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .slider-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid #d1d5db;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          color: #374151;
          transition: all 0.2s;
        }

        .slider-btn:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .slider-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .vote-slider {
          flex: 1;
          height: 8px;
          border-radius: 4px;
          background: #e5e7eb;
          outline: none;
          -webkit-appearance: none;
        }

        .vote-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
        }

        .vote-count-display {
          min-width: 70px;
          text-align: right;
          font-weight: 600;
          color: #1f2937;
        }

        .max-votes-note {
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 0.5rem;
          text-align: center;
        }

        .cost-breakdown-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1.25rem;
        }

        .cost-breakdown-card h4 {
          margin: 0 0 0.75rem;
          font-size: 0.9rem;
          color: #475569;
        }

        .cost-loading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.9rem;
        }

        .cost-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .cost-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #64748b;
        }

        .cost-row.highlight {
          color: #3b82f6;
          font-weight: 500;
        }

        .cost-row.total {
          padding-top: 0.5rem;
          border-top: 1px dashed #cbd5e1;
          font-weight: 600;
          color: #1e293b;
        }

        .cost-value {
          font-weight: 600;
        }

        .voting-power {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05));
          border-radius: 8px;
          font-size: 0.85rem;
          color: #b45309;
        }

        .power-icon {
          font-size: 1rem;
        }

        .cannot-afford-warning {
          background: #fee2e2;
          color: #991b1b;
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.8rem;
          text-align: center;
          margin-top: 0.5rem;
        }

        .vote-warning {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #fef3c7;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #92400e;
        }

        .warning-icon {
          font-size: 1rem;
          flex-shrink: 0;
        }

        /* Reuse modal styles from VoteModal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
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
          padding: 1.5rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #1f2937;
          font-weight: 600;
        }

        .modal-close {
          background: #f3f4f6;
          border: none;
          font-size: 1.25rem;
          color: #6b7280;
          cursor: pointer;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: #e5e7eb;
          color: #374151;
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1.5rem;
          border-top: 1px solid #f3f4f6;
          background: #fafafa;
          border-radius: 0 0 20px 20px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .btn-secondary {
          background: white;
          border: 1.5px solid #d1d5db;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .btn-success {
          background: linear-gradient(135deg, #22c55e, #16a34a) !important;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .btn-danger {
          background: linear-gradient(135deg, #ef4444, #dc2626) !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        @media (max-width: 480px) {
          .vote-options {
            grid-template-columns: 1fr;
          }
          
          .slider-container {
            flex-wrap: wrap;
          }
          
          .vote-slider {
            order: -1;
            width: 100%;
            flex: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default QuadraticVoteModal;
