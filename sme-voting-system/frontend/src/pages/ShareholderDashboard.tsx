function ShareholderDashboard() {
  return (
    <div className="shareholder-dashboard">
      <h1>Shareholder Dashboard Placeholder</h1>
      <p>This page will contain shareholder functionality:</p>
      <ul>
        <li>View active proposals</li>
        <li>Cast votes (weighted by shares)</li>
        <li>View voting history</li>
        <li>Check share balance</li>
      </ul>

      <style>{`
        .shareholder-dashboard {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }
        .shareholder-dashboard h1 {
          color: #4ade80;
          margin-bottom: 1rem;
        }
        .shareholder-dashboard ul {
          list-style: disc;
          margin-left: 2rem;
          margin-top: 1rem;
        }
        .shareholder-dashboard li {
          padding: 0.5rem 0;
        }
      `}</style>
    </div>
  )
}

export default ShareholderDashboard
