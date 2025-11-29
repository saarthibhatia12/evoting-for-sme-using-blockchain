function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard Placeholder</h1>
      <p>This page will contain admin functionality:</p>
      <ul>
        <li>Create new proposals</li>
        <li>Manage shareholders</li>
        <li>View voting results</li>
        <li>Deploy voting contracts</li>
      </ul>

      <style>{`
        .admin-dashboard {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }
        .admin-dashboard h1 {
          color: #646cff;
          margin-bottom: 1rem;
        }
        .admin-dashboard ul {
          list-style: disc;
          margin-left: 2rem;
          margin-top: 1rem;
        }
        .admin-dashboard li {
          padding: 0.5rem 0;
        }
      `}</style>
    </div>
  )
}

export default AdminDashboard
