
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import MachineAddForm from '@/components/machine/MachineAddForm';
import { Machine } from '@/types';
import { toast } from '@/components/ui/use-toast';

const AddMachine = () => {
  const navigate = useNavigate();
  
  const handleSave = (machine: Machine) => {
    // In a real app, this would send to a backend
    // For now, we'll just navigate to the dashboard
    toast({
      title: "Maskine oprettet",
      description: `${machine.name} er blevet oprettet.`,
    });
    navigate('/dashboard');
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
