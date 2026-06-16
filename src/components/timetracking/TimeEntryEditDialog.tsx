import React, { useState, useEffect } from 'react';
import { TimeEntry } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { formatDuration } from '@/utils/dateUtils';
import {
  toLocalDateValue,
  toLocalTimeValue,
  toISOFromLocal,
} from '@/utils/timeEntryUtils';

interface TimeEntryEditDialogProps {
  entry: TimeEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: TimeEntry) => void;
  canEditHours: boolean;
  machineName?: string;
}

const TimeEntryEditDialog: React.FC<TimeEntryEditDialogProps> = ({
  entry,
  open,
  onOpenChange,
  onSave,
  canEditHours,
  machineName,
}) => {
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startClock, setStartClock] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endClock, setEndClock] = useState('');

  useEffect(() => {
    if (!entry) return;
    setDescription(entry.description);
    setNotes(entry.notes || '');
    setStartDate(toLocalDateValue(entry.startTime));
    setStartClock(toLocalTimeValue(entry.startTime));
    setEndDate(entry.endTime ? toLocalDateValue(entry.endTime) : '');
    setEndClock(entry.endTime ? toLocalTimeValue(entry.endTime) : '');
  }, [entry]);

  const handleSave = () => {
    if (!entry) return;

    let updatedStartTime = entry.startTime;
    let updatedEndTime = entry.endTime;
    let updatedDuration = entry.duration;

    if (canEditHours) {
      const parsedStart = toISOFromLocal(startDate, startClock);
      const parsedEnd = endDate || endClock ? toISOFromLocal(endDate, endClock) : undefined;

      if (!parsedStart) {
        toast({
          variant: 'destructive',
          title: 'Ugyldig starttid',
          description: 'Angiv en gyldig starttid.',
        });
        return;
      }

      if ((endDate || endClock) && !parsedEnd) {
        toast({
          variant: 'destructive',
          title: 'Ugyldig sluttid',
          description: 'Angiv både dato og tidspunkt for sluttid.',
        });
        return;
      }

      if (parsedEnd) {
        const startDt = new Date(parsedStart);
        const endDt = new Date(parsedEnd);
        if (endDt.getTime() < startDt.getTime()) {
          toast({
            variant: 'destructive',
            title: 'Ugyldig sluttid',
            description: 'Sluttiden skal være efter starttiden.',
          });
          return;
        }
        updatedDuration = Math.round((endDt.getTime() - startDt.getTime()) / (1000 * 60));
      }

      updatedStartTime = parsedStart;
      updatedEndTime = parsedEnd;
    }

    const updated: TimeEntry = {
      ...entry,
      startTime: updatedStartTime,
      endTime: updatedEndTime,
      duration: updatedDuration,
      description,
      notes,
      status: entry.status === 'approved' || entry.status === 'rejected' ? 'completed' : entry.status,
    };

    onSave(updated);
    onOpenChange(false);
  };

  if (!entry) return null;

  const previewDuration = (() => {
    const s = toISOFromLocal(startDate, startClock);
    const e = toISOFromLocal(endDate, endClock);
    if (!s || !e) return entry.duration;
    return Math.round((new Date(e).getTime() - new Date(s).getTime()) / (1000 * 60));
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Rediger tidsregistrering</DialogTitle>
          <DialogDescription>
            {machineName && `${machineName} · `}{entry.userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {canEditHours && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <Input type="time" step="60" value={startClock} onChange={(e) => setStartClock(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Slut</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                <Input type="time" step="60" value={endClock} onChange={(e) => setEndClock(e.target.value)} />
              </div>
            </div>
          )}

          {previewDuration != null && previewDuration > 0 && (
            <p className="text-sm text-muted-foreground">
              Varighed: <span className="font-medium text-foreground">{formatDuration(previewDuration)}</span>
            </p>
          )}

          <div className="space-y-2">
            <Label>Beskrivelse</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv det udførte arbejde..."
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Noter</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Eventuelle noter..."
              className="min-h-[60px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuller
          </Button>
          <Button onClick={handleSave}>Gem ændringer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimeEntryEditDialog;
