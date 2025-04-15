
import React, { useState } from 'react';
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceRecord, LubricationRecord, Task, EquipmentType } from '@/types';
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { Printer } from 'lucide-react';
import { Button } from "@/components/ui/button";

import ServiceRecordsList from './service/ServiceRecordsList';
import LubricationRecordsList from './service/LubricationRecordsList';
import TasksList from './service/TasksList';
import ServiceRecordForm from './service/ServiceRecordForm';
import TaskForm from './service/TaskForm';

interface ServiceHistoryProps {
  serviceRecords: ServiceRecord[];
  lubricationRecords: LubricationRecord[];
  tasks: Task[];
  machineId: string;
  onServiceSubmit?: (data: { equipmentType: string; description: string; issues?: string }) => void;
  onLubricationSubmit?: (data: { equipmentType: EquipmentType; notes: string; date: string; performedBy: string }) => void;
  onTaskSubmit?: (data: Task) => void;
  onTaskComplete?: (taskId: string, completedBy: string) => void;
}

const ServiceHistory: React.FC<ServiceHistoryProps> = ({ 
  serviceRecords, 
  lubricationRecords, 
  tasks,
  machineId,
  onServiceSubmit,
  onLubricationSubmit,
  onTaskSubmit,
  onTaskComplete
}) => {
  const { canAddServiceRecord, canAddTask } = useAuth();
  const [activeTab, setActiveTab] = useState('service');
  const [processingAction, setProcessingAction] = useState(false);
  
  // Sort history with newest first
  const sortedServiceRecords = [...serviceRecords].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const sortedLubricationRecords = [...lubricationRecords].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
  );

  const handlePrint = () => {
    // Create a new window with only the service history
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Fejl ved udskrift",
        description: "Kunne ikke åbne udskriftsvindue. Tjek om pop-up blocker er aktiveret.",
      });
      return;
    }

    // Function to get equipment type name in Danish
    const getEquipmentTypeName = (type: string): string => {
      switch (type) {
        case 'truck': return 'Lastbil';
        case 'crane': return 'Kran';
        case 'winch': return 'Spil';
        case 'hooklift': return 'Kroghejs';
        default: return type;
      }
    };

    // Generate HTML content for printing
    printWindow.document.write(`
      <html>
        <head>
          <title>Service Historik</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .record { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
            .record-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .record-type { font-weight: bold; color: #555; }
            .record-date { color: #777; }
            .record-description { margin-bottom: 8px; }
            .record-issues { background-color: #fff4f4; padding: 8px; border-radius: 4px; color: #e11d48; }
            .record-performer { font-size: 0.9em; color: #777; margin-top: 8px; }
            .print-button { display: none; }
            @media print {
              body { padding: 0; }
              h1 { margin-top: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Service Historik</h1>
          ${sortedServiceRecords.map(record => `
            <div class="record">
              <div class="record-header">
                <span class="record-type">${getEquipmentTypeName(record.equipmentType)}</span>
                <span class="record-date">${new Date(record.date).toLocaleDateString('da-DK')}</span>
              </div>
              <div class="record-description">${record.description}</div>
              ${record.issues ? `<div class="record-issues">Problem: ${record.issues}</div>` : ''}
              <div class="record-performer">Udført af: ${record.performedBy}</div>
            </div>
          `).join('')}
          
          <h1>Smøring Historik</h1>
          ${sortedLubricationRecords.map(record => `
            <div class="record">
              <div class="record-header">
                <span class="record-type">${getEquipmentTypeName(record.equipmentType)}</span>
                <span class="record-date">${new Date(record.date).toLocaleDateString('da-DK')}</span>
              </div>
              ${record.notes ? `<div class="record-description">${record.notes}</div>` : ''}
              <div class="record-performer">Udført af: ${record.performedBy}</div>
            </div>
          `).join('')}
          
          <button class="print-button" onclick="window.print()">Udskriv</button>
        </body>
      </html>
    `);
    
    // Close the document to finish writing
    printWindow.document.close();
    
    // Focus the new window and print after a small delay to ensure content is loaded
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
  
  const handleTaskCompleteWrapper = (taskId: string, completedBy: string) => {
    if (processingAction || !onTaskComplete) return;
    
    try {
      setProcessingAction(true);
      
      // Using setTimeout to prevent UI blocking
      setTimeout(() => {
        onTaskComplete(taskId, completedBy);
        setProcessingAction(false);
      }, 0);
    } catch (error) {
      console.error("Error completing task from ServiceHistory:", error);
      setProcessingAction(false);
      toast({
        variant: "destructive",
        title: "Fejl ved markering af opgave",
        description: "Der opstod en fejl. Prøv venligst igen.",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Service & Vedligeholdelse</CardTitle>
          <CardDescription>
            Overblik over servicehistorik, smøring og planlagte opgaver
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1"
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4" />
          <span>Udskriv</span>
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="service" className="space-y-4" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="service">Service</TabsTrigger>
            <TabsTrigger value="lubrication">Smøring</TabsTrigger>
            <TabsTrigger value="tasks">Opgaver</TabsTrigger>
          </TabsList>
          
          <TabsContent value="service" className="space-y-4">
            <ServiceRecordsList serviceRecords={sortedServiceRecords} />
            
            {/* Only show service form for users with appropriate permissions */}
            {canAddServiceRecord() && onServiceSubmit && (
              <ServiceRecordForm 
                machineId={machineId}
                onSubmit={(data) => {
                  if (onServiceSubmit && data.equipmentType && data.description) {
                    onServiceSubmit({
                      equipmentType: data.equipmentType,
                      description: data.description,
                      issues: data.issues
                    });
                  }
                }}
              />
            )}
          </TabsContent>
          
          <TabsContent value="lubrication" className="space-y-4">
            <LubricationRecordsList lubricationRecords={sortedLubricationRecords} />
          </TabsContent>
          
          <TabsContent value="tasks" className="space-y-4">
            <TasksList 
              tasks={sortedTasks} 
              onTaskComplete={handleTaskCompleteWrapper}
            />
            
            {/* Task creation form */}
            {canAddTask() && onTaskSubmit && (
              <TaskForm 
                machineId={machineId}
                onSubmit={onTaskSubmit}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ServiceHistory;
