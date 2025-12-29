import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui';
import '../styles/index.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { 
    account, 
    isConnecting, 
    isMetaMaskInstalled,
    isCorrectNetwork,
    error: walletError,
    connectWallet,
    switchNetwork,
    clearError 
  } = useWallet();

  const {
    user,
    isAuthenticated,
    isAuthenticating,
    authError,
    login,
    clearAuthError,
  } = useAuth();

  const handleConnect = async () => {
    try {
      clearError();
      await connectWallet();
      showToast('Wallet connected successfully!', 'success');
    } catch (err) {
      console.error('Connection error:', err);
      showToast('Failed to connect wallet', 'error');
    }
  };

  const handleSignIn = async () => {
    try {
      clearAuthError();
      await login();
      showToast('Successfully authenticated!', 'success');
      // Redirect based on user role
      if (user?.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/shareholder');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      showToast('Authentication failed. Please try again.', 'error');
    }
  };

  // Effect to redirect after successful login
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/shareholder');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Show wallet error toast
  React.useEffect(() => {
    if (walletError) {
      showToast(walletError, 'error');
    }
  }, [walletError, showToast]);

  // Show auth error toast
  React.useEffect(() => {
    if (authError) {
      showToast(authError, 'error');
    }
  }, [authError, showToast]);

  // If already authenticated, show navigation options
  if (isAuthenticated && user) {
    return (
      <div className="login-container">
        <div className="login-card card">
          <div className="card-body">
            <h1 className="login-title">Welcome, {user.name}!</h1>
            <p className="login-subtitle">You are authenticated</p>
            
            <div className="wallet-info">
              <span className="wallet-label">Wallet Address:</span>
              <span className="wallet-address">
                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </span>
              <div style={{ marginTop: '0.5rem' }}>
                <span className="wallet-label">Shares:</span>
                <span style={{ fontWeight: 600, marginLeft: '0.5rem' }}>{user.shares}</span>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <span className="wallet-label">Role:</span>
                <span className={`role-badge ${user.isAdmin ? 'admin' : 'shareholder'}`}>
                  {user.isAdmin ? 'Admin' : 'Shareholder'}
                </span>
              </div>
            </div>

            <div className="login-actions">
              {user.isAdmin && (
                <button 
                  className="btn btn-secondary btn-lg"
                  onClick={() => navigate('/admin')}
                >
                  Go to Admin Dashboard
                </button>
              )}
              <button 
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/shareholder')}
              >
                Go to Shareholder Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Wallet connected but not authenticated
  if (account && !isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card card">
          <div className="card-body">
            <div className="login-header">
              <div className="login-icon">🔐</div>
              <h1 className="login-title">Sign In</h1>
              <p className="login-subtitle">Authenticate with your wallet</p>
            </div>

            {!isCorrectNetwork && (
              <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                You are on the wrong network. 
                <button 
                  onClick={switchNetwork} 
                  className="btn btn-sm"
                  style={{ marginLeft: '0.5rem' }}
                >
                  Switch Network
                </button>
              </div>
            )}

            {authError && (
              <div className="alert alert-error">
                {authError}
                <button 
                  onClick={clearAuthError} 
                  style={{ 
                    marginLeft: '0.5rem', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: '1.1rem'
                  }}
                >
                  ×
                </button>
              </div>
            )}
            
            <div className="wallet-info">
              <span className="wallet-label">Connected Wallet:</span>
              <span className="wallet-address">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>

            <div className="login-content">
              <p className="login-description">
                Sign a message with your wallet to verify ownership and authenticate.
                This will not cost any gas.
              </p>

              <button
                className="btn btn-primary btn-lg connect-btn"
                onClick={handleSignIn}
                disabled={isAuthenticating || !isCorrectNetwork}
              >
                {isAuthenticating ? (
                  <>
                    <span className="spinner"></span>
                    Signing In...
                  </>
                ) : (
                  <>
                    ✍️ Sign Message to Authenticate
                  </>
                )}
              </button>

              <p className="login-help text-muted">
                A signature request will appear in MetaMask. Approve it to continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not connected - show connect wallet
  return (
    <div className="login-container">
      <div className="login-card card">
        <div className="card-body">
          <div className="login-header">
            <div className="login-icon">🗳️</div>
            <h1 className="login-title">SME Voting System</h1>
            <p className="login-subtitle">
              Blockchain-Based Secure Shareholder Voting
            </p>
          </div>

          {walletError && (
            <div className="alert alert-error">
              {walletError}
              <button 
                onClick={clearError} 
                style={{ 
                  marginLeft: '0.5rem', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontSize: '1.1rem'
                }}
              >
                ×
              </button>
            </div>
          )}

          <div className="login-content">
            {!isMetaMaskInstalled ? (
              <>
                <div className="metamask-not-found">
                  <p className="login-description">
                    MetaMask is required to use this application. 
                    Please install the MetaMask browser extension to continue.
                  </p>
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-lg connect-btn metamask-btn"
                  >
                    🦊 Install MetaMask
                  </a>
                </div>
              </>
            ) : (
              <>
                <p className="login-description">
                  Connect your MetaMask wallet to authenticate and access the voting system.
                </p>

                <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                  <strong>💡 Tip:</strong> To use a different account, first switch it in your MetaMask extension, 
                  then click "Connect Wallet" below.
                </div>

                <button
                  className="btn btn-primary btn-lg connect-btn"
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <span className="spinner"></span>
                      Connecting...
                    </>
                  ) : (
                    <>
                      🦊 Connect with MetaMask
                    </>
                  )}
                </button>

                <p className="login-help text-muted">
                  Make sure MetaMask is unlocked and you have an account ready.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-4);
        }

        .login-card {
          width: 100%;
          max-width: 440px;
        }

        .login-header {
          text-align: center;
          margin-bottom: var(--spacing-6);
        }

        .login-icon {
          font-size: 3rem;
          margin-bottom: var(--spacing-4);
        }

        .login-title {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          color: var(--color-gray-900);
          margin: 0 0 var(--spacing-2);
        }

        .login-subtitle {
          font-size: var(--font-size-base);
          color: var(--color-gray-500);
          margin: 0;
        }

        .login-content {
          text-align: center;
        }

        .login-description {
          color: var(--color-gray-600);
          margin-bottom: var(--spacing-6);
        }

        .connect-btn {
          width: 100%;
          gap: var(--spacing-2);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .metamask-btn {
          background-color: #f6851b;
          text-decoration: none;
        }

        .metamask-btn:hover {
          background-color: #e2761b;
          text-decoration: none;
        }

        .login-help {
          margin-top: var(--spacing-4);
          font-size: var(--font-size-sm);
        }

        .wallet-info {
          background-color: var(--color-gray-100);
          padding: var(--spacing-4);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-6);
          text-align: center;
        }

        .wallet-label {
          display: block;
          font-size: var(--font-size-sm);
          color: var(--color-gray-500);
          margin-bottom: var(--spacing-1);
        }

        .wallet-address {
          font-family: monospace;
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-gray-900);
        }

        .login-actions {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-3);
        }

        .metamask-not-found {
          padding: var(--spacing-4);
          background-color: #fff7ed;
          border-radius: var(--radius-md);
          border: 1px solid #fed7aa;
        }

        .role-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: var(--font-size-sm);
          font-weight: 500;
          margin-left: 0.5rem;
        }

        .role-badge.admin {
          background-color: #fef3c7;
          color: #92400e;
        }

        .role-badge.shareholder {
          background-color: #dbeafe;
          color: #1e40af;
        }
      `}</style>
    </div>
  );
};

export default Login;
