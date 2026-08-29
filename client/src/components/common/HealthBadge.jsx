import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectSystemHealth,
  selectHealthLoading,
  selectHealthError,
  fetchSystemHealth,
} from '../../features/app/appSlice';

export const HealthBadge = () => {
  const dispatch = useDispatch();
  const health = useSelector(selectSystemHealth);
  const loading = useSelector(selectHealthLoading);
  const error = useSelector(selectHealthError);

  const handleRefresh = () => {
    dispatch(fetchSystemHealth());
  };

  if (loading && !health) {
    return (
      <div className="badge badge-info" title="Connecting to backend...">
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>sync</span>
        <span>Checking API...</span>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div
        className="badge badge-danger"
        style={{ cursor: 'pointer' }}
        onClick={handleRefresh}
        title={`Error: ${error || 'Backend offline'}. Click to retry.`}
      >
        <span className="status-dot"></span>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>cloud_off</span>
        <span>API Offline</span>
      </div>
    );
  }

  const isDbConnected = health.database?.status === 'connected';

  return (
    <div
      className="badge badge-success"
      style={{ cursor: 'pointer' }}
      onClick={handleRefresh}
      title={`Server: ${health.server} | Uptime: ${health.uptime} | DB: ${health.database?.status}. Click to refresh.`}
    >
      <span className="status-dot pulse"></span>
      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>cloud_done</span>
      <span>API Online</span>
      {isDbConnected ? (
        <span style={{ fontSize: '10px', opacity: 0.8 }}>(DB Ready)</span>
      ) : (
        <span style={{ fontSize: '10px', opacity: 0.8 }}>(DB Handshake Standby)</span>
      )}
    </div>
  );
};

export default HealthBadge;
