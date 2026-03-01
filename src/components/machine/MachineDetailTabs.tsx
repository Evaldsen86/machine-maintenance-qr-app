import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, FileText, Droplet, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Machine, Document, ServiceRecord, LubricationRecord, Task, OilType } from '@/types';

import ServiceHistory from '@/components/ServiceHistory';
import LubricationForm from '@/components/LubricationForm';
import MachineDocuments from '@/components/MachineDocuments';
import OilInformation from '@/components/OilInformation';
import MachineTasksList from '@/components/machine/MachineTasksList';

interface MachineDetailTabsProps {
  machine: Machine;
  selectedEquipmentType: string;
  setSelectedEquipmentType: (type: string) => void;
  serviceRecords: ServiceRecord[];
  lubricationRecords: LubricationRecord[];
  tasks: Task[];
  documents: Document[];
  oils: OilType[];
  onServiceSubmit: (data: any) => void;
  onLubricationSubmit: (data: any) => void;
  onTaskSubmit: (task: Task) => void;
  onTaskComplete: (taskId: string, completedBy: string) => void;
  onTaskUpdate: (task: Task) => void;
  onDocumentAdd: (document: Document) => void;
  onDocumentsAdd?: (documents: Document[]) => void;
  onDocumentUpdate: (document: Document) => void;
  onOilAdd: (oilData: OilType) => void;
}

const MachineDetailTabs: React.FC<MachineDetailTabsProps> = ({
  machine,
  selectedEquipmentType,
  setSelectedEquipmentType,
  serviceRecords,
  lubricationRecords,
  tasks,
  documents,
  oils,
  onServiceSubmit,
  onLubricationSubmit,
  onTaskSubmit,
  onTaskComplete,
  onTaskUpdate,
  onDocumentAdd,
  onDocumentsAdd,
  onDocumentUpdate,
  onOilAdd
}) => {
  const { 
    isAuthenticated, 
    isPublicAccess, 
    canEditMachine, 
    canMarkLubrication,
    canUploadDocuments
  } = useAuth();

  // Check edit permission for current machine
  const canEdit = canEditMachine(machine.editPermissions);

  return (
    <div className="mt-8">
      <Tabs defaultValue="service" className="space-y-8">
        <TabsList className="flex w-full flex-wrap gap-1 overflow-x-auto">
          <TabsTrigger value="service" className="flex-1 min-w-0 sm:flex-initial">
            <Wrench className="h-4 w-4 mr-1 sm:mr-2 shrink-0" />
            <span className="truncate">Service & Vedligeholdelse</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1 min-w-0 sm:flex-initial">
            <Clock className="h-4 w-4 mr-1 sm:mr-2 shrink-0" />
            Opgaver
          </TabsTrigger>
          {(isAuthenticated || isPublicAccess) && (
            <>
              <TabsTrigger value="documents" className="flex-1 min-w-0 sm:flex-initial">
                <FileText className="h-4 w-4 mr-1 sm:mr-2 shrink-0" />
                <span className="truncate">Dokumentation</span>
              </TabsTrigger>
              <TabsTrigger value="oils" className="flex-1 min-w-0 sm:flex-initial">
                <Droplet className="h-4 w-4 mr-1 sm:mr-2 shrink-0" />
                Olier
              </TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="service" className="space-y-8 animate-fade-in">
          <ServiceHistory 
            serviceRecords={serviceRecords}
            lubricationRecords={lubricationRecords}
            tasks={tasks}
            machineId={machine.id}
            machineName={machine.name}
            machine={machine}
            onServiceSubmit={onServiceSubmit}
            onLubricationSubmit={onLubricationSubmit}
            onTaskSubmit={onTaskSubmit}
            onTaskComplete={onTaskComplete}
            onTaskUpdate={onTaskUpdate}
          />
          
          {canMarkLubrication() && (
            <LubricationForm 
              machineId={machine.id} 
              onSubmit={onLubricationSubmit} 
            />
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-8 animate-fade-in">
          <MachineTasksList 
            machine={machine}
            onTaskUpdate={onTaskUpdate}
            onTaskSubmit={onTaskSubmit}
          />
        </TabsContent>
        
        <TabsContent value="documents" className="mt-6 space-y-4">
          <MachineDocuments 
            documents={documents} 
            canUpload={canUploadDocuments()}
            onDocumentAdd={onDocumentAdd}
            onDocumentsAdd={onDocumentsAdd}
            onDocumentUpdate={onDocumentUpdate}
          />
        </TabsContent>
        
        <TabsContent value="oils" className="space-y-8 animate-fade-in">
          <OilInformation 
            oils={oils} 
            onAddOil={onOilAdd}
            canEdit={canEdit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MachineDetailTabs;
