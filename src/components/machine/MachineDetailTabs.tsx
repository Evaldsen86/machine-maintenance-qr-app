import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, FileText, Droplet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Machine, Document, ServiceRecord, LubricationRecord, Task, OilType } from '@/types';

import ServiceHistory from '@/components/ServiceHistory';
import LubricationForm from '@/components/LubricationForm';
import MachineDocuments from '@/components/MachineDocuments';
import OilInformation from '@/components/OilInformation';

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
  onDocumentAdd: (document: Document) => void;
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
  onDocumentAdd,
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
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="service">
            <Wrench className="h-4 w-4 mr-2" />
            Service & Vedligeholdelse
          </TabsTrigger>
          {(isAuthenticated || isPublicAccess) && (
            <>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Dokumentation
              </TabsTrigger>
              <TabsTrigger value="oils">
                <Droplet className="h-4 w-4 mr-2" />
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
            onServiceSubmit={onServiceSubmit}
            onLubricationSubmit={onLubricationSubmit}
            onTaskSubmit={onTaskSubmit}
            onTaskComplete={onTaskComplete}
          />
          
          {canMarkLubrication() && (
            <LubricationForm 
              machineId={machine.id} 
              onSubmit={onLubricationSubmit} 
            />
          )}
        </TabsContent>
        
        <TabsContent value="documents" className="mt-6 space-y-4">
          <MachineDocuments 
            documents={documents} 
            canUpload={canUploadDocuments()}
            onDocumentAdd={onDocumentAdd}
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
