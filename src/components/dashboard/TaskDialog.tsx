import React, { useState } from 'react';
import { Task, Machine } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { 
  Play, 
  Square, 
  CheckCircle, 
  Clock, 
  User, 
  Truck,
  AlertTriangle,
  Circle,
  ArrowUp,
  ArrowDown,
  FileText,
  DollarSign,
  Calendar,
  Users,
  Edit
} from 'lucide-react';
import { translateType } from '@/utils/equipmentTranslations';
import { getStatusDetails } from '@/utils/equipmentTranslations';
import { mockUsers } from '@/data/mockData';
import { formatDateTime, formatDuration } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/currencyUtils';
import TaskWorkflow from './TaskWorkflow';

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
  const [assignedTo, setAssignedTo] = useState(task.assignedTo || '');
  const [customerName, setCustomerName] = useState(task.customerName || '');
  const [hourlyRate, setHourlyRate] = useState(task.hourlyRate || 750);
  const [estimatedHours, setEstimatedHours] = useState(task.estimatedHours || 2);
  const [notes, setNotes] = useState('');

  const canEdit = hasPermission('admin') || hasPermission('mechanic') || hasPermission('technician');
  const canAssign = hasPermission('admin');
  const canTakeTask = hasPermission('mechanic') || hasPermission('technician') || hasPermission('admin');
  const isAssignedToMe = task.assignedTo === user?.id || task.assignedTo === user?.name;

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
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'approved': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'invoiced': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUserName = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    return user?.name || userId;
  };

  const handleAssignToMe = () => {
    const updatedTask: Task = {
      ...task,
      assignedTo: user?.id || user?.name || '',
      status: 'pending'
    };
    onTaskUpdate(updatedTask);
    
    toast({
      title: "Opgave tildelt",
      description: `Du har nu taget ansvar for: ${task.title}`,
    });
  };

  const handleStartWork = () => {
    // This will be handled by TaskWorkflow component
    // Just close the dialog to show the workflow
    onClose();
  };

  const handleSaveChanges = () => {
    const updatedTask: Task = {
      ...task,
      assignedTo,
      customerName,
      hourlyRate,
      estimatedHours
    };
    onTaskUpdate(updatedTask);
    setIsEditing(false);
    
    toast({
      title: "Opgave opdateret",
      description: "Opgavedetaljerne er blevet gemt.",
    });
  };

  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < new Date() && task.status !== 'completed' && task.status !== 'approved' && task.status !== 'invoiced';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getPriorityIcon(task.priority || 'medium')}
              <div>
                <DialogTitle className="text-xl">{task.title}</DialogTitle>
                <DialogDescription>
                  {task.description}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(task.status)}>
                {getStatusDetails(task.status).label}
              </Badge>
              <Badge variant="outline">
                {translateType(task.equipmentType)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tildelt til</label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg person" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ikke tildelt</SelectItem>
                        {eligibleUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role === 'admin' ? 'Administrator' : 
                              user.role === 'mechanic' ? 'Mekaniker' : 
                              user.role === 'technician' ? 'Tekniker' : 
                              user.role === 'blacksmith' ? 'Smed' : 'Chauffør'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      {task.assignedTo ? getUserName(task.assignedTo) : 'Ikke tildelt'}
                    </div>
                  </div>
                  
                  {task.estimatedHours && (
                    <div>
                      <span className="text-sm text-muted-foreground">Estimeret tid:</span>
                      <div className="font-medium">{task.estimatedHours} timer</div>
                    </div>
                  )}
                  
                  {task.hourlyRate && (
                    <div>
                      <span className="text-sm text-muted-foreground">Timepris:</span>
                      <div className="font-medium">{formatCurrency(task.hourlyRate)}</div>
                    </div>
                  )}
                </div>
              )}

              {isEditing && (
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Annuller
                  </Button>
                  <Button onClick={handleSaveChanges}>
                    Gem ændringer
                  </Button>
                </DialogFooter>
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
                {/* Take Task Button */}
                {task.status === 'pending' && canTakeTask && !isAssignedToMe && (
                  <Button onClick={handleAssignToMe} className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Tag ansvar for opgaven
                  </Button>
                )}

                {/* Start Work Button */}
                {task.status === 'pending' && canTakeTask && (isAssignedToMe || !task.assignedTo) && (
                  <Button onClick={handleStartWork} className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Start arbejde
                  </Button>
                )}

                {/* Machine Info */}
                <Button variant="outline" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  {machine.name} ({machine.model})
                </Button>

                {/* Priority Info */}
                <Badge variant="outline" className="flex items-center gap-1">
                  {getPriorityIcon(task.priority || 'medium')}
                  {task.priority || 'medium'} prioritet
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Task Workflow */}
          <TaskWorkflow
            task={task}
            machine={machine}
            onTaskUpdate={onTaskUpdate}
            onTimeEntryUpdate={onTimeEntryUpdate}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog; 