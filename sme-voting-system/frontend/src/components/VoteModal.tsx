import React, { useState } from 'react';
import { Proposal } from '../services/proposalService';
import { LoadingSpinner } from './ui';

interface VoteModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  isVoting: boolean;
  userShares: number;
  onClose: () => void;
  onVote: (proposalId: number, voteChoice: boolean) => Promise<void>;
}

const VoteModal: React.FC<VoteModalProps> = ({
  proposal,
  isOpen,
  isVoting,
  userShares,
  onClose,
  onVote,
}) => {
  const [selectedVote, setSelectedVote] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !proposal) return null;

  const handleVote = async () => {
    if (selectedVote === null) {
      setError('Please select Yes or No to vote');
      return;
    }

    setError(null);
    try {
      await onVote(proposal.proposalId, selectedVote);
      setSelectedVote(null);
    } catch (err) {
      // Error is handled by parent component
    }
  };

  const handleClose = () => {
    setSelectedVote(null);
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cast Your Vote</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="proposal-info">
            <h3>{proposal.title}</h3>
            {proposal.description && (
              <p className="proposal-desc">{proposal.description}</p>
            )}
          </div>

          <div className="vote-weight-info">
            <span className="weight-label">Your voting weight:</span>
            <span className="weight-value">{userShares} shares</span>
          </div>

          {error && (
            <div className="vote-error">
              {error}
            </div>
          )}

          <div className="vote-options">
            <button
              className={`vote-option yes ${selectedVote === true ? 'selected' : ''}`}
              onClick={() => setSelectedVote(true)}
              disabled={isVoting}
            >
              <span className="vote-icon">👍</span>
              <span className="vote-label">YES</span>
              <span className="vote-desc">I approve this proposal</span>
            </button>

            <button
              className={`vote-option no ${selectedVote === false ? 'selected' : ''}`}
              onClick={() => setSelectedVote(false)}
              disabled={isVoting}
            >
              <span className="vote-icon">👎</span>
              <span className="vote-label">NO</span>
              <span className="vote-desc">I reject this proposal</span>
            </button>
          </div>

          <div className="vote-warning">
            <span className="warning-icon">⚠️</span>
            <span>You will be asked to sign this vote with MetaMask. Your vote cannot be changed once confirmed on the blockchain.</span>
          </div>
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
            disabled={isVoting || selectedVote === null}
          >
            {isVoting ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span style={{ marginLeft: '0.5rem' }}>Submitting Vote...</span>
              </>
            ) : (
              `Confirm ${selectedVote === true ? 'YES' : selectedVote === false ? 'NO' : ''} Vote`
            )}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
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

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
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
          padding: 0;
          line-height: 1;
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

        .proposal-info {
          margin-bottom: 1.5rem;
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

        .vote-weight-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f0f9ff;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .weight-label {
          color: #0369a1;
          font-size: 0.9rem;
        }

        .weight-value {
          font-weight: 600;
          color: #0284c7;
          font-size: 1.1rem;
        }

        .vote-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .vote-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .vote-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1.5rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          background: white;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .vote-option:hover:not(:disabled) {
          border-color: #9ca3af;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .vote-option.yes.selected {
          border-color: #22c55e;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.02));
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.2);
          transform: translateY(-2px);
        }

        .vote-option.no.selected {
          border-color: #ef4444;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02));
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
          transform: translateY(-2px);
        }

        .vote-option:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .vote-icon {
          font-size: 2rem;
        }

        .vote-label {
          font-size: 1.1rem;
          font-weight: 700;
        }

        .vote-option.yes .vote-label {
          color: #16a34a;
        }

        .vote-option.no .vote-label {
          color: #dc2626;
        }

        .vote-desc {
          font-size: 0.75rem;
          color: #9ca3af;
          text-align: center;
        }

        .vote-warning {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #fef3c7;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #92400e;
        }

        .warning-icon {
          font-size: 1rem;
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

        .modal-footer .btn {
          transition: all 0.2s ease;
        }

        .modal-footer .btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .btn-success {
          background: linear-gradient(135deg, #22c55e, #16a34a) !important;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .btn-success:hover {
          box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4) !important;
        }

        .btn-danger {
          background: linear-gradient(135deg, #ef4444, #dc2626) !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .btn-danger:hover {
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4) !important;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .vote-options {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default VoteModal;
