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
          padding: 2rem;
          text-align: center;
        }
        .home h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        .description {
          color: #888;
          margin-bottom: 3rem;
        }
        .cards {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }
        .card {
          background: #1a1a2e;
          padding: 2rem;
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          border: 1px solid #333;
          transition: all 0.2s;
          min-width: 250px;
        }
        .card:hover {
          border-color: #646cff;
          transform: translateY(-2px);
        }
        .card h2 {
          margin-bottom: 0.5rem;
          font-size: 1.3rem;
        }
        .card p {
          color: #888;
          font-size: 0.9rem;
        }
        .features {
          margin-top: 2rem;
          text-align: left;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        .features h2 {
          margin-bottom: 1rem;
          text-align: center;
        }
        .features ul {
          list-style: none;
        }
        .features li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #333;
        }
      `}</style>
    </div>
  )
}

export default Home
