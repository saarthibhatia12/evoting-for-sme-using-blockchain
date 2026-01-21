import React, { useState, useEffect, useCallback } from 'react';
import { proposalService, votingService } from '../services';
import { 
  Proposal, 
  ProposalResult, 
  FinalResultResponse,
  TieResolutionType 
} from '../services/proposalService';
import { Vote, QuadraticResults } from '../services/votingService';
import { useAuth } from '../context/AuthContext';
import TieResolutionModal from './TieResolutionModal';

interface ProposalResultsViewProps {
  proposalId?: number;
}

const ProposalResultsView: React.FC<ProposalResultsViewProps> = ({ proposalId }) => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [results, setResults] = useState<ProposalResult | null>(null);
  const [quadraticResults, setQuadraticResults] = useState<QuadraticResults | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Tie Resolution State
  const [finalResult, setFinalResult] = useState<FinalResultResponse['data'] | null>(null);
  const [showTieModal, setShowTieModal] = useState(false);

  // Check if current user is admin
  const isAdmin = user?.isAdmin ?? false;

  // Fetch all proposals
  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await proposalService.getAllProposals();
      if (response.success) {
        setProposals(response.data.proposals);
        
        // If proposalId is provided or there's a proposal, select it
        if (proposalId) {
          const proposal = response.data.proposals.find(p => p.proposalId === proposalId);
          if (proposal) {
            setSelectedProposal(proposal);
          }
        } else if (response.data.proposals.length > 0) {
          setSelectedProposal(response.data.proposals[0]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch proposals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  // Fetch results for selected proposal
  const fetchResults = useCallback(async (proposal: Proposal) => {
    try {
      setLoadingResults(true);
      setError(null);
      setQuadraticResults(null); // Reset quadratic results
      setFinalResult(null); // Reset final result / tie status

      // Check if this is a quadratic voting proposal
      if (proposal.votingType === 'quadratic') {
        // Fetch quadratic-specific results
        try {
          const quadraticResponse = await votingService.getQuadraticResults(proposal.proposalId);
          if (quadraticResponse.success) {
            setQuadraticResults(quadraticResponse.data);
          }
        } catch (err) {
          console.error('Failed to fetch quadratic results:', err);
        }
      }

      // Also fetch standard results (for fallback/additional info)
      const resultsResponse = await proposalService.getProposalResults(proposal.proposalId);
      if (resultsResponse.success) {
        setResults(resultsResponse.data);
      }

      // Fetch final result (includes tie status) for ended proposals
      if (proposal.status === 'ended') {
        try {
          const finalResultResponse = await proposalService.getFinalResult(proposal.proposalId);
          if (finalResultResponse.success) {
            setFinalResult(finalResultResponse.data);
          }
        } catch (err) {
          console.error('Failed to fetch final result:', err);
        }
      }

      // Fetch vote breakdown
      try {
        const votesResponse = await votingService.getVotesForProposal(proposal.proposalId);
        if (votesResponse.success) {
          setVotes(votesResponse.data.votes);
        }
      } catch {
        // Votes might not be available
        setVotes([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch results');
      console.error(err);
    } finally {
      setLoadingResults(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  useEffect(() => {
    if (selectedProposal) {
      fetchResults(selectedProposal);
    }
  }, [selectedProposal, fetchResults]);

  const handleProposalSelect = (proposal: Proposal) => {
    setSelectedProposal(proposal);
  };

  // Handler for when a tie is resolved
  const handleTieResolved = (resolutionType: TieResolutionType) => {
    console.log('Tie resolved with:', resolutionType);
    // Refresh the results to show updated status
    if (selectedProposal) {
      fetchResults(selectedProposal);
    }
    setShowTieModal(false);
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
        return <span className="badge badge-default">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="proposal-results-view">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="proposal-results-view">
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      <div className="results-layout">
        {/* Proposal List */}
        <div className="proposal-list">
          <h3>All Proposals</h3>
          {proposals.length === 0 ? (
            <p className="empty-message">No proposals found</p>
          ) : (
            proposals.map((proposal) => (
              <div
                key={proposal.id}
                className={`proposal-item ${selectedProposal?.id === proposal.id ? 'selected' : ''}`}
                onClick={() => handleProposalSelect(proposal)}
              >
                <div className="proposal-item-header">
                  <span className="proposal-id">#{proposal.proposalId}</span>
                  {proposal.votingType === 'quadratic' && (
                    <span className="badge badge-quadratic">📊 Quadratic</span>
                  )}
                  {getStatusBadge(proposal.status)}
                </div>
                <h4>{proposal.title}</h4>
                <p className="proposal-time">Ends: {formatDate(proposal.endTime)}</p>
              </div>
            ))
          )}
        </div>

        {/* Results Panel */}
        <div className="results-panel">
          {loadingResults ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading results...</p>
            </div>
          ) : selectedProposal && results ? (
            <>
              <div className="results-header">
                <h2>{selectedProposal.title}</h2>
                {getStatusBadge(selectedProposal.status)}
              </div>

              {selectedProposal.description && (
                <p className="results-description">{selectedProposal.description}</p>
              )}

              <div className="results-meta">
                <div className="meta-item">
                  <span className="meta-label">Start</span>
                  <span className="meta-value">{formatDate(selectedProposal.startTime)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">End</span>
                  <span className="meta-value">{formatDate(selectedProposal.endTime)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Voting</span>
                  <span className="meta-value">{selectedProposal.votingOpen ? '🟢 Open' : '🔴 Closed'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Type</span>
                  <span className="meta-value">
                    {selectedProposal.votingType === 'quadratic' ? '📊 Quadratic' : '🗳️ Simple'}
                  </span>
                </div>
              </div>

              {/* Vote Stats - Different display for quadratic vs simple voting */}
              <div className="vote-stats card">
                <h3>
                  {selectedProposal.votingType === 'quadratic' 
                    ? '📊 Quadratic Voting Results' 
                    : '📊 Voting Results'}
                </h3>
                
                {/* QUADRATIC VOTING RESULTS */}
                {selectedProposal.votingType === 'quadratic' && quadraticResults ? (
                  <>
                    <div className="quadratic-info-banner">
                      <span className="info-icon">ℹ️</span>
                      <span>Quadratic voting: Voting power = √(tokens spent). This reduces the influence of large stakeholders.</span>
                    </div>
                    
                    <div className="stats-grid">
                      <div className="stat-card yes">
                        <span className="stat-icon">👍</span>
                        <span className="stat-value">{quadraticResults.yesVotingPower.toFixed(2)}</span>
                        <span className="stat-label">Yes Voting Power</span>
                        <span className="stat-percent">{quadraticResults.yesPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="stat-card no">
                        <span className="stat-icon">👎</span>
                        <span className="stat-value">{quadraticResults.noVotingPower.toFixed(2)}</span>
                        <span className="stat-label">No Voting Power</span>
                        <span className="stat-percent">{quadraticResults.noPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="stat-card total">
                        <span className="stat-icon">⚡</span>
                        <span className="stat-value">{quadraticResults.totalVotingPower.toFixed(2)}</span>
                        <span className="stat-label">Total Voting Power</span>
                      </div>
                    </div>

                    {/* Token Stats */}
                    <div className="token-stats">
                      <div className="token-stat">
                        <span className="token-label">🎟️ Total Tokens Spent:</span>
                        <span className="token-value">{quadraticResults.totalTokensSpent}</span>
                      </div>
                      <div className="token-stat">
                        <span className="token-label">👥 Total Voters:</span>
                        <span className="token-value">{quadraticResults.voterCount}</span>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="progress-section">
                      <div className="progress-bar-container">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill yes" 
                            style={{ width: `${quadraticResults.yesPercentage}%` }}
                          ></div>
                          <div 
                            className="progress-fill no" 
                            style={{ width: `${quadraticResults.noPercentage}%` }}
                          ></div>
                        </div>
                        <div className="progress-labels">
                          <span className="yes-label">Yes {quadraticResults.yesPercentage.toFixed(1)}%</span>
                          <span className="no-label">No {quadraticResults.noPercentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Winner indicator */}
                    {selectedProposal.status === 'ended' && (
                      <>
                        {/* Check if this is a tie situation */}
                        {finalResult?.isTied ? (
                          <>
                            {/* Tie has been resolved */}
                            {finalResult.tieResolutionType ? (
                              <div className={`winner-banner ${finalResult.status === 'APPROVED' ? 'passed' : 'rejected'}`}>
                                {finalResult.status === 'APPROVED' ? (
                                  <>✅ Proposal APPROVED via Chairperson's tie-breaking vote</>
                                ) : finalResult.tieResolutionType === 'STATUS_QUO_REJECT' ? (
                                  <>❌ Proposal REJECTED (Status Quo - Tie broken by maintaining status quo)</>
                                ) : (
                                  <>❌ Proposal REJECTED via Chairperson's tie-breaking vote</>
                                )}
                              </div>
                            ) : (
                              /* Tie is pending resolution */
                              <div className="tie-pending-section">
                                <div className="winner-banner tied">
                                  ⚖️ Voting ended in a TIE ({quadraticResults.yesVotingPower.toFixed(2)} vs {quadraticResults.noVotingPower.toFixed(2)})
                                </div>
                                {isAdmin ? (
                                  <div className="tie-admin-action">
                                    <p>As an Admin, you can resolve this tie:</p>
                                    <button 
                                      className="btn btn-primary resolve-tie-btn"
                                      onClick={() => setShowTieModal(true)}
                                    >
                                      ⚖️ Resolve Tie
                                    </button>
                                  </div>
                                ) : (
                                  <div className="tie-waiting-message">
                                    <span className="waiting-icon">⏳</span>
                                    <span>Awaiting Chairperson's decision to break the tie</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          /* Normal (non-tie) result */
                          <div className={`winner-banner ${quadraticResults.yesPercentage > quadraticResults.noPercentage ? 'passed' : 'rejected'}`}>
                            {quadraticResults.yesPercentage > quadraticResults.noPercentage ? (
                              <>✅ Proposal PASSED with {quadraticResults.yesPercentage.toFixed(1)}% approval</>
                            ) : (
                              <>❌ Proposal REJECTED with {quadraticResults.noPercentage.toFixed(1)}% against</>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  /* SIMPLE VOTING RESULTS */
                  <>
                    <div className="stats-grid">
                      <div className="stat-card yes">
                        <span className="stat-icon">👍</span>
                        <span className="stat-value">{parseInt(results.yesVotes).toLocaleString()}</span>
                        <span className="stat-label">Yes Votes</span>
                        <span className="stat-percent">{results.yesPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="stat-card no">
                        <span className="stat-icon">👎</span>
                        <span className="stat-value">{parseInt(results.noVotes).toLocaleString()}</span>
                        <span className="stat-label">No Votes</span>
                        <span className="stat-percent">{results.noPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="stat-card total">
                        <span className="stat-icon">🗳️</span>
                        <span className="stat-value">{parseInt(results.totalVotes).toLocaleString()}</span>
                        <span className="stat-label">Total Votes</span>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="progress-section">
                      <div className="progress-bar-container">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill yes" 
                            style={{ width: `${results.yesPercentage}%` }}
                          ></div>
                          <div 
                            className="progress-fill no" 
                            style={{ width: `${results.noPercentage}%` }}
                          ></div>
                        </div>
                        <div className="progress-labels">
                          <span className="yes-label">Yes {results.yesPercentage.toFixed(1)}%</span>
                          <span className="no-label">No {results.noPercentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Winner indicator */}
                    {selectedProposal.status === 'ended' && (
                      <>
                        {/* Check if this is a tie situation */}
                        {finalResult?.isTied ? (
                          <>
                            {/* Tie has been resolved */}
                            {finalResult.tieResolutionType ? (
                              <div className={`winner-banner ${finalResult.status === 'APPROVED' ? 'passed' : 'rejected'}`}>
                                {finalResult.status === 'APPROVED' ? (
                                  <>✅ Proposal APPROVED via Chairperson's tie-breaking vote</>
                                ) : finalResult.tieResolutionType === 'STATUS_QUO_REJECT' ? (
                                  <>❌ Proposal REJECTED (Status Quo - Tie broken by maintaining status quo)</>
                                ) : (
                                  <>❌ Proposal REJECTED via Chairperson's tie-breaking vote</>
                                )}
                              </div>
                            ) : (
                              /* Tie is pending resolution */
                              <div className="tie-pending-section">
                                <div className="winner-banner tied">
                                  ⚖️ Voting ended in a TIE ({parseInt(results.yesVotes)} vs {parseInt(results.noVotes)})
                                </div>
                                {isAdmin ? (
                                  <div className="tie-admin-action">
                                    <p>As an Admin, you can resolve this tie:</p>
                                    <button 
                                      className="btn btn-primary resolve-tie-btn"
                                      onClick={() => setShowTieModal(true)}
                                    >
                                      ⚖️ Resolve Tie
                                    </button>
                                  </div>
                                ) : (
                                  <div className="tie-waiting-message">
                                    <span className="waiting-icon">⏳</span>
                                    <span>Awaiting Chairperson's decision to break the tie</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          /* Normal (non-tie) result */
                          <div className={`winner-banner ${results.yesPercentage > results.noPercentage ? 'passed' : 'rejected'}`}>
                            {results.yesPercentage > results.noPercentage ? (
                              <>✅ Proposal PASSED with {results.yesPercentage.toFixed(1)}% approval</>
                            ) : (
                              <>❌ Proposal REJECTED with {results.noPercentage.toFixed(1)}% against</>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Individual Votes Table */}
              {votes.length > 0 && (
                <div className="votes-table-section card">
                  <h3>📝 Vote Breakdown</h3>
                  <div className="votes-table-container">
                    <table className="votes-table">
                      <thead>
                        <tr>
                          <th>Voter</th>
                          <th>Vote</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {votes.map((vote, index) => (
                          <tr key={index}>
                            <td>
                              <div className="voter-info">
                                {vote.shareholder?.name && (
                                  <span className="voter-name">{vote.shareholder.name}</span>
                                )}
                                <code>{formatAddress(vote.shareholder?.walletAddress || 'Unknown')}</code>
                              </div>
                            </td>
                            <td>
                              <span className={`vote-badge ${vote.voteChoice ? 'yes' : 'no'}`}>
                                {vote.voteChoice ? '👍 Yes' : '👎 No'}
                              </span>
                            </td>
                            <td>{formatDate(vote.votedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>Select a proposal to view results</p>
            </div>
          )}
        </div>
      </div>

      {/* Tie Resolution Modal */}
      {selectedProposal && finalResult && (
        <TieResolutionModal
          isOpen={showTieModal}
          proposalId={selectedProposal.proposalId}
          proposalTitle={selectedProposal.title}
          yesVotes={finalResult.yesVotes}
          noVotes={finalResult.noVotes}
          votingType={selectedProposal.votingType || 'simple'}
          onClose={() => setShowTieModal(false)}
          onResolved={handleTieResolved}
        />
      )}

      <style>{`
        .proposal-results-view {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .loading-state,
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
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
          padding: 0.75rem 1rem;
          margin: 1rem;
          border-radius: 8px;
        }

        .alert-error { background: #fee2e2; color: #991b1b; }
        .alert-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: inherit;
        }

        .results-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          min-height: 500px;
        }

        .proposal-list {
          border-right: 1px solid #e5e7eb;
          background: #f9fafb;
          padding: 1rem;
          overflow-y: auto;
          max-height: 600px;
        }

        .proposal-list h3 {
          margin: 0 0 1rem 0;
          font-size: 0.9rem;
          text-transform: uppercase;
          color: #6b7280;
          letter-spacing: 0.05em;
        }

        .empty-message {
          color: #9ca3af;
          font-size: 0.9rem;
        }

        .proposal-item {
          padding: 0.875rem;
          background: white;
          border-radius: 8px;
          margin-bottom: 0.5rem;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .proposal-item:hover {
          border-color: #dbeafe;
        }

        .proposal-item.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .proposal-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .proposal-id {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 600;
        }

        .proposal-item h4 {
          margin: 0;
          font-size: 0.95rem;
          color: #1f2937;
          line-height: 1.3;
        }

        .proposal-time {
          margin: 0.5rem 0 0 0;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .badge {
          display: inline-block;
          padding: 0.15rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-error { background: #fee2e2; color: #991b1b; }
        .badge-default { background: #f3f4f6; color: #4b5563; }

        .results-panel {
          padding: 1.5rem;
          overflow-y: auto;
        }

        .results-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .results-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #1f2937;
        }

        .results-header .badge {
          font-size: 0.8rem;
          padding: 0.25rem 0.75rem;
        }

        .results-description {
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .results-meta {
          display: flex;
          gap: 2rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
          margin-bottom: 1.5rem;
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
          font-weight: 500;
          color: #374151;
        }

        .card {
          background: #f9fafb;
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .card h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #374151;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .stat-card.yes { border-color: #86efac; }
        .stat-card.no { border-color: #fca5a5; }

        .stat-icon { font-size: 1.5rem; }
        .stat-value { font-size: 1.75rem; font-weight: 700; color: #1f2937; }
        .stat-label { font-size: 0.8rem; color: #6b7280; }
        .stat-percent { font-size: 1rem; font-weight: 600; color: #4b5563; margin-top: 0.25rem; }

        .stat-card.yes .stat-value { color: #16a34a; }
        .stat-card.no .stat-value { color: #dc2626; }

        .progress-section {
          margin-bottom: 1rem;
        }

        .progress-bar-container {
          width: 100%;
        }

        .progress-bar {
          display: flex;
          height: 32px;
          background: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
        }

        .progress-fill.yes { background: linear-gradient(90deg, #22c55e, #16a34a); }
        .progress-fill.no { background: linear-gradient(90deg, #ef4444, #dc2626); }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .yes-label { color: #16a34a; }
        .no-label { color: #dc2626; }

        .winner-banner {
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
          font-weight: 600;
          font-size: 1rem;
        }

        .winner-banner.passed { background: #dcfce7; color: #166534; }
        .winner-banner.rejected { background: #fee2e2; color: #991b1b; }
        .winner-banner.tied { background: #fef3c7; color: #92400e; }

        /* Tie Resolution Styles */
        .tie-pending-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .tie-admin-action {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
        }

        .tie-admin-action p {
          margin: 0 0 0.75rem 0;
          color: #1e40af;
          font-weight: 500;
        }

        .resolve-tie-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }

        .resolve-tie-btn:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .tie-waiting-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          color: #4b5563;
          font-weight: 500;
        }

        .waiting-icon {
          font-size: 1.25rem;
        }

        .votes-table-container {
          overflow-x: auto;
        }

        .votes-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .votes-table th,
        .votes-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .votes-table th {
          background: white;
          font-weight: 600;
          color: #374151;
          font-size: 0.8rem;
          text-transform: uppercase;
        }

        .votes-table code {
          background: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .voter-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .voter-name {
          font-weight: 500;
          color: #1f2937;
        }

        .vote-badge {
          display: inline-block;
          padding: 0.2rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .vote-badge.yes { background: #dcfce7; color: #166534; }
        .vote-badge.no { background: #fee2e2; color: #991b1b; }

        @media (max-width: 768px) {
          .results-layout {
            grid-template-columns: 1fr;
          }

          .proposal-list {
            max-height: 200px;
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .results-meta {
            flex-direction: column;
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ProposalResultsView;
