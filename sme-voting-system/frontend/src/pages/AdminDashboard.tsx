import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { proposalService, shareholderService } from '../services';
import CreateProposalForm from '../components/CreateProposalForm';
import ShareholderManagement from '../components/ShareholderManagement';
import ProposalResultsView from '../components/ProposalResultsView';
import { Proposal } from '../services/proposalService';
import { LoadingSpinner } from '../components/ui';

type TabType = 'overview' | 'proposals' | 'shareholders' | 'results';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalProposals: 0,
    activeProposals: 0,
    totalShareholders: 0,
    totalShares: 0,
  });
  const [recentProposals, setRecentProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch proposals
      const proposalsRes = await proposalService.getAllProposals();
      if (proposalsRes.success) {
        const proposals = proposalsRes.data.proposals;
        const activeCount = proposals.filter(p => p.status === 'active').length;
        setStats(prev => ({
          ...prev,
          totalProposals: proposals.length,
          activeProposals: activeCount,
        }));
        // Get 5 most recent proposals
        setRecentProposals(proposals.slice(0, 5));
      }

      // Fetch shareholders
      const shareholdersRes = await shareholderService.getAllShareholders();
      if (shareholdersRes.success) {
        const shareholders = shareholdersRes.data.shareholders.filter(s => s.isActive);
        const totalShares = shareholders.reduce((sum, s) => sum + Number(s.shares || 0), 0);
        setStats(prev => ({
          ...prev,
          totalShareholders: shareholders.length,
          totalShares,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleProposalCreated = () => {
    setShowCreateForm(false);
    fetchStats();
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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderOverview = () => (
    <div className="overview-section">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalProposals}</span>
            <span className="stat-label">Total Proposals</span>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-icon">🗳️</div>
          <div className="stat-content">
            <span className="stat-value">{stats.activeProposals}</span>
            <span className="stat-label">Active Proposals</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalShareholders}</span>
            <span className="stat-label">Shareholders</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-value">{Number(stats.totalShares || 0).toLocaleString()}</span>
            <span className="stat-label">Total Shares</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button 
            className="action-card"
            onClick={() => { setActiveTab('proposals'); setShowCreateForm(true); }}
          >
            <span className="action-icon">📝</span>
            <span className="action-title">Create Proposal</span>
            <span className="action-desc">Create a new voting proposal</span>
          </button>
          <button 
            className="action-card"
            onClick={() => setActiveTab('shareholders')}
          >
            <span className="action-icon">👤</span>
            <span className="action-title">Add Shareholder</span>
            <span className="action-desc">Register a new shareholder</span>
          </button>
          <button 
            className="action-card"
            onClick={() => setActiveTab('results')}
          >
            <span className="action-icon">📈</span>
            <span className="action-title">View Results</span>
            <span className="action-desc">See voting results</span>
          </button>
        </div>
      </div>

      {/* Recent Proposals */}
      <div className="recent-proposals">
        <div className="section-header">
          <h2>Recent Proposals</h2>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setActiveTab('proposals')}
          >
            View All →
          </button>
        </div>
        {recentProposals.length === 0 ? (
          <p className="empty-message">No proposals yet. Create your first proposal!</p>
        ) : (
          <div className="proposals-list">
            {recentProposals.map((proposal) => (
              <div key={proposal.id} className="proposal-row">
                <div className="proposal-info">
                  <span className="proposal-id">#{proposal.proposalId}</span>
                  <h4>{proposal.title}</h4>
                </div>
                <div className="proposal-meta">
                  <span className="proposal-date">Ends: {formatDate(proposal.endTime)}</span>
                  {getStatusBadge(proposal.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProposals = () => (
    <div className="proposals-section">
      <div className="section-header">
        <h2>Manage Proposals</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '✕ Cancel' : '+ New Proposal'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form-wrapper">
          <CreateProposalForm
            onSuccess={handleProposalCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* All Proposals List */}
      <div className="all-proposals-list">
        <h3>All Proposals</h3>
        {recentProposals.length === 0 ? (
          <div className="empty-state">
            <p>No proposals found. Create your first proposal!</p>
          </div>
        ) : (
          <div className="proposals-table-container">
            <table className="proposals-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Voting</th>
                </tr>
              </thead>
              <tbody>
                {recentProposals.map((proposal) => (
                  <tr key={proposal.id}>
                    <td><strong>#{proposal.proposalId}</strong></td>
                    <td>{proposal.title}</td>
                    <td>{getStatusBadge(proposal.status)}</td>
                    <td>{formatDate(proposal.startTime)}</td>
                    <td>{formatDate(proposal.endTime)}</td>
                    <td>
                      {proposal.votingOpen ? (
                        <span className="voting-open">🟢 Open</span>
                      ) : (
                        <span className="voting-closed">🔴 Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderShareholders = () => (
    <div className="shareholders-section">
      <div className="section-header">
        <h2>Manage Shareholders</h2>
      </div>
      <ShareholderManagement onRefresh={fetchStats} />
    </div>
  );

  const renderResults = () => (
    <div className="results-section">
      <div className="section-header">
        <h2>Voting Results</h2>
      </div>
      <ProposalResultsView />
    </div>
  );

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🏛️ Admin Dashboard</h1>
          <p>Manage proposals, shareholders, and monitor voting activity</p>
        </div>
        <div className="admin-badge">
          <span className="badge badge-admin">👑 Admin</span>
          {user && (
            <span className="admin-address">
              {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposals')}
        >
          📝 Proposals
        </button>
        <button
          className={`tab ${activeTab === 'shareholders' ? 'active' : ''}`}
          onClick={() => setActiveTab('shareholders')}
        >
          👥 Shareholders
        </button>
        <button
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          📈 Results
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {loading && activeTab === 'overview' ? (
          <div className="loading-state">
            <LoadingSpinner size="lg" />
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'proposals' && renderProposals()}
            {activeTab === 'shareholders' && renderShareholders()}
            {activeTab === 'results' && renderResults()}
          </>
        )}
      </div>

      <style>{`
        .admin-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-content h1 {
          margin: 0 0 0.5rem 0;
          font-size: 1.75rem;
          color: #1f2937;
        }

        .header-content p {
          margin: 0;
          color: #6b7280;
        }

        .admin-badge {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .badge-admin {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #78350f;
          font-weight: 600;
        }

        .admin-address {
          font-size: 0.85rem;
          color: #6b7280;
          font-family: monospace;
        }

        .dashboard-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0;
        }

        .tab {
          padding: 0.875rem 1.5rem;
          background: none;
          border: none;
          font-size: 0.95rem;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: all 0.25s ease;
          border-radius: 8px 8px 0 0;
        }

        .tab:hover {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.04);
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background: rgba(59, 130, 246, 0.06);
        }

        .dashboard-content {
          min-height: 400px;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
        }

        .stat-card.active {
          border-color: rgba(34, 197, 94, 0.3);
          background: linear-gradient(135deg, rgba(240, 253, 244, 0.8), rgba(220, 252, 231, 0.5));
        }

        .stat-icon {
          font-size: 2rem;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
        }

        .stat-content {
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
          font-size: 0.85rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        /* Quick Actions */
        .quick-actions {
          margin-bottom: 2rem;
        }

        .quick-actions h2 {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          color: #374151;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .action-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 1.5rem;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .action-card:hover {
          border-color: rgba(59, 130, 246, 0.3);
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.12);
        }

        .action-icon {
          font-size: 1.75rem;
          margin-bottom: 0.75rem;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
          border-radius: 12px;
        }

        .action-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.35rem;
          font-size: 1rem;
        }

        .action-desc {
          font-size: 0.85rem;
          color: #6b7280;
          line-height: 1.4;
        }

        /* Recent Proposals */
        .recent-proposals {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          padding: 1.75rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .section-header h2 {
          margin: 0;
          font-size: 1.15rem;
          color: #374151;
          font-weight: 600;
        }

        .empty-message {
          color: #6b7280;
          text-align: center;
          padding: 2.5rem;
        }

        .proposals-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .proposal-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          background: linear-gradient(135deg, #f9fafb, #f3f4f6);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .proposal-row:hover {
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          transform: translateX(4px);
        }

        .proposal-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .proposal-id {
          font-size: 0.8rem;
          color: #9ca3af;
          font-weight: 600;
        }

        .proposal-info h4 {
          margin: 0;
          font-size: 0.95rem;
          color: #1f2937;
        }

        .proposal-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .proposal-date {
          font-size: 0.85rem;
          color: #6b7280;
        }

        /* Badges */
        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-error { background: #fee2e2; color: #991b1b; }
        .badge-default { background: #f3f4f6; color: #4b5563; }

        /* Buttons */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-outline {
          background: white;
          border: 1px solid #d1d5db;
          color: #374151;
        }

        .btn-outline:hover {
          background: #f3f4f6;
        }

        /* Proposals Section */
        .proposals-section,
        .shareholders-section,
        .results-section {
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .create-form-wrapper {
          margin-bottom: 2rem;
        }

        .all-proposals-list {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .all-proposals-list h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #374151;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }

        .proposals-table-container {
          overflow-x: auto;
        }

        .proposals-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .proposals-table th,
        .proposals-table td {
          padding: 0.875rem 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .proposals-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .voting-open { color: #16a34a; font-weight: 500; }
        .voting-closed { color: #dc2626; font-weight: 500; }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .admin-dashboard {
            padding: 1rem;
          }

          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .admin-badge {
            align-items: flex-start;
          }

          .dashboard-tabs {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .tab {
            white-space: nowrap;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .proposal-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
