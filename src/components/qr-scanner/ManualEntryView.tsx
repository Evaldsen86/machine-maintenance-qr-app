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
      const cleanCode = manualCode.trim().toLowerCase();
      
      // Try different formats of the machine ID
      const machineIdWithPrefix = cleanCode.startsWith('machine-') ? cleanCode : `machine-${cleanCode}`;
      const machineIdWithoutPrefix = cleanCode.replace('machine-', '');
      
      // Check if machine exists
      const machineExists = machines.some((machine: Machine) => 
        machine.id === machineIdWithPrefix || machine.id === machineIdWithoutPrefix
      );
      
      if (machineExists) {
        // Use the correct format when handling the scan
        const foundMachine = machines.find((machine: Machine) => 
          machine.id === machineIdWithPrefix || machine.id === machineIdWithoutPrefix
        );
        
        if (foundMachine) {
          console.log("Machine found via manual code:", foundMachine.id);
          onScan(foundMachine.id);
          setManualCode('');
        }
      } else {
        console.error("No machine found with code:", cleanCode, "or", machineIdWithPrefix);
        toast({
          variant: "destructive",
          title: "Fejl",
          description: "Ingen maskine fundet med denne kode.",
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
          Indtast ID eller koden fra maskinens QR-kode. Eksempel: machine-1 eller bare 1
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
