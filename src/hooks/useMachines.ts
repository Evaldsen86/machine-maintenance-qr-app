import { useState, useEffect, useCallback } from 'react';
import { Machine } from '@/types';
import { mockMachines } from '@/data/mockData';
import { toast } from "@/components/ui/use-toast";

const LOCAL_STORAGE_KEY = 'dashboard_machines';

export const useMachines = () => {
  const [machines, setMachines] = useState<Machine[]>(() => {
    try {
      const storedMachines = localStorage.getItem(LOCAL_STORAGE_KEY);
      return storedMachines ? JSON.parse(storedMachines) : mockMachines;
    } catch (error) {
      console.error("Error loading machines from localStorage:", error);
      return mockMachines;
    }
  });

  const saveMachines = useCallback((updatedMachines: Machine[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedMachines));
      console.log("Saved machines to localStorage successfully");
    } catch (error) {
      console.error("Error saving machines to localStorage:", error);
      toast({
        variant: "destructive",
        title: "Fejl ved gemning",
        description: "Kunne ikke gemme data. Kontroller din browser's indstillinger for lokal lagring.",
      });
    }
  }, []);

  const updateMachine = useCallback((machineId: string, updates: Partial<Machine>) => {
    setMachines(prevMachines => {
      const updatedMachines = prevMachines.map(machine => 
        machine.id === machineId ? { ...machine, ...updates } : machine
      );
      saveMachines(updatedMachines);
      return updatedMachines;
    });
  }, [saveMachines]);

  const updateTask = useCallback((machineId: string, taskId: string, taskUpdates: any) => {
    setMachines(prevMachines => {
      const updatedMachines = prevMachines.map(machine => {
        if (machine.id === machineId) {
          return {
            ...machine,
            tasks: machine.tasks?.map(task => 
              task.id === taskId ? { ...task, ...taskUpdates } : task
            ) || []
          };
        }
        return machine;
      });
      saveMachines(updatedMachines);
      return updatedMachines;
    });
  }, [saveMachines]);

  const addMachine = useCallback((newMachine: Machine) => {
    setMachines(prevMachines => {
      const updatedMachines = [newMachine, ...prevMachines];
      saveMachines(updatedMachines);
      return updatedMachines;
    });
  }, [saveMachines]);

  const deleteMachine = useCallback((machineId: string) => {
    setMachines(prevMachines => {
      const updatedMachines = prevMachines.filter(machine => machine.id !== machineId);
      saveMachines(updatedMachines);
      return updatedMachines;
    });
  }, [saveMachines]);

  const getMachine = useCallback((machineId: string) => {
    if (!machineId) return undefined;
    // Try exact match first
    let found = machines.find(machine => machine.id === machineId);
    // If not found, try case-insensitive match
    if (!found) {
      const machineIdLower = machineId.toLowerCase();
      found = machines.find(machine => machine.id.toLowerCase() === machineIdLower);
    }
    return found;
  }, [machines]);

  return {
    machines,
    setMachines,
    updateMachine,
    updateTask,
    addMachine,
    deleteMachine,
    getMachine,
    saveMachines
  };
}; 