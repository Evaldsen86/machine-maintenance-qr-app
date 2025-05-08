import { createClient } from '@supabase/supabase-js';
import { openDB } from 'idb';

// These values should be stored in environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with auto-retry and better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize IndexedDB for offline support
const initDB = async () => {
  return openDB('machine-history-qr', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('machines')) {
        db.createObjectStore('machines', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('maintenance')) {
        db.createObjectStore('maintenance', { keyPath: 'id' });
      }
    }
  });
};

// Initialize DB
initDB().catch(console.error);

// Types for our database tables
export type Machine = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  qr_data?: {
    width: number;
    margin: number;
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
    color: {
      dark: string;
      light: string;
    };
  };
};

// Helper functions for machine operations with offline support
export const machineService = {
  // Expose the supabase client
  supabase,
  
  // Get all machines with offline support
  getAllMachines: async () => {
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Store in IndexedDB for offline access
      const db = await initDB();
      const tx = db.transaction('machines', 'readwrite');
      const store = tx.objectStore('machines');
      for (const machine of data) {
        await store.put(machine);
      }
      
      return data as Machine[];
    } catch (error) {
      console.error('Error fetching machines:', error);
      
      // Try to get from IndexedDB if online fetch fails
      try {
        const db = await initDB();
        const machines = await db.getAll('machines');
        return machines as Machine[];
      } catch (offlineError) {
        console.error('Error fetching from IndexedDB:', offlineError);
        throw error;
      }
    }
  },

  // Get a single machine by ID
  getMachineById: async (id: number) => {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Machine;
  },

  // Create a new machine
  createMachine: async (machine: Omit<Machine, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('machines')
      .insert([machine])
      .select()
      .single();
    
    if (error) throw error;
    return data as Machine;
  },

  // Update a machine
  updateMachine: async (id: number, updates: Partial<Machine>) => {
    const { data, error } = await supabase
      .from('machines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Machine;
  },

  // Delete a machine
  deleteMachine: async (id: number) => {
    const { error } = await supabase
      .from('machines')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Add a task to a machine
  addTask: async (machineId: number, taskData: any) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...taskData, machine_id: machineId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get tasks for a machine
  getTasks: async (machineId: number) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('machine_id', machineId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Add a maintenance record
  addMaintenance: async (machineId: number, maintenanceData: any) => {
    const { data, error } = await supabase
      .from('maintenance')
      .insert({ ...maintenanceData, machine_id: machineId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get maintenance records for a machine
  getMaintenance: async (machineId: number) => {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .eq('machine_id', machineId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Update oil information
  updateOilInfo: async (machineId: number, oilInfo: any) => {
    const { data, error } = await supabase
      .from('machines')
      .update({ oil_info: oilInfo })
      .eq('id', machineId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Generate QR code for a machine
  generateQRCode: async (machineId: number) => {
    const machine = await machineService.getMachineById(machineId);
    
    if (!machine) {
      throw new Error('Machine not found');
    }

    const qrData = {
      id: machine.id,
      name: machine.name,
      model: machine.model,
      serialNumber: machine.serial_number
    };

    return qrData;
  },

  // Validate QR code
  validateQRCode: async (qrData: any) => {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('id', qrData.id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      throw new Error('Machine not found');
    }

    // Verify that the scanned data matches the machine
    if (data.name !== qrData.name || 
        data.model !== qrData.model || 
        data.serial_number !== qrData.serialNumber) {
      throw new Error('Invalid QR code');
    }

    return data;
  }
}; 