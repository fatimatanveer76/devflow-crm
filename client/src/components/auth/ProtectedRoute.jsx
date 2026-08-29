import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../features/auth/authSlice';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isInitialized } = useSelector(selectAuth);
  const location = useLocation();

  if (isLoading && !isInitialized) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: 'var(--primary-color)',
            animation: 'spin 1s linear infinite',
          }}
        />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Verifying session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
