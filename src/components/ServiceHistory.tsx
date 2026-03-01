
import React, { useState } from 'react';
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceRecord, LubricationRecord, Task, EquipmentType, Machine } from '@/types';
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { Printer, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { printHistory, printFullMachineData, printFullPage, PrintHistoryType } from '@/utils/printHistoryUtils';

import ServiceRecordsList from './service/ServiceRecordsList';
import LubricationRecordsList from './service/LubricationRecordsList';
import MachineTasksList from './machine/MachineTasksList';
import ServiceRecordForm from './service/ServiceRecordForm';
import TaskForm from './service/TaskForm';

interface ServiceHistoryProps {
  serviceRecords: ServiceRecord[];
  lubricationRecords: LubricationRecord[];
  tasks: Task[];
  machineId: string;
  machineName?: string;
  machine?: Machine;
  onServiceSubmit?: (data: { equipmentType: string; description: string; issues?: string }) => void;
  onLubricationSubmit?: (data: { equipmentType: EquipmentType; notes: string; date: string; performedBy: string }) => void;
  onTaskSubmit?: (data: Task) => void;
  onTaskComplete?: (taskId: string, completedBy: string) => void;
  onTaskUpdate?: (task: Task) => void;
}

const ServiceHistory: React.FC<ServiceHistoryProps> = ({ 
  serviceRecords, 
  lubricationRecords, 
  tasks,
  machineId,
  machineName = 'Maskine',
  machine,
  onServiceSubmit,
  onLubricationSubmit,
  onTaskSubmit,
  onTaskComplete,
  onTaskUpdate
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

  const handlePrint = (printType: PrintHistoryType) => {
    const ok = printHistory({
      machineName,
      serviceRecords: sortedServiceRecords,
      lubricationRecords: sortedLubricationRecords,
      tasks: sortedTasks,
      printType,
    });
    if (!ok) {
      toast({
        variant: "destructive",
        title: "Fejl ved udskrift",
        description: "Kunne ikke åbne udskriftsvindue. Tjek om pop-up blocker er aktiveret.",
      });
    }
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Printer className="h-4 w-4" />
              <span>Udskriv</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handlePrint('service')}>
              Servicehistorik (service + smøring)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePrint('tasks')}>
              Opgavehistorik (udførte opgaver)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePrint('combined')}>
              Samlet (service + opgaver)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {machine && (
              <DropdownMenuItem onClick={() => {
                const ok = printFullMachineData(machine);
                if (!ok) toast({ variant: "destructive", title: "Fejl ved udskrift", description: "Kunne ikke åbne udskriftsvindue. Tjek pop-up blocker." });
              }}>
                Hele maskindata
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => printFullPage()}>
              Hele siden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <MachineTasksList 
              machine={{ id: machineId, tasks: sortedTasks } as any}
              onTaskUpdate={onTaskUpdate || ((task) => {
                console.log('Task updated:', task);
              })}
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
