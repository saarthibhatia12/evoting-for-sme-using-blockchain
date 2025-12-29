import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home">
      <h1>🗳️ SME Voting System</h1>
      <p className="description">
        Blockchain-Based Secure Shareholder Voting
      </p>

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
        <h2>Features</h2>
        <ul>
          <li>✅ Weighted voting based on shares</li>
          <li>✅ Secure wallet authentication</li>
          <li>✅ Transparent voting records</li>
          <li>✅ Admin proposal management</li>
        </ul>
      </div>

      <style>{`
        .home {
          padding: 3rem 2rem;
          text-align: center;
          max-width: 900px;
          margin: 0 auto;
        }
        .home h1 {
          font-size: 2.75rem;
          margin-bottom: 0.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .description {
          color: #6b7280;
          margin-bottom: 3.5rem;
          font-size: 1.1rem;
          line-height: 1.6;
        }
        .cards {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 3.5rem;
          flex-wrap: wrap;
        }
        .card {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 2.25rem;
          border-radius: 20px;
          text-decoration: none;
          color: inherit;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-width: 260px;
          position: relative;
          overflow: hidden;
        }
        .card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(100, 108, 255, 0.1) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .card:hover {
          border-color: rgba(100, 108, 255, 0.5);
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(100, 108, 255, 0.2), 0 8px 16px rgba(0, 0, 0, 0.3);
        }
        .card:hover::before {
          opacity: 1;
        }
        .card h2 {
          margin-bottom: 0.75rem;
          font-size: 1.35rem;
          font-weight: 600;
          position: relative;
        }
        .card p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
          position: relative;
          line-height: 1.5;
        }
        .features {
          margin-top: 3rem;
          text-align: left;
          max-width: 450px;
          margin-left: auto;
          margin-right: auto;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.75rem;
        }
        .features h2 {
          margin-bottom: 1.25rem;
          text-align: center;
          font-size: 1.25rem;
          font-weight: 600;
        }
        .features ul {
          list-style: none;
        }
        .features li {
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }
        .features li:hover {
          padding-left: 0.5rem;
          color: #a5b4fc;
        }
        .features li:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  )
}

export default Home
