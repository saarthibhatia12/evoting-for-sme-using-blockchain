import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { proposalService, votingService } from '../services';
import { ProposalWithBlockchain, ProposalResult } from '../services/proposalService';
import VoteModal from '../components/VoteModal';
import { useToast, LoadingSpinner } from '../components/ui';
import '../styles/index.css';

const ProposalDetail: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [proposal, setProposal] = useState<ProposalWithBlockchain | null>(null);
  const [results, setResults] = useState<ProposalResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVoteChoice, setUserVoteChoice] = useState<boolean | null>(null);
  const [userVoteWeight, setUserVoteWeight] = useState<number | null>(null);
  const [userTokensSpent, setUserTokensSpent] = useState<number | null>(null);
  
  // Vote modal
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    const proposalId = parseInt(id, 10);
    if (isNaN(proposalId)) {
      setError('Invalid proposal ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch proposal details
      const proposalResponse = await proposalService.getProposalById(proposalId);
      if (proposalResponse.success) {
        setProposal(proposalResponse.data);
      } else {
        throw new Error('Failed to load proposal');
      }

      // Fetch results
      try {
        const resultsResponse = await proposalService.getProposalResults(proposalId);
        if (resultsResponse.success) {
          setResults(resultsResponse.data);
        }
      } catch {
        // Results might not be available yet
      }

      // Check if user has voted
      try {
        const voteStatusResponse = await votingService.checkVoteStatus(proposalId);
        if (voteStatusResponse.success) {
          setHasVoted(voteStatusResponse.data.hasVoted);
        }
      } catch {
        // Vote status check failed
      }

      // Get user's vote choice and weight info
      try {
        const myVotesResponse = await votingService.getMyVotes();
        if (myVotesResponse.success) {
          const myVote = myVotesResponse.data.votes.find(v => v.proposalId === proposalId);
          if (myVote) {
            setUserVoteChoice(myVote.voteChoice);
            setUserVoteWeight(myVote.voteWeight);
            setUserTokensSpent(myVote.tokensSpent);
            setHasVoted(true);
          }
        }
      } catch {
        // My votes fetch failed
      }

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load proposal details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVote = async (proposalId: number, voteChoice: boolean) => {
    setIsVoting(true);
    setError(null);

    try {
      // Step 1: Cast vote on blockchain using MetaMask
      showToast('Please confirm the transaction in MetaMask...', 'info');
      
      const { blockchainService } = await import('../services');
      const txHash = await blockchainService.castVoteOnChain(proposalId, voteChoice);
      
      console.log(`✅ Vote recorded on blockchain: ${txHash}`);
      showToast('Vote recorded on blockchain! Updating database...', 'success');
      
      // Step 2: Update database with the transaction hash
      const response = await votingService.castVote(proposalId, voteChoice);
      
      if (response.success) {
        showToast(`Your vote (${voteChoice ? 'YES' : 'NO'}) has been recorded successfully!`, 'success');
        setHasVoted(true);
        setUserVoteChoice(voteChoice);
        setIsVoteModalOpen(false);
        
        // Refresh data
        await fetchData();
      }
    } catch (err: any) {
      console.error('Vote error:', err);
      
      // Handle different types of errors
      let errorMsg = 'Failed to submit vote. Please try again.';
      
      if (err.message.includes('rejected')) {
        errorMsg = 'Transaction was rejected. Please try again.';
      } else if (err.message.includes('already voted')) {
        errorMsg = 'You have already voted on this proposal.';
      } else if (err.message.includes('shareholder')) {
        errorMsg = 'You must be a registered shareholder to vote.';
      } else if (err.message.includes('not open')) {
        errorMsg = 'Voting is not currently open for this proposal.';
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      showToast(errorMsg, 'error');
      console.error(err);
    } finally {
      setIsVoting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">🟢 Active</span>;
      case 'upcoming':
        return <span className="badge badge-warning">🟡 Upcoming</span>;
      case 'ended':
        return <span className="badge badge-error">🔴 Ended</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="proposal-detail-container">
        <div className="loading-state">
          <LoadingSpinner size="lg" />
          <p>Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error && !proposal) {
    return (
      <div className="proposal-detail-container">
        <div className="error-state card">
          <div className="card-body">
            <h2>Error</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="proposal-detail-container">
        <div className="error-state card">
          <div className="card-body">
            <h2>Proposal Not Found</h2>
            <p>The proposal you're looking for doesn't exist.</p>
            <Link to="/shareholder" className="btn btn-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const yesVotes = results ? parseInt(results.yesVotes) : 0;
  const noVotes = results ? parseInt(results.noVotes) : 0;
  const totalVotes = results ? parseInt(results.totalVotes) : 0;
  const yesPercentage = results?.yesPercentage || 0;
  const noPercentage = results?.noPercentage || 0;

  return (
    <div className="proposal-detail-container">
      <div className="proposal-detail">
        <div className="proposal-header">
          <button className="btn btn-outline back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div className="proposal-title-section">
            <h1>{proposal.title}</h1>
            {getStatusBadge(proposal.status)}
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError(null)} className="alert-close">×</button>
          </div>
        )}

        <div className="proposal-content">
          <div className="card proposal-info-card">
            <div className="card-header">
              <h2 className="card-title">Proposal Details</h2>
            </div>
            <div className="card-body">
              <p className="proposal-description">
                {proposal.description || 'No description provided.'}
              </p>
              
              <div className="proposal-meta">
                <div className="meta-item">
                  <span className="meta-label">Proposal ID</span>
                  <span className="meta-value">#{proposal.proposalId}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Start Time</span>
                  <span className="meta-value">{formatDate(proposal.startTime)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">End Time</span>
                  <span className="meta-value">{formatDate(proposal.endTime)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Voting Status</span>
                  <span className="meta-value">
                    {proposal.votingOpen ? '🟢 Open' : '🔴 Closed'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card voting-card">
            <div className="card-header">
              <h2 className="card-title">Voting Results</h2>
            </div>
            <div className="card-body">
              <div className="voting-stats">
                <div className="vote-bar">
                  <div className="vote-bar-labels">
                    <span className="vote-yes-label">👍 Yes ({yesVotes})</span>
                    <span>{yesPercentage}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill yes" 
                      style={{ width: `${yesPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="vote-bar">
                  <div className="vote-bar-labels">
                    <span className="vote-no-label">👎 No ({noVotes})</span>
                    <span>{noPercentage}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill no" 
                      style={{ width: `${noPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="total-votes">
                  Total Votes: <strong>{totalVotes}</strong>
                </div>
              </div>

              {/* User Vote Status */}
              {hasVoted && (
                <div className={`voted-message ${userVoteChoice ? 'voted-yes' : 'voted-no'}`}>
                  <span className="vote-icon">{userVoteChoice ? '👍' : '👎'}</span>
                  <div className="vote-details">
                    <span>You voted: <strong>{userVoteChoice ? 'YES' : 'NO'}</strong></span>
                    {userVoteWeight !== null && userVoteWeight > 0 && (
                      <span className="vote-weight-detail">
                        {proposal?.votingType === 'quadratic' 
                          ? `(${userVoteWeight} vote${userVoteWeight > 1 ? 's' : ''}, cost: ${userTokensSpent || 0} tokens)`
                          : `(Weight: ${userVoteWeight} shares)`}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Vote Button for active proposals */}
              {proposal.status === 'active' && proposal.votingOpen && !hasVoted && user && (
                <div className="vote-actions">
                  <p className="vote-prompt">
                    {proposal?.votingType === 'quadratic'
                      ? <>Available tokens: <strong>{proposal?.baseTokens || 100} tokens</strong></>
                      : <>Your voting weight: <strong>{user.shares} shares</strong></>}
                  </p>
                  <button
                    className="btn btn-primary btn-lg vote-btn"
                    onClick={() => setIsVoteModalOpen(true)}
                  >
                    🗳️ Cast Your Vote
                  </button>
                </div>
              )}

              {/* Voting closed message */}
              {(proposal.status === 'ended' || !proposal.votingOpen) && !hasVoted && (
                <div className="closed-message">
                  <p>Voting for this proposal has ended</p>
                </div>
              )}

              {/* Upcoming message */}
              {proposal.status === 'upcoming' && (
                <div className="upcoming-message">
                  <p>Voting will open on {formatDate(proposal.startTime)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vote Modal */}
      <VoteModal
        proposal={proposal}
        isOpen={isVoteModalOpen}
        isVoting={isVoting}
        userShares={user?.shares || 0}
        onClose={() => setIsVoteModalOpen(false)}
        onVote={handleVote}
      />

      <style>{`
        .proposal-detail-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
        }

        .loading-state,
        .error-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .loading-state .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 1rem;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .proposal-header {
          margin-bottom: 1.5rem;
        }

        .back-btn {
          margin-bottom: 1rem;
        }

        .proposal-title-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .proposal-title-section h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          color: #1f2937;
        }

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-error { background: #fee2e2; color: #991b1b; }
        .badge-info { background: #dbeafe; color: #1e40af; }

        .alert {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .alert-error { background: #fee2e2; color: #991b1b; }
        .alert-success { background: #dcfce7; color: #166534; }

        .alert-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          opacity: 0.7;
          color: inherit;
        }

        .proposal-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .card-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .card-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
        }

        .card-body {
          padding: 1.5rem;
        }

        .proposal-description {
          color: #4b5563;
          line-height: 1.7;
          margin: 0;
        }

        .proposal-meta {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .meta-label {
          font-size: 0.8rem;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .meta-value {
          font-weight: 500;
          color: #374151;
        }

        .voting-stats {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .vote-bar {
          width: 100%;
        }

        .vote-bar-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .vote-yes-label { color: #16a34a; font-weight: 500; }
        .vote-no-label { color: #dc2626; font-weight: 500; }

        .progress-bar {
          height: 24px;
          background-color: #f3f4f6;
          border-radius: 9999px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .progress-fill.yes { background: linear-gradient(90deg, #22c55e, #16a34a); }
        .progress-fill.no { background: linear-gradient(90deg, #ef4444, #dc2626); }

        .total-votes {
          text-align: center;
          padding-top: 1rem;
          color: #6b7280;
          font-size: 0.95rem;
        }

        .voted-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1.5rem;
          font-size: 1rem;
        }

        .vote-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .vote-weight-detail {
          font-size: 0.85rem;
          opacity: 0.85;
        }

        .voted-message.voted-yes {
          background: #dcfce7;
          color: #166534;
        }

        .voted-message.voted-no {
          background: #fee2e2;
          color: #991b1b;
        }

        .vote-icon {
          font-size: 1.5rem;
        }

        .vote-actions {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        .vote-prompt {
          margin-bottom: 1rem;
          color: #6b7280;
        }

        .vote-btn {
          min-width: 200px;
        }

        .closed-message,
        .upcoming-message {
          margin-top: 1.5rem;
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
        }

        .closed-message {
          background: #f3f4f6;
          color: #6b7280;
        }

        .upcoming-message {
          background: #fef3c7;
          color: #92400e;
        }

        @media (max-width: 640px) {
          .proposal-detail-container {
            padding: 1rem;
          }

          .proposal-meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ProposalDetail;
