import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPortalProfile,
  updatePortalProfile,
  selectPortalProfile,
  selectPortalActionLoading,
  selectPortalError,
} from '../../features/portal/portalSlice';
import { selectCurrentUser } from '../../features/auth/authSlice';

export const ClientProfilePage = () => {
  const dispatch = useDispatch();
  const profile = useSelector(selectPortalProfile);
  const actionLoading = useSelector(selectPortalActionLoading);
  const error = useSelector(selectPortalError);
  const currentUser = useSelector(selectCurrentUser);

  const [formData, setFormData] = useState({
    name: '',
    contact_phone: '',
    address: '',
    industry: '',
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    dispatch(fetchPortalProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: currentUser?.name || '',
        contact_phone: profile.contact_phone || '',
        address: profile.address || '',
        industry: profile.industry || '',
      });
    }
  }, [profile, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveSuccess(false);
    const res = await dispatch(updatePortalProfile(formData));
    if (!res.error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
          Company &amp; Contact Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '6px' }}>
          Manage your organization's primary contact details for project communications and notices.
        </p>
      </div>

      {saveSuccess && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-sm)',
            color: '#10b981',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
          Profile contact details updated successfully.
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            background: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--status-danger)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      <div className="glass-card" style={{ padding: '28px', borderRadius: 'var(--radius-md)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Organization Name
              </label>
              <input
                type="text"
                value={profile?.company_name || 'Your Organization'}
                disabled
                style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Managed by your DevFlow account manager.
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Primary Contact Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Official Contact Email
              </label>
              <input
                type="email"
                value={currentUser?.email || ''}
                disabled
                style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Industry / Domain
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g. Financial Technology, Healthcare, E-Commerce"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Billing &amp; Corporate Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                placeholder="Street address, city, state, postal code, country..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={actionLoading}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
              {actionLoading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientProfilePage;
