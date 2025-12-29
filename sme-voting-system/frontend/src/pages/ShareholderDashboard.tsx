import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { proposalService, votingService } from '../services';
import { Proposal } from '../services/proposalService';
import { MyVote } from '../services/votingService';
import ProposalCard from '../components/ProposalCard';
import VoteModal from '../components/VoteModal';
import { useToast, LoadingSpinner } from '../components/ui';

interface VoteStatusMap {
  [proposalId: number]: {
    hasVoted: boolean;
    voteChoice?: boolean;
  };
}

const ShareholderDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  
  // State
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [myVotes, setMyVotes] = useState<MyVote[]>([]);
  const [voteStatusMap, setVoteStatusMap] = useState<VoteStatusMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Vote modal state
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'active' | 'all' | 'my-votes'>('active');

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch proposals and my votes in parallel
      const [proposalsResponse, votesResponse] = await Promise.all([
        proposalService.getAllProposals(),
        votingService.getMyVotes(),
      ]);

      // Build the vote status map from my votes first
      const statusMap: VoteStatusMap = {};
      
      if (votesResponse.success) {
        setMyVotes(votesResponse.data.votes);
        // Add all votes to status map with their choices
        votesResponse.data.votes.forEach((vote) => {
          statusMap[vote.proposalId] = {
            hasVoted: true,
            voteChoice: vote.voteChoice,
          };
        });
      }

      if (proposalsResponse.success) {
        setProposals(proposalsResponse.data.proposals);

        // Check vote status for active proposals we haven't voted on yet
        for (const proposal of proposalsResponse.data.proposals) {
          if (proposal.status === 'active' && !statusMap[proposal.proposalId]) {
            try {
              const statusResponse = await votingService.checkVoteStatus(proposal.proposalId);
              if (statusResponse.success) {
                statusMap[proposal.proposalId] = {
                  hasVoted: statusResponse.data.hasVoted,
                };
              }
            } catch {
              // Ignore individual status errors
            }
          }
        }
      }

      // Set the complete status map once
      setVoteStatusMap(statusMap);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle vote
  const handleOpenVoteModal = (proposalId: number) => {
    const proposal = proposals.find((p) => p.proposalId === proposalId);
    if (proposal) {
      setSelectedProposal(proposal);
      setIsVoteModalOpen(true);
    }
  };

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
        showToast(`Vote cast successfully! You voted ${voteChoice ? 'YES' : 'NO'}.`, 'success');
        
        // Update vote status
        setVoteStatusMap((prev) => ({
          ...prev,
          [proposalId]: { hasVoted: true, voteChoice },
        }));

        // Close modal
        setIsVoteModalOpen(false);
        setSelectedProposal(null);

        // Refresh data
        await fetchData();
        await refreshUser();
      }
    } catch (err: any) {
      console.error('Vote error:', err);
      
      // Handle different types of errors
      let errorMessage = 'Failed to cast vote. Please try again.';
      
      if (err.message.includes('rejected')) {
        errorMessage = 'Transaction was rejected. Please try again.';
      } else if (err.message.includes('already voted')) {
        errorMessage = 'You have already voted on this proposal.';
      } else if (err.message.includes('shareholder')) {
        errorMessage = 'You must be a registered shareholder to vote.';
      } else if (err.message.includes('not open')) {
        errorMessage = 'Voting is not currently open for this proposal.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsVoting(false);
    }
  };

  // Filter proposals based on active tab
  const getFilteredProposals = () => {
    switch (activeTab) {
      case 'active':
        return proposals.filter((p) => p.status === 'active');
      case 'all':
        return proposals;
      case 'my-votes':
        return proposals.filter((p) => voteStatusMap[p.proposalId]?.hasVoted);
      default:
        return proposals;
    }
  };

  const filteredProposals = getFilteredProposals();
  const activeProposalsCount = proposals.filter((p) => p.status === 'active').length;

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <LoadingSpinner size="xl" />
        <p>Loading dashboard...</p>
        <style>{`
          .dashboard-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: calc(100vh - 80px);
            gap: 1rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="shareholder-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Shareholder Dashboard</h1>
          <p className="header-subtitle">View proposals and cast your votes</p>
        </div>
      </div>

      {/* User Info Cards */}
      <div className="info-cards">
        <div className="info-card wallet-card">
          <div className="card-icon">👛</div>
          <div className="card-content">
            <span className="card-label">Wallet Address</span>
            <span className="card-value wallet-address">
              {user?.walletAddress.slice(0, 8)}...{user?.walletAddress.slice(-6)}
            </span>
          </div>
        </div>

        <div className="info-card shares-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <span className="card-label">Your Shares</span>
            <span className="card-value">{user?.shares || 0}</span>
          </div>
        </div>

        <div className="info-card votes-card">
          <div className="card-icon">🗳️</div>
          <div className="card-content">
            <span className="card-label">Votes Cast</span>
            <span className="card-value">{myVotes.length}</span>
          </div>
        </div>

        <div className="info-card active-card">
          <div className="card-icon">🟢</div>
          <div className="card-content">
            <span className="card-label">Active Proposals</span>
            <span className="card-value">{activeProposalsCount}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Proposals
          {activeProposalsCount > 0 && (
            <span className="tab-badge">{activeProposalsCount}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Proposals
        </button>
        <button
          className={`tab ${activeTab === 'my-votes' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-votes')}
        >
          My Votes
          {myVotes.length > 0 && (
            <span className="tab-badge">{myVotes.length}</span>
          )}
        </button>
      </div>

      {/* Proposals Grid */}
      <div className="proposals-section">
        {filteredProposals.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No proposals found</h3>
            <p>
              {activeTab === 'active' && 'There are no active proposals at the moment.'}
              {activeTab === 'all' && 'No proposals have been created yet.'}
              {activeTab === 'my-votes' && "You haven't voted on any proposals yet."}
            </p>
          </div>
        ) : (
          <div className="proposals-grid">
            {filteredProposals.map((proposal) => (
              <ProposalCard
                key={proposal.proposalId}
                proposal={proposal}
                hasVoted={voteStatusMap[proposal.proposalId]?.hasVoted}
                userVote={voteStatusMap[proposal.proposalId]?.voteChoice}
                onVote={handleOpenVoteModal}
                showVoteButton={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Vote Modal */}
      <VoteModal
        proposal={selectedProposal}
        isOpen={isVoteModalOpen}
        isVoting={isVoting}
        userShares={user?.shares || 0}
        onClose={() => {
          setIsVoteModalOpen(false);
          setSelectedProposal(null);
        }}
        onVote={handleVote}
      />

      <style>{`
        .shareholder-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          font-size: 1.75rem;
          color: #1f2937;
          margin: 0 0 0.5rem;
        }

        .header-subtitle {
          color: #6b7280;
          margin: 0;
        }

        .info-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .info-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .info-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
        }

        .card-icon {
          font-size: 2rem;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #f3f4f6;
        }

        .wallet-card .card-icon { background: linear-gradient(135deg, #ede9fe, #e0e7ff); }
        .shares-card .card-icon { background: linear-gradient(135deg, #dbeafe, #cffafe); }
        .votes-card .card-icon { background: linear-gradient(135deg, #dcfce7, #d1fae5); }
        .active-card .card-icon { background: linear-gradient(135deg, #fef3c7, #fef9c3); }

        .card-content {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .card-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 500;
        }

        .card-value {
          font-size: 1.35rem;
          font-weight: 700;
          color: #1f2937;
        }

        .wallet-address {
          font-family: monospace;
          font-size: 0.95rem;
        }

        .alert {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .alert-error {
          background: #fee2e2;
          color: #991b1b;
        }

        .alert-success {
          background: #dcfce7;
          color: #166534;
        }

        .alert-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          opacity: 0.7;
          color: inherit;
        }

        .alert-close:hover {
          opacity: 1;
        }

        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.75rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0;
        }

        .tab {
          padding: 0.875rem 1.5rem;
          background: none;
          border: none;
          font-size: 0.95rem;
          color: #6b7280;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.25s ease;
          font-weight: 500;
          border-radius: 8px 8px 0 0;
        }

        .tab:hover {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.04);
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          font-weight: 600;
          background: rgba(59, 130, 246, 0.06);
        }

        .tab-badge {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          font-size: 0.7rem;
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
        }

        .proposals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 1.75rem;
        }

        .empty-state {
          text-align: center;
          padding: 4.5rem 2rem;
          background: linear-gradient(135deg, #f9fafb, #f3f4f6);
          border-radius: 20px;
          border: 1px dashed #d1d5db;
        }

        .empty-icon {
          font-size: 4rem;
          display: block;
          margin-bottom: 1.25rem;
          filter: grayscale(0.3);
        }

        .empty-state h3 {
          color: #374151;
          margin: 0 0 0.75rem;
          font-weight: 600;
          font-size: 1.25rem;
        }

        .empty-state p {
          color: #6b7280;
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        @media (max-width: 640px) {
          .shareholder-dashboard {
            padding: 1rem;
          }

          .info-cards {
            grid-template-columns: 1fr 1fr;
          }

          .proposals-grid {
            grid-template-columns: 1fr;
          }

          .tabs {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default ShareholderDashboard;
