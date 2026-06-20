import React from 'react';

export default function MetricCard({ label, value, small }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {small && <div className="metric-small">{small}</div>}
    </div>
  );
}
