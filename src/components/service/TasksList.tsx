import React, { useState } from 'react';
import { Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Truck, 
  CheckCircle, 
  User,
  MoreHorizontal,
  CheckCircle2
} from 'lucide-react';
import { translateType } from '@/utils/equipmentTranslations';
import { getStatusDetails } from '@/utils/equipmentTranslations';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/hooks/useAuth';
import { mockUsers } from '@/data/mockData';
import { toast } from "@/components/ui/use-toast";

interface TasksListProps {
  tasks: Task[];
  onTaskComplete?: (taskId: string, completedBy: string) => void;
}

const TasksList: React.FC<TasksListProps> = ({ tasks: rawTasks, onTaskComplete }) => {
  const tasks = Array.isArray(rawTasks) ? rawTasks : [];
  const { user, canMarkLubrication, hasPermission } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completedBy, setCompletedBy] = useState<string>('');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get eligible users who can complete tasks
  const eligibleUsers = mockUsers.filter(u => 
    u.role === 'driver' || 
    u.role === 'mechanic' || 
    u.role === 'technician' || 
    u.role === 'blacksmith' || 
    u.role === 'admin'
  );
  
  const handleOpenCompleteDialog = (task: Task) => {
    setSelectedTask(task);
    setCompletedBy(user?.name || '');
    setShowCompleteDialog(true);
  };
  
  const handleCompleteTask = async () => {
    if (!selectedTask || !onTaskComplete || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Call the parent handler
      await onTaskComplete(selectedTask.id, completedBy);
      
      // Only update UI after successful completion
      setSelectedTask(null);
      setShowCompleteDialog(false);
      
      toast({
        title: "Opgave fuldført",
        description: "Opgaven er blevet markeret som fuldført.",
      });
    } catch (error) {
      console.error("Error completing task:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Der opstod en fejl ved markering af opgave. Prøv venligst igen.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">Ingen opgaver fundet</p>
      </div>
    );
  }
  
  // Filter tasks by status, fallback to 'pending' if missing
  const completedTasks = tasks.filter(task => (task.status || 'pending') === 'completed');
  const pendingTasks = tasks.filter(task => (task.status || 'pending') !== 'completed');
  
  return (
    <div className="space-y-6">
      {pendingTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Kommende Opgaver</h3>
          <div className="space-y-4">
            {pendingTasks.map((task) => {
              try {
                const statusDetails = getStatusDetails(task.status || 'pending');
                return (
                  <div 
                    key={task.id || Math.random()}
                    className="flex flex-col p-4 border rounded-lg bg-card"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="mr-2">
                          {translateType(task.equipmentType || 'truck')}
                        </Badge>
                        <Badge variant={statusDetails.variant}>
                          {statusDetails.label}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenCompleteDialog(task)}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Markér som fuldført
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h4 className="font-medium mb-1">{task.title || 'Ingen titel'}</h4>
                    <p className="text-sm mb-2">{task.description || ''}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground text-xs">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Deadline: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('da-DK') : 'Ukendt'}
                      </span>
                      {task.assignedTo && (
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          Ansvarlig: {task.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                );
              } catch (err) {
                return (
                  <div key={task.id || Math.random()} className="p-4 border rounded-lg bg-red-50 text-red-700">
                    Fejl ved visning af opgave.
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}
      
      {completedTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Fuldførte Opgaver</h3>
          <div className="space-y-4">
            {completedTasks.map((task) => (
              <div 
                key={task.id} 
                className="flex flex-col p-4 border rounded-lg bg-card/50 border-dashed"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="mr-2 bg-transparent">
                      {translateType(task.equipmentType)}
                    </Badge>
                    <Badge variant="outline" className="bg-transparent border-green-500 text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Fuldført
                    </Badge>
                  </div>
                </div>
                
                <h4 className="font-medium mb-1 line-through">{task.title}</h4>
                <p className="text-sm mb-2 text-muted-foreground">{task.description}</p>
                
                <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground text-xs">
                  {task.assignedTo && (
                    <span className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      Udført af: {task.assignedTo}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Task completion dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-[425px] w-[95%] mx-auto">
          <DialogHeader>
            <DialogTitle>Markér opgave som fuldført</DialogTitle>
            <DialogDescription>
              Angiv hvem der har fuldført denne opgave.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Opgave</Label>
                <p className="text-sm font-medium">{selectedTask?.title}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="completed-by">Udført af</Label>
                <Select
                  value={completedBy}
                  onValueChange={setCompletedBy}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Vælg person" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {/* Include current user at the top if they have permission */}
                      {user && canMarkLubrication() && (
                        <SelectItem value={user.name || ""}>{user.name} (dig)</SelectItem>
                      )}
                      
                      {/* List all eligible users */}
                      {eligibleUsers
                        .filter(u => u.id !== user?.id) // Filter out current user
                        .map(u => (
                          <SelectItem key={u.id} value={u.name}>
                            {u.name} ({u.role === 'admin' ? 'Administrator' : 
                              u.role === 'mechanic' ? 'Mekaniker' : 
                              u.role === 'technician' ? 'Tekniker' : 
                              u.role === 'blacksmith' ? 'Smed' : 'Chauffør'})
                          </SelectItem>
                        ))
                      }
                      
                      {/* Allow custom entry if user is admin */}
                      {hasPermission('admin') && (
                        <div className="px-2 py-1.5">
                          <Input
                            placeholder="Eller indtast navn manuelt..."
                            value={!eligibleUsers.some(u => u.name === completedBy) ? completedBy : ""}
                            onChange={(e) => setCompletedBy(e.target.value)}
                            className="mt-2"
                          />
                        </div>
                      )}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)} disabled={isSubmitting}>
              Annuller
            </Button>
            <Button 
              onClick={handleCompleteTask} 
              disabled={!completedBy.trim() || isSubmitting}
            >
              {isSubmitting ? "Arbejder..." : "Markér som fuldført"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksList;
