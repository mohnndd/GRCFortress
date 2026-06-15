import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './Dashboard.css';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, loadCurrentUser, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      loadCurrentUser().catch(() => {
        logout();
        navigate('/login', { replace: true });
      });
    }
  }, [user, loadCurrentUser, logout, navigate]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="brand-mark">GF</div>
        <div>
          <h1>GRC Fortress</h1>
          <p>Governance, Risk & Compliance Platform</p>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      <main className="dashboard-content">
        {user ? (
          <>
            <h2>Welcome, {user.fullName}</h2>
            <p>Username: {user.username}</p>
            <p>Email: {user.email}</p>
            <p>Roles: {user.roles.join(', ')}</p>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </main>
    </div>
  );
}
