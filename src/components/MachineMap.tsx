import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Machine, Location } from '@/types';
import { MapPin, Map, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MachineMapProps {
  machines: Machine[];
  onSelectMachine?: (machine: Machine) => void;
}

const MachineMap: React.FC<MachineMapProps> = ({ machines, onSelectMachine }) => {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const isMobile = useIsMobile();

  // Calculate machine count by location
  const machinesByLocation = useMemo(() => {
    const locationMap: Record<string, Machine[]> = {};
    
    machines.forEach(machine => {
      if (machine.location) {
        // Handle both string and Location object types
        const locationName = typeof machine.location === 'string' 
          ? machine.location 
          : machine.location.name;
          
        if (!locationMap[locationName]) {
          locationMap[locationName] = [];
        }
        locationMap[locationName].push(machine);
      }
    });
    
    return locationMap;
  }, [machines]);

  // Calculate total machines with locations
  const machinesWithLocation = useMemo(() => {
    return machines.filter(machine => machine.location).length;
  }, [machines]);

  // Calculate locations with machines
  const locationsWithMachines = useMemo(() => {
    return Object.keys(machinesByLocation).length;
  }, [machinesByLocation]);

  // Get list of all locations for dropdown
  const allLocations = useMemo(() => {
    return Object.keys(machinesByLocation).sort();
  }, [machinesByLocation]);

  // Filter machines by selected location
  const filteredMachines = useMemo(() => {
    if (selectedLocation === 'all') return machines;
    return machines.filter(machine => {
      if (typeof machine.location === 'string') {
        return machine.location === selectedLocation;
      } else if (machine.location && typeof machine.location === 'object') {
        return machine.location.name === selectedLocation;
      }
      return false;
    });
  }, [machines, selectedLocation]);

  // Get status color based on machine status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <Card className="w-full h-[400px] overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span>Maskine Placeringer</span>
            <div className="flex items-center gap-2 text-sm font-normal">
              <Badge variant="outline" className="bg-primary/10">
                {machinesWithLocation} maskiner
              </Badge>
              <Badge variant="outline" className="bg-primary/10">
                {locationsWithMachines} lokationer
              </Badge>
            </div>
          </CardTitle>
          
          {/* Location filter */}
          <div className="flex items-center gap-2">
            <Select
              value={selectedLocation}
              onValueChange={setSelectedLocation}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vælg lokation" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-60">
                  <SelectItem value="all">Alle lokationer</SelectItem>
                  {allLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location} ({machinesByLocation[location].length})
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
            {selectedLocation !== 'all' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedLocation('all')}
              >
                Nulstil
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 h-[calc(100%-70px)] relative">
        <div className="h-full w-full bg-muted/20 rounded-md relative border">
          {/* Greenland map visualization */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="relative w-full h-full">
              {/* SVG for Greenland Map */}
              <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full absolute inset-0"
                preserveAspectRatio="none"
              >
                {/* Improved Greenland outline with more detail */}
                <path 
                  d="M35,5 C40,5 45,5 50,7 C55,9 60,12 65,15 
                     C70,18 75,20 80,30 C85,40 90,50 90,60 
                     C90,70 85,75 80,80 C75,85 65,90 55,92 
                     C45,94 35,93 30,85 C25,80 20,70 15,60 
                     C10,50 10,40 15,30 C20,20 30,10 35,5 Z" 
                  fill="#e5e7eb" 
                  stroke="#9ca3af" 
                  strokeWidth="0.5"
                />
                
                {/* Coastal details */}
                <path 
                  d="M45,10 C50,12 55,15 60,18 C65,21 68,25 70,30 
                     C72,35 73,40 75,50 C77,60 78,70 75,80 
                     C72,85 68,88 60,90 C55,91 50,92 45,90 
                     C40,88 35,85 30,80 C25,75 22,65 20,55 
                     C18,45 18,35 20,25 C22,15 30,8 45,10 Z" 
                  fill="#f3f4f6" 
                  stroke="#9ca3af" 
                  strokeWidth="0.3"
                  opacity="0.8"
                />
              </svg>

              {/* City/location markers */}
              <TooltipProvider>
                {Object.entries(machinesByLocation).map(([location, locationMachines]) => {
                  // Skip if filtered and not the selected location
                  if (selectedLocation !== 'all' && selectedLocation !== location) {
                    return null;
                  }
                  
                  // Get coordinates for this location
                  const normalizedX = getRelativeX(location);
                  const normalizedY = getRelativeY(location);
                  
                  const count = locationMachines.length;
                  
                  // Scale the marker size based on machine count (between 24px and 44px)
                  const size = Math.max(24, Math.min(44, 24 + (count * 2)));
                  
                  // Determine pin color based on most common machine status
                  const statuses = locationMachines.map(m => m.status);
                  const activeCount = statuses.filter(s => s === 'active').length;
                  const maintenanceCount = statuses.filter(s => s === 'maintenance').length;
                  const inactiveCount = statuses.filter(s => s === 'inactive').length;
                  
                  let pinColor = 'bg-green-500';
                  if (inactiveCount > activeCount && inactiveCount > maintenanceCount) {
                    pinColor = 'bg-red-500';
                  } else if (maintenanceCount > activeCount) {
                    pinColor = 'bg-yellow-500';
                  }

                  // Highlight selected location
                  const isSelected = selectedLocation === location;
                  const scaleEffect = isSelected ? 'scale-125' : 'hover:scale-110';
                  const zIndexClass = isSelected ? 'z-10' : '';
                  
                  return (
                    <Tooltip key={location}>
                      <TooltipTrigger asChild>
                        <div 
                          className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${scaleEffect} ${zIndexClass}`}
                          style={{ 
                            left: `${normalizedX}%`, 
                            top: `${normalizedY}%` 
                          }}
                          onClick={() => onSelectMachine && onSelectMachine(locationMachines[0])}
                        >
                          <div className="flex flex-col items-center">
                            <div 
                              className={`flex items-center justify-center rounded-full shadow-lg ${pinColor} text-white font-medium ${isSelected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}`}
                              style={{ width: `${size}px`, height: `${size}px` }}
                            >
                              <span className="text-sm">{count}</span>
                            </div>
                            <div className={`mt-1 bg-white/90 backdrop-blur-sm shadow-sm px-2 py-0.5 rounded-md text-xs ${isSelected ? 'font-bold' : ''}`}>
                              {location}
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={5} className="z-50">
                        <div className="p-2">
                          <p className="font-medium text-sm">{location}</p>
                          <p className="text-xs text-muted-foreground">{count} maskine{count > 1 ? 'r' : ''}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {activeCount > 0 && <Badge className="bg-green-500 text-[10px]">Aktiv: {activeCount}</Badge>}
                            {maintenanceCount > 0 && <Badge className="bg-yellow-500 text-[10px]">Vedligeholdelse: {maintenanceCount}</Badge>}
                            {inactiveCount > 0 && <Badge className="bg-red-500 text-[10px]">Inaktiv: {inactiveCount}</Badge>}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
              
              {/* Legend */}
              <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded-md shadow-sm">
                <div className="text-xs font-medium mb-1">Status</div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs">Aktiv</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-xs">Vedligeholdelse</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs">Inaktiv</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper functions to position locations on the map with realistic Greenland geography
function getRelativeX(location: string): number {
  // Define x-coordinate mapping for locations (approximate longitude position on SVG)
  const locationXPositions: Record<string, number> = {
    "Nuuk": 34,
    "Sisimiut": 30,
    "Ilulissat": 35,
    "Qaqortoq": 44,
    "Aasiaat": 28,
    "Maniitsoq": 32,
    "Tasiilaq": 64,
    "Paamiut": 38,
    "Narsaq": 43,
    "Nanortalik": 45,
    "Uummannaq": 33,
    "Qasigiannguit": 32,
    "Upernavik": 26,
    "Qeqertarsuaq": 26,
    "Kangaatsiaq": 27,
    "Ittoqqortoormiit": 75,
    "Kangerlussuaq": 30,
    "Kullorsuaq": 24,
    "Kuummiut": 65,
    "Arsuk": 39,
    "Narsarsuaq": 42,
    "Qaanaaq": 18,
    "Savissivik": 20,
    "Niaqornat": 32,
    "Atammik": 33,
    "Kapisillit": 35,
    "Qeqertarsuatsiaat": 36,
    "Qassimiut": 44,
    "Alluitsup Paa": 45
  };

  return locationXPositions[location] || 50; // Default to center if location not found
}

function getRelativeY(location: string): number {
  // Define y-coordinate mapping for locations (approximate latitude position on SVG)
  const locationYPositions: Record<string, number> = {
    "Nuuk": 57,
    "Sisimiut": 45,
    "Ilulissat": 35,
    "Qaqortoq": 84,
    "Aasiaat": 42,
    "Maniitsoq": 53,
    "Tasiilaq": 60,
    "Paamiut": 67,
    "Narsaq": 80,
    "Nanortalik": 87,
    "Uummannaq": 25,
    "Qasigiannguit": 38,
    "Upernavik": 15,
    "Qeqertarsuaq": 36,
    "Kangaatsiaq": 43,
    "Ittoqqortoormiit": 40,
    "Kangerlussuaq": 48,
    "Kullorsuaq": 10,
    "Kuummiut": 58,
    "Arsuk": 72,
    "Narsarsuaq": 78,
    "Qaanaaq": 5,
    "Savissivik": 8,
    "Niaqornat": 24,
    "Atammik": 55,
    "Kapisillit": 56,
    "Qeqertarsuatsiaat": 63,
    "Qassimiut": 82,
    "Alluitsup Paa": 85
  };

  return locationYPositions[location] || 50; // Default to center if location not found
}

export default MachineMap;
