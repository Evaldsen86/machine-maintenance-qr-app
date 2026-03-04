import React from 'react';
import { Task, Machine, User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wrench,
  Clock,
  User as UserIcon,
  Truck,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Circle,
} from 'lucide-react';
import { translateType } from '@/utils/equipmentTranslations';
import { getStatusDetails } from '@/utils/equipmentTranslations';
import {
  sortTasksByPriority,
  suggestNextTask,
  TaskWithMachine,
} from '@/utils/taskSuggestionUtils';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface TechnicianTaskListProps {
  machines: Machine[];
  technicians: User[];
  selectedTechnicianId: string | null;
  onTechnicianSelect?: (technicianId: string | null) => void;
  onTaskClick?: (task: Task, machine: Machine) => void;
}

const technicianRoles = ['technician', 'mechanic', 'blacksmith', 'admin'];

const TechnicianTaskList: React.FC<TechnicianTaskListProps> = ({
  machines,
  technicians,
  selectedTechnicianId,
  onTechnicianSelect,
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

  const getTechnicianTasks = (techId: string) =>
    allTasks.filter((t) => t.assignedTo === techId);

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

  const renderTechnicianTasks = (tech: User) => {
    const techTasks = getTechnicianTasks(tech.id);
    const sortedTasks = sortTasksByPriority(techTasks, tech.id);
    const suggestedTask = suggestNextTask(allTasks, tech.id);
    const machineMap = new Map(machines.map((m) => [m.id, m]));

    if (sortedTasks.length === 0) {
      return (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Ingen planlagte opgaver. Teknikeren kan tage nye opgaver fra listen.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {suggestedTask && suggestedTask.assignedTo !== tech.id && (
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
              <Lightbulb className="h-4 w-4" />
              Forslag: Tag denne opgave næste
            </div>
            {(() => {
              const machine = machineMap.get(suggestedTask.machineId);
              if (!machine) return null;
              return (
                <div
                  className="flex items-center justify-between p-3 rounded-lg bg-background border cursor-pointer hover:bg-muted/50"
                  onClick={() => onTaskClick?.(suggestedTask, machine)}
                >
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(suggestedTask.priority || 'medium')}
                    <span className="font-medium">{suggestedTask.title}</span>
                    <Badge variant="outline">{suggestedTask.machineName}</Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              );
            })()}
          </div>
        )}

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Prioriteret rækkefølge
          </div>
          {sortedTasks.map((task, index) => {
            const machine = machineMap.get(task.machineId);
            if (!machine) return null;
            const statusDetails = getStatusDetails(task.status);
            const dueDate = new Date(task.dueDate);
            const isOverdue =
              dueDate < new Date() &&
              !['completed', 'approved', 'invoiced'].includes(task.status);

            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                  isOverdue ? 'border-red-200 bg-red-50/50' : 'bg-card'
                }`}
                onClick={() => onTaskClick?.(task, machine)}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </span>
                  {getPriorityIcon(task.priority || 'medium')}
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                      <Truck className="h-3 w-3" />
                      {task.machineName}
                      <Badge variant={statusDetails.variant} className="text-xs">
                        {statusDetails.label}
                      </Badge>
                      <span
                        className={
                          isOverdue ? 'text-red-600 font-medium' : ''
                        }
                      >
                        <Clock className="h-3 w-3 inline mr-1" />
                        {format(dueDate, 'd. MMM', { locale: da })}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const displayTechnician = selectedTechnicianId
    ? eligibleTechnicians.find((t) => t.id === selectedTechnicianId)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Opgaveliste pr. tekniker
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Prioriteret rækkefølge så teknikeren ved hvad næste opgave er. Undgå
          standby-tid.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {displayTechnician ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTechnicianSelect?.(null)}
                className="shrink-0"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Tilbage
              </Button>
              <div className="flex items-center gap-2 flex-1">
                <UserIcon className="h-4 w-4" />
                <span className="font-medium">{displayTechnician.name}</span>
                <Badge variant="secondary">
                  {getTechnicianTasks(displayTechnician.id).length} opgaver
                </Badge>
              </div>
            </div>
            {renderTechnicianTasks(displayTechnician)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eligibleTechnicians.map((tech) => {
              const taskCount = getTechnicianTasks(tech.id).length;
              return (
                <Button
                  key={tech.id}
                  variant="outline"
                  className="h-auto flex flex-col items-start gap-2 p-4"
                  onClick={() => onTechnicianSelect?.(tech.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <UserIcon className="h-4 w-4 shrink-0" />
                    <span className="font-medium truncate">{tech.name}</span>
                  </div>
                  <Badge variant="secondary" className="self-start">
                    {taskCount} opgaver
                  </Badge>
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TechnicianTaskList;
