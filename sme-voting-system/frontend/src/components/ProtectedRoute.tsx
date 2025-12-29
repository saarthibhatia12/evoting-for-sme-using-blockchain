import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireShareholder?: boolean; // Block admins from shareholder-only pages
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireShareholder = false
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { account } = useWallet();
  const location = useLocation();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="protected-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
        <style>{`
          .protected-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: calc(100vh - 80px);
            gap: 1rem;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #646cff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Not connected to wallet
  if (!account) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && !user?.isAdmin) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <span className="access-icon">🚫</span>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p className="access-details">This page requires administrator privileges.</p>
          <a href="/shareholder" className="btn btn-primary">
            Go to Shareholder Dashboard
          </a>
        </div>
        <style>{`
          .access-denied {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: calc(100vh - 80px);
            padding: 2rem;
          }
          .access-denied-content {
            text-align: center;
            max-width: 400px;
          }
          .access-icon {
            font-size: 4rem;
            display: block;
            margin-bottom: 1rem;
          }
          .access-denied h2 {
            color: #dc3545;
            margin-bottom: 0.5rem;
          }
          .access-denied p {
            color: #666;
            margin-bottom: 0.5rem;
          }
          .access-details {
            font-size: 0.9rem;
            color: #999;
            margin-bottom: 1.5rem !important;
          }
          .btn {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: #646cff;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            transition: all 0.2s;
          }
          .btn:hover {
            background: #535bf2;
            transform: translateY(-1px);
          }
        `}</style>
      </div>
    );
  }

  // Block admins from shareholder-only pages
  if (requireShareholder && user?.isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Check if shareholder is active
  if (user && !user.isActive) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <span className="access-icon">⚠️</span>
          <h2>Account Inactive</h2>
          <p>Your shareholder account has been deactivated.</p>
          <p className="access-details">Please contact an administrator for assistance.</p>
        </div>
        <style>{`
          .access-denied {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: calc(100vh - 80px);
            padding: 2rem;
          }
          .access-denied-content {
            text-align: center;
            max-width: 400px;
          }
          .access-icon {
            font-size: 4rem;
            display: block;
            margin-bottom: 1rem;
          }
          .access-denied h2 {
            color: #f59e0b;
            margin-bottom: 0.5rem;
          }
          .access-denied p {
            color: #666;
            margin-bottom: 0.5rem;
          }
          .access-details {
            font-size: 0.9rem;
            color: #999;
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
