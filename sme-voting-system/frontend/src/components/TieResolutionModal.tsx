import React, { useState } from 'react';
import { LoadingSpinner } from './ui';
import proposalService, { 
  TieResolutionType,
  TieResolutionResponse 
} from '../services/proposalService';

// =============================================================================
// TIE RESOLUTION MODAL - Phase 5
// Allows Admin to resolve tied proposals with 3 options:
// 1. Reject (Status Quo)
// 2. Chairperson Vote: YES
// 3. Chairperson Vote: NO
// =============================================================================

type ResolutionChoice = 'STATUS_QUO' | 'CHAIRPERSON_YES' | 'CHAIRPERSON_NO';

interface TieResolutionModalProps {
  isOpen: boolean;
  proposalId: number;
  proposalTitle: string;
  yesVotes: number;
  noVotes: number;
  votingType: string;
  onClose: () => void;
  onResolved: (resolutionType: TieResolutionType) => void;
}

const TieResolutionModal: React.FC<TieResolutionModalProps> = ({
  isOpen,
  proposalId,
  proposalTitle,
  yesVotes,
  noVotes,
  votingType,
  onClose,
  onResolved,
}) => {
  const [selectedChoice, setSelectedChoice] = useState<ResolutionChoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedChoice) {
      setError('Please select a resolution option');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let response: TieResolutionResponse;

      if (selectedChoice === 'STATUS_QUO') {
        response = await proposalService.resolveTieStatusQuo(proposalId);
      } else {
        const voteChoice = selectedChoice === 'CHAIRPERSON_YES';
        response = await proposalService.resolveTieChairpersonVote(proposalId, voteChoice);
      }

      if (response.success) {
        onResolved(response.data.tieResolutionType);
        handleClose();
      } else {
        setError('Failed to resolve tie. Please try again.');
      }
    } catch (err: any) {
      console.error('Error resolving tie:', err);
      setError(err.response?.data?.error || err.message || 'Failed to resolve tie');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedChoice(null);
    setError(null);
    onClose();
  };

  // Format vote display based on voting type
  const formatVotes = (votes: number): string => {
    if (votingType === 'quadratic') {
      return votes.toFixed(2) + ' VP';
    }
    return votes.toString() + ' shares';
  };

  return (
    <div className="tie-modal-overlay" onClick={handleClose}>
      <div className="tie-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tie-modal-header">
          <div className="tie-header-icon">⚖️</div>
          <h2>Tie-Breaker Required</h2>
          <button className="tie-modal-close" onClick={handleClose} disabled={isSubmitting}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="tie-modal-body">
          {/* Proposal Info */}
          <div className="tie-proposal-info">
            <span className="tie-label">Proposal:</span>
            <span className="tie-title">{proposalTitle}</span>
          </div>

          {/* Vote Comparison */}
          <div className="tie-vote-comparison">
            <div className="tie-vote-box yes">
              <span className="tie-vote-icon">✅</span>
              <span className="tie-vote-label">YES</span>
              <span className="tie-vote-count">{formatVotes(yesVotes)}</span>
            </div>
            <div className="tie-versus">VS</div>
            <div className="tie-vote-box no">
              <span className="tie-vote-icon">❌</span>
              <span className="tie-vote-label">NO</span>
              <span className="tie-vote-count">{formatVotes(noVotes)}</span>
            </div>
          </div>

          <div className="tie-info-banner">
            <span className="tie-info-icon">ℹ️</span>
            <span>As the Chairperson, you must resolve this tie. Your decision is final and will be recorded.</span>
          </div>

          {/* Error Display */}
          {error && (
            <div className="tie-error">
              <span className="tie-error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Resolution Options */}
          <div className="tie-options">
            <label className="tie-option-label">Select Resolution:</label>
            
            <button
              className={`tie-option ${selectedChoice === 'STATUS_QUO' ? 'selected' : ''}`}
              onClick={() => setSelectedChoice('STATUS_QUO')}
              disabled={isSubmitting}
            >
              <div className="tie-option-radio">
                {selectedChoice === 'STATUS_QUO' && <div className="tie-option-radio-inner" />}
              </div>
              <div className="tie-option-content">
                <span className="tie-option-icon">🚫</span>
                <div className="tie-option-text">
                  <span className="tie-option-title">Reject (Status Quo)</span>
                  <span className="tie-option-desc">Proposal fails - no changes made</span>
                </div>
              </div>
            </button>

            <button
              className={`tie-option chairperson-yes ${selectedChoice === 'CHAIRPERSON_YES' ? 'selected' : ''}`}
              onClick={() => setSelectedChoice('CHAIRPERSON_YES')}
              disabled={isSubmitting}
            >
              <div className="tie-option-radio">
                {selectedChoice === 'CHAIRPERSON_YES' && <div className="tie-option-radio-inner yes" />}
              </div>
              <div className="tie-option-content">
                <span className="tie-option-icon">✅</span>
                <div className="tie-option-text">
                  <span className="tie-option-title">Chairperson Vote: YES</span>
                  <span className="tie-option-desc">Cast deciding vote to APPROVE</span>
                </div>
              </div>
            </button>

            <button
              className={`tie-option chairperson-no ${selectedChoice === 'CHAIRPERSON_NO' ? 'selected' : ''}`}
              onClick={() => setSelectedChoice('CHAIRPERSON_NO')}
              disabled={isSubmitting}
            >
              <div className="tie-option-radio">
                {selectedChoice === 'CHAIRPERSON_NO' && <div className="tie-option-radio-inner no" />}
              </div>
              <div className="tie-option-content">
                <span className="tie-option-icon">❌</span>
                <div className="tie-option-text">
                  <span className="tie-option-title">Chairperson Vote: NO</span>
                  <span className="tie-option-desc">Cast deciding vote to REJECT</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="tie-modal-footer">
          <button 
            className="tie-btn tie-btn-secondary" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className={`tie-btn tie-btn-primary ${
              selectedChoice === 'CHAIRPERSON_YES' ? 'tie-btn-approve' : 
              selectedChoice === 'CHAIRPERSON_NO' || selectedChoice === 'STATUS_QUO' ? 'tie-btn-reject' : ''
            }`}
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedChoice}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span style={{ marginLeft: '0.5rem' }}>Submitting...</span>
              </>
            ) : (
              'Confirm Decision'
            )}
          </button>
        </div>
      </div>

      <style>{`
        .tie-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: tieModalFadeIn 0.2s ease;
        }

        @keyframes tieModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes tieModalSlideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .tie-modal-content {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
          animation: tieModalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .tie-modal-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 20px 20px 0 0;
        }

        .tie-header-icon {
          font-size: 1.75rem;
        }

        .tie-modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #92400e;
          font-weight: 700;
          flex: 1;
        }

        .tie-modal-close {
          background: rgba(255, 255, 255, 0.6);
          border: none;
          font-size: 1.5rem;
          color: #92400e;
          cursor: pointer;
          padding: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .tie-modal-close:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.9);
          transform: rotate(90deg);
        }

        .tie-modal-close:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tie-modal-body {
          padding: 1.5rem;
        }

        .tie-proposal-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .tie-label {
          font-size: 0.85rem;
          color: #6b7280;
          font-weight: 500;
        }

        .tie-title {
          font-size: 1.1rem;
          color: #1f2937;
          font-weight: 600;
        }

        .tie-vote-comparison {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .tie-vote-box {
          flex: 1;
          max-width: 140px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1.25rem 1rem;
          border-radius: 16px;
          border: 2px solid;
        }

        .tie-vote-box.yes {
          border-color: #22c55e;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
        }

        .tie-vote-box.no {
          border-color: #ef4444;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
        }

        .tie-vote-icon {
          font-size: 1.5rem;
        }

        .tie-vote-label {
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .tie-vote-box.yes .tie-vote-label {
          color: #16a34a;
        }

        .tie-vote-box.no .tie-vote-label {
          color: #dc2626;
        }

        .tie-vote-count {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
        }

        .tie-versus {
          font-size: 1rem;
          font-weight: 700;
          color: #9ca3af;
          padding: 0.5rem;
        }

        .tie-info-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          color: #1e40af;
          line-height: 1.5;
        }

        .tie-info-icon {
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .tie-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          color: #991b1b;
        }

        .tie-error-icon {
          font-size: 1rem;
        }

        .tie-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .tie-option-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.25rem;
        }

        .tie-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
        }

        .tie-option:hover:not(:disabled) {
          border-color: #9ca3af;
          background: #f9fafb;
        }

        .tie-option.selected {
          border-color: #6366f1;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0.02) 100%);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
        }

        .tie-option.chairperson-yes.selected {
          border-color: #22c55e;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.02) 100%);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
        }

        .tie-option.chairperson-no.selected {
          border-color: #ef4444;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
        }

        .tie-option:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .tie-option-radio {
          width: 22px;
          height: 22px;
          border: 2px solid #d1d5db;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: border-color 0.2s ease;
        }

        .tie-option.selected .tie-option-radio {
          border-color: #6366f1;
        }

        .tie-option.chairperson-yes.selected .tie-option-radio {
          border-color: #22c55e;
        }

        .tie-option.chairperson-no.selected .tie-option-radio {
          border-color: #ef4444;
        }

        .tie-option-radio-inner {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #6366f1;
          animation: tieRadioPopIn 0.2s ease;
        }

        .tie-option-radio-inner.yes {
          background: #22c55e;
        }

        .tie-option-radio-inner.no {
          background: #ef4444;
        }

        @keyframes tieRadioPopIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }

        .tie-option-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        .tie-option-icon {
          font-size: 1.5rem;
        }

        .tie-option-text {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .tie-option-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .tie-option-desc {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .tie-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1.5rem;
          border-top: 1px solid #f3f4f6;
          background: #fafafa;
          border-radius: 0 0 20px 20px;
        }

        .tie-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.5rem;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tie-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .tie-btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .tie-btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .tie-btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .tie-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
        }

        .tie-btn-approve {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .tie-btn-approve:hover:not(:disabled) {
          box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
        }

        .tie-btn-reject {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .tie-btn-reject:hover:not(:disabled) {
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
        }

        @media (max-width: 480px) {
          .tie-modal-content {
            max-width: 100%;
            border-radius: 16px;
          }

          .tie-vote-comparison {
            flex-direction: column;
            gap: 0.75rem;
          }

          .tie-vote-box {
            max-width: 100%;
            flex-direction: row;
            justify-content: space-between;
            padding: 1rem;
          }

          .tie-versus {
            display: none;
          }

          .tie-option {
            padding: 0.875rem;
          }

          .tie-option-icon {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TieResolutionModal;
