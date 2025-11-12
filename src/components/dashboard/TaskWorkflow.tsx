import React, { useState, useEffect } from 'react';
import { Task, Machine, TimeEntry, Invoice } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  Users
} from 'lucide-react';
import { translateType } from '@/utils/equipmentTranslations';
import { getStatusDetails } from '@/utils/equipmentTranslations';
import { mockUsers } from '@/data/mockData';
import { formatDateTime, formatDuration } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/currencyUtils';
import InvoiceGenerator from '@/components/invoice/InvoiceGenerator';

interface TaskWorkflowProps {
  task: Task;
  machine: Machine;
  onTaskUpdate: (task: Task) => void;
  onTimeEntryUpdate?: (entry: TimeEntry) => void;
}

const TaskWorkflow: React.FC<TaskWorkflowProps> = ({ 
  task, 
  machine, 
  onTaskUpdate,
  onTimeEntryUpdate 
}) => {
  const { user, hasPermission } = useAuth();
  const [isWorking, setIsWorking] = useState(false);
  const [currentTimeEntry, setCurrentTimeEntry] = useState<TimeEntry | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(task.hourlyRate || 750);
  const [estimatedHours, setEstimatedHours] = useState(task.estimatedHours || 2);
  const [customerName, setCustomerName] = useState(task.customerName || '');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  // Load time entries for this task
  useEffect(() => {
    const loadTimeEntries = () => {
      try {
        const storedEntries = localStorage.getItem(`time_entries_${machine.id}`);
        if (storedEntries) {
          const entries = JSON.parse(storedEntries);
          const taskEntries = entries.filter((entry: TimeEntry) => 
            entry.description.includes(task.title) || entry.id === task.timeEntryId
          );
          setTimeEntries(taskEntries);
          
          // Find active entry for this task
          const active = taskEntries.find((entry: TimeEntry) => entry.status === 'active');
          if (active) {
            setCurrentTimeEntry(active);
            setIsWorking(true);
          }
        }
      } catch (error) {
        console.error("Error loading time entries:", error);
      }
    };
    
    loadTimeEntries();
  }, [machine.id, task.id, task.timeEntryId, task.title]);

  const canTakeTask = hasPermission('mechanic') || hasPermission('technician') || hasPermission('admin');
  const canApprove = hasPermission('admin');
  const isAssignedToMe = task.assignedTo === user?.id || task.assignedTo === user?.name;

  const startWorking = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Du skal være logget ind for at starte arbejde.",
      });
      return;
    }

    const newTimeEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      machineId: machine.id,
      userId: user.id,
      userName: user.name,
      startTime: new Date().toISOString(),
      description: `Arbejde på: ${task.title}`,
      status: 'active',
      equipmentType: task.equipmentType,
    };

    setCurrentTimeEntry(newTimeEntry);
    setIsWorking(true);

    // Update task with time entry
    const updatedTask: Task = {
      ...task,
      timeEntryId: newTimeEntry.id,
      status: 'in-progress'
    };
    onTaskUpdate(updatedTask);

    // Save time entry
    const existingEntries = JSON.parse(localStorage.getItem(`time_entries_${machine.id}`) || '[]');
    const updatedEntries = [newTimeEntry, ...existingEntries];
    localStorage.setItem(`time_entries_${machine.id}`, JSON.stringify(updatedEntries));

    toast({
      title: "Arbejde startet",
      description: `Du har nu startet arbejde på: ${task.title}`,
    });
  };

  const stopWorking = () => {
    if (!currentTimeEntry) return;

    const endTime = new Date();
    const startTime = new Date(currentTimeEntry.startTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    const updatedTimeEntry: TimeEntry = {
      ...currentTimeEntry,
      endTime: endTime.toISOString(),
      duration,
      status: 'completed'
    };

    setCurrentTimeEntry(null);
    setIsWorking(false);

    // Update task
    const updatedTask: Task = {
      ...task,
      status: 'completed'
    };
    onTaskUpdate(updatedTask);

    // Save time entry
    const existingEntries = JSON.parse(localStorage.getItem(`time_entries_${machine.id}`) || '[]');
    const updatedEntries = existingEntries.map((entry: TimeEntry) => 
      entry.id === currentTimeEntry.id ? updatedTimeEntry : entry
    );
    localStorage.setItem(`time_entries_${machine.id}`, JSON.stringify(updatedEntries));

    if (onTimeEntryUpdate) {
      onTimeEntryUpdate(updatedTimeEntry);
    }

    toast({
      title: "Arbejde afsluttet",
      description: `Arbejde på ${task.title} er afsluttet. Tid: ${formatDuration(duration)}`,
    });
  };

  const approveTask = () => {
    if (!user) return;

    const updatedTask: Task = {
      ...task,
      approvedBy: user.name,
      approvedAt: new Date().toISOString(),
      status: 'approved'
    };
    onTaskUpdate(updatedTask);

    toast({
      title: "Opgave godkendt",
      description: "Opgaven er godkendt og klar til fakturering.",
    });
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

  const generateInvoice = (invoice: Invoice) => {
    const updatedTask: Task = {
      ...task,
      invoiceId: invoice.id,
      status: 'invoiced'
    };
    onTaskUpdate(updatedTask);

    setShowInvoiceDialog(false);
    toast({
      title: "Faktura genereret",
      description: "Fakturaen er blevet genereret og tilknyttet opgaven.",
    });
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

  const totalTime = timeEntries
    .filter(entry => entry.status === 'completed')
    .reduce((sum, entry) => sum + (entry.duration || 0), 0);

  const estimatedCost = (estimatedHours * hourlyRate);
  const actualCost = (totalTime / 60) * hourlyRate;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getPriorityIcon(task.priority || 'medium')}
            <div>
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{task.description}</p>
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
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Task Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Deadline:</span>
            <div className="font-medium">{new Date(task.dueDate).toLocaleDateString('da-DK')}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Tildelt til:</span>
            <div className="font-medium">{getUserName(task.assignedTo || '')}</div>
          </div>
          {task.estimatedHours && (
            <div>
              <span className="text-muted-foreground">Estimeret tid:</span>
              <div className="font-medium">{task.estimatedHours} timer</div>
            </div>
          )}
          {task.hourlyRate && (
            <div>
              <span className="text-muted-foreground">Timepris:</span>
              <div className="font-medium">{formatCurrency(task.hourlyRate)}</div>
            </div>
          )}
        </div>

        {/* Time Tracking */}
        {isWorking && currentTimeEntry && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Arbejder nu</span>
              </div>
              <Button onClick={stopWorking} variant="destructive" size="sm">
                <Square className="h-4 w-4 mr-2" />
                Stop arbejde
              </Button>
            </div>
            <div className="text-sm text-blue-700">
              Startet: {formatDateTime(currentTimeEntry.startTime)}
            </div>
          </div>
        )}

        {/* Time Summary */}
        {timeEntries.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Tidsregistrering</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total tid:</span>
                <div className="font-medium">{formatDuration(totalTime)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Kostnad:</span>
                <div className="font-medium">{formatCurrency(actualCost)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Take Task Button - Show if not assigned to anyone or not assigned to me */}
          {task.status === 'pending' && canTakeTask && !isAssignedToMe && (
            <Button onClick={handleAssignToMe} className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Tag ansvar for opgaven
            </Button>
          )}

          {/* Start Work Button - Show if assigned to me OR if not assigned to anyone */}
          {task.status === 'pending' && canTakeTask && (isAssignedToMe || !task.assignedTo) && (
            <Button onClick={startWorking} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Start arbejde
            </Button>
          )}

          {task.status === 'completed' && canApprove && !task.approvedBy && (
            <Button onClick={approveTask} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Godkend opgave
            </Button>
          )}

          {task.status === 'approved' && canApprove && (
            <Button 
              onClick={() => setShowInvoiceDialog(true)} 
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generer faktura
            </Button>
          )}

          {task.invoiceId && (
            <Button variant="outline" className="flex-1" disabled>
              <DollarSign className="h-4 w-4 mr-2" />
              Faktura genereret
            </Button>
          )}
        </div>

        {/* Approval Info */}
        {task.approvedBy && (
          <div className="text-sm text-muted-foreground">
            Godkendt af {task.approvedBy} den {task.approvedAt && new Date(task.approvedAt).toLocaleDateString('da-DK')}
          </div>
        )}
      </CardContent>

      {/* Invoice Generation Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generer faktura for opgave</DialogTitle>
            <DialogDescription>
              Konfigurer fakturaindstillinger og generer faktura for {task.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kunde</label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Kundenavn"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Timepris</label>
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
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                  placeholder="2"
                />
              </div>
            </div>

            <InvoiceGenerator
              timeEntries={timeEntries.filter(entry => entry.status === 'completed')}
              customerId={task.customerId || 'default'}
              customerName={customerName || 'Kunde'}
              onInvoiceGenerated={generateInvoice}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TaskWorkflow; 