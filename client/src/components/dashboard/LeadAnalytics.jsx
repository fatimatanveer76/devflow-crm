import React from 'react';
import { ChartCard, DonutChart, BarListChart } from './ChartCard';

const STATUS_COLORS = {
  new: '#6366f1',
  contacted: '#06b6d4',
  qualified: '#10b981',
  lost: '#ef4444',
};

const SOURCE_COLORS = {
  website: '#6366f1',
  referral: '#10b981',
  linkedin: '#0284c7',
  cold_call: '#f59e0b',
  inbound: '#8b5cf6',
  unspecified: '#94a3b8',
};

export const LeadAnalytics = ({ leads = {} }) => {
  const byStatus = leads.byStatus || {};
  const bySource = leads.bySource || {};

  const statusData = Object.keys(byStatus).map((status) => ({
    label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
    value: byStatus[status] || 0,
    color: STATUS_COLORS[status] || '#94a3b8',
  }));

  const sourceData = Object.keys(bySource).map((src) => ({
    label: src.charAt(0).toUpperCase() + src.slice(1).replace('_', ' '),
    value: bySource[src] || 0,
    color: SOURCE_COLORS[src] || '#6366f1',
  }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      <ChartCard
        title="Leads by Status"
        icon="pie_chart"
        subtitle="Distribution across qualification lifecycle"
      >
        <DonutChart data={statusData} centerLabel="Leads" />
      </ChartCard>

      <ChartCard
        title="Leads by Source"
        icon="hub"
        subtitle="Acquisition channels and origin"
      >
        <BarListChart data={sourceData} />
      </ChartCard>
    </div>
  );
};

export default LeadAnalytics;
