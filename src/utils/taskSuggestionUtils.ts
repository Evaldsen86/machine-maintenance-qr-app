import { Task, TaskPriority } from '@/types';
import { isTaskVisibleForTechnicians } from '@/utils/equipmentTranslations';

export interface TaskWithMachine extends Task {
  machineId: string;
  machineName: string;
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Beregner en score for hvilken opgave en tekniker bør tage næste.
 * Højere score = bedre forslag.
 * Faktorer: prioritet, deadline-nærhed, status (in-progress først hvis allerede tildelt)
 */
export function calculateTaskScore(
  task: TaskWithMachine,
  technicianId: string | undefined,
  now: Date = new Date()
): number {
  if (!isTaskVisibleForTechnicians(task.status)) return -1;

  let score = 0;

  // Prioritet (0-40 point)
  const priorityValue = PRIORITY_WEIGHT[task.priority || 'medium'];
  score += priorityValue * 10;

  // Deadline-nærhed: jo tættere på deadline, jo højere score (0-30 point)
  const dueDate = new Date(task.dueDate);
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilDue < 0) score += 30; // Forfalden = højeste
  else if (daysUntilDue <= 3) score += 25;
  else if (daysUntilDue <= 7) score += 15;
  else if (daysUntilDue <= 14) score += 5;

  // Allerede tildelt denne tekniker = bonus (20 point) – undgå at skifte opgave
  if (task.assignedTo === technicianId && task.status === 'in-progress') {
    score += 20;
  } else if (task.assignedTo === technicianId) {
    score += 10;
  }

  // Ikke tildelt nogen = lidt bonus for at fordele arbejde (5 point)
  if (!task.assignedTo) score += 5;

  return score;
}

/**
 * Foreslår næste opgave for en tekniker baseret på prioritet, tilgængelighed og status.
 */
export function suggestNextTask(
  tasks: TaskWithMachine[],
  technicianId: string | undefined
): TaskWithMachine | null {
  const visibleTasks = tasks.filter((t) => isTaskVisibleForTechnicians(t.status));
  if (visibleTasks.length === 0) return null;

  const now = new Date();
  const scored = visibleTasks.map((task) => ({
    task,
    score: calculateTaskScore(task, technicianId, now),
  }));

  const best = scored
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score)[0];

  return best?.task ?? null;
}

/**
 * Sorterer opgaver i prioriteret rækkefølge for en tekniker.
 */
export function sortTasksByPriority(
  tasks: TaskWithMachine[],
  technicianId: string | undefined
): TaskWithMachine[] {
  const visible = tasks.filter((t) => isTaskVisibleForTechnicians(t.status));
  const now = new Date();
  return [...visible].sort((a, b) => {
    const scoreA = calculateTaskScore(a, technicianId, now);
    const scoreB = calculateTaskScore(b, technicianId, now);
    return scoreB - scoreA;
  });
}
