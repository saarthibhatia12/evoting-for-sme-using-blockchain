// =============================================================================
// NAVBAR COMPONENT - Task 4.7
// Role-based navigation with mobile responsive hamburger menu
// =============================================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { 
    account, 
    isConnecting, 
    isMetaMaskInstalled, 
    isCorrectNetwork,
    error,
    connectWallet, 
    disconnectWallet,
    switchNetwork,
    clearError 
  } = useWallet();

  const {
    user,
    isAuthenticated,
    logout
  } = useAuth();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    disconnectWallet();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🗳️ SME Voting</Link>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
        aria-expanded={isMobileMenuOpen}
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>
      
      {/* Navigation Links */}
      <div className={`navbar-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="navbar-links">
          <Link to="/" className={isActiveRoute('/') ? 'active' : ''}>Home</Link>
          {isAuthenticated && user?.isAdmin && (
            <Link to="/admin" className={isActiveRoute('/admin') ? 'active' : ''}>Admin Dashboard</Link>
          )}
          {isAuthenticated && !user?.isAdmin && (
            <Link to="/shareholder" className={isActiveRoute('/shareholder') ? 'active' : ''}>My Dashboard</Link>
          )}
          {!isAuthenticated && (
            <Link to="/login" className={isActiveRoute('/login') ? 'active' : ''}>Login</Link>
          )}
        </div>

        <div className="navbar-wallet">
          {!isMetaMaskInstalled ? (
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-install"
            >
              Install MetaMask
            </a>
          ) : isAuthenticated && account ? (
            <div className="wallet-connected">
              {!isCorrectNetwork && (
                <button onClick={switchNetwork} className="btn-switch-network">
                  ⚠️ Wrong Network
                </button>
              )}
              <div className="user-info">
                {user && (
                  <span className={`role-tag ${user.isAdmin ? 'admin' : 'shareholder'}`}>
                    {user.isAdmin ? '👑 Admin' : '👤 Shareholder'}
                  </span>
                )}
                <span className="wallet-address">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
              <button onClick={handleLogout} className="btn-disconnect" title="Sign out">
                🚪 Disconnect
              </button>
            </div>
          ) : account ? (
            <div className="wallet-connected">
              <span className="wallet-address">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              <Link to="/login" className="btn-sign-in">
                ✍️ Sign In
              </Link>
            </div>
          ) : (
            <button 
              onClick={connectWallet} 
              disabled={isConnecting} 
              className="btn-connect"
            >
              {isConnecting ? (
                <>
                  <span className="spinner-small"></span>
                  Connecting...
                </>
              ) : (
                '🦊 Connect Wallet'
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="navbar-error">
          <span>⚠️ {error}</span>
          <button onClick={clearError} className="btn-close-error">×</button>
        </div>
      )}

      <style>{`
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .navbar-brand a {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          text-decoration: none;
          transition: all 0.2s ease;
          letter-spacing: -0.02em;
        }
        
        .navbar-brand a:hover {
          opacity: 0.9;
          text-decoration: none;
          transform: scale(1.02);
        }

        /* Hamburger Menu Button */
        .hamburger {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 28px;
          height: 20px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 1001;
        }

        .hamburger-line {
          width: 100%;
          height: 3px;
          background: #fff;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .hamburger.active .hamburger-line:nth-child(1) {
          transform: translateY(8.5px) rotate(45deg);
        }

        .hamburger.active .hamburger-line:nth-child(2) {
          opacity: 0;
        }

        .hamburger.active .hamburger-line:nth-child(3) {
          transform: translateY(-8.5px) rotate(-45deg);
        }

        /* Menu Container */
        .navbar-menu {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .navbar-links {
          display: flex;
          gap: 2rem;
        }
        
        .navbar-links a {
          color: rgba(255, 255, 255, 0.65);
          text-decoration: none;
          transition: all 0.2s ease;
          font-weight: 500;
          padding: 0.5rem 0;
          position: relative;
        }
        
        .navbar-links a:hover {
          color: #fff;
          text-decoration: none;
          transform: translateY(-1px);
        }

        .navbar-links a.active {
          color: #fff;
        }

        .navbar-links a.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #646cff, #a855f7);
          border-radius: 2px;
        }

        .navbar-wallet {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .wallet-connected {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .role-tag {
          font-size: 0.75rem;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .role-tag.admin {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #fff;
          box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
        }
        
        .role-tag.shareholder {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: #fff;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
        }
        
        .wallet-address {
          font-family: 'Consolas', 'Monaco', monospace;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.9rem;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .btn-connect {
          background: linear-gradient(135deg, #646cff, #535bf2);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(100, 108, 255, 0.3);
        }
        
        .btn-connect:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(100, 108, 255, 0.4);
        }
        
        .btn-connect:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .btn-sign-in {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .btn-sign-in:hover {
          transform: translateY(-1px);
          text-decoration: none;
        }
        
        .btn-disconnect {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
        }
        
        .btn-disconnect:hover {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
        }
        
        .btn-install {
          background: linear-gradient(135deg, #f6851b, #e2761b);
          color: white;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .btn-install:hover {
          transform: translateY(-1px);
          text-decoration: none;
        }
        
        .btn-switch-network {
          background: rgba(245, 158, 11, 0.1);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .btn-switch-network:hover {
          background: rgba(245, 158, 11, 0.2);
        }
        
        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .navbar-error {
          position: absolute;
          bottom: -48px;
          left: 50%;
          transform: translateX(-50%);
          background: #fee2e2;
          color: #991b1b;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.85rem;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          max-width: 90%;
        }
        
        .btn-close-error {
          background: none;
          border: none;
          color: #991b1b;
          cursor: pointer;
          font-size: 1.25rem;
          padding: 0;
          line-height: 1;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        
        .btn-close-error:hover {
          opacity: 1;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .navbar {
            padding: 1rem;
            flex-wrap: wrap;
          }

          .hamburger {
            display: flex;
          }

          .navbar-menu {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            flex-direction: column;
            padding: 1.5rem;
            gap: 1.5rem;
            border-top: 1px solid #333;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
          }

          .navbar-menu.open {
            display: flex;
          }

          .navbar-links {
            flex-direction: column;
            gap: 0.5rem;
            width: 100%;
          }

          .navbar-links a {
            display: block;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            transition: background 0.2s;
          }

          .navbar-links a:hover,
          .navbar-links a.active {
            background: rgba(255, 255, 255, 0.05);
          }

          .navbar-links a.active::after {
            display: none;
          }

          .navbar-wallet {
            width: 100%;
            justify-content: center;
            padding-top: 1rem;
            border-top: 1px solid #333;
          }

          .wallet-connected {
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
          }

          .user-info {
            flex-direction: column;
            align-items: center;
          }

          .btn-connect,
          .btn-install {
            width: 100%;
            justify-content: center;
          }

          .navbar-error {
            position: fixed;
            bottom: 1rem;
            top: auto;
            left: 1rem;
            right: 1rem;
            transform: none;
            max-width: none;
          }
        }

        @media (max-width: 480px) {
          .navbar-brand a {
            font-size: 1.25rem;
          }

          .wallet-address {
            font-size: 0.8rem;
            padding: 0.4rem 0.75rem;
          }
        }
      `}</style>
    </nav>
  )
}

export default Navbar
