import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { machineService } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../constants';

// Define types
export interface Machine {
  id: string;
  name: string;
  model: string;
  serial_number: string;
  specifications: string[];
  oil_info: {
    lastChange?: string;
    nextChange?: string;
    type?: string;
    quantity?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  machine_id: string;
  title: string;
  description?: string;
  due_date?: string;
  assigned_to?: string;
  status: 'pending' | 'in-progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Maintenance {
  id: string;
  machine_id: string;
  date: string;
  description: string;
  technician?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface MachineContextType {
  machines: Machine[];
  loading: boolean;
  error: string | null;
  selectedMachine: Machine | null;
  tasks: Task[];
  maintenance: Maintenance[];
  fetchMachines: () => Promise<void>;
  fetchMachine: (id: string) => Promise<void>;
  createMachine: (machineData: Partial<Machine>) => Promise<Machine | null>;
  updateMachine: (id: string, machineData: Partial<Machine>) => Promise<Machine | null>;
  deleteMachine: (id: string) => Promise<boolean>;
  addTask: (machineId: string, taskData: Partial<Task>) => Promise<Task | null>;
  updateTask: (taskId: string, taskData: Partial<Task>) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  addMaintenance: (machineId: string, maintenanceData: Partial<Maintenance>) => Promise<Maintenance | null>;
  updateMaintenance: (maintenanceId: string, maintenanceData: Partial<Maintenance>) => Promise<Maintenance | null>;
  deleteMaintenance: (maintenanceId: string) => Promise<boolean>;
  updateOilInfo: (machineId: string, oilInfo: any) => Promise<Machine | null>;
}

const MachineContext = createContext<MachineContextType | undefined>(undefined);

export const useMachineData = () => {
  const context = useContext(MachineContext);
  if (context === undefined) {
    throw new Error('useMachineData must be used within a MachineDataProvider');
  }
  return context;
};

interface MachineDataProviderProps {
  children: ReactNode;
}

export const MachineDataProvider: React.FC<MachineDataProviderProps> = ({ children }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);

  // Fetch all machines
  const fetchMachines = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await machineService.getAllMachines();
      setMachines(data);
    } catch (err) {
      console.error('Error fetching machines:', err);
      setError(ERROR_MESSAGES.SERVER_ERROR);
      toast.error(ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single machine by ID
  const fetchMachine = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const machine = await machineService.getMachineById(id);
      setSelectedMachine(machine);
      
      // Fetch related data
      const tasksData = await machineService.getTasks(id);
      const maintenanceData = await machineService.getMaintenance(id);
      
      setTasks(tasksData);
      setMaintenance(maintenanceData);
    } catch (err) {
      console.error('Error fetching machine:', err);
      setError(ERROR_MESSAGES.MACHINE_NOT_FOUND);
      toast.error(ERROR_MESSAGES.MACHINE_NOT_FOUND);
    } finally {
      setLoading(false);
    }
  };

  // Create a new machine
  const createMachine = async (machineData: Partial<Machine>) => {
    try {
      setLoading(true);
      setError(null);
      const newMachine = await machineService.createMachine(machineData);
      setMachines(prev => [...prev, newMachine]);
      toast.success(SUCCESS_MESSAGES.MACHINE_CREATED);
      return newMachine;
    } catch (err) {
      console.error('Error creating machine:', err);
      setError(ERROR_MESSAGES.VALIDATION_ERROR);
      toast.error(ERROR_MESSAGES.VALIDATION_ERROR);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update a machine
  const updateMachine = async (id: string, machineData: Partial<Machine>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedMachine = await machineService.updateMachine(id, machineData);
      
      // Update machines list
      setMachines(prev => 
        prev.map(machine => machine.id === id ? updatedMachine : machine)
      );
      
      // Update selected machine if it's the one being updated
      if (selectedMachine && selectedMachine.id === id) {
        setSelectedMachine(updatedMachine);
      }
      
      toast.success(SUCCESS_MESSAGES.MACHINE_UPDATED);
      return updatedMachine;
    } catch (err) {
      console.error('Error updating machine:', err);
      setError(ERROR_MESSAGES.VALIDATION_ERROR);
      toast.error(ERROR_MESSAGES.VALIDATION_ERROR);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a machine
  const deleteMachine = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await machineService.deleteMachine(id);
      
      // Remove from machines list
      setMachines(prev => prev.filter(machine => machine.id !== id));
      
      // Clear selected machine if it's the one being deleted
      if (selectedMachine && selectedMachine.id === id) {
        setSelectedMachine(null);
        setTasks([]);
        setMaintenance([]);
      }
      
      toast.success(SUCCESS_MESSAGES.MACHINE_DELETED);
      return true;
    } catch (err) {
      console.error('Error deleting machine:', err);
      setError(ERROR_MESSAGES.SERVER_ERROR);
      toast.error(ERROR_MESSAGES.SERVER_ERROR);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add a task to a machine
  const addTask = async (machineId: string, taskData: Partial<Task>) => {
    try {
      setLoading(true);
      setError(null);
      const newTask = await machineService.addTask(machineId, taskData);
      
      // Update tasks list
      setTasks(prev => [...prev, newTask]);
      
      toast.success(SUCCESS_MESSAGES.TASK_ADDED);
      return newTask;
    } catch (err) {
      console.error('Error adding task:', err);
      setError(ERROR_MESSAGES.VALIDATION_ERROR);
      toast.error(ERROR_MESSAGES.VALIDATION_ERROR);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update a task
  const updateTask = async (taskId: string, taskData: Partial<Task>) => {
    try {
      setLoading(true);
      setError(null);
      
      // This would be implemented in the machineService
      const { data, error } = await machineService.supabase
        .from('tasks')
        .update(taskData)
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update tasks list
      setTasks(prev => 
        prev.map(task => task.id === taskId ? data : task)
      );
      
      toast.success('Task updated successfully');
      return data;
    } catch (err) {
      console.error('Error updating task:', err);
      setError(ERROR_MESSAGES.VALIDATION_ERROR);
      toast.error(ERROR_MESSAGES.VALIDATION_ERROR);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // This would be implemented in the machineService
      const { error } = await machineService.supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
      
      // Remove from tasks list
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      toast.success('Task deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(ERROR_MESSAGES.SERVER_ERROR);
      toast.error(ERROR_MESSAGES.SERVER_ERROR);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add a maintenance record
  const addMaintenance = async (machineId: string, maintenanceData: Partial<Maintenance>) => {
    try {
      setLoading(true);
      setError(null);
      const newMaintenance = await machineService.addMaintenance(machineId, maintenanceData);
      
      // Update maintenance list
      setMaintenance(prev => [...prev, newMaintenance]);
      
      toast.success(SUCCESS_MESSAGES.MAINTENANCE_ADDED);
      return newMaintenance;
    } catch (err) {
      console.error('Error adding maintenance:', err);
      setError(ERROR_MESSAGES.VALIDATION_ERROR);
      toast.error(ERROR_MESSAGES.VALIDATION_ERROR);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update a maintenance record
  const updateMaintenance = async (maintenanceId: string, maintenanceData: Partial<Maintenance>) => {
    try {
      setLoading(true);
      setError(null);
      
      // This would be implemented in the machineService
      const { data, error } = await machineService.supabase
        .from('maintenance')
        .update(maintenanceData)
        .eq('id', maintenanceId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update maintenance list
      setMaintenance(prev => 
        prev.map(m => m.id === maintenanceId ? data : m)
      );
      
      toast.success('Maintenance record updated successfully');
      return data;
    } catch (err) {
      console.error('Error updating maintenance:', err);
      setError(ERROR_MESSAGES.VALIDATION_ERROR);
      toast.error(ERROR_MESSAGES.VALIDATION_ERROR);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a maintenance record
  const deleteMaintenance = async (maintenanceId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // This would be implemented in the machineService
      const { error } = await machineService.supabase
        .from('maintenance')
        .delete()
        .eq('id', maintenanceId);
      
      if (error) throw error;
      
      // Remove from maintenance list
      setMaintenance(prev => prev.filter(m => m.id !== maintenanceId));
      
      toast.success('Maintenance record deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting maintenance:', err);
      setError(ERROR_MESSAGES.SERVER_ERROR);
      toast.error(ERROR_MESSAGES.SERVER_ERROR);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update oil information
  const updateOilInfo = async (machineId: string, oilInfo: any) => {
    try {
      setLoading(true);
      setError(null);
      const updatedMachine = await machineService.updateOilInfo(machineId, oilInfo);
      
      // Update machines list
      setMachines(prev => 
        prev.map(machine => machine.id === machineId ? updatedMachine : machine)
      );
      
      // Update selected machine if it's the one being updated
      if (selectedMachine && selectedMachine.id === machineId) {
        setSelectedMachine(updatedMachine);
      }
      
      toast.success(SUCCESS_MESSAGES.OIL_INFO_UPDATED);
      return updatedMachine;
    } catch (err) {
      console.error('Error updating oil info:', err);
      setError(ERROR_MESSAGES.VALIDATION_ERROR);
      toast.error(ERROR_MESSAGES.VALIDATION_ERROR);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load machines on component mount
  useEffect(() => {
    fetchMachines();
  }, []);

  const value = {
    machines,
    loading,
    error,
    selectedMachine,
    tasks,
    maintenance,
    fetchMachines,
    fetchMachine,
    createMachine,
    updateMachine,
    deleteMachine,
    addTask,
    updateTask,
    deleteTask,
    addMaintenance,
    updateMaintenance,
    deleteMaintenance,
    updateOilInfo
  };

  return (
    <MachineContext.Provider value={value}>
      {children}
    </MachineContext.Provider>
  );
}; 