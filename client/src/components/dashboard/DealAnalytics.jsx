import React from 'react';
import { ChartCard, DonutChart, BarListChart } from './ChartCard';

const STAGE_COLORS = {
  prospecting: '#6366f1',
  qualification: '#06b6d4',
  proposal: '#8b5cf6',
  negotiation: '#f59e0b',
  closed_won: '#10b981',
  closed_lost: '#ef4444',
};

const formatCurrency = (amount) => {
  const n = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
};

export const DealAnalytics = ({ deals = {} }) => {
  const byStage = deals.byStage || {};
  const byStatus = deals.byStatus || {};

  const stageData = Object.keys(byStage).map((stage) => {
    const entry = byStage[stage] || { count: 0, value: 0 };
    return {
      label: stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' '),
      value: entry.count || 0,
      subLabel: formatCurrency(entry.value),
      color: STAGE_COLORS[stage] || '#6366f1',
    };
  });

  const statusData = [
    { label: 'Won', value: deals.wonValue || 0, color: '#10b981' },
    { label: 'Open', value: deals.openValue || 0, color: '#6366f1' },
    { label: 'Lost', value: deals.lostValue || 0, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      <ChartCard
        title="Deals by Pipeline Stage"
        icon="trending_up"
        subtitle="Active pipeline volume and stage valuation"
      >
        <BarListChart data={stageData} />
      </ChartCard>

      <ChartCard
        title="Pipeline Value Breakdown"
        icon="monetization_on"
        subtitle={`Total Volume: ${formatCurrency(deals.totalValue || 0)}`}
      >
        <DonutChart
          data={statusData.map((s) => ({
            label: s.label,
            value: s.value,
            color: s.color,
          }))}
          centerLabel="Value ($)"
        />
      </ChartCard>
    </div>
  );
};

export default DealAnalytics;
