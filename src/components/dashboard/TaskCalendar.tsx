import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Machine, Task, TaskStatus, TaskPriority, User } from "@/types";
import { mockUsers } from "@/data/mockData";
import { format, parseISO, isValid } from "date-fns";
import { da } from "date-fns/locale";

interface TaskCalendarProps {
  machines: Machine[];
}

interface TaskWithMachine extends Task {
  machineName: string;
}

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Afventer',
  'in-progress': 'I gang',
  completed: 'Fuldført',
  canceled: 'Annulleret',
  approved: 'Godkendt',
  invoiced: 'Faktureret',
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Lav',
  medium: 'Mellem',
  high: 'Høj',
  critical: 'Kritisk',
};

const TaskCalendar: React.FC<TaskCalendarProps> = ({ machines }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const users = useMemo<User[]>(() => {
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      try {
        return JSON.parse(storedUsers) as User[];
      } catch {
        return mockUsers;
      }
    }
    return mockUsers;
  }, []);

  const userMap = useMemo(() => {
    return new Map(users.map(user => [user.id, user.name]));
  }, [users]);

  const tasks = useMemo<TaskWithMachine[]>(() => {
    return machines.flatMap(machine =>
      (machine.tasks || [])
        .filter(task => !!task.dueDate)
        .map(task => ({
          ...task,
          machineName: machine.name,
        }))
    );
  }, [machines]);

  const tasksByDate = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const parsed = parseISO(task.dueDate);
      if (!isValid(parsed)) return acc;
      const key = format(parsed, 'yyyy-MM-dd');
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {} as Record<string, TaskWithMachine[]>);
  }, [tasks]);

  const highlightedDates = useMemo(() => {
    return Object.keys(tasksByDate)
      .map(dateKey => parseISO(dateKey))
      .filter(date => isValid(date));
  }, [tasksByDate]);

  const selectedKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const tasksForDate = tasksByDate[selectedKey] || [];

  const tasksByAssignee = useMemo(() => {
    return tasksForDate.reduce((acc, task) => {
      const assigneeName = task.assignedTo ? (userMap.get(task.assignedTo) || 'Ukendt bruger') : 'Ikke tildelt';
      if (!acc[assigneeName]) acc[assigneeName] = [];
      acc[assigneeName].push(task);
      return acc;
    }, {} as Record<string, TaskWithMachine[]>);
  }, [tasksForDate, userMap]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Kalender</CardTitle>
          <CardDescription>
            Opgaver fordelt på datoer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{ hasTasks: highlightedDates }}
            modifiersClassNames={{
              hasTasks: "bg-primary/15 text-primary-foreground",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, 'PPP', { locale: da }) : 'Vælg en dato'}
          </CardTitle>
          <CardDescription>
            Tekniker og maskiner til planlagte opgaver
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {tasksForDate.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Ingen opgaver planlagt denne dag.
            </div>
          )}

          {Object.entries(tasksByAssignee).map(([assignee, assigneeTasks]) => (
            <div key={assignee} className="space-y-3">
              <div className="font-medium">{assignee}</div>
              <div className="space-y-3">
                {assigneeTasks.map(task => (
                  <div key={task.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{task.machineName}</Badge>
                      <Badge variant="secondary">{statusLabels[task.status]}</Badge>
                      {task.priority && (
                        <Badge variant="default">{priorityLabels[task.priority]}</Badge>
                      )}
                    </div>
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground">{task.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskCalendar;
