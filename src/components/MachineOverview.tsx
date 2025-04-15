import React, { useState } from 'react';
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Machine } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Info,
  Calendar as CalendarIcon,
  CheckCircle,
  Wrench,
  AlertTriangle,
  Truck,
  Construction,
  Forklift,
  Edit
} from 'lucide-react';
import ImageGallery from '../components/ImageGallery';
import { formatDate, parseDanishDateString, getFormattedDate, parseISODateString } from '@/utils/dateUtils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MachineOverviewProps {
  machine: Machine;
  onUpdateMachine?: (updatedMachine: Machine) => void;
}

const MachineOverview: React.FC<MachineOverviewProps> = ({ machine, onUpdateMachine }) => {
  const { hasPermission } = useAuth();
  const canEditServiceInfo = hasPermission('mechanic') || hasPermission('admin');
  
  const [isEditingOdometer, setIsEditingOdometer] = useState(false);
  const [odometerValue, setOdometerValue] = useState<string>('');
  
  const [isEditingInterval, setIsEditingInterval] = useState(false);
  const [intervalValue, setIntervalValue] = useState<string>('');
  
  const [isEditingLastService, setIsEditingLastService] = useState(false);
  const [lastServiceDate, setLastServiceDate] = useState<Date | undefined>(undefined);
  
  const [isEditingNextService, setIsEditingNextService] = useState(false);
  const [nextServiceDate, setNextServiceDate] = useState<Date | undefined>(undefined);

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aktiv
          </Badge>
        );
      case 'maintenance':
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            <Wrench className="h-3 w-3 mr-1" />
            Vedligeholdelse
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Inaktiv
          </Badge>
        );
      default:
        return null;
    }
  };

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'truck':
        return <Truck className="h-5 w-5 mr-2 text-primary" />;
      case 'crane':
        return <Construction className="h-5 w-5 mr-2 text-primary" />;
      case 'winch':
      case 'hooklift':
        return <Forklift className="h-5 w-5 mr-2 text-primary" />;
      default:
        return <Info className="h-5 w-5 mr-2 text-primary" />;
    }
  };

  const getServiceInfo = () => {
    if (!machine.serviceHistory || machine.serviceHistory.length === 0) {
      return {
        lastService: 'Ingen data',
        nextService: 'Ikke planlagt',
        odometerReading: 'Ikke registreret',
        intervalKm: '10.000 km',
        lastServiceDate: null,
        nextServiceDate: null
      };
    }

    const sortedHistory = [...machine.serviceHistory].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const lastServiceDate = new Date(sortedHistory[0].date);
    
    let intervalDays = 90; // Default to 3 months
    let intervalKm = 10000; // Default to 10,000 km

    if (machine.maintenanceSchedules && machine.maintenanceSchedules.length > 0) {
      const primarySchedule = machine.maintenanceSchedules[0];
      
      if (primarySchedule.customInterval) {
        intervalDays = primarySchedule.customInterval;
      } else if (primarySchedule.interval === 'weekly') {
        intervalDays = 7;
      } else if (primarySchedule.interval === 'biweekly') {
        intervalDays = 14;
      } else if (primarySchedule.interval === 'monthly') {
        intervalDays = 30;
      } else if (primarySchedule.interval === 'quarterly') {
        intervalDays = 90;
      } else if (primarySchedule.interval === 'yearly') {
        intervalDays = 365;
      }

      if (primarySchedule.intervalKm) {
        intervalKm = primarySchedule.intervalKm;
      }
    }
    
    const nextServiceDate = new Date(lastServiceDate);
    nextServiceDate.setDate(nextServiceDate.getDate() + intervalDays);

    let odometerReading = 'Ikke registreret';
    if (sortedHistory[0].odometerReading !== undefined) {
      odometerReading = `${sortedHistory[0].odometerReading.toLocaleString('da-DK')} km`;
    }

    const formattedIntervalKm = `${intervalKm.toLocaleString('da-DK')} km`;

    return {
      lastService: formatDate(sortedHistory[0].date),
      nextService: formatDate(nextServiceDate.toISOString()),
      odometerReading,
      intervalKm: formattedIntervalKm,
      rawOdometerReading: sortedHistory[0].odometerReading,
      rawIntervalKm: intervalKm,
      lastServiceDate: sortedHistory[0].date,
      nextServiceDate: nextServiceDate.toISOString()
    };
  };

  const serviceInfo = getServiceInfo();

  const handleSaveOdometer = () => {
    if (!onUpdateMachine) return;
    
    const odometerNumber = parseInt(odometerValue.replace(/\D/g, ''));
    
    if (isNaN(odometerNumber)) {
      toast({
        variant: "destructive",
        title: "Ugyldig værdi",
        description: "Indtast venligst et gyldigt kilometertal."
      });
      return;
    }
    
    if (machine.serviceHistory && machine.serviceHistory.length > 0) {
      const updatedHistory = [...machine.serviceHistory].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      updatedHistory[0] = {
        ...updatedHistory[0],
        odometerReading: odometerNumber
      };
      
      const updatedMachine = {
        ...machine,
        serviceHistory: updatedHistory
      };
      
      onUpdateMachine(updatedMachine);
      
      toast({
        title: "Kilometertal opdateret",
        description: `Kilometertallet er blevet opdateret til ${odometerNumber.toLocaleString('da-DK')} km.`
      });
    } else {
      const newServiceRecord = {
        id: `service-${Date.now()}`,
        date: new Date().toISOString(),
        performedBy: "System",
        equipmentType: machine.equipment[0].type,
        description: "Kilometertal opdatering",
        odometerReading: odometerNumber
      };
      
      const updatedMachine = {
        ...machine,
        serviceHistory: [newServiceRecord, ...(machine.serviceHistory || [])]
      };
      
      onUpdateMachine(updatedMachine);
      
      toast({
        title: "Kilometertal registreret",
        description: `Nyt kilometertal på ${odometerNumber.toLocaleString('da-DK')} km er blevet registreret.`
      });
    }
    
    setIsEditingOdometer(false);
  };

  const handleSaveInterval = () => {
    if (!onUpdateMachine) return;
    
    const intervalNumber = parseInt(intervalValue.replace(/\D/g, ''));
    
    if (isNaN(intervalNumber)) {
      toast({
        variant: "destructive",
        title: "Ugyldig værdi",
        description: "Indtast venligst et gyldigt serviceinterval."
      });
      return;
    }
    
    if (machine.maintenanceSchedules && machine.maintenanceSchedules.length > 0) {
      const updatedSchedules = [...machine.maintenanceSchedules];
      
      updatedSchedules[0] = {
        ...updatedSchedules[0],
        intervalKm: intervalNumber
      };
      
      const updatedMachine = {
        ...machine,
        maintenanceSchedules: updatedSchedules
      };
      
      onUpdateMachine(updatedMachine);
      
      toast({
        title: "Serviceinterval opdateret",
        description: `Serviceintervallet er blevet opdateret til ${intervalNumber.toLocaleString('da-DK')} km.`
      });
    } else {
      const newSchedule = {
        id: `schedule-${Date.now()}`,
        equipmentType: machine.equipment[0].type,
        taskDescription: "Regelmæssig service",
        interval: 'custom' as const,
        customInterval: 90,
        intervalUnit: 'days' as const,
        intervalKm: intervalNumber
      };
      
      const updatedMachine = {
        ...machine,
        maintenanceSchedules: [newSchedule]
      };
      
      onUpdateMachine(updatedMachine);
      
      toast({
        title: "Serviceinterval oprettet",
        description: `Nyt serviceinterval på ${intervalNumber.toLocaleString('da-DK')} km er blevet oprettet.`
      });
    }
    
    setIsEditingInterval(false);
  };

  const handleSaveLastService = () => {
    if (!onUpdateMachine || !lastServiceDate) return;
    
    const newDateIso = lastServiceDate.toISOString();
    
    if (machine.serviceHistory && machine.serviceHistory.length > 0) {
      const updatedHistory = [...machine.serviceHistory].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      updatedHistory[0] = {
        ...updatedHistory[0],
        date: newDateIso
      };
      
      const updatedMachine = {
        ...machine,
        serviceHistory: updatedHistory
      };
      
      onUpdateMachine(updatedMachine);
      
      toast({
        title: "Dato opdateret",
        description: `Sidste service dato er blevet opdateret til ${formatDate(newDateIso)}.`
      });
    } else {
      const newServiceRecord = {
        id: `service-${Date.now()}`,
        date: newDateIso,
        performedBy: "System",
        equipmentType: machine.equipment[0].type,
        description: "Dato for sidste service opdateret",
      };
      
      const updatedMachine = {
        ...machine,
        serviceHistory: [newServiceRecord, ...(machine.serviceHistory || [])]
      };
      
      onUpdateMachine(updatedMachine);
      
      toast({
        title: "Service record oprettet",
        description: `Ny service record med dato ${formatDate(newDateIso)} er blevet registreret.`
      });
    }
    
    setIsEditingLastService(false);
  };

  const handleSaveNextService = () => {
    if (!onUpdateMachine || !nextServiceDate) return;
    
    const nextServiceIso = nextServiceDate.toISOString();
    
    let lastServiceDate = new Date();
    if (machine.serviceHistory && machine.serviceHistory.length > 0) {
      const sortedHistory = [...machine.serviceHistory].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      lastServiceDate = new Date(sortedHistory[0].date);
    }
    
    const diffTime = Math.abs(nextServiceDate.getTime() - lastServiceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (machine.maintenanceSchedules && machine.maintenanceSchedules.length > 0) {
      const updatedSchedules = [...machine.maintenanceSchedules];
      
      updatedSchedules[0] = {
        ...updatedSchedules[0],
        interval: 'custom' as const,
        customInterval: diffDays,
        nextDue: nextServiceIso
      };
      
      const updatedMachine = {
        ...machine,
        maintenanceSchedules: updatedSchedules
      };
      
      onUpdateMachine(updatedMachine);
    } else {
      const newSchedule = {
        id: `schedule-${Date.now()}`,
        equipmentType: machine.equipment[0].type,
        taskDescription: "Regelmæssig service",
        interval: 'custom' as const,
        customInterval: diffDays,
        intervalUnit: 'days' as const,
        nextDue: nextServiceIso,
        intervalKm: 10000
      };
      
      const updatedMachine = {
        ...machine,
        maintenanceSchedules: [newSchedule]
      };
      
      onUpdateMachine(updatedMachine);
    }
    
    toast({
      title: "Næste service opdateret",
      description: `Dato for næste service er blevet sat til ${formatDate(nextServiceIso)}.`
    });
    
    setIsEditingNextService(false);
  };

  return (
    <Card className="overflow-hidden">
      <div className="w-full relative">
        {machine.equipment && machine.equipment.length > 0 && (
          <ImageGallery 
            images={machine.equipment[0]?.images || []}
            alt={machine.name}
            models3D={machine.equipment[0]?.models3D}
          />
        )}
        
        <div className="absolute top-0 right-0 p-2">
          {renderStatusBadge(machine.status)}
        </div>
      </div>

      <CardContent className="p-6">
        <h1 className="text-3xl font-bold mb-2">{machine.name}</h1>
        <p className="text-muted-foreground mb-6">{machine.model}</p>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Info className="h-5 w-5 mr-2 text-primary" />
              Overblik
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <CalendarIcon className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Serviceintervaller</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Sidste service:</div>
                      {isEditingLastService ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-[180px] pl-3 text-left font-normal",
                                  !lastServiceDate && "text-muted-foreground"
                                )}
                              >
                                {lastServiceDate ? (
                                  format(lastServiceDate, "dd/MM/yyyy")
                                ) : (
                                  <span>Vælg dato</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={lastServiceDate}
                                onSelect={setLastServiceDate}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <Button size="sm" onClick={handleSaveLastService} className="h-8">Gem</Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditingLastService(false)} className="h-8">Annuller</Button>
                        </div>
                      ) : (
                        <div className="font-medium flex items-center">
                          {serviceInfo.lastService}
                          {canEditServiceInfo && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 ml-2"
                              onClick={() => {
                                const date = parseISODateString(serviceInfo.lastServiceDate);
                                if (date) {
                                  setLastServiceDate(date);
                                } else {
                                  setLastServiceDate(new Date());
                                }
                                setIsEditingLastService(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Næste service:</div>
                      {isEditingNextService ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-[180px] pl-3 text-left font-normal",
                                  !nextServiceDate && "text-muted-foreground"
                                )}
                              >
                                {nextServiceDate ? (
                                  format(nextServiceDate, "dd/MM/yyyy")
                                ) : (
                                  <span>Vælg dato</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={nextServiceDate}
                                onSelect={setNextServiceDate}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <Button size="sm" onClick={handleSaveNextService} className="h-8">Gem</Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditingNextService(false)} className="h-8">Annuller</Button>
                        </div>
                      ) : (
                        <div className="font-medium flex items-center">
                          {serviceInfo.nextService}
                          {canEditServiceInfo && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 ml-2"
                              onClick={() => {
                                const date = parseISODateString(serviceInfo.nextServiceDate);
                                if (date) {
                                  setNextServiceDate(date);
                                } else {
                                  const date = new Date();
                                  date.setMonth(date.getMonth() + 3);
                                  setNextServiceDate(date);
                                }
                                setIsEditingNextService(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Seneste km-stand:</div>
                      {isEditingOdometer ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={odometerValue}
                            onChange={(e) => setOdometerValue(e.target.value)}
                            placeholder={serviceInfo.rawOdometerReading ? serviceInfo.rawOdometerReading.toString() : "0"}
                            className="h-8 w-28"
                          />
                          <Button size="sm" onClick={handleSaveOdometer} className="h-8">Gem</Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditingOdometer(false)} className="h-8">Annuller</Button>
                        </div>
                      ) : (
                        <div className="font-medium flex items-center">
                          {serviceInfo.odometerReading}
                          {canEditServiceInfo && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 ml-2"
                              onClick={() => {
                                setOdometerValue(serviceInfo.rawOdometerReading?.toString() || '');
                                setIsEditingOdometer(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Service interval:</div>
                      {isEditingInterval ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={intervalValue}
                            onChange={(e) => setIntervalValue(e.target.value)}
                            placeholder={serviceInfo.rawIntervalKm ? serviceInfo.rawIntervalKm.toString() : "10000"}
                            className="h-8 w-28"
                          />
                          <Button size="sm" onClick={handleSaveInterval} className="h-8">Gem</Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditingInterval(false)} className="h-8">Annuller</Button>
                        </div>
                      ) : (
                        <div className="font-medium flex items-center">
                          {serviceInfo.intervalKm}
                          {canEditServiceInfo && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 ml-2"
                              onClick={() => {
                                setIntervalValue(serviceInfo.rawIntervalKm?.toString() || '');
                                setIsEditingInterval(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {machine.equipment.map((equipment) => (
            <div key={equipment.id}>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                {getEquipmentIcon(equipment.type)}
                {equipment.type === 'truck' ? 'Lastbil' : 
                 equipment.type === 'crane' ? 'Kran' : 
                 equipment.type === 'winch' ? 'Spil' : 
                 equipment.type === 'hooklift' ? 'Kroghejs' : 
                 equipment.type} - {equipment.model}
              </h3>
              <div className="space-y-2">
                {Object.entries(equipment.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b py-2">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MachineOverview;
