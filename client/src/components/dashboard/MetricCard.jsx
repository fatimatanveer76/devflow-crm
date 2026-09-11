import React from 'react';

/**
 * MetricCard — Displays an executive KPI metric with icon, formatted value, and secondary context
 */
export const MetricCard = ({
  icon,
  label,
  value,
  secondary,
  color = 'var(--brand-primary)',
  bg = 'rgba(99,102,241,0.12)',
  badge,
  badgeType = 'info',
}) => {
  return (
    <div
      className="glass-card"
      style={{
        padding: '20px',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              background: bg,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {icon}
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {label}
          </span>
        </div>

        {badge && (
          <span
            className={`badge badge-${badgeType}`}
            style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px' }}
          >
            {badge}
          </span>
        )}
      </div>

      <div>
        <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: '1.1' }}>
          {value}
        </div>
        {secondary && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {secondary}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
