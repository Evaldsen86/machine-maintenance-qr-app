import React from 'react';
import { Task, Machine, User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Truck,
  Clock,
  Wrench,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Circle,
  Package,
} from 'lucide-react';
import { translateType } from '@/utils/equipmentTranslations';
import { getStatusDetails } from '@/utils/equipmentTranslations';
import { sortTasksByPriority, TaskWithMachine } from '@/utils/taskSuggestionUtils';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface ManagerOverviewProps {
  machines: Machine[];
  technicians: User[];
  onTaskClick?: (task: Task, machine: Machine) => void;
}

const technicianRoles = ['technician', 'mechanic', 'blacksmith', 'admin'];

const ACTIVE_STATUSES = [
  'awaiting-parts',
  'ready-for-repair',
  'pending',
  'in-progress',
] as const;

const ManagerOverview: React.FC<ManagerOverviewProps> = ({
  machines,
  technicians,
  onTaskClick,
}) => {
  const eligibleTechnicians = technicians.filter((u) =>
    technicianRoles.includes(u.role)
  );

  const allTasks: TaskWithMachine[] = machines.flatMap((machine) =>
    (machine.tasks || []).map((task) => ({
      ...task,
      machineId: machine.id,
      machineName: machine.name,
    }))
  );

  const activeTasks = allTasks.filter((t) =>
    ACTIVE_STATUSES.includes(t.status as any)
  );

  const getTechnicianTasks = (techId: string) =>
    activeTasks.filter((t) => t.assignedTo === techId);

  const getUnassignedTasks = () =>
    activeTasks.filter((t) => !t.assignedTo).sort((a, b) => {
      const aVal = ['critical', 'high', 'medium', 'low'].indexOf(a.priority || 'medium');
      const bVal = ['critical', 'high', 'medium', 'low'].indexOf(b.priority || 'medium');
      return aVal - bVal;
    });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <ArrowUp className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Circle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <ArrowDown className="h-4 w-4 text-green-500" />;
      default:
        return <Circle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const machineMap = new Map(machines.map((m) => [m.id, m]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Lederens overblik
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Se alle teknikere, deres opgaver og prioriteringsrækkefølge. Let at
          forstå og overskueligt.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Ikke-tildelte opgaver */}
        {getUnassignedTasks().length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Opgaver uden tildeling ({getUnassignedTasks().length})
            </h3>
            <div className="space-y-2">
              {getUnassignedTasks().slice(0, 5).map((task) => {
                const machine = machineMap.get(task.machineId);
                if (!machine) return null;
                const statusDetails = getStatusDetails(task.status);
                const isBlocked = task.status === 'awaiting-parts';
                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                      isBlocked ? 'opacity-75 bg-amber-50/50' : 'bg-card'
                    }`}
                    onClick={() => onTaskClick?.(task, machine)}
                  >
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(task.priority || 'medium')}
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline">{task.machineName}</Badge>
                      <Badge variant={statusDetails.variant}>
                        {statusDetails.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Teknikere og deres opgaver */}
        <div className="space-y-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Teknikere og opgaver
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            {eligibleTechnicians.map((tech) => {
              const techTasks = getTechnicianTasks(tech.id);
              const sortedTasks = sortTasksByPriority(techTasks, tech.id);

              return (
                <div
                  key={tech.id}
                  className="rounded-lg border p-4 space-y-3 bg-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{tech.name}</span>
                    <Badge variant="secondary">{sortedTasks.length} opgaver</Badge>
                  </div>
                  {sortedTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Ingen aktive opgaver
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sortedTasks.map((task, idx) => {
                        const machine = machineMap.get(task.machineId);
                        if (!machine) return null;
                        const statusDetails = getStatusDetails(task.status);
                        const dueDate = new Date(task.dueDate);
                        const isOverdue =
                          dueDate < new Date() &&
                          !['completed', 'approved', 'invoiced'].includes(
                            task.status
                          );
                        return (
                          <div
                            key={task.id}
                            className={`flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50 text-sm ${
                              isOverdue ? 'border-red-200' : ''
                            }`}
                            onClick={() => onTaskClick?.(task, machine)}
                          >
                            <span className="text-muted-foreground w-5">
                              {idx + 1}.
                            </span>
                            {getPriorityIcon(task.priority || 'medium')}
                            <span className="truncate flex-1">{task.title}</span>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {task.machineName}
                            </Badge>
                            <Badge
                              variant={statusDetails.variant}
                              className="text-xs shrink-0"
                            >
                              {statusDetails.label}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManagerOverview;
