
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from '@/components/ui/use-toast';
import { mockMachines } from '@/data/mockData';

interface ManualEntryViewProps {
  onScan: (data: string) => void;
}

const ManualEntryView: React.FC<ManualEntryViewProps> = ({ onScan }) => {
  const [manualCode, setManualCode] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      try {
        const storedMachines = localStorage.getItem('dashboard_machines');
        const machines = storedMachines ? JSON.parse(storedMachines) : mockMachines;
        
        // Clean up the input code - remove any non-alphanumeric characters
        let cleanCode = manualCode.trim();
        
        // Handle full URLs
        if (cleanCode.includes('/machine/')) {
          cleanCode = cleanCode.split('/machine/')[1].split('?')[0].split('#')[0];
        }
        
        // Handle both with and without "machine-" prefix
        const machineIdWithPrefix = cleanCode.startsWith('machine-') ? cleanCode : `machine-${cleanCode}`;
        const machineIdWithoutPrefix = cleanCode.startsWith('machine-') ? cleanCode.substring(8) : cleanCode;
        
        console.log("Looking for machine with ID:", machineIdWithPrefix, "or", machineIdWithoutPrefix);

        // Check if the machine exists with either ID form
        const machineExists = machines.some((machine: any) => 
          machine.id === machineIdWithPrefix || machine.id === machineIdWithoutPrefix
        );
        
        if (machineExists) {
          // Use the correct format when handling the scan
          const foundMachine = machines.find((machine: any) => 
            machine.id === machineIdWithPrefix || machine.id === machineIdWithoutPrefix
          );
          
          if (foundMachine) {
            console.log("Machine found via manual code:", foundMachine.id);
            onScan(foundMachine.id);
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
      }
    } else {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Indtast venligst en gyldig kode.",
      });
    }
  };

  return (
    <form onSubmit={handleManualSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="machine-code" className="text-sm font-medium">
          Maskine ID / QR-kode
        </label>
        <div className="relative">
          <input
            id="machine-code"
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Indtast maskine-ID"
            className="w-full p-2 border rounded-md bg-background"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Indtast ID eller koden fra maskinens QR-kode. Eksempel: machine-1 eller bare 1
        </p>
      </div>
      
      <Button type="submit" className="w-full">
        Find Maskine
      </Button>
    </form>
  );
};

export default ManualEntryView;
