export const JOB_STATUS_BADGE: Record<string, { bg: string; text: string; ring: string; dot: string; label: string }> = {
  SCHEDULED: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-500/20', dot: 'bg-blue-500', label: 'Scheduled' },
  EN_ROUTE: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-500/20', dot: 'bg-amber-500', label: 'En Route' },
  IN_PROGRESS: { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'ring-cyan-500/20', dot: 'bg-cyan-500', label: 'In Progress' },
  COMPLETED: { bg: 'bg-green-50', text: 'text-green-600', ring: 'ring-green-500/20', dot: 'bg-green-500', label: 'Completed' },
};

export const PRIORITY_BADGE: Record<string, string> = {
  EMERGENCY: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  NORMAL: 'bg-gray-100 text-neutral-500',
  LOW: 'bg-blue-50 text-blue-600',
};
