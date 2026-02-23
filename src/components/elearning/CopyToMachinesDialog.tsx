import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Machine, Video, MachineChecklist } from '@/types';
import { Copy, CheckCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface CopyToMachinesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy: (targetMachineIds: string[]) => void;
  sourceMachine: Machine;
  machines: Machine[];
  type: 'videos' | 'checklist';
  itemCount?: number;
}

const CopyToMachinesDialog: React.FC<CopyToMachinesDialogProps> = ({
  isOpen,
  onClose,
  onCopy,
  sourceMachine,
  machines,
  type,
  itemCount = 0
}) => {
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);

  // Find machines with same brand and model
  const sameTypeMachines = machines.filter(m => 
    m.id !== sourceMachine.id && 
    m.brand === sourceMachine.brand && 
    m.model === sourceMachine.model
  );

  // Find machines with same brand only
  const sameBrandMachines = machines.filter(m => 
    m.id !== sourceMachine.id && 
    m.brand === sourceMachine.brand && 
    m.model !== sourceMachine.model
  );

  // All other machines
  const otherMachines = machines.filter(m => 
    m.id !== sourceMachine.id && 
    m.brand !== sourceMachine.brand
  );

  const handleToggleMachine = (machineId: string) => {
    if (selectedMachineIds.includes(machineId)) {
      setSelectedMachineIds(selectedMachineIds.filter(id => id !== machineId));
    } else {
      setSelectedMachineIds([...selectedMachineIds, machineId]);
    }
  };

  const handleSelectAll = (machineIds: string[]) => {
    const allSelected = machineIds.every(id => selectedMachineIds.includes(id));
    if (allSelected) {
      setSelectedMachineIds(selectedMachineIds.filter(id => !machineIds.includes(id)));
    } else {
      setSelectedMachineIds([...new Set([...selectedMachineIds, ...machineIds])]);
    }
  };

  const handleCopy = () => {
    if (selectedMachineIds.length === 0) {
      return;
    }
    onCopy(selectedMachineIds);
    setSelectedMachineIds([]);
    onClose();
  };

  const renderMachineGroup = (title: string, machineList: Machine[], badge?: string) => {
    if (machineList.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="font-semibold">{title}</Label>
            {badge && <Badge variant="outline">{badge}</Badge>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSelectAll(machineList.map(m => m.id))}
          >
            {machineList.every(m => selectedMachineIds.includes(m.id)) ? 'Fjern alle' : 'Vælg alle'}
          </Button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
          {machineList.map(machine => (
            <div key={machine.id} className="flex items-center space-x-2">
              <Checkbox
                id={`machine-${machine.id}`}
                checked={selectedMachineIds.includes(machine.id)}
                onCheckedChange={() => handleToggleMachine(machine.id)}
              />
              <Label htmlFor={`machine-${machine.id}`} className="cursor-pointer flex-1 text-sm">
                {machine.name} ({machine.brand} {machine.model})
              </Label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kopiér {type === 'videos' ? 'Videoer' : 'Checkliste'} til andre maskiner</DialogTitle>
          <DialogDescription>
            Kopiér {type === 'videos' ? `${itemCount} videoer` : 'checklisten'} fra {sourceMachine.name} ({sourceMachine.brand} {sourceMachine.model}) til andre maskiner
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {sameTypeMachines.length > 0 && renderMachineGroup(
            'Samme type maskiner',
            sameTypeMachines,
            `${sameTypeMachines.length} maskiner`
          )}

          {sameBrandMachines.length > 0 && renderMachineGroup(
            'Samme mærke',
            sameBrandMachines,
            `${sameBrandMachines.length} maskiner`
          )}

          {otherMachines.length > 0 && renderMachineGroup(
            'Andre maskiner',
            otherMachines,
            `${otherMachines.length} maskiner`
          )}

          {sameTypeMachines.length === 0 && sameBrandMachines.length === 0 && otherMachines.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ingen andre maskiner tilgængelige
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuller
          </Button>
          <Button 
            onClick={handleCopy}
            disabled={selectedMachineIds.length === 0}
          >
            <Copy className="h-4 w-4 mr-2" />
            Kopiér til {selectedMachineIds.length} maskine{selectedMachineIds.length !== 1 ? 'r' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyToMachinesDialog;

