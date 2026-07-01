import { TimeEntry, TimeEntryPeriod, EmployeeTimeStats } from '@/types';
import { mockMachines } from '@/data/mockData';

const TIME_ENTRIES_PREFIX = 'time_entries_';

export const getTimeEntriesStorageKey = (machineId: string): string =>
  `${TIME_ENTRIES_PREFIX}${machineId}`;

export const loadTimeEntriesForMachine = (machineId: string): TimeEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(getTimeEntriesStorageKey(machineId)) || '[]') as TimeEntry[];
  } catch {
    return [];
  }
};

export const saveTimeEntriesForMachine = (machineId: string, entries: TimeEntry[]): void => {
  localStorage.setItem(getTimeEntriesStorageKey(machineId), JSON.stringify(entries));
};

/** Completed/approved/rejected entries may have deducted inventory for partsUsed. */
export const shouldRestoreInventoryOnDelete = (entry: TimeEntry): boolean =>
  entry.status !== 'active' && (entry.partsUsed?.some((p) => p.inventoryPartId) ?? false);

export interface TimeEntryWithMachine extends TimeEntry {
  machineName: string;
}

export const getMachineName = (machineId: string): string => {
  try {
    const stored = localStorage.getItem('dashboard_machines');
    const machines = stored ? JSON.parse(stored) : mockMachines;
    const machine = machines.find((m: { id: string }) => m.id === machineId);
    return machine?.name || machineId;
  } catch {
    return machineId;
  }
};

export const loadAllTimeEntries = (includeArchived = false): TimeEntryWithMachine[] => {
  const allEntries: TimeEntryWithMachine[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(TIME_ENTRIES_PREFIX)) continue;

      const machineId = key.replace(TIME_ENTRIES_PREFIX, '');
      const entries = JSON.parse(localStorage.getItem(key) || '[]') as TimeEntry[];
      const machineName = getMachineName(machineId);

      entries.forEach((entry) => {
        if (!includeArchived && entry.archived) return;
        allEntries.push({ ...entry, machineName });
      });
    }
  } catch (error) {
    console.error('Error loading time entries:', error);
  }

  return allEntries.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
};

export const loadArchivedTimeEntries = (): TimeEntryWithMachine[] => {
  return loadAllTimeEntries(true).filter((e) => e.archived);
};

export const saveTimeEntry = (entry: TimeEntry): void => {
  const key = `${TIME_ENTRIES_PREFIX}${entry.machineId}`;
  const existing = JSON.parse(localStorage.getItem(key) || '[]') as TimeEntry[];
  const index = existing.findIndex((e) => e.id === entry.id);
  const updated = index >= 0
    ? existing.map((e) => (e.id === entry.id ? entry : e))
    : [entry, ...existing];
  localStorage.setItem(key, JSON.stringify(updated));
};

export const deleteTimeEntry = (machineId: string, entryId: string): void => {
  const key = `${TIME_ENTRIES_PREFIX}${machineId}`;
  const existing = JSON.parse(localStorage.getItem(key) || '[]') as TimeEntry[];
  localStorage.setItem(key, JSON.stringify(existing.filter((e) => e.id !== entryId)));
};

export const archiveTimeEntry = (entry: TimeEntry, archivedBy: string): TimeEntry => {
  const archived: TimeEntry = {
    ...entry,
    archived: true,
    archivedAt: new Date().toISOString(),
    archivedBy,
  };
  saveTimeEntry(archived);
  return archived;
};

export const restoreTimeEntry = (entry: TimeEntry): TimeEntry => {
  const restored: TimeEntry = {
    ...entry,
    archived: false,
    archivedAt: undefined,
    archivedBy: undefined,
  };
  saveTimeEntry(restored);
  return restored;
};

export const getPeriodRange = (period: TimeEntryPeriod): { start: Date; end: Date } => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();

  if (period === 'week') {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'biweekly') {
    start.setDate(start.getDate() - 13);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end };
};

export const getPeriodLabel = (period: TimeEntryPeriod): string => {
  switch (period) {
    case 'week': return 'Denne uge';
    case 'biweekly': return 'Seneste 14 dage';
    case 'month': return 'Denne måned';
  }
};

export const isEntryInPeriod = (entry: TimeEntry, period: TimeEntryPeriod): boolean => {
  const { start, end } = getPeriodRange(period);
  const entryDate = new Date(entry.startTime);
  return entryDate >= start && entryDate <= end;
};

export const calculateEmployeeStats = (
  entries: TimeEntryWithMachine[],
  userId: string,
  userName: string,
  role: string,
  period: TimeEntryPeriod
): EmployeeTimeStats => {
  const periodEntries = entries.filter(
    (e) => e.userId === userId && e.status !== 'active' && isEntryInPeriod(e, period)
  );

  const totalMinutes = periodEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const approvedEntries = periodEntries.filter((e) => e.status === 'approved');
  const pendingEntries = periodEntries.filter((e) => e.status === 'completed');
  const rejectedEntries = periodEntries.filter((e) => e.status === 'rejected');

  const approvedMinutes = approvedEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const pendingMinutes = pendingEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const rejectedMinutes = rejectedEntries.reduce((sum, e) => sum + (e.duration || 0), 0);

  const { start, end } = getPeriodRange(period);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const machineMap = new Map<string, { machineId: string; machineName: string; minutes: number }>();
  periodEntries.forEach((e) => {
    const existing = machineMap.get(e.machineId);
    if (existing) {
      existing.minutes += e.duration || 0;
    } else {
      machineMap.set(e.machineId, {
        machineId: e.machineId,
        machineName: e.machineName,
        minutes: e.duration || 0,
      });
    }
  });

  return {
    userId,
    userName,
    role,
    totalMinutes,
    approvedMinutes,
    pendingMinutes,
    rejectedMinutes,
    entryCount: periodEntries.length,
    approvedCount: approvedEntries.length,
    pendingCount: pendingEntries.length,
    approvalRate: periodEntries.length > 0
      ? Math.round((approvedEntries.length / periodEntries.length) * 100)
      : 0,
    avgMinutesPerDay: Math.round(totalMinutes / days),
    machineBreakdown: Array.from(machineMap.values()).sort((a, b) => b.minutes - a.minutes),
  };
};

export const getStatusLabel = (status: TimeEntry['status']): string => {
  switch (status) {
    case 'active': return 'I gang';
    case 'completed': return 'Afventer godkendelse';
    case 'approved': return 'Godkendt';
    case 'rejected': return 'Afvist';
    default: return status;
  }
};

export const getStatusVariant = (
  status: TimeEntry['status']
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'active': return 'secondary';
    case 'completed': return 'outline';
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
};

export const toLocalDateValue = (isoString: string): string => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toLocalTimeValue = (isoString: string): string => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const toISOFromLocal = (dateValue: string, timeValue: string): string | undefined => {
  if (!dateValue || !timeValue) return undefined;
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hours, minutes] = timeValue.split(':').map(Number);
  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) return undefined;
  const localDate = new Date(year, month - 1, day, hours, minutes);
  if (Number.isNaN(localDate.getTime())) return undefined;
  return localDate.toISOString();
};
