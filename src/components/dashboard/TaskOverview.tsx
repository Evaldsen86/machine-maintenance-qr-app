import React, { useState } from 'react';
import { Task, Machine } from '@/types';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  User, 
  Truck,
  AlertTriangle,
  CheckCircle,
  Circle,
  ArrowUp,
  ArrowDown,
  DollarSign
} from 'lucide-react';
import { translateType } from '@/utils/equipmentTranslations';
import { getStatusDetails } from '@/utils/equipmentTranslations';
import { formatCurrency } from '@/utils/currencyUtils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { mockUsers } from '@/data/mockData';
import TaskWorkflow from './TaskWorkflow';
import TaskDialog from './TaskDialog';

interface TaskOverviewProps {
  machines: Machine[];
  onTaskUpdate?: (task: Task, machineId: string) => void;
}

interface TaskWithMachine extends Task {
  machineId: string;
  machineName: string;
  priorityValue: number;
}

const TaskOverview: React.FC<TaskOverviewProps> = ({ machines, onTaskUpdate }) => {
  const [expandedMachines, setExpandedMachines] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);

  const getPriorityValue = (priority: string): number => {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  };

  // Extract all tasks from machines and add machine info
  const allTasks: TaskWithMachine[] = machines.flatMap(machine => 
    (machine.tasks || []).map(task => ({
      ...task,
      machineId: machine.id,
      machineName: machine.name,
      priorityValue: getPriorityValue(task.priority || 'medium')
    }))
  );

  // Filter active tasks: awaiting-parts, ready-for-repair, pending, in-progress
  const activeTasks = allTasks.filter(task => 
    ['awaiting-parts', 'ready-for-repair', 'pending', 'in-progress'].includes(task.status)
  );

  // Group tasks by machine
  const tasksByMachine = activeTasks.reduce((acc, task) => {
    if (!acc[task.machineId]) {
      acc[task.machineId] = {
        machineId: task.machineId,
        machineName: task.machineName,
        tasks: []
      };
    }
    acc[task.machineId].tasks.push(task);
    return acc;
  }, {} as Record<string, { machineId: string; machineName: string; tasks: TaskWithMachine[] }>);

  // Sort machines by highest priority task
  const sortedMachines = Object.values(tasksByMachine).sort((a, b) => {
    const aMaxPriority = Math.max(...a.tasks.map(t => t.priorityValue));
    const bMaxPriority = Math.max(...b.tasks.map(t => t.priorityValue));
    return sortOrder === 'asc' ? aMaxPriority - bMaxPriority : bMaxPriority - aMaxPriority;
  });

  const toggleMachineExpansion = (machineId: string) => {
    const newExpanded = new Set(expandedMachines);
    if (newExpanded.has(machineId)) {
      newExpanded.delete(machineId);
    } else {
      newExpanded.add(machineId);
    }
    setExpandedMachines(newExpanded);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <ArrowUp className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Circle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <ArrowDown className="h-4 w-4 text-green-500" />;
      default: return <Circle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getUserName = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    return user?.name || userId;
  };

  const handleTaskClick = (task: Task, machine: Machine) => {
    setSelectedTask(task);
    setSelectedMachine(machine);
    setShowTaskDialog(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    if (onTaskUpdate && selectedMachine) {
      onTaskUpdate(updatedTask, selectedMachine.id);
    }
    setShowTaskDialog(false);
  };

  if (activeTasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <h3 className="text-lg font-medium mb-2">Ingen aktive opgaver</h3>
            <p className="text-muted-foreground">Alle opgaver er fuldført eller der er ingen planlagte opgaver.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Opgaveliste
            <Badge variant="secondary" className="ml-2">
              {activeTasks.length} opgaver
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2"
          >
            {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            Prioritet {sortOrder === 'asc' ? 'Lav → Høj' : 'Høj → Lav'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2">
          {sortedMachines.map(({ machineId, machineName, tasks }) => {
            const isExpanded = expandedMachines.has(machineId);
            const sortedTasks = tasks.sort((a, b) => b.priorityValue - a.priorityValue);
            
            return (
              <Collapsible
                key={machineId}
                open={isExpanded}
                onOpenChange={() => toggleMachineExpansion(machineId)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{machineName}</span>
                        <Badge variant="outline">{tasks.length} opgaver</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(sortedTasks[0]?.priority || 'medium')}
                      <span className="text-sm text-muted-foreground">
                        {translateType(sortedTasks[0]?.equipmentType || 'truck')}
                      </span>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="border-t bg-muted/30">
                    <div className="p-4 space-y-2">
                      {sortedTasks.map((task) => {
                        const machine = machines.find(m => m.id === task.machineId);
                        if (!machine) return null;
                        
                        const statusDetails = getStatusDetails(task.status || 'pending');
                        const dueDate = new Date(task.dueDate);
                        const isOverdue = dueDate < new Date() && task.status !== 'completed' && task.status !== 'approved' && task.status !== 'invoiced';
                        
                        return (
                          <div
                            key={task.id}
                            className={`p-4 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors ${
                              isOverdue ? 'border-red-200 bg-red-50' : 'border-border'
                            }`}
                            onClick={() => handleTaskClick(task, machine)}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {getPriorityIcon(task.priority || 'medium')}
                                <Badge 
                                  variant="outline" 
                                  className={getPriorityColor(task.priority || 'medium')}
                                >
                                  {task.priority || 'medium'}
                                </Badge>
                                <Badge variant={statusDetails.variant}>
                                  {statusDetails.label}
                                </Badge>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {translateType(task.equipmentType)}
                              </Badge>
                            </div>
                            
                            <h4 className="font-medium mb-2 text-lg">{task.title}</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              {task.description}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <span className={`flex items-center gap-1 ${
                                isOverdue ? 'text-red-600 font-medium' : ''
                              }`}>
                                <Clock className="h-3 w-3" />
                                {isOverdue ? 'Forfalden: ' : 'Deadline: '}
                                {dueDate.toLocaleDateString('da-DK')}
                              </span>
                              
                              {task.assignedTo && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {getUserName(task.assignedTo)}
                                </span>
                              )}
                              
                              {task.hourlyRate && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(task.hourlyRate)}/time
                                </span>
                              )}
                            </div>
                            
                            <div className="mt-3 text-xs text-blue-600">
                              Klik for at åbne opgave og starte arbejde
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
      
      {/* Task Dialog */}
      {selectedTask && selectedMachine && (
        <TaskDialog
          task={selectedTask}
          machine={selectedMachine}
          isOpen={showTaskDialog}
          onClose={() => setShowTaskDialog(false)}
          onTaskUpdate={handleTaskUpdate}
        />
      )}
    </Card>
  );
};

export default TaskOverview; 