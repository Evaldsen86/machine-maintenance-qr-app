import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { TimeEntry, EquipmentType, Part } from '@/types';
import { formatDateTime, formatDuration } from '@/utils/dateUtils';
import { Link } from 'react-router-dom';
import {
  getStatusLabel,
  getStatusVariant,
  toLocalDateValue,
  toLocalTimeValue,
  toISOFromLocal,
  loadTimeEntriesForMachine,
} from '@/utils/timeEntryUtils';
import { Play, Square, Edit, Trash2, Check, X, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PartsManager from './PartsManager';
import { useInventory } from '@/hooks/useInventory';
import {
  applyInventoryQuantityChanges,
  diffPartInventoryUsage,
  restoreInventoryForDeletedTimeEntry,
} from '@/utils/inventoryPartUsage';

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
  const { changeQuantity } = useInventory();
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

  const persistTimeEntries = (mutator: (prev: TimeEntry[]) => TimeEntry[]) => {
    setTimeEntries((prev) => {
      const next = mutator(prev);
      try {
        localStorage.setItem(`time_entries_${machineId}`, JSON.stringify(next));
      } catch (error) {
        console.error('Error saving time entries:', error);
        toast({
          variant: 'destructive',
          title: 'Fejl ved gemning',
          description: 'Kunne ikke gemme tidsregistreringer.',
        });
      }
      return next;
    });
  };

  // Load time entries from localStorage
  useEffect(() => {
    const loadTimeEntries = () => {
      try {
        const entries = loadTimeEntriesForMachine(machineId);
        setTimeEntries(entries);

        const active = user
          ? entries.find(
              (entry: TimeEntry) => entry.status === 'active' && entry.userId === user.id
            )
          : undefined;

        if (active) {
          setActiveEntry(active);
          setDescription(active.description);
          setNotes(active.notes || '');
          setPartsUsed(active.partsUsed || []);
        } else {
          setActiveEntry(null);
        }
      } catch (error) {
        console.error('Error loading time entries:', error);
      }
    };

    loadTimeEntries();
  }, [machineId, user?.id]);

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
    persistTimeEntries((prev) => [newEntry, ...prev]);
  };

  const stopTimeEntry = async () => {
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

    try {
      await applyInventoryQuantityChanges(
        diffPartInventoryUsage([], partsUsed),
        changeQuantity
      );
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        variant: 'destructive',
        title: 'Lagerfejl',
        description: 'Kunne ikke opdatere lagerbeholdning for reservedele.',
      });
      return;
    }

    setActiveEntry(null);
    persistTimeEntries((prev) =>
      prev.map((entry) => (entry.id === activeEntry.id ? updatedEntry : entry))
    );

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

  const saveTimeEntry = async () => {
    if (!activeEntry) return;

    let updatedStartTime = activeEntry.startTime;
    let updatedEndTime = activeEntry.endTime;
    let updatedDuration = activeEntry.duration;

    if (canEditHoursForEntry(activeEntry)) {
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

    try {
      await applyInventoryQuantityChanges(
        diffPartInventoryUsage(activeEntry.partsUsed, partsUsed),
        changeQuantity
      );
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        variant: 'destructive',
        title: 'Lagerfejl',
        description: 'Kunne ikke opdatere lagerbeholdning for reservedele.',
      });
      return;
    }

    persistTimeEntries((prev) =>
      prev.map((entry) => (entry.id === activeEntry.id ? updatedEntry : entry))
    );

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

  const confirmDelete = async () => {
    if (!entryToDelete) return;

    const entry = timeEntries.find((e) => e.id === entryToDelete);
    if (entry) {
      try {
        await restoreInventoryForDeletedTimeEntry(entry, changeQuantity);
      } catch (error) {
        console.error('Error restoring inventory:', error);
        toast({
          variant: 'destructive',
          title: 'Lagerfejl',
          description: 'Kunne ikke tilbageføre reservedele til lageret.',
        });
        return;
      }
    }

    persistTimeEntries((prev) => prev.filter((entry) => entry.id !== entryToDelete));

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

  const approveTimeEntry = (entry: TimeEntry) => {
    if (!user) return;
    const updated: TimeEntry = {
      ...entry,
      status: 'approved',
      approvedBy: user.name,
      approvedAt: new Date().toISOString(),
    };
    persistTimeEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? updated : e))
    );
    if (onTimeEntryUpdate) onTimeEntryUpdate(updated);
    toast({ title: "Tid godkendt", description: "Tidsregistreringen er godkendt." });
  };

  const rejectTimeEntry = (entry: TimeEntry) => {
    if (!user) return;
    const updated: TimeEntry = {
      ...entry,
      status: 'rejected',
      approvedBy: user.name,
      approvedAt: new Date().toISOString(),
    };
    persistTimeEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? updated : e))
    );
    if (onTimeEntryUpdate) onTimeEntryUpdate(updated);
    toast({ title: "Tid afvist", description: "Tidsregistreringen er afvist." });
  };

  const isLeaderOrAdmin = hasPermission('admin') || hasPermission('leader');
  const canStartTime =
    hasPermission('admin') ||
    hasPermission('leader') ||
    hasPermission('mechanic') ||
    hasPermission('technician') ||
    hasPermission('blacksmith') ||
    hasPermission('lagermand');

  const canEditEntry = (entry: TimeEntry) => {
    if (!user) return false;
    if (isLeaderOrAdmin) return true;
    return entry.userId === user.id || entry.userName === user.name;
  };

  const canEditHoursForEntry = (entry: TimeEntry) => {
    if (!user) return false;
    if (isLeaderOrAdmin) return true;
    return entry.userId === user.id || entry.userName === user.name;
  };

  const canApproveEntry = (entry: TimeEntry) => {
    return isLeaderOrAdmin && entry.status === 'completed';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tidsregistrering</CardTitle>
        <CardDescription className="flex flex-col gap-2">
          <span>
            Registrer arbejdstid på {equipmentType === 'crane' ? 'kran' : equipmentType === 'winch' ? 'spil' : 'lastbil'}.
          </span>
          <Link to="/tidsregistrering" className="text-primary hover:underline text-sm font-medium">
            Gå til samlet tidsregistrering →
          </Link>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!activeEntry && !isEditing && (
          <Button 
            onClick={startTimeEntry}
            className="w-full"
            disabled={!canStartTime}
          >
            <Play className="h-4 w-4 mr-2" />
            Start tid
          </Button>
        )}

        {activeEntry && !isEditing && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Startet</div>
                <div className="font-medium break-words">{formatDateTime(activeEntry.startTime)}</div>
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
              machineId={machineId}
            />
          </div>
        )}

        {isEditing && activeEntry && (
          <div className="space-y-4">
            {canEditHoursForEntry(activeEntry) && (
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
              machineId={machineId}
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
            <h3 className="font-medium">Tidsregistreringer</h3>
            <div className="space-y-2">
              {timeEntries
                .filter(entry => entry.status !== 'active' && !entry.archived)
                .slice(0, 5)
                .map(entry => (
                  <div 
                    key={entry.id}
                    className="flex flex-col gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium">
                            {formatDateTime(entry.startTime)}
                            {entry.endTime && ` – ${formatDateTime(entry.endTime)}`}
                          </span>
                          <Badge variant={getStatusVariant(entry.status)} className="text-xs">
                            {getStatusLabel(entry.status)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.duration != null && formatDuration(entry.duration)}
                          {entry.userName && ` · ${entry.userName}`}
                        </div>
                        {entry.description && (
                          <div className="text-sm mt-1">{entry.description}</div>
                        )}
                        {entry.partsUsed && entry.partsUsed.length > 0 && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {entry.partsUsed.length} reservedel{entry.partsUsed.length !== 1 ? 'er' : ''} brugt
                          </div>
                        )}
                        {entry.approvedBy && (entry.status === 'approved' || entry.status === 'rejected') && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {entry.status === 'approved' ? 'Godkendt' : 'Afvist'} af {entry.approvedBy}
                            {entry.approvedAt && ` ${new Date(entry.approvedAt).toLocaleDateString('da-DK')}`}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {canApproveEntry(entry) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => approveTimeEntry(entry)}
                              title="Godkend"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => rejectTimeEntry(entry)}
                              title="Afvis"
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {canEditEntry(entry) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editTimeEntry(entry)}
                              title="Rediger"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTimeEntry(entry.id)}
                              title="Slet"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            {timeEntries.filter(e => e.status !== 'active' && !e.archived).length > 5 && (
              <Link to="/tidsregistrering" className="text-sm text-primary hover:underline block text-center pt-2">
                Se alle tidsregistreringer ({timeEntries.filter(e => e.status !== 'active' && !e.archived).length})
              </Link>
            )}
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