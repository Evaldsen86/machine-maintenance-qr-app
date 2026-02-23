import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { TimeEntry, EquipmentType, Part } from '@/types';
import { formatDateTime, formatDuration } from '@/utils/dateUtils';
import { Play, Square, Edit, Trash2, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PartsManager from './PartsManager';

interface TimeTrackingProps {
  machineId: string;
  equipmentType: EquipmentType;
  onTimeEntryUpdate?: (entry: TimeEntry) => void;
  onTimeEntryDelete?: (entryId: string) => void;
}

const TimeTracking: React.FC<TimeTrackingProps> = ({
  machineId,
  equipmentType,
  onTimeEntryUpdate,
  onTimeEntryDelete
}) => {
  const { user, hasPermission } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [partsUsed, setPartsUsed] = useState<Part[]>([]);
  const [editStartDate, setEditStartDate] = useState('');
  const [editStartClock, setEditStartClock] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editEndClock, setEditEndClock] = useState('');

  // Load time entries from localStorage
  useEffect(() => {
    const loadTimeEntries = () => {
      try {
        const storedEntries = localStorage.getItem(`time_entries_${machineId}`);
        if (storedEntries) {
          const entries = JSON.parse(storedEntries);
          setTimeEntries(entries);
          
          // Find active entry if any
          const active = entries.find((entry: TimeEntry) => entry.status === 'active');
          if (active) {
            setActiveEntry(active);
            setDescription(active.description);
            setNotes(active.notes || '');
            setPartsUsed(active.partsUsed || []);
          }
        }
      } catch (error) {
        console.error("Error loading time entries:", error);
      }
    };
    
    loadTimeEntries();
  }, [machineId]);

  const startTimeEntry = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Du skal være logget ind for at registrere tid.",
      });
      return;
    }

    const newEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      machineId,
      userId: user.id,
      userName: user.name,
      startTime: new Date().toISOString(),
      description: '',
      status: 'active',
      equipmentType,
    };

    setActiveEntry(newEntry);
    setTimeEntries(prev => [newEntry, ...prev]);
    saveTimeEntries([newEntry, ...timeEntries]);
  };

  const stopTimeEntry = () => {
    if (!activeEntry) return;

    const endTime = new Date();
    const startTime = new Date(activeEntry.startTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // in minutes

    const updatedEntry: TimeEntry = {
      ...activeEntry,
      endTime: endTime.toISOString(),
      duration,
      status: 'completed',
      description,
      notes,
      partsUsed
    };

    setActiveEntry(null);
    setTimeEntries(prev => prev.map(entry => 
      entry.id === activeEntry.id ? updatedEntry : entry
    ));
    saveTimeEntries(timeEntries.map(entry => 
      entry.id === activeEntry.id ? updatedEntry : entry
    ));

    if (onTimeEntryUpdate) {
      onTimeEntryUpdate(updatedEntry);
    }

    toast({
      title: "Tid registreret",
      description: `Arbejdstid på ${formatDuration(duration)} er blevet registreret.`,
    });
  };

  const editTimeEntry = (entry: TimeEntry) => {
    setActiveEntry(entry);
    setDescription(entry.description);
    setNotes(entry.notes || '');
    setPartsUsed(entry.partsUsed || []);
    setEditStartDate(toLocalDateValue(entry.startTime));
    setEditStartClock(toLocalTimeValue(entry.startTime));
    setEditEndDate(entry.endTime ? toLocalDateValue(entry.endTime) : '');
    setEditEndClock(entry.endTime ? toLocalTimeValue(entry.endTime) : '');
    setIsEditing(true);
  };

  const saveTimeEntry = () => {
    if (!activeEntry) return;

    let updatedStartTime = activeEntry.startTime;
    let updatedEndTime = activeEntry.endTime;
    let updatedDuration = activeEntry.duration;

    if (canEditHours) {
      const parsedStart = toISOFromLocal(editStartDate, editStartClock);
      const parsedEnd = editEndDate || editEndClock ? toISOFromLocal(editEndDate, editEndClock) : undefined;

      if (!parsedStart) {
        toast({
          variant: "destructive",
          title: "Ugyldig starttid",
          description: "Angiv en gyldig starttid for arbejdet.",
        });
        return;
      }

      if ((editEndDate || editEndClock) && !parsedEnd) {
        toast({
          variant: "destructive",
          title: "Ugyldig sluttid",
          description: "Angiv både dato og tidspunkt for sluttid.",
        });
        return;
      }

      if (parsedEnd) {
        const startDate = new Date(parsedStart);
        const endDate = new Date(parsedEnd);
        if (endDate.getTime() < startDate.getTime()) {
          toast({
            variant: "destructive",
            title: "Ugyldig sluttid",
            description: "Sluttiden skal være efter starttiden.",
          });
          return;
        }
        updatedDuration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
      } else {
        updatedDuration = undefined;
      }

      updatedStartTime = parsedStart;
      updatedEndTime = parsedEnd;
    }

    const updatedEntry: TimeEntry = {
      ...activeEntry,
      startTime: updatedStartTime,
      endTime: updatedEndTime,
      duration: updatedDuration,
      description,
      notes,
      partsUsed,
      status: 'completed'
    };

    setTimeEntries(prev => prev.map(entry => 
      entry.id === activeEntry.id ? updatedEntry : entry
    ));
    saveTimeEntries(timeEntries.map(entry => 
      entry.id === activeEntry.id ? updatedEntry : entry
    ));

    if (onTimeEntryUpdate) {
      onTimeEntryUpdate(updatedEntry);
    }

    setIsEditing(false);
    setActiveEntry(null);
    setDescription('');
    setNotes('');
    setPartsUsed([]);
    setEditStartDate('');
    setEditStartClock('');
    setEditEndDate('');
    setEditEndClock('');

    toast({
      title: "Tid opdateret",
      description: "Tidsregistreringen er blevet opdateret.",
    });
  };

  const deleteTimeEntry = (entryId: string) => {
    setEntryToDelete(entryId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!entryToDelete) return;

    setTimeEntries(prev => prev.filter(entry => entry.id !== entryToDelete));
    saveTimeEntries(timeEntries.filter(entry => entry.id !== entryToDelete));

    if (onTimeEntryDelete) {
      onTimeEntryDelete(entryToDelete);
    }

    setShowDeleteDialog(false);
    setEntryToDelete(null);

    toast({
      title: "Tid slettet",
      description: "Tidsregistreringen er blevet slettet.",
    });
  };

  const saveTimeEntries = (entries: TimeEntry[]) => {
    try {
      localStorage.setItem(`time_entries_${machineId}`, JSON.stringify(entries));
    } catch (error) {
      console.error("Error saving time entries:", error);
      toast({
        variant: "destructive",
        title: "Fejl ved gemning",
        description: "Kunne ikke gemme tidsregistreringer.",
      });
    }
  };

  const canEditTime = hasPermission('admin') || hasPermission('leader') || hasPermission('mechanic') || hasPermission('technician');
  const canEditHours = hasPermission('leader');

  const toLocalDateValue = (isoString: string) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toLocalTimeValue = (isoString: string) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const toISOFromLocal = (dateValue: string, timeValue: string) => {
    if (!dateValue || !timeValue) return undefined;
    const [year, month, day] = dateValue.split('-').map(Number);
    const [hours, minutes] = timeValue.split(':').map(Number);
    if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) return undefined;
    const localDate = new Date(year, month - 1, day, hours, minutes);
    if (Number.isNaN(localDate.getTime())) return undefined;
    return localDate.toISOString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tidsregistrering</CardTitle>
        <CardDescription>
          Registrer arbejdstid på {equipmentType === 'crane' ? 'kran' : equipmentType === 'winch' ? 'spil' : 'lastbil'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!activeEntry && !isEditing && (
          <Button 
            onClick={startTimeEntry}
            className="w-full"
            disabled={!canEditTime}
          >
            <Play className="h-4 w-4 mr-2" />
            Start tid
          </Button>
        )}

        {activeEntry && !isEditing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Startet</div>
                <div className="font-medium">{formatDateTime(activeEntry.startTime)}</div>
              </div>
              <Button 
                onClick={stopTimeEntry}
                variant="destructive"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop tid
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Beskrivelse</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskriv det udførte arbejde..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Noter</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tilføj eventuelle noter..."
                className="min-h-[100px]"
              />
            </div>

            <PartsManager
              parts={partsUsed}
              onPartsChange={setPartsUsed}
            />
          </div>
        )}

        {isEditing && activeEntry && (
          <div className="space-y-4">
            {canEditHours && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Starttid</label>
                  <div className="grid gap-2">
                    <Input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                    />
                    <Input
                      type="time"
                      step="60"
                      value={editStartClock}
                      onChange={(e) => setEditStartClock(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sluttid</label>
                  <div className="grid gap-2">
                    <Input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                    />
                    <Input
                      type="time"
                      step="60"
                      value={editEndClock}
                      onChange={(e) => setEditEndClock(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Beskrivelse</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskriv det udførte arbejde..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Noter</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tilføj eventuelle noter..."
                className="min-h-[100px]"
              />
            </div>

            <PartsManager
              parts={partsUsed}
              onPartsChange={setPartsUsed}
            />

            <div className="flex gap-2">
              <Button 
                onClick={saveTimeEntry}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Gem ændringer
              </Button>
              <Button 
                onClick={() => {
                  setIsEditing(false);
                  setActiveEntry(null);
                }}
                variant="outline"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Annuller
              </Button>
            </div>
          </div>
        )}

        {timeEntries.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Tidligere registreringer</h3>
            <div className="space-y-2">
              {timeEntries
                .filter(entry => entry.status !== 'active')
                .map(entry => (
                  <div 
                    key={entry.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {formatDateTime(entry.startTime)}
                        {entry.endTime && ` - ${formatDateTime(entry.endTime)}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {entry.duration && formatDuration(entry.duration)}
                      </div>
                      <div className="text-sm mt-1">{entry.description}</div>
                      {entry.partsUsed && entry.partsUsed.length > 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {entry.partsUsed.length} reservedel{entry.partsUsed.length !== 1 ? 'er' : ''} brugt
                        </div>
                      )}
                    </div>
                    {canEditTime && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editTimeEntry(entry)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTimeEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker på at du vil slette denne tidsregistrering?</AlertDialogTitle>
            <AlertDialogDescription>
              Denne handling kan ikke fortrydes. Tidsregistreringen vil blive slettet permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Slet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default TimeTracking; 