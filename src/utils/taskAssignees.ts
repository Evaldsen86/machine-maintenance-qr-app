import { Task } from '@/types';

function uniqueOrderedIds(ids: string[]): string[] {
  return [...new Set(ids.filter((x) => typeof x === 'string' && x.length > 0))];
}

/**
 * Samler alle tildelte bruger-id'er (`assignedTo` + `assignedToIds`, unikke, rækkefølge bevares).
 */
export function getTaskAssigneeIds(task: Task): string[] {
  const primary = task.assignedTo;
  const extra = task.assignedToIds;
  if (extra?.length) {
    return uniqueOrderedIds([...(primary ? [primary] : []), ...extra]);
  }
  if (primary) {
    return [primary];
  }
  return [];
}

export function taskHasAssignees(task: Task): boolean {
  return getTaskAssigneeIds(task).length > 0;
}

export function isTaskAssignedTo(task: Task, userId: string | undefined): boolean {
  if (!userId) return false;
  return getTaskAssigneeIds(task).includes(userId);
}

export function isTaskAssignedToCurrentUser(
  task: Task,
  user: { id?: string; name?: string } | null | undefined
): boolean {
  if (!user) return false;
  const ids = getTaskAssigneeIds(task);
  if (user.id && ids.includes(user.id)) return true;
  if (user.name && ids.includes(user.name)) return true;
  return false;
}

/**
 * Til persistens: ét felt = kun `assignedTo`; flere = `assignedTo` (primær) + fuld liste i `assignedToIds`.
 */
export function assigneesPayloadFromIds(ids: string[]): Pick<Task, 'assignedTo' | 'assignedToIds'> {
  const u = uniqueOrderedIds(ids);
  if (u.length === 0) {
    return { assignedTo: undefined, assignedToIds: undefined };
  }
  if (u.length === 1) {
    return { assignedTo: u[0], assignedToIds: undefined };
  }
  return { assignedTo: u[0], assignedToIds: u };
}

/** Tilføj bruger til listen hvis ny; ellers `null` (fx allerede tildelt eller manglende id). */
export function addAssigneeToTask(task: Task, userId: string | undefined): Task | null {
  if (!userId) return null;
  const current = getTaskAssigneeIds(task);
  if (current.includes(userId)) return null;
  return { ...task, ...assigneesPayloadFromIds([...current, userId]) };
}

export function formatTaskAssignees(task: Task, nameLookup: (userId: string) => string): string {
  const ids = getTaskAssigneeIds(task);
  if (ids.length === 0) return '';
  return ids.map(nameLookup).join(', ');
}
