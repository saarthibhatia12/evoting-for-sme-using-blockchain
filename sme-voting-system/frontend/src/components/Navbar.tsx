import { Link } from 'react-router-dom'

interface NavbarProps {
  account: string | null
  onConnect: () => void
  onDisconnect: () => void
  isConnecting: boolean
}

function Navbar({ account, onConnect, onDisconnect, isConnecting }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🗳️ SME Voting</Link>
      </div>
      
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/admin">Admin</Link>
        <Link to="/shareholder">Shareholder</Link>
      </div>

      <div className="navbar-wallet">
        {account ? (
          <div className="wallet-connected">
            <span className="wallet-address">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
            <button onClick={onDisconnect} className="btn-disconnect">
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={onConnect} disabled={isConnecting} className="btn-connect">
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>

      <style>{`
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: #1a1a2e;
          border-bottom: 1px solid #333;
        }
        .navbar-brand a {
          font-size: 1.5rem;
          font-weight: bold;
          color: #fff;
          text-decoration: none;
        }
        .navbar-links {
          display: flex;
          gap: 2rem;
        }
        .navbar-links a {
          color: #888;
          text-decoration: none;
          transition: color 0.2s;
        }
        .navbar-links a:hover {
          color: #fff;
        }
        .navbar-wallet {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .wallet-connected {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .wallet-address {
          font-family: monospace;
          background: #333;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        .btn-connect {
          background: #646cff;
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-connect:hover {
          background: #535bf2;
        }
        .btn-disconnect {
          background: #dc3545;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn-disconnect:hover {
          background: #c82333;
        }
      `}</style>
    </nav>
  )
}

export default Navbar
