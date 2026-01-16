import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home">
      <div className="hero-section">
        <div className="icon-badge">🗳️</div>
        <h1>
          <span className="brand-text">SME Voting System</span>
        </h1>
        <p className="description">
          Blockchain-Based Secure Shareholder Voting
        </p>
      </div>

      <div className="cards">
        <Link to="/admin" className="card">
          <h2>👔 Admin Dashboard</h2>
          <p>Manage proposals and shareholders</p>
        </Link>

        <Link to="/shareholder" className="card">
          <h2>👥 Shareholder Dashboard</h2>
          <p>View proposals and cast votes</p>
        </Link>
      </div>

      <div className="features">
        <h2>Platform Features</h2>
        <ul>
          <li>
            <span className="feature-icon">🔐</span>
            <div className="feature-content">
              <strong>Secure Wallet Authentication</strong>
              <span className="feature-desc">MetaMask integration for secure blockchain access</span>
            </div>
          </li>
          <li>
            <span className="feature-icon">⚖️</span>
            <div className="feature-content">
              <strong>Share-Weighted Voting</strong>
              <span className="feature-desc">Votes weighted by shareholder ownership</span>
            </div>
          </li>
          <li>
            <span className="feature-icon">📊</span>
            <div className="feature-content">
              <strong>Quadratic Voting</strong>
              <span className="feature-desc">Fair voting with diminishing returns to prevent dominance</span>
            </div>
          </li>
          <li>
            <span className="feature-icon">🔍</span>
            <div className="feature-content">
              <strong>Transparent Records</strong>
              <span className="feature-desc">Immutable blockchain-backed voting history</span>
            </div>
          </li>
          <li>
            <span className="feature-icon">⏰</span>
            <div className="feature-content">
              <strong>Timed Proposals</strong>
              <span className="feature-desc">Automated voting periods with start/end times</span>
            </div>
          </li>
          <li>
            <span className="feature-icon">📈</span>
            <div className="feature-content">
              <strong>Real-Time Results</strong>
              <span className="feature-desc">Live voting results and analytics dashboard</span>
            </div>
          </li>
        </ul>
      </div>

      <style>{`
        :root {
          --primary: #4F46E5;
          --primary-dark: #4338ca;
          --bg-color: #f8fafc;
          --card-bg: #ffffff;
          --text-main: #0f172a;
          --text-muted: #64748b;
          --border-color: #e2e8f0;
        }

        .home {
          padding: 4rem 2rem;
          text-align: center;
          max-width: 1200px;
          margin: 0 auto;
          min-height: calc(100vh - 80px);
          display: flex;
          flex-direction: column;
          /* justify-content: center; Remove vertical centering for better scroll flow */
          background-color: var(--bg-color);
          color: var(--text-main);
        }

        .hero-section {
          margin-bottom: 5rem;
          padding-top: 2rem;
        }

        .icon-badge {
          font-size: 4.5rem;
          margin-bottom: 1.5rem;
          display: inline-block;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
        }

        .home h1 {
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          color: var(--text-main);
          line-height: 1.2;
        }

        .brand-text {
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: inline-block;
          padding-bottom: 0.2rem; /* Fix clipping */
        }

        .description {
          color: var(--text-muted);
          font-size: 1.35rem;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2.5rem;
          margin-bottom: 5rem;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }

        .card {
          background: var(--card-bg);
          padding: 3rem 2rem;
          border-radius: 20px;
          text-decoration: none;
          color: var(--text-main);
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: var(--primary);
        }

        .card h2 {
          margin-bottom: 1rem;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .card p {
          color: var(--text-muted);
          font-size: 1.1rem;
          line-height: 1.5;
        }

        .features {
          margin-top: 2rem;
          text-align: left;
          width: 100%;
          max-width: 1000px;
          margin-left: auto;
          margin-right: auto;
        }

        .features h2 {
          margin-bottom: 3rem;
          text-align: center;
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .features ul {
          list-style: none;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
          padding: 0;
        }

        .features li {
          background: var(--card-bg);
          padding: 1.5rem;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          border: 1px solid var(--border-color);
          transition: transform 0.2s ease;
        }

        .features li:hover {
          transform: scale(1.02);
          border-color: var(--primary);
        }

        .feature-icon {
          font-size: 2rem;
          flex-shrink: 0;
          width: 3.5rem;
          height: 3.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #EEF2FF; /* Light indigo background */
          border-radius: 12px;
          color: var(--primary);
        }

        .feature-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .feature-content strong {
          color: var(--text-main);
          font-weight: 700;
          font-size: 1.1rem;
          display: block;
          margin-bottom: 0.25rem;
        }

        .feature-desc {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .home {
            padding: 2rem 1rem;
          }
          .home h1 {
            font-size: 2.5rem;
          }
           .features ul {
            grid-template-columns: 1fr;
          }
          .features li {
            flex-direction: row;
            padding: 1.25rem;
          }
        }
      `}</style>
    </div>
  )
}

export default Home
