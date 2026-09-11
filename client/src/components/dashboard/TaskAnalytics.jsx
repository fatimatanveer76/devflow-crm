import React from 'react';
import { ChartCard, DonutChart, BarListChart } from './ChartCard';

const STATUS_COLORS = {
  pending: '#6366f1',
  in_progress: '#f59e0b',
  completed: '#10b981',
  cancelled: '#ef4444',
};

const PRIORITY_COLORS = {
  low: '#94a3b8',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
};

export const TaskAnalytics = ({ tasks = {} }) => {
  const byStatus = tasks.byStatus || {};
  const byPriority = tasks.byPriority || {};

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

  const overdue = tasks.overdue || 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      <ChartCard
        title="Tasks by Status"
        icon="checklist"
        subtitle={
          overdue > 0 ? (
            <span style={{ color: 'var(--status-danger)', fontWeight: '700' }}>
              ⚠️ {overdue} overdue task{overdue > 1 ? 's' : ''} require attention
            </span>
          ) : (
            'Deliverables execution lifecycle'
          )
        }
      >
        <DonutChart data={statusData} centerLabel="Tasks" />
      </ChartCard>

      <ChartCard
        title="Tasks by Priority"
        icon="priority_high"
        subtitle="Workload urgency distribution"
      >
        <BarListChart data={priorityData} />
      </ChartCard>
    </div>
  );
};

export default TaskAnalytics;
