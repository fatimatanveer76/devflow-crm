import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import { refreshSession } from './features/auth/authSlice';
import { selectAuthInitialized } from './features/auth/authSlice';

export const App = () => {
  const dispatch = useDispatch();
  const isInitialized = useSelector(selectAuthInitialized);

  useEffect(() => {
    // Attempt to restore session from HTTP-only refresh token cookie on every mount.
    // Resolves (success or failure) before rendering protected content.
    dispatch(refreshSession());
  }, [dispatch]);

  // Block render until we know whether the user has an active session.
  // This prevents the ProtectedRoute from briefly flashing the login redirect
  // for users who actually have a valid session.
  if (!isInitialized) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '16px',
          background: 'var(--bg-primary)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '3px solid rgba(99, 102, 241, 0.15)',
            borderTopColor: 'var(--accent-primary)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
          Initializing DevFlow CRM…
        </div>
      </div>
    );
  }

  return <AppRoutes />;
};

export default App;
