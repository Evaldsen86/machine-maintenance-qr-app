import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Machine } from '@/types';

interface ManualEntryViewProps {
  onScan: (machineId: string) => void;
  machines: Machine[];
}

const ManualEntryView: React.FC<ManualEntryViewProps> = ({ onScan, machines }) => {
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualCode.trim()) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Indtast venligst en gyldig kode.",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Clean the input code
      const cleanCode = manualCode.trim();
      const cleanCodeLower = cleanCode.toLowerCase();
      
      console.log("Searching for machine with code:", cleanCode, "Total machines:", machines.length);
      
      // Search for machine by ID (case-insensitive), QR code, or name
      const foundMachine = machines.find((machine: Machine) => {
        const machineIdLower = machine.id.toLowerCase();
        const machineNameLower = machine.name?.toLowerCase() || '';
        const machineQrCodeLower = machine.qrCode?.toLowerCase() || '';
        
        // Try exact ID match (case-insensitive) - this should handle "machine-1" === "machine-1"
        if (machineIdLower === cleanCodeLower) {
          return true;
        }
        
        // Try ID with "machine-" prefix if input doesn't have it (e.g., input "1" matches "machine-1")
        if (!cleanCodeLower.startsWith('machine-')) {
          if (machineIdLower === `machine-${cleanCodeLower}`) {
            return true;
          }
        }
        
        // Try ID without "machine-" prefix if input has it (shouldn't be needed but just in case)
        if (cleanCodeLower.startsWith('machine-')) {
          const codeWithoutPrefix = cleanCodeLower.replace(/^machine-/, '');
          // Match if machine ID is exactly "machine-{number}"
          if (machineIdLower === `machine-${codeWithoutPrefix}`) {
            return true;
          }
        }
        
        // Try QR code match (case-insensitive)
        if (machineQrCodeLower && machineQrCodeLower === cleanCodeLower) {
          return true;
        }
        
        // Try name match (partial, case-insensitive)
        if (machineNameLower.includes(cleanCodeLower)) {
          return true;
        }
        
        return false;
      });
      
      if (foundMachine) {
        console.log("Machine found via manual code:", foundMachine.id, foundMachine.name);
        onScan(foundMachine.id);
        setManualCode('');
      } else {
        console.error("No machine found with code:", cleanCode);
        console.error("Available machines:", machines.map(m => ({ id: m.id, name: m.name, qrCode: m.qrCode })));
        toast({
          variant: "destructive",
          title: "Fejl",
          description: `Ingen maskine fundet med "${cleanCode}". Prøv at søge på ID (f.eks. machine-1), QR-kode eller navn.`,
        });
      }
    } catch (error) {
      console.error("Error checking machine:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Der opstod en fejl. Prøv igen senere.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleManualSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="machine-code" className="text-sm font-medium">
          Maskine ID / QR-kode
        </label>
        <div className="relative">
          <Input
            id="machine-code"
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Indtast maskine-ID"
            className="w-full"
            disabled={isLoading}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Indtast maskine ID, QR-kode eller navn. Eksempel: machine-1, 1, eller maskinens navn
        </p>
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading || !manualCode.trim()}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          "Find Maskine"
        )}
      </Button>
    </form>
  );
};

export default ManualEntryView;
