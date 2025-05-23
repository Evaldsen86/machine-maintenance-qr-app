import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import MachineAddForm from '@/components/machine/MachineAddForm';
import { Machine } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { machineService } from '@/lib/supabase';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';

const AddMachine = () => {
  const navigate = useNavigate();
  
  const handleSave = async (machine: Machine) => {
    try {
      if (!machine.serialNumber) {
        throw new Error('Serienummer er påkrævet');
      }

      // Prepare data for Supabase
      const machineData = {
        name: machine.name,
        model: machine.model,
        serial_number: machine.serialNumber,
        status: machine.status,
        equipment: machine.equipment,
        location: typeof machine.location === 'string' ? machine.location : machine.location?.name,
        coordinates: machine.coordinates,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const newMachine = await machineService.createMachine(machineData);
      
      if (newMachine) {
        // Store the full machine data in localStorage for offline access
        const fullMachineData = {
          ...machine,
          id: newMachine.id.toString(),
          created_at: newMachine.created_at,
          updated_at: newMachine.updated_at
        };
        
        const storedMachines = localStorage.getItem('dashboard_machines');
        const machines = storedMachines ? JSON.parse(storedMachines) : [];
        machines.push(fullMachineData);
        localStorage.setItem('dashboard_machines', JSON.stringify(machines));

        toast({
          title: SUCCESS_MESSAGES.MACHINE_CREATED,
          description: `${machine.name} er blevet oprettet.`,
        });
        navigate('/dashboard');
      } else {
        throw new Error('Failed to create machine');
      }
    } catch (error) {
      console.error('Error creating machine:', error);
      toast({
        variant: "destructive",
        title: ERROR_MESSAGES.VALIDATION_ERROR,
        description: error instanceof Error ? error.message : "Der opstod en fejl ved oprettelse af maskinen. Prøv venligst igen.",
      });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <div className="page-container py-6">
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Tilbage til dashboard
            </Button>
            <h1 className="text-2xl font-semibold">Tilføj Ny Maskine</h1>
          </div>
          
          <MachineAddForm 
            onSave={handleSave}
            onCancel={() => navigate('/dashboard')}
          />
        </div>
      </main>
    </div>
  );
};

export default AddMachine;
