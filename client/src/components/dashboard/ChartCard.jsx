import React from 'react';

/**
 * ChartCard — Container card for charts with title, icon, and empty-state handling
 */
export const ChartCard = ({ title, icon, subtitle, children, rightAction }) => {
  return (
    <div
      className="glass-card"
      style={{
        padding: '22px',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon && (
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--brand-primary)' }}>
                {icon}
              </span>
            )}
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {subtitle}
            </p>
          )}
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>

      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
};

/**
 * DonutChart — Pure SVG donut chart with legend and percentages
 * @param {Array<{ label: string, value: number, color: string }>} data
 * @param {string} centerLabel - Text in donut center (e.g. "Total")
 */
export const DonutChart = ({ data = [], centerLabel = 'Total' }) => {
  const total = data.reduce((acc, item) => acc + (Number(item.value) || 0), 0);

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: '6px', opacity: 0.6 }}>
          pie_chart
        </span>
        <div>No records available for this filter</div>
      </div>
    );
  }

  // Calculate SVG stroke segments
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
      {/* SVG Donut */}
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {/* Base track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--bg-tertiary)"
            strokeWidth={strokeWidth}
          />
          {/* Data segments */}
          {data.map((item, idx) => {
            const val = Number(item.value) || 0;
            if (val === 0) return null;
            const percent = val / total;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.4s ease' }}
              />
            );
          })}
        </svg>

        {/* Center Label */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
            {total}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', textTransform: 'uppercase' }}>
            {centerLabel}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '150px' }}>
        {data.map((item, idx) => {
          const val = Number(item.value) || 0;
          const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: item.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{item.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{val}</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * BarListChart — Horizontal progress distribution bars
 * @param {Array<{ label: string, value: number, subLabel: string, color: string }>} data
 */
export const BarListChart = ({ data = [] }) => {
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);

  if (data.length === 0 || data.every((d) => (Number(d.value) || 0) === 0)) {
    return (
      <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: '6px', opacity: 0.6 }}>
          bar_chart
        </span>
        <div>No records available for this filter</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {data.map((item, idx) => {
        const val = Number(item.value) || 0;
        const widthPct = Math.max(3, (val / max) * 100);

        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{val}</span>
                {item.subLabel && (
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{item.subLabel}</span>
                )}
              </div>
            </div>

            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'var(--bg-tertiary)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${widthPct}%`,
                  height: '100%',
                  background: item.color || 'var(--brand-primary)',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChartCard;
