import { MaintenanceStatus } from '../types';

export const STATUS_COLORS: Record<MaintenanceStatus, string> = {
  ok: '#2e7d32',
  due_soon: '#f57c00',
  overdue: '#c62828',
  broken: '#7b1fa2',
};

export const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  ok: 'Up to date',
  due_soon: 'Due soon',
  overdue: 'Overdue',
  broken: 'Broken',
};
