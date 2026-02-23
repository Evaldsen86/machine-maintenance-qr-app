import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/hooks/useAuth';
import { Approval, Machine, Video, VideoProgress, User } from '@/types';
import { toast } from "@/components/ui/use-toast";
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  userId: z.string().min(1, "Vælg en chauffør"),
  machineId: z.string().min(1, "Vælg en lastbil"),
  notes: z.string().optional(),
});

interface ApprovalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (approval: Approval) => void;
  machines: Machine[];
  videos: Video[];
  videoProgress: VideoProgress[];
  users: User[];
  existingApproval?: Approval;
}

const ApprovalForm: React.FC<ApprovalFormProps> = ({
  isOpen,
  onClose,
  onSave,
  machines,
  videos,
  videoProgress,
  users,
  existingApproval
}) => {
  const { user: currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>(existingApproval?.userId || '');
  const [selectedMachineId, setSelectedMachineId] = useState<string>(existingApproval?.machineId || '');
  const [notes, setNotes] = useState<string>(existingApproval?.notes || '');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: existingApproval?.userId || '',
      machineId: existingApproval?.machineId || '',
      notes: existingApproval?.notes || '',
    },
  });

  useEffect(() => {
    if (existingApproval) {
      form.reset({
        userId: existingApproval.userId,
        machineId: existingApproval.machineId,
        notes: existingApproval.notes || '',
      });
      setSelectedUserId(existingApproval.userId);
      setSelectedMachineId(existingApproval.machineId);
      setNotes(existingApproval.notes || '');
    } else {
      form.reset({
        userId: '',
        machineId: '',
        notes: '',
      });
      setSelectedUserId('');
      setSelectedMachineId('');
      setNotes('');
    }
  }, [existingApproval, isOpen]);

  // Get videos linked to selected machine
  const machineVideos = videos.filter(video => 
    video.machineIds && video.machineIds.includes(selectedMachineId)
  );

  // Get video progress for selected user
  const userProgress = selectedUserId 
    ? videoProgress.filter(p => p.userId === selectedUserId)
    : [];

  // Check which videos the user has completed
  const completedVideos = machineVideos.filter(video => {
    const progress = userProgress.find(p => p.videoId === video.id);
    return progress && progress.completed;
  });

  const allVideosWatched = machineVideos.length > 0 && completedVideos.length === machineVideos.length;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Du skal være logget ind for at godkende.",
      });
      return;
    }

    if (!allVideosWatched && machineVideos.length > 0) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Chaufføren skal have set alle videoer linket til lastbilen før godkendelse.",
      });
      return;
    }

    try {
      const selectedUser = users.find(u => u.id === values.userId);
      const selectedMachine = machines.find(m => m.id === values.machineId);

      if (!selectedUser || !selectedMachine) {
        toast({
          variant: "destructive",
          title: "Fejl",
          description: "Kunne ikke finde bruger eller maskine.",
        });
        return;
      }

      const approval: Approval = {
        id: existingApproval?.id || `approval-${Date.now()}`,
        userId: values.userId,
        userName: selectedUser.name,
        machineId: values.machineId,
        machineName: selectedMachine.name,
        approvedBy: currentUser.id,
        approvedByName: currentUser.name,
        approvedAt: new Date().toISOString(),
        notes: values.notes || undefined,
        videoIds: machineVideos.map(v => v.id),
        status: existingApproval?.status || 'approved',
      };

      onSave(approval);
      
      form.reset();
      setSelectedUserId('');
      setSelectedMachineId('');
      setNotes('');
      
      toast({
        title: existingApproval ? "Godkendelse opdateret" : "Godkendelse oprettet",
        description: `${selectedUser.name} er nu godkendt til at køre ${selectedMachine.name}.`,
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving approval:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Der opstod en fejl under gemning af godkendelsen.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingApproval ? 'Rediger Godkendelse' : 'Opret Godkendelse'}</DialogTitle>
          <DialogDescription>
            Godkend en chauffør til at køre en specifik lastbil efter prøveløft
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">Chauffør *</Label>
            <Select
              value={selectedUserId}
              onValueChange={(value) => {
                setSelectedUserId(value);
                form.setValue("userId", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vælg chauffør" />
              </SelectTrigger>
              <SelectContent>
                {users
                  .filter(u => u.role === 'driver' || u.role === 'technician' || u.role === 'mechanic')
                  .map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {form.formState.errors.userId && (
              <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="machineId">Lastbil *</Label>
            <Select
              value={selectedMachineId}
              onValueChange={(value) => {
                setSelectedMachineId(value);
                form.setValue("machineId", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vælg lastbil" />
              </SelectTrigger>
              <SelectContent>
                {machines.map(machine => (
                  <SelectItem key={machine.id} value={machine.id}>
                    {machine.name} ({machine.brand} {machine.model})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.machineId && (
              <p className="text-sm text-destructive">{form.formState.errors.machineId.message}</p>
            )}
          </div>

          {/* Video Status */}
          {selectedMachineId && selectedUserId && (
            <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
              <Label>Video Status</Label>
              {machineVideos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ingen videoer linket til denne lastbil
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    {allVideosWatched ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          Alle videoer set ({completedVideos.length}/{machineVideos.length})
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-600">
                          Ikke alle videoer set ({completedVideos.length}/{machineVideos.length})
                        </span>
                      </>
                    )}
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {machineVideos.map(video => {
                      const progress = userProgress.find(p => p.videoId === video.id);
                      const isCompleted = progress && progress.completed;
                      return (
                        <div
                          key={video.id}
                          className={`flex items-center gap-2 p-2 rounded text-sm ${
                            isCompleted ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                          )}
                          <span className={isCompleted ? 'text-green-800' : 'text-yellow-800'}>
                            {video.title}
                          </span>
                          {progress && !isCompleted && (
                            <Badge variant="outline" className="ml-auto">
                              {Math.round(progress.progress)}%
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Noter (valgfrit)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                form.setValue("notes", e.target.value);
              }}
              placeholder="F.eks. Prøveløft gennemført succesfuldt..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuller
            </Button>
            <Button 
              type="submit" 
              disabled={!allVideosWatched && machineVideos.length > 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {existingApproval ? 'Opdater' : 'Godkend'} Chauffør
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalForm;

