import { createClient } from '@supabase/supabase-js';
import { openDB } from 'idb';

// These values should be stored in environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with auto-retry and better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-application-name': 'machine-history-qr' }
  }
});

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
      
      return data;
    } catch (error) {
      console.error('Error fetching machines:', error);
      
      // Try to get from IndexedDB if online fetch fails
      try {
        const db = await initDB();
        const machines = await db.getAll('machines');
        return machines;
      } catch (offlineError) {
        console.error('Error fetching from IndexedDB:', offlineError);
        throw error;
      }
    }
  },

  // Get a single machine by ID
  getMachineById: async (id: string) => {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create a new machine
  createMachine: async (machineData: any) => {
    const { data, error } = await supabase
      .from('machines')
      .insert(machineData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update a machine
  updateMachine: async (id: string, machineData: any) => {
    const { data, error } = await supabase
      .from('machines')
      .update(machineData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete a machine
  deleteMachine: async (id: string) => {
    const { error } = await supabase
      .from('machines')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Add a task to a machine
  addTask: async (machineId: string, taskData: any) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...taskData, machine_id: machineId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get tasks for a machine
  getTasks: async (machineId: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('machine_id', machineId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Add a maintenance record
  addMaintenance: async (machineId: string, maintenanceData: any) => {
    const { data, error } = await supabase
      .from('maintenance')
      .insert({ ...maintenanceData, machine_id: machineId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get maintenance records for a machine
  getMaintenance: async (machineId: string) => {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .eq('machine_id', machineId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Update oil information
  updateOilInfo: async (machineId: string, oilInfo: any) => {
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
  generateQRCode: async (machineId: string) => {
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