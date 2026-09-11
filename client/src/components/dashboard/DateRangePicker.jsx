import React, { useState } from 'react';

const PRESET_RANGES = [
  { key: 'all',          label: 'All Time' },
  { key: 'today',        label: 'Today' },
  { key: 'this_week',    label: 'This Week' },
  { key: 'this_month',   label: 'This Month' },
  { key: 'last_30_days', label: 'Last 30 Days' },
  { key: 'this_year',    label: 'This Year' },
  { key: 'custom',       label: 'Custom' },
];

export const computeDateRange = (rangeKey) => {
  const now = new Date();
  let startDate = null;
  let endDate = new Date(now);

  if (rangeKey === 'today') {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  } else if (rangeKey === 'this_week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    startDate = new Date(now.setDate(diff));
    startDate.setHours(0, 0, 0, 0);
  } else if (rangeKey === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (rangeKey === 'last_30_days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (rangeKey === 'this_year') {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  return {
    startDate: startDate ? startDate.toISOString().split('T')[0] : null,
    endDate: endDate ? endDate.toISOString().split('T')[0] : null,
  };
};

export const DateRangePicker = ({
  activeKey = 'all',
  customStart,
  customEnd,
  onRangeChange,
  onRefresh,
  isLoading,
}) => {
  const [showCustom, setShowCustom] = useState(activeKey === 'custom');
  const [startInput, setStartInput] = useState(customStart || '');
  const [endInput, setEndInput] = useState(customEnd || '');

  const handleSelectPreset = (key) => {
    if (key === 'custom') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    const { startDate, endDate } = computeDateRange(key);
    onRangeChange(key, startDate, endDate);
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (startInput && endInput) {
      onRangeChange('custom', startInput, endInput);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-secondary)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            flexWrap: 'wrap',
          }}
        >
          {PRESET_RANGES.map((preset) => {
            const isActive = activeKey === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => handleSelectPreset(preset.key)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--brand-primary)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="btn btn-secondary"
          style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
          title="Refresh analytics"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '18px', animation: isLoading ? 'spin 1s linear infinite' : 'none' }}
          >
            refresh
          </span>
          Refresh
        </button>
      </div>

      {showCustom && (
        <form
          onSubmit={handleApplyCustom}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-tertiary)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
            <label style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>From:</label>
            <input
              type="date"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              style={{
                padding: '4px 8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
            <label style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>To:</label>
            <input
              type="date"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              style={{
                padding: '4px 8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '4px 12px', fontSize: '0.8rem' }}
            disabled={!startInput || !endInput}
          >
            Apply
          </button>
        </form>
      )}
    </div>
  );
};

export default DateRangePicker;
