import React from 'react';
import { Link } from 'react-router-dom';
import { Proposal } from '../services/proposalService';

interface ProposalCardProps {
  proposal: Proposal;
  hasVoted?: boolean;
  userVote?: boolean;
  onVote?: (proposalId: number) => void;
  showVoteButton?: boolean;
}

const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  hasVoted = false,
  userVote,
  onVote,
  showVoteButton = true,
}) => {
  const getStatusBadge = () => {
    switch (proposal.status) {
      case 'active':
        return <span className="status-badge active">🟢 Active</span>;
      case 'upcoming':
        return <span className="status-badge upcoming">🟡 Upcoming</span>;
      case 'ended':
        return <span className="status-badge ended">🔴 Ended</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const end = new Date(proposal.endTime);
    const start = new Date(proposal.startTime);

    if (proposal.status === 'upcoming') {
      const diff = start.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) return `Starts in ${days}d ${hours}h`;
      if (hours > 0) return `Starts in ${hours}h`;
      return 'Starting soon';
    }

    if (proposal.status === 'active') {
      const diff = end.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) return `${days}d ${hours}h remaining`;
      if (hours > 0) return `${hours}h remaining`;
      return 'Ending soon';
    }

    return 'Voting closed';
  };

  return (
    <div className="proposal-card">
      <div className="proposal-header">
        <div className="proposal-title-section">
          <h3 className="proposal-title">{proposal.title}</h3>
          <span className={`voting-type-badge ${proposal.votingType || 'simple'}`}>
            {proposal.votingType === 'quadratic' ? '📊 Quadratic' : '📋 Simple'}
          </span>
        </div>
        {getStatusBadge()}
      </div>

      {proposal.description && (
        <p className="proposal-description">{proposal.description}</p>
      )}

      <div className="proposal-meta">
        <div className="meta-item">
          <span className="meta-label">Start:</span>
          <span className="meta-value">{formatDate(proposal.startTime)}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">End:</span>
          <span className="meta-value">{formatDate(proposal.endTime)}</span>
        </div>
        <div className="meta-item time-remaining">
          <span className="time-badge">{getTimeRemaining()}</span>
        </div>
      </div>

      {hasVoted && (
        <div className={`vote-status ${userVote ? 'voted-yes' : 'voted-no'}`}>
          <span className="vote-icon">{userVote ? '👍' : '👎'}</span>
          <span>You voted: <strong>{userVote ? 'YES' : 'NO'}</strong></span>
        </div>
      )}

      <div className="proposal-actions">
        <Link to={`/proposals/${proposal.proposalId}`} className="btn btn-secondary btn-sm">
          View Details
        </Link>
        
        {showVoteButton && proposal.status === 'active' && !hasVoted && onVote && (
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => onVote(proposal.proposalId)}
          >
            Cast Vote
          </button>
        )}
        
        {proposal.status === 'ended' && (
          <Link to={`/proposals/${proposal.proposalId}`} className="btn btn-outline btn-sm">
            View Results
          </Link>
        )}
      </div>

      <style>{`
        .proposal-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .proposal-card:hover {
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.08);
          transform: translateY(-6px);
          border-color: rgba(59, 130, 246, 0.15);
        }

        .proposal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .proposal-title-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .proposal-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          line-height: 1.4;
        }

        .voting-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.65rem;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          font-weight: 500;
          width: fit-content;
        }

        .voting-type-badge.simple {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .voting-type-badge.quadratic {
          background: rgba(139, 92, 246, 0.1);
          color: #7c3aed;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .status-badge {
          font-size: 0.7rem;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          font-weight: 600;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .status-badge.active {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
        }

        .status-badge.upcoming {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
        }

        .status-badge.ended {
          background: #6b7280;
          color: white;
        }

        .proposal-description {
          color: #6b7280;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .proposal-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 0.875rem 1rem;
          background: linear-gradient(135deg, #f9fafb, #f3f4f6);
          border-radius: 12px;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .meta-label {
          font-size: 0.75rem;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .meta-value {
          font-size: 0.85rem;
          color: #374151;
          font-weight: 500;
        }

        .time-remaining {
          margin-left: auto;
        }

        .time-badge {
          background: #3b82f6;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .vote-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .vote-status.voted-yes {
          background: #dcfce7;
          color: #166534;
        }

        .vote-status.voted-no {
          background: #fee2e2;
          color: #991b1b;
        }

        .vote-icon {
          font-size: 1.2rem;
        }

        .proposal-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .proposal-actions .btn {
          transition: all 0.2s ease;
        }

        .proposal-actions .btn:hover {
          transform: translateY(-2px);
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          border-radius: 8px;
        }

        .btn-outline {
          background: transparent;
          border: 1.5px solid #d1d5db;
          color: #374151;
        }

        .btn-outline:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default ProposalCard;
