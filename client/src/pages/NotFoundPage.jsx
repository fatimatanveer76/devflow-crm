import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '32px',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--status-warning-bg)',
          color: 'var(--status-warning)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>
          search_off
        </span>
      </div>

      <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '8px' }}>404</h1>
      <h2 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Page Not Found
      </h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '480px', marginBottom: '28px' }}>
        The page or view you are attempting to access does not exist or has not yet been registered
        in the current phase.
      </p>

      <Link to="/" className="btn btn-primary">
        <span className="material-symbols-outlined">arrow_back</span>
        <span>Return to Architecture Hub</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
