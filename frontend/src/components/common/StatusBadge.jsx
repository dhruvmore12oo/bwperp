import React from 'react';

/**
 * Reusable StatusBadge component
 * Follows design system token requirement: uses 'IBM Plex Mono' font and designated colors.
 */
export function StatusBadge({ status, label }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase().trim();
  const displayLabel = label || status.replace(/_/g, ' ').toUpperCase();

  let badgeClass = 'badge ';

  switch (normalized) {
    // Sales order stages & Job stages
    case 'demand':
      badgeClass += 'badge-demand';
      break;
    case 'procurement':
      badgeClass += 'badge-procurement';
      break;
    case 'production':
    case 'in_progress':
      badgeClass += 'badge-production';
      break;
    case 'qc':
      badgeClass += 'badge-qc';
      break;
    case 'delivered':
    case 'done':
    case 'received':
    case 'active':
      badgeClass += 'badge-delivered';
      break;
    case 'on_hold':
    case 'pending':
      badgeClass += 'badge-on_hold';
      break;
    case 'cancelled':
    case 'inactive':
      badgeClass += 'badge-cancelled';
      break;
    case 'queued':
      badgeClass += 'badge-queued';
      break;
    default:
      badgeClass += 'badge-demand';
      break;
  }

  return (
    <span className={badgeClass} title={`Status: ${displayLabel}`}>
      {displayLabel}
    </span>
  );
}
