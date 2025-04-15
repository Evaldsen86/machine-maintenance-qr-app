import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MobileFriendlyViewer from '@/components/machine/MobileFriendlyViewer';
import { useIsMobile } from '@/hooks/use-mobile';

// Components
import Navbar from '@/components/Navbar';
import MachineOverview from '@/components/MachineOverview';
import PublicAccessBanner from '@/components/machine/PublicAccessBanner';
import MachineDetailHeader from '@/components/machine/MachineDetailHeader';
import MachineDetailTabs from '@/components/machine/MachineDetailTabs';
import MachineInfoCards from '@/components/machine/MachineInfoCards';
import MachineNotFound from '@/components/machine/MachineNotFound';
import MachineEditForm from '@/components/machine/MachineEditForm';
import Machine3DViewer from '@/components/machine/Machine3DViewer';

// Data & Hooks
import { 
  mockMachines, 
  getServiceHistoryByMachineAndType, 
  getLubricationHistoryByMachineAndType, 
  getTasksByMachineAndType,
  getDocumentsByMachineId,
  getOilsByMachineId
} from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { Document, Machine, OilType, ServiceRecord, Task, LubricationRecord, EquipmentType, MaintenanceSchedule } from '@/types';
import { addDays, format } from 'date-fns';

// Local storage key for machines
const LOCAL_STORAGE_KEY = 'dashboard_machines';

const MachineDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isPublicAccess, setPublicAccess, user, hasPermission } = useAuth();
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<string>('truck');
  const [machineDocuments, setMachineDocuments] = useState<Document[]>([]);
  const [machineOils, setMachineOils] = useState<OilType[]>([]);
  const [serviceHistoryState, setServiceHistoryState] = useState<ServiceRecord[]>([]);
  const [lubricationHistoryState, setLubricationHistoryState] = useState<LubricationRecord[]>([]);
  const [tasksState, setTasksState] = useState<Task[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [machineState, setMachineState] = useState<Machine | undefined>(undefined);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [show3DDialog, setShow3DDialog] = useState(false);
  const [comingFromQRCode, setComingFromQRCode] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  const getAllMachines = (): Machine[] => {
    try {
      const storedMachines = localStorage.getItem(LOCAL_STORAGE_KEY);
      return storedMachines ? JSON.parse(storedMachines) : mockMachines;
    } catch (error) {
      console.error("Error loading machines from localStorage:", error);
      return mockMachines;
    }
  };

  const saveAllMachines = useCallback((machines: Machine[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(machines));
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
  
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadMachine = async () => {
      setLoading(true);
      setNotFound(false);
      
      try {
        const url = new URL(window.location.href);
        const hasQrParam = url.searchParams.has('qr');
        const timestamp = url.searchParams.get('t');
        
        if (hasQrParam || !isAuthenticated) {
          console.log("QR mode detected or user not authenticated, setting public access");
          setPublicAccess(true);
          if (hasQrParam) {
            setComingFromQRCode(true);
            // Show a welcome message for QR code access
            toast({
              title: "Velkommen til maskinedata",
              description: "Du har adgang via QR-kode scanning",
            });
          }
        }
        
        const allMachines = getAllMachines();
        
        // Try to find the machine with the exact ID first
        let foundMachine = allMachines.find(m => m.id === id);
        
        // If not found and we have a timestamp, try without it
        if (!foundMachine && timestamp) {
          const cleanId = id.split('&t=')[0];
          foundMachine = allMachines.find(m => m.id === cleanId);
        }
        
        if (foundMachine) {
          console.log("Machine found:", foundMachine);
          if (foundMachine.models3D && foundMachine.models3D.length > 0) {
            console.log("3D models found on machine:", foundMachine.models3D.length);
          } else {
            console.log("No 3D models found directly on machine");
          }
          
          // Ensure machine has images property
          if (!foundMachine.images) {
            foundMachine.images = [];
          }
          
          setMachineState(foundMachine);
        } else {
          console.error("Machine not found with ID:", id);
          setNotFound(true);
          toast({
            variant: "destructive",
            title: "Maskine ikke fundet",
            description: `Kunne ikke finde maskinen med ID: ${id}`,
          });
        }
      } catch (error) {
        console.error("Error loading machine data:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    
    loadMachine();
  }, [id, setPublicAccess, isAuthenticated]);

  useEffect(() => {
    if (machineState) {
      if (machineState.equipment && machineState.equipment.length > 0) {
        setSelectedEquipmentType(machineState.equipment[0].type);
      }

      const records = getServiceHistoryByMachineAndType(machineState.id, selectedEquipmentType);
      setServiceHistoryState(records || []);
      
      const lubRecords = getLubricationHistoryByMachineAndType(machineState.id, selectedEquipmentType);
      setLubricationHistoryState(lubRecords || []);
      
      const taskRecords = getTasksByMachineAndType(machineState.id, selectedEquipmentType);
      setTasksState(taskRecords || []);
      
      if (machineState.maintenanceSchedules && machineState.maintenanceSchedules.length > 0) {
        setMaintenanceSchedules(machineState.maintenanceSchedules);
      } else {
        const defaultSchedules: MaintenanceSchedule[] = [];
        
        machineState.equipment.forEach(equipment => {
          let interval = 'monthly';
          let days = 30;
          
          if (equipment.type === 'crane') {
            interval = 'biweekly';
            days = 14;
          } else if (equipment.type === 'truck') {
            interval = 'monthly';
            days = 30;
          } else if (equipment.type === 'winch') {
            interval = 'quarterly';
            days = 90;
          }
          
          const defaultSchedule: MaintenanceSchedule = {
            id: `schedule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            equipmentType: equipment.type,
            taskDescription: `Regelmæssig vedligeholdelse af ${equipment.type}`,
            interval: interval as any,
            intervalUnit: 'days',
            customInterval: days,
            nextDue: addDays(new Date(), days).toISOString(),
          };
          
          defaultSchedules.push(defaultSchedule);
          
          const initialTask: Task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            title: `Vedligeholdelse af ${equipment.type}`,
            description: `Rutine vedligeholdelse af ${equipment.type}`,
            dueDate: defaultSchedule.nextDue || '',
            status: 'pending',
            equipmentType: equipment.type
          };
          
          setTasksState(prev => [initialTask, ...prev]);
        });
        
        setMaintenanceSchedules(defaultSchedules);
        
        setMachineState(prev => {
          if (!prev) return undefined;
          
          const updatedMachine = {
            ...prev,
            maintenanceSchedules: defaultSchedules
          };
          
          updateMachineInStorage(updatedMachine);
          
          return updatedMachine;
        });
      }
      
      const docs = getDocumentsByMachineId(machineState.id);
      setMachineDocuments(docs || []);
      
      const oils = getOilsByMachineId(machineState.id);
      setMachineOils(oils || []);
    }
  }, [machineState?.id, selectedEquipmentType]);
  
  const updateMachineInStorage = useCallback((updatedMachine: Machine) => {
    try {
      const allMachines = getAllMachines();
      const updatedMachines = allMachines.map(machine => 
        machine.id === updatedMachine.id ? updatedMachine : machine
      );
      saveAllMachines(updatedMachines);
      console.log("Updated machine in storage:", updatedMachine.id);
    } catch (error) {
      console.error("Failed to update machine in storage:", error);
    }
  }, [saveAllMachines]);
  
  const handleServiceSubmit = (data: { equipmentType: string; description: string; issues?: string }) => {
    const newServiceRecord: ServiceRecord = {
      id: `service-${Date.now()}`,
      date: new Date().toISOString(),
      performedBy: user?.name || 'Unknown user',
      equipmentType: data.equipmentType as any,
      description: data.description,
      issues: data.issues
    };
    
    setServiceHistoryState(prevRecords => [newServiceRecord, ...prevRecords]);
    
    setMachineState(prevState => {
      if (!prevState) return undefined;
      
      const updatedMachine = {
        ...prevState,
        serviceHistory: [newServiceRecord, ...(prevState.serviceHistory || [])]
      };
      
      updateMachineInStorage(updatedMachine);
      
      return updatedMachine;
    });
    
    toast({
      title: "Service registreret",
      description: `Service på ${data.equipmentType === 'crane' ? 'kran' : data.equipmentType === 'winch' ? 'spil' : 'lastbil'} er registreret.`,
    });
  };
  
  const handleLubricationSubmit = (data: { 
    equipmentType: EquipmentType; 
    notes: string;
    date: string;
    performedBy: string;
  }) => {
    const newLubricationRecord: LubricationRecord = {
      id: `lubrication-${Date.now()}`,
      date: data.date,
      performedBy: data.performedBy,
      equipmentType: data.equipmentType,
      notes: data.notes
    };
    
    setLubricationHistoryState(prevRecords => [newLubricationRecord, ...prevRecords]);
    
    setMachineState(prevState => {
      if (!prevState) return undefined;
      
      const updatedMachine = {
        ...prevState,
        lubricationHistory: [newLubricationRecord, ...(prevState.lubricationHistory || [])]
      };
      
      updateMachineInStorage(updatedMachine);
      
      return updatedMachine;
    });
    
    let equipmentText = "lastbil";
    if (data.equipmentType === 'crane') {
      equipmentText = 'kran';
    } else if (data.equipmentType === 'winch') {
      equipmentText = 'spil';
    } else if (data.equipmentType === 'hooklift') {
      equipmentText = 'kroghejs';
    }
    
    toast({
      title: "Smøring registreret",
      description: `Smøring af ${equipmentText} er registreret.`,
    });
    
    const relatedSchedule = maintenanceSchedules.find(
      schedule => schedule.equipmentType === data.equipmentType
    );
    
    if (relatedSchedule) {
      let nextDueDate = new Date();
      
      if (relatedSchedule.interval === 'biweekly') {
        nextDueDate = addDays(new Date(), 14);
      } else if (relatedSchedule.interval === 'weekly') {
        nextDueDate = addDays(new Date(), 7);
      } else if (relatedSchedule.interval === 'monthly') {
        nextDueDate = addDays(new Date(), 30);
      } else if (relatedSchedule.interval === 'quarterly') {
        nextDueDate = addDays(new Date(), 90);
      } else if (relatedSchedule.interval === 'yearly') {
        nextDueDate = addDays(new Date(), 365);
      } else if (relatedSchedule.interval === 'custom' && relatedSchedule.customInterval) {
        nextDueDate = addDays(new Date(), relatedSchedule.customInterval);
      }
      
      const updatedSchedule = {
        ...relatedSchedule,
        lastPerformed: new Date().toISOString(),
        nextDue: nextDueDate.toISOString()
      };
      
      setMaintenanceSchedules(prevSchedules => 
        prevSchedules.map(schedule => 
          schedule.id === relatedSchedule.id ? updatedSchedule : schedule
        )
      );
      
      setMachineState(prevState => {
        if (!prevState) return undefined;
        
        const updatedSchedules = prevState.maintenanceSchedules 
          ? prevState.maintenanceSchedules.map(schedule => 
              schedule.id === relatedSchedule.id ? updatedSchedule : schedule
            )
          : [updatedSchedule];
          
        return {
          ...prevState,
          maintenanceSchedules: updatedSchedules
        };
      });
      
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: data.equipmentType === 'crane' ? 'Udskudssmøring' : `Smøring af ${equipmentText}`,
        description: `Planlagt smøring af ${equipmentText}${data.equipmentType === 'crane' ? ' udskud' : ''}`,
        dueDate: nextDueDate.toISOString(),
        status: 'pending',
        equipmentType: data.equipmentType
      };
      
      setTasksState(prevTasks => [newTask, ...prevTasks]);
      
      setMachineState(prevState => {
        if (!prevState) return undefined;
        const updatedMachine: Machine = {
          ...prevState,
          tasks: [newTask, ...(prevState.tasks || [])]
        };
        
        updateMachineInStorage(updatedMachine);
        
        return updatedMachine;
      });
      
      toast({
        title: "Næste deadline oprettet",
        description: `Ny smøre-opgave er planlagt til ${format(nextDueDate, 'dd/MM/yyyy')}.`,
      });
    }
  };
  
  const handleTaskSubmit = (task: Task) => {
    setTasksState(prevTasks => [task, ...prevTasks]);
    
    setMachineState(prevState => {
      if (!prevState) return undefined;
      
      const updatedMachine = {
        ...prevState,
        tasks: [task, ...(prevState.tasks || [])]
      };
      
      updateMachineInStorage(updatedMachine);
      
      return updatedMachine;
    });
    
    toast({
      title: "Opgave oprettet",
      description: `Ny opgave "${task.title}" er blevet oprettet.`,
    });
  };
  
  const handleTaskComplete = (taskId: string, completedBy: string) => {
    if (processingAction) return;
    
    try {
      setProcessingAction(true);
      
      // First update the state
      setTasksState(prevTasks => prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed' as const, assignedTo: completedBy } 
          : task
      ));
      
      // Then update the machine state and save to localStorage
      setMachineState(prevState => {
        if (!prevState) return undefined;
        
        const updatedMachine: Machine = {
          ...prevState,
          tasks: prevState.tasks 
            ? prevState.tasks.map(task => 
                task.id === taskId
                  ? { ...task, status: 'completed' as const, assignedTo: completedBy }
                  : task
              )
            : []
        };
        
        // Use setTimeout to prevent UI blocking
        setTimeout(() => {
          updateMachineInStorage(updatedMachine);
          setProcessingAction(false);
          
          toast({
            title: "Opgave fuldført",
            description: `Opgaven er blevet markeret som fuldført af ${completedBy}.`,
          });
        }, 0);
        
        return updatedMachine;
      });
    } catch (error) {
      console.error("Error completing task:", error);
      setProcessingAction(false);
      
      toast({
        variant: "destructive",
        title: "Fejl ved markering af opgave",
        description: "Der opstod en fejl. Prøv venligst igen.",
      });
    }
  };
  
  const handleDocumentAdd = (newDocument: Document) => {
    setMachineDocuments(prevDocs => [newDocument, ...prevDocs]);
    
    setMachineState(prevState => {
      if (!prevState) return undefined;
      
      const updatedMachine = {
        ...prevState,
        documents: [newDocument, ...(prevState.documents || [])]
      };
      
      updateMachineInStorage(updatedMachine);
      
      return updatedMachine;
    });
    
    toast({
      title: "Dokument tilføjet",
      description: `"${newDocument.title}" er blevet tilføjet til maskinen.`,
    });
  };
  
  const handleDocumentUpdate = (updatedDocument: Document) => {
    setMachineDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === updatedDocument.id ? updatedDocument : doc
      )
    );
    
    setMachineState(prevState => {
      if (!prevState) return undefined;
      
      const updatedMachine = {
        ...prevState,
        documents: prevState.documents
          ? prevState.documents.map(doc => 
              doc.id === updatedDocument.id ? updatedDocument : doc
            )
          : []
      };
      
      updateMachineInStorage(updatedMachine);
      
      return updatedMachine;
    });
    
    toast({
      title: "Dokument opdateret",
      description: `Tilladelser for "${updatedDocument.title}" er blevet opdateret.`,
    });
  };
  
  const handleOilAdd = (oilData: OilType) => {
    setMachineOils(prevOils => [oilData, ...prevOils]);
    
    setMachineState(prevState => {
      if (!prevState) return undefined;
      
      const updatedMachine = {
        ...prevState,
        oils: [oilData, ...(prevState.oils || [])]
      };
      
      updateMachineInStorage(updatedMachine);
      
      return updatedMachine;
    });
    
    toast({
      title: "Olie tilføjet",
      description: `"${oilData.name}" er blevet tilføjet til maskinen.`,
    });
  };
  
  const handleMachineEdit = () => {
    setShowEditDialog(true);
  };
  
  const handleMachineDelete = () => {
    setShowDeleteDialog(true);
  };
  
  const confirmDeleteMachine = () => {
    if (!machineState) return;
    
    const allMachines = getAllMachines();
    const updatedMachines = allMachines.filter(m => m.id !== machineState.id);
    
    saveAllMachines(updatedMachines);
    
    navigate('/dashboard');
    
    toast({
      title: "Maskine slettet",
      description: `${machineState.name} er blevet slettet.`,
    });
  };
  
  const handleSaveMachine = (updatedMachine: Machine) => {
    // Ensure images property exists
    if (!updatedMachine.images) {
      updatedMachine.images = [];
    }
    
    setMachineState(updatedMachine);
    updateMachineInStorage(updatedMachine);
    
    setShowEditDialog(false);
    toast({
      title: "Ændringer gemt",
      description: "Maskinen er blevet opdateret.",
    });
    
    if (updatedMachine.models3D && updatedMachine.models3D.length > 0) {
      console.log(`Saved machine with ${updatedMachine.models3D.length} 3D models:`, updatedMachine.models3D);
    }
  };

  const handleUpdateMachine = (updatedMachine: Machine) => {
    // Ensure images property exists
    if (!updatedMachine.images) {
      updatedMachine.images = [];
    }
    
    setMachineState(updatedMachine);
    updateMachineInStorage(updatedMachine);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-lg text-muted-foreground">Indlæser maskine...</div>
        </div>
      </div>
    );
  }

  if (notFound || !machineState) {
    return <MachineNotFound />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      {isPublicAccess && <PublicAccessBanner />}
      <MachineDetailHeader 
        machine={machineState} 
        onEdit={handleMachineEdit}
        onDelete={hasPermission('admin') ? handleMachineDelete : undefined}
        onView3D={() => setShow3DDialog(true)}
      />
      
      <main className="flex-1 page-container py-8">
        {/* Always show MobileFriendlyViewer on mobile devices or QR code visits */}
        {(comingFromQRCode || isMobile) && machineState && (
          <MobileFriendlyViewer machine={machineState} />
        )}

        <MachineOverview 
          machine={machineState} 
          onUpdateMachine={handleUpdateMachine}
        />
        
        <MachineDetailTabs
          machine={machineState}
          selectedEquipmentType={selectedEquipmentType}
          setSelectedEquipmentType={setSelectedEquipmentType}
          serviceRecords={serviceHistoryState}
          lubricationRecords={lubricationHistoryState}
          tasks={tasksState}
          documents={machineDocuments}
          oils={machineOils}
          onLubricationSubmit={handleLubricationSubmit}
          onServiceSubmit={handleServiceSubmit}
          onTaskSubmit={handleTaskSubmit}
          onTaskComplete={handleTaskComplete}
          onDocumentAdd={handleDocumentAdd}
          onDocumentUpdate={handleDocumentUpdate}
          onOilAdd={handleOilAdd}
        />
        
        <MachineInfoCards machine={machineState} />
      </main>
      
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rediger maskine</DialogTitle>
            <DialogDescription>
              Foretag ændringer til maskinens informationer.
            </DialogDescription>
          </DialogHeader>
          <MachineEditForm
            machine={machineState}
            onSave={handleSaveMachine}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker på at du vil slette denne maskine?</AlertDialogTitle>
            <AlertDialogDescription>
              Denne handling kan ikke fortrydes. Maskinen vil blive slettet permanent fra systemet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMachine} className="bg-destructive text-destructive-foreground">
              Slet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {machineState && (
        <Machine3DViewer
          machine={machineState}
          isOpen={show3DDialog}
          onClose={() => setShow3DDialog(false)}
        />
      )}
    </div>
  );
};

export default MachineDetail;
