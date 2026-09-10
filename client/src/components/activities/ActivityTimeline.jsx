import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchActivities,
  selectActivities,
  selectActivitiesLoading,
} from '../../features/activities/activitiesSlice';

const ACTIVITY_ICONS = {
  task_created: { icon: 'add_task', color: '#10b981' },
  task_updated: { icon: 'edit_note', color: '#6366f1' },
  task_status_changed: { icon: 'published_with_changes', color: '#f59e0b' },
  task_completed: { icon: 'check_circle', color: '#10b981' },
  lead_created: { icon: 'person_add', color: '#06b6d4' },
  lead_updated: { icon: 'manage_accounts', color: '#6366f1' },
  lead_status_changed: { icon: 'sync_alt', color: '#f59e0b' },
  deal_created: { icon: 'monetization_on', color: '#10b981' },
  deal_updated: { icon: 'edit', color: '#6366f1' },
  deal_stage_changed: { icon: 'trending_up', color: '#8b5cf6' },
  deal_status_changed: { icon: 'change_circle', color: '#f59e0b' },
  project_created: { icon: 'rocket_launch', color: '#ec4899' },
  project_updated: { icon: 'edit_calendar', color: '#6366f1' },
  project_status_changed: { icon: 'update', color: '#f59e0b' },
  note_added: { icon: 'comment', color: '#06b6d4' },
  note_updated: { icon: 'edit_note', color: '#6366f1' },
};

const getIconMeta = (type) =>
  ACTIVITY_ICONS[type] || { icon: 'notifications', color: 'var(--text-secondary)' };

export const ActivityTimeline = ({ entityType, entityId, limit = 15 }) => {
  const dispatch = useDispatch();
  const activities = useSelector(selectActivities);
  const isLoading = useSelector(selectActivitiesLoading);

  useEffect(() => {
    const params = { limit };
    if (entityType && entityId) {
      params[`${entityType}_id`] = entityId;
    }
    dispatch(fetchActivities(params));
  }, [dispatch, entityType, entityId, limit]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--brand-primary)' }}>
          history
        </span>
        Activity History
      </h4>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Loading activities...
        </div>
      ) : activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
          No activities recorded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
          {activities.map((act) => {
            const meta = getIconMeta(act.type);
            return (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  padding: '10px 12px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: `${meta.color}18`,
                    color: meta.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {meta.icon}
                  </span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    {act.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      by {act.user?.name || act.user?.email || 'System'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      {new Date(act.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
