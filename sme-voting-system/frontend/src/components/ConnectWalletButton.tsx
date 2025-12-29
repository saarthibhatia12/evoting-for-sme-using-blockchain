import React from 'react';
import { useWallet } from '../context/WalletContext';

interface ConnectWalletButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({ 
  className = '', 
  size = 'md',
  fullWidth = false 
}) => {
  const { 
    account, 
    isConnecting, 
    isMetaMaskInstalled,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchNetwork
  } = useWallet();

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  };

  // Not installed
  if (!isMetaMaskInstalled) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className={`connect-wallet-btn install ${sizeClasses[size]} ${className}`}
        style={{ width: fullWidth ? '100%' : 'auto' }}
      >
        🦊 Install MetaMask
      </a>
    );
  }

  // Connected
  if (account) {
    return (
      <div className={`connect-wallet-connected ${className}`}>
        {!isCorrectNetwork && (
          <button 
            onClick={switchNetwork}
            className={`connect-wallet-btn warning ${sizeClasses[size]}`}
          >
            ⚠️ Wrong Network
          </button>
        )}
        <span className="connect-wallet-address">
          {account.slice(0, 6)}...{account.slice(-4)}
        </span>
        <button 
          onClick={disconnectWallet}
          className={`connect-wallet-btn disconnect ${sizeClasses[size]}`}
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Not connected
  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className={`connect-wallet-btn connect ${sizeClasses[size]} ${className}`}
      style={{ width: fullWidth ? '100%' : 'auto' }}
    >
      {isConnecting ? (
        <>
          <span className="connect-wallet-spinner"></span>
          Connecting...
        </>
      ) : (
        '🦊 Connect Wallet'
      )}
    </button>
  );
};

// Styles for the component
const styles = `
  .connect-wallet-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .connect-wallet-btn.btn-sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  .connect-wallet-btn.btn-lg {
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
  }

  .connect-wallet-btn.connect {
    background: #646cff;
    color: white;
  }

  .connect-wallet-btn.connect:hover:not(:disabled) {
    background: #535bf2;
  }

  .connect-wallet-btn.connect:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .connect-wallet-btn.disconnect {
    background: #dc3545;
    color: white;
  }

  .connect-wallet-btn.disconnect:hover {
    background: #c82333;
  }

  .connect-wallet-btn.install {
    background: #f6851b;
    color: white;
  }

  .connect-wallet-btn.install:hover {
    background: #e2761b;
    text-decoration: none;
  }

  .connect-wallet-btn.warning {
    background: #f59e0b;
    color: white;
  }

  .connect-wallet-btn.warning:hover {
    background: #d97706;
  }

  .connect-wallet-connected {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .connect-wallet-address {
    font-family: monospace;
    background: #333;
    color: #fff;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .connect-wallet-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: connect-wallet-spin 0.8s linear infinite;
  }

  @keyframes connect-wallet-spin {
    to { transform: rotate(360deg); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'connect-wallet-styles';
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }
}

export default ConnectWalletButton;
