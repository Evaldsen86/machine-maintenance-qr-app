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
import { MachineChecklist, ChecklistItem, ChecklistFrequency, Machine } from '@/types';
import { toast } from "@/components/ui/use-toast";
import { Plus, X, Trash2, GripVertical } from 'lucide-react';

interface ChecklistFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (checklist: MachineChecklist) => void;
  machines: Machine[];
  existingChecklist?: MachineChecklist;
}

const ChecklistForm: React.FC<ChecklistFormProps> = ({
  isOpen,
  onClose,
  onSave,
  machines,
  existingChecklist
}) => {
  const { user } = useAuth();
  const [selectedMachineId, setSelectedMachineId] = useState<string>(existingChecklist?.machineId || '');
  const [dailyChecks, setDailyChecks] = useState<ChecklistItem[]>(existingChecklist?.dailyChecks || []);
  const [weeklyChecks, setWeeklyChecks] = useState<ChecklistItem[]>(existingChecklist?.weeklyChecks || []);
  const [monthlyChecks, setMonthlyChecks] = useState<ChecklistItem[]>(existingChecklist?.monthlyChecks || []);

  useEffect(() => {
    if (existingChecklist) {
      setSelectedMachineId(existingChecklist.machineId);
      setDailyChecks(existingChecklist.dailyChecks || []);
      setWeeklyChecks(existingChecklist.weeklyChecks || []);
      setMonthlyChecks(existingChecklist.monthlyChecks || []);
    } else {
      setSelectedMachineId('');
      setDailyChecks([]);
      setWeeklyChecks([]);
      setMonthlyChecks([]);
    }
  }, [existingChecklist, isOpen]);

  // Log machines for debugging
  useEffect(() => {
    if (isOpen) {
      console.log('ChecklistForm - Machines available:', machines.length, machines);
    }
  }, [isOpen, machines]);

  const addChecklistItem = (frequency: ChecklistFrequency) => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      title: '',
      description: '',
      frequency,
      order: frequency === 'daily' ? dailyChecks.length : frequency === 'weekly' ? weeklyChecks.length : monthlyChecks.length,
    };

    if (frequency === 'daily') {
      setDailyChecks([...dailyChecks, newItem]);
    } else if (frequency === 'weekly') {
      setWeeklyChecks([...weeklyChecks, newItem]);
    } else {
      setMonthlyChecks([...monthlyChecks, newItem]);
    }
  };

  const removeChecklistItem = (frequency: ChecklistFrequency, itemId: string) => {
    if (frequency === 'daily') {
      setDailyChecks(dailyChecks.filter(item => item.id !== itemId));
    } else if (frequency === 'weekly') {
      setWeeklyChecks(weeklyChecks.filter(item => item.id !== itemId));
    } else {
      setMonthlyChecks(monthlyChecks.filter(item => item.id !== itemId));
    }
  };

  const updateChecklistItem = (frequency: ChecklistFrequency, itemId: string, field: 'title' | 'description', value: string) => {
    const updateItem = (items: ChecklistItem[]) => 
      items.map(item => item.id === itemId ? { ...item, [field]: value } : item);

    if (frequency === 'daily') {
      setDailyChecks(updateItem(dailyChecks));
    } else if (frequency === 'weekly') {
      setWeeklyChecks(updateItem(weeklyChecks));
    } else {
      setMonthlyChecks(updateItem(monthlyChecks));
    }
  };

  const onSubmit = () => {
    if (!selectedMachineId) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Vælg venligst en maskine.",
      });
      return;
    }

    const selectedMachine = machines.find(m => m.id === selectedMachineId);
    if (!selectedMachine) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Maskine ikke fundet.",
      });
      return;
    }

    // Validate that all items have titles
    const allItems = [...dailyChecks, ...weeklyChecks, ...monthlyChecks];
    const itemsWithoutTitle = allItems.filter(item => !item.title || item.title.trim() === '');
    if (itemsWithoutTitle.length > 0) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Alle checkliste punkter skal have en titel.",
      });
      return;
    }

    try {
      const checklist: MachineChecklist = {
        id: existingChecklist?.id || `checklist-${Date.now()}`,
        machineId: selectedMachineId,
        machineName: selectedMachine.name,
        dailyChecks: dailyChecks.map((item, index) => ({ ...item, order: index })),
        weeklyChecks: weeklyChecks.map((item, index) => ({ ...item, order: index })),
        monthlyChecks: monthlyChecks.map((item, index) => ({ ...item, order: index })),
        createdAt: existingChecklist?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onSave(checklist);
      
      toast({
        title: existingChecklist ? "Checkliste opdateret" : "Checkliste oprettet",
        description: `Checklisten for ${selectedMachine.name} er blevet ${existingChecklist ? 'opdateret' : 'oprettet'}.`,
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving checklist:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Der opstod en fejl under gemning af checklisten.",
      });
    }
  };

  const renderChecklistSection = (frequency: ChecklistFrequency, items: ChecklistItem[], label: string) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">{label}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addChecklistItem(frequency)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Tilføj punkt
          </Button>
        </div>
        <div className="space-y-2 border rounded p-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Ingen {label.toLowerCase()} tilføjet endnu
            </p>
          ) : (
            items.map((item, index) => (
              <div key={item.id} className="flex items-start gap-2 p-2 bg-muted rounded">
                <GripVertical className="h-4 w-4 text-muted-foreground mt-2 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Titel (påkrævet)"
                    value={item.title}
                    onChange={(e) => updateChecklistItem(frequency, item.id, 'title', e.target.value)}
                    className="text-sm"
                  />
                  <Textarea
                    placeholder="Beskrivelse (valgfrit)"
                    value={item.description || ''}
                    onChange={(e) => updateChecklistItem(frequency, item.id, 'description', e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChecklistItem(frequency, item.id)}
                  className="flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingChecklist ? 'Rediger Checkliste' : 'Opret Checkliste'}</DialogTitle>
          <DialogDescription>
            Opret eller rediger checklister for daglige, ugentlige og månedlige checks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Machine Selection */}
          <div className="space-y-2">
            <Label htmlFor="machine">Maskine *</Label>
            {machines.length === 0 ? (
              <div className="p-4 border rounded bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Ingen maskiner tilgængelige. Tilføj maskiner i Dashboard først.
                </p>
              </div>
            ) : (
              <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg maskine" />
                </SelectTrigger>
                <SelectContent>
                  {machines.map(machine => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name} ({machine.brand} {machine.model})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Daily Checks */}
          {renderChecklistSection('daily', dailyChecks, 'Daglige Checks')}

          {/* Weekly Checks */}
          {renderChecklistSection('weekly', weeklyChecks, 'Ugentlige Checks')}

          {/* Monthly Checks */}
          {renderChecklistSection('monthly', monthlyChecks, 'Månedlige Checks')}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuller
            </Button>
            <Button type="button" onClick={onSubmit}>
              <Plus className="h-4 w-4 mr-2" />
              {existingChecklist ? 'Opdater' : 'Opret'} Checkliste
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChecklistForm;

