import React, { useState } from 'react';
import { Task, Machine } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { 
  User, 
  Truck,
  AlertTriangle,
  Circle,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Plus,
  Calendar
} from 'lucide-react';
import { translateType } from '@/utils/equipmentTranslations';
import { getStatusDetails } from '@/utils/equipmentTranslations';
import { mockUsers } from '@/data/mockData';
import { formatCurrency } from '@/utils/currencyUtils';
import TaskDialog from '@/components/dashboard/TaskDialog';
import TaskForm from '@/components/service/TaskForm';

interface MachineTasksListProps {
  machine: Machine;
  onTaskUpdate: (task: Task) => void;
  onTaskSubmit?: (task: Task) => void;
}

const MachineTasksList: React.FC<MachineTasksListProps> = ({ machine, onTaskUpdate, onTaskSubmit }) => {
  const { hasPermission } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const tasks = machine.tasks || [];
  const activeTasks = tasks.filter(task => 
    ['awaiting-parts', 'ready-for-repair', 'pending', 'in-progress'].includes(task.status)
  );

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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDialog(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    onTaskUpdate(updatedTask);
    setShowTaskDialog(false);
  };

  const handleTaskSubmit = (newTask: Task) => {
    if (onTaskSubmit) {
      onTaskSubmit(newTask);
      setShowTaskForm(false);
      toast({
        title: "Opgave oprettet",
        description: `${newTask.title} er blevet oprettet.`,
      });
    }
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium mb-2">Ingen opgaver</h3>
            <p className="text-muted-foreground">Der er ingen opgaver for denne maskine.</p>
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
            Opgaver for {machine.name}
            <Badge variant="secondary" className="ml-2">
              {activeTasks.length} aktive
            </Badge>
          </CardTitle>
          {hasPermission('admin') && onTaskSubmit && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowTaskForm(!showTaskForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {showTaskForm ? 'Annuller' : 'Ny opgave'}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Task Form */}
        {showTaskForm && onTaskSubmit && (
          <div className="mb-4">
            <TaskForm
              machineId={machine.id}
              onSubmit={handleTaskSubmit}
            />
          </div>
        )}

        {activeTasks.map((task) => {
          const statusDetails = getStatusDetails(task.status || 'pending');
          const dueDate = new Date(task.dueDate);
          const isOverdue = dueDate < new Date() && task.status !== 'completed' && task.status !== 'approved' && task.status !== 'invoiced';
          
          return (
            <div
              key={task.id}
              className={`p-4 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors ${
                isOverdue ? 'border-red-200 bg-red-50' : 'border-border'
              }`}
              onClick={() => handleTaskClick(task)}
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
                  <Calendar className="h-3 w-3" />
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

        {/* Completed Tasks */}
        {tasks.filter(task => task.status === 'completed' || task.status === 'approved' || task.status === 'invoiced').length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Fuldførte opgaver</h3>
            <div className="space-y-2">
              {tasks
                .filter(task => task.status === 'completed' || task.status === 'approved' || task.status === 'invoiced')
                .map((task) => {
                  const statusDetails = getStatusDetails(task.status);
                  const dueDate = new Date(task.dueDate);
                  
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-transparent">
                            {translateType(task.equipmentType)}
                          </Badge>
                          <Badge variant="outline" className="bg-transparent border-green-500 text-green-600">
                            {statusDetails.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <h4 className="font-medium mb-1">{task.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dueDate.toLocaleDateString('da-DK')}
                        </span>
                        
                        {task.assignedTo && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {getUserName(task.assignedTo)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>

      {/* Task Dialog */}
      {selectedTask && (
        <TaskDialog
          task={selectedTask}
          machine={machine}
          isOpen={showTaskDialog}
          onClose={() => setShowTaskDialog(false)}
          onTaskUpdate={handleTaskUpdate}
        />
      )}
    </Card>
  );
};

export default MachineTasksList; 