import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Machine, Task, TaskStatus, TaskPriority, User } from "@/types";
import { mockUsers } from "@/data/mockData";
import { format, parseISO, isValid, addMonths, subMonths } from "date-fns";
import { da } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskCalendarProps {
  machines: Machine[];
  onTaskClick?: (task: Task, machine: Machine) => void;
}

interface TaskWithMachine extends Task {
  machineId: string;
  machineName: string;
}

const statusLabels: Record<TaskStatus, string> = {
  'awaiting-parts': 'Afventer reservedele',
  'ready-for-repair': 'Klar til reparation',
  pending: 'Afventer',
  'in-progress': 'I gang',
  completed: 'Færdig',
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

const technicianRoles = ['technician', 'mechanic', 'blacksmith', 'admin'];

const TaskCalendar: React.FC<TaskCalendarProps> = ({ machines, onTaskClick }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [filterTechnicianId, setFilterTechnicianId] = useState<string>('all');

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

  const technicians = useMemo(
    () => users.filter((u) => technicianRoles.includes(u.role)),
    [users]
  );

  const tasks = useMemo<TaskWithMachine[]>(() => {
    return machines.flatMap(machine =>
      (machine.tasks || [])
        .filter(task => !!task.dueDate)
        .map(task => ({
          ...task,
          machineId: machine.id,
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
  let tasksForDate = tasksByDate[selectedKey] || [];

  if (filterTechnicianId !== 'all') {
    tasksForDate = tasksForDate.filter((t) => t.assignedTo === filterTechnicianId);
  }

  const tasksByAssignee = useMemo(() => {
    return tasksForDate.reduce((acc, task) => {
      const assigneeName = task.assignedTo ? (userMap.get(task.assignedTo) || 'Ukendt bruger') : 'Ikke tildelt';
      if (!acc[assigneeName]) acc[assigneeName] = [];
      acc[assigneeName].push(task);
      return acc;
    }, {} as Record<string, TaskWithMachine[]>);
  }, [tasksForDate, userMap]);

  const machineMap = useMemo(
    () => new Map<string, Machine>(machines.map((m) => [m.id, m])),
    [machines]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Kalender</CardTitle>
          <CardDescription>
            Opgaver fordelt på datoer. Skift hurtigt mellem teknikere.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Vis opgaver for</label>
            <Select value={filterTechnicianId} onValueChange={setFilterTechnicianId}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg tekniker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle teknikere</SelectItem>
                {technicians.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium capitalize">
              {format(calendarMonth, 'MMMM yyyy', { locale: da })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Calendar
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
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
            {filterTechnicianId === 'all'
              ? 'Tekniker og maskiner til planlagte opgaver'
              : `Opgaver for ${userMap.get(filterTechnicianId) || 'valgt tekniker'}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {tasksForDate.length === 0 && (
            <div className="text-sm text-muted-foreground">
              {filterTechnicianId === 'all'
                ? 'Ingen opgaver planlagt denne dag.'
                : 'Ingen opgaver for denne tekniker denne dag.'}
            </div>
          )}

          {Object.entries(tasksByAssignee).map(([assignee, assigneeTasks]) => (
            <div key={assignee} className="space-y-3">
              <div className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                {assignee}
              </div>
              <div className="space-y-3">
                {assigneeTasks.map((task) => {
                  const taskWithMachine = task as TaskWithMachine;
                  const machineForTask = machineMap.get(taskWithMachine.machineId);
                  return (
                    <div
                      key={task.id}
                      className={`rounded-lg border p-3 space-y-2 ${
                        onTaskClick && machineForTask
                          ? 'cursor-pointer hover:bg-muted/50 transition-colors'
                          : ''
                      }`}
                      onClick={() =>
                        machineForTask && onTaskClick?.(task, machineForTask)
                      }
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{task.machineName}</Badge>
                        <Badge variant="secondary">
                          {statusLabels[task.status]}
                        </Badge>
                        {task.priority && (
                          <Badge variant="default">
                            {priorityLabels[task.priority]}
                          </Badge>
                        )}
                      </div>
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground">
                          {task.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskCalendar;
