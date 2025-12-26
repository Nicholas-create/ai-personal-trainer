import type { PlanStatus } from '@/types/plan';

interface StatusBadgeProps {
  status: PlanStatus;
  size?: 'sm' | 'md';
}

const statusStyles: Record<
  PlanStatus,
  { bg: string; text: string; label: string; icon: string }
> = {
  active: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Active',
    icon: '✓',
  },
  paused: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    label: 'Paused',
    icon: '⏸',
  },
  archived: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    label: 'Archived',
    icon: '📦',
  },
  expired: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    label: 'Expired',
    icon: '⏰',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const style = statusStyles[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${style.bg} ${style.text} ${sizeClasses}`}
    >
      <span>{style.icon}</span>
      <span>{style.label}</span>
    </span>
  );
}
