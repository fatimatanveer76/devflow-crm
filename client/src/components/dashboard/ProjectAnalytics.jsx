import React from 'react';
import { ChartCard, DonutChart, BarListChart } from './ChartCard';

const STATUS_COLORS = {
  planning: '#6366f1',
  active: '#10b981',
  on_hold: '#f59e0b',
  completed: '#06b6d4',
  cancelled: '#ef4444',
};

const PRIORITY_COLORS = {
  low: '#94a3b8',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
};

const formatCurrency = (amount) => {
  const n = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
};

export const ProjectAnalytics = ({ projects = {} }) => {
  const byStatus = projects.byStatus || {};
  const byPriority = projects.byPriority || {};

  const statusData = Object.keys(byStatus).map((status) => ({
    label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
    value: byStatus[status] || 0,
    color: STATUS_COLORS[status] || '#94a3b8',
  }));

  const priorityData = Object.keys(byPriority).map((priority) => ({
    label: priority.charAt(0).toUpperCase() + priority.slice(1),
    value: byPriority[priority] || 0,
    color: PRIORITY_COLORS[priority] || '#6366f1',
  }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      <ChartCard
        title="Projects by Status"
        icon="task_alt"
        subtitle={`Total Portfolio Budget: ${formatCurrency(projects.totalBudget || 0)}`}
      >
        <DonutChart data={statusData} centerLabel="Projects" />
      </ChartCard>

      <ChartCard
        title="Projects by Priority"
        icon="flag"
        subtitle="Priority allocation across ongoing initiatives"
      >
        <BarListChart data={priorityData} />
      </ChartCard>
    </div>
  );
};

export default ProjectAnalytics;
