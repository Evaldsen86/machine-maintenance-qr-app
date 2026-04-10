import React, { useState, useEffect } from 'react';
import { Task, Machine, TaskStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { 
  Truck,
  AlertTriangle,
  Circle,
  ArrowUp,
  ArrowDown,
  Calendar,
  Users,
  Edit
} from 'lucide-react';
import { translateType } from '@/utils/equipmentTranslations';
import { getStatusDetails } from '@/utils/equipmentTranslations';
import { mockUsers } from '@/data/mockData';
import { formatCurrency } from '@/utils/currencyUtils';
import TaskWorkflow from './TaskWorkflow';
import {
  addAssigneeToTask,
  assigneesPayloadFromIds,
  formatTaskAssignees,
  getTaskAssigneeIds,
  isTaskAssignedToCurrentUser,
} from '@/utils/taskAssignees';

interface TaskDialogProps {
  task: Task;
  machine: Machine;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: (task: Task) => void;
  onTimeEntryUpdate?: (entry: any) => void;
}

const TaskDialog: React.FC<TaskDialogProps> = ({ 
  task, 
  machine, 
  isOpen, 
  onClose, 
  onTaskUpdate,
  onTimeEntryUpdate 
}) => {
  const { user, hasPermission } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(task.status);
  const [customerName, setCustomerName] = useState(task.customerName || '');
  const [hourlyRate, setHourlyRate] = useState(task.hourlyRate || 750);
  const [estimatedHours, setEstimatedHours] = useState(task.estimatedHours || 2);
  const [currentTask, setCurrentTask] = useState(task);

  // Update state when task prop changes
  useEffect(() => {
    setCurrentTask(task);
    setSelectedAssigneeIds(getTaskAssigneeIds(task));
    setTaskStatus(task.status);
    setCustomerName(task.customerName || '');
    setHourlyRate(task.hourlyRate || 750);
    setEstimatedHours(task.estimatedHours || 2);
  }, [task]);

  const canEdit = hasPermission('admin') || hasPermission('leader') || hasPermission('mechanic') || hasPermission('technician');
  const canAssign = hasPermission('admin') || hasPermission('leader');
  const canChangeStatus = hasPermission('admin') || hasPermission('leader') || hasPermission('lagermand');
  const canTakeTask = hasPermission('mechanic') || hasPermission('technician') || hasPermission('admin') || hasPermission('blacksmith');

  const eligibleUsers = mockUsers.filter(u => 
    u.role === 'driver' || 
    u.role === 'mechanic' || 
    u.role === 'technician' || 
    u.role === 'blacksmith' || 
    u.role === 'admin'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'awaiting-parts': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ready-for-repair': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'approved': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'invoiced': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'canceled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUserName = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    return user?.name || userId;
  };

  const handleAssignToMe = () => {
    const uid = user?.id || user?.name || '';
    const updated = addAssigneeToTask(currentTask, uid);
    if (!updated) {
      toast({
        variant: 'destructive',
        title: 'Kan ikke tilføje',
        description: uid
          ? 'Du er allerede tildelt denne opgave.'
          : 'Du skal være logget ind.',
      });
      return;
    }
    const nextTask: Task = {
      ...updated,
      status: currentTask.status === 'in-progress' ? 'in-progress' : 'pending',
    };
    setCurrentTask(nextTask);
    setSelectedAssigneeIds(getTaskAssigneeIds(nextTask));
    onTaskUpdate(nextTask);

    toast({
      title: 'Opgave tildelt',
      description: `Du er tilføjet som tekniker på: ${currentTask.title}`,
    });
  };

  // Start work is handled by TaskWorkflow component directly

  const handleSaveChanges = () => {
    const { assignedTo: nextTo, assignedToIds: nextIds } = assigneesPayloadFromIds(selectedAssigneeIds);
    const updatedTask: Task = {
      ...currentTask,
      assignedTo: nextTo,
      assignedToIds: nextIds,
      status: taskStatus,
      customerName,
      hourlyRate,
      estimatedHours
    };
    setCurrentTask(updatedTask);
    onTaskUpdate(updatedTask);
    setIsEditing(false);
    
    toast({
      title: "Opgave opdateret",
      description: "Opgavedetaljerne er blevet gemt.",
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedAssigneeIds(getTaskAssigneeIds(currentTask));
    setTaskStatus(currentTask.status);
    setCustomerName(currentTask.customerName || '');
    setHourlyRate(currentTask.hourlyRate || 750);
    setEstimatedHours(currentTask.estimatedHours || 2);
  };

  const dueDate = new Date(currentTask.dueDate);
  const isOverdue = dueDate < new Date() && currentTask.status !== 'completed' && currentTask.status !== 'approved' && currentTask.status !== 'invoiced';
  const isAssignedToMe = isTaskAssignedToCurrentUser(currentTask, user);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getPriorityIcon(currentTask.priority || 'medium')}
              <div>
                <DialogTitle className="text-xl">{currentTask.title}</DialogTitle>
                <DialogDescription>
                  {currentTask.description}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(currentTask.status)}>
                {getStatusDetails(currentTask.status).label}
              </Badge>
              <Badge variant="outline">
                {translateType(currentTask.equipmentType)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Hint for offer-based projects */}
          {currentTask.offerId && (currentTask.status === 'in-progress' || currentTask.status === 'completed' || currentTask.status === 'approved') && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              Projekt fra tilbud. Du kan ændre timer og reservedele under arbejdet – det faktiske beløb bruges i fakturaen.
            </div>
          )}

          {/* Task Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Opgavedetaljer</CardTitle>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? 'Annuller' : 'Rediger'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {canChangeStatus && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={taskStatus} onValueChange={(v) => setTaskStatus(v as TaskStatus)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="awaiting-parts">Afventer reservedele</SelectItem>
                          <SelectItem value="ready-for-repair">Klar til reparation</SelectItem>
                          <SelectItem value="pending">Afventer</SelectItem>
                          <SelectItem value="in-progress">I gang</SelectItem>
                          <SelectItem value="completed">Færdig</SelectItem>
                          <SelectItem value="canceled">Annulleret</SelectItem>
                          <SelectItem value="approved">Godkendt</SelectItem>
                          <SelectItem value="invoiced">Faktureret</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Når reservedele er modtaget: Skift fra &quot;Afventer reservedele&quot; til &quot;Klar til reparation&quot; – opgaven bliver synlig for teknikerne.
                      </p>
                    </div>
                  )}
                  <div className="space-y-2 md:col-span-2">
                    <span className="text-sm font-medium">Tildelte teknikere</span>
                    <p className="text-xs text-muted-foreground">
                      Vælg ét eller flere navne. Alle vises i kalenderen på opgavens deadline-dag.
                    </p>
                    <div className="max-h-48 overflow-y-auto rounded-md border p-3 space-y-3">
                      {eligibleUsers.map((u) => (
                        <div key={u.id} className="flex items-center gap-3">
                          <Checkbox
                            id={`assign-${u.id}`}
                            checked={selectedAssigneeIds.includes(u.id)}
                            onCheckedChange={(checked) => {
                              const on = checked === true;
                              setSelectedAssigneeIds((prev) =>
                                on
                                  ? prev.includes(u.id)
                                    ? prev
                                    : [...prev, u.id]
                                  : prev.filter((id) => id !== u.id)
                              );
                            }}
                          />
                          <Label
                            htmlFor={`assign-${u.id}`}
                            className="text-sm font-normal leading-none cursor-pointer flex-1"
                          >
                            {u.name}
                            <span className="text-muted-foreground ml-1">
                              ({u.role === 'admin'
                                ? 'Administrator'
                                : u.role === 'mechanic'
                                  ? 'Mekaniker'
                                  : u.role === 'technician'
                                    ? 'Tekniker'
                                    : u.role === 'blacksmith'
                                      ? 'Smed'
                                      : 'Chauffør'})
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kunde</label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Kundenavn"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timepris (kr)</label>
                    <Input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                      placeholder="750"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estimeret timer</label>
                    <Input
                      type="number"
                      step="0.5"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                      placeholder="2"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Deadline:</span>
                    <div className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {dueDate.toLocaleDateString('da-DK')}
                      {isOverdue && <span className="text-red-600 ml-2">(Forfalden)</span>}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-muted-foreground">Tildelt til:</span>
                    <div className="font-medium">
                      {formatTaskAssignees(currentTask, getUserName) || 'Ikke tildelt'}
                    </div>
                  </div>
                  
                  {currentTask.estimatedHours && (
                    <div>
                      <span className="text-sm text-muted-foreground">Estimeret tid:</span>
                      <div className="font-medium">{currentTask.estimatedHours} timer</div>
                    </div>
                  )}
                  
                  {currentTask.hourlyRate && (
                    <div>
                      <span className="text-sm text-muted-foreground">Timepris:</span>
                      <div className="font-medium">{formatCurrency(currentTask.hourlyRate)}</div>
                    </div>
                  )}
                </div>
              )}

              {isEditing && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Annuller
                  </Button>
                  <Button onClick={handleSaveChanges}>
                    Gem ændringer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Handlinger</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {/* Take Task Button - synlig for ready-for-repair og pending */}
                {(currentTask.status === 'ready-for-repair' || currentTask.status === 'pending') && canTakeTask && !isAssignedToMe && (
                  <Button onClick={handleAssignToMe} className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Tag ansvar for opgaven
                  </Button>
                )}

                {/* Assign Task Button - For admin/leader to assign to technician */}
                {canAssign && (currentTask.status === 'ready-for-repair' || currentTask.status === 'pending' || currentTask.status === 'in-progress') && (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    variant="outline" 
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Tildel opgave
                  </Button>
                )}

                {/* Machine Info - Non-clickable info badge */}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  {machine.name} ({machine.model})
                </Badge>

                {/* Priority Info */}
                <Badge variant="outline" className="flex items-center gap-1">
                  {getPriorityIcon(currentTask.priority || 'medium')}
                  {currentTask.priority || 'medium'} prioritet
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Task Workflow */}
          <TaskWorkflow
            task={currentTask}
            machine={machine}
            onTaskUpdate={(updatedTask) => {
              setCurrentTask(updatedTask);
              onTaskUpdate(updatedTask);
            }}
            onTimeEntryUpdate={onTimeEntryUpdate}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog; 