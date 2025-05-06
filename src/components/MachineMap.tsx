import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Machine } from '@/types';
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
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
    <Card className="w-full h-[600px] overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span>Maskine Placeringer</span>
            <div className="flex items-center gap-2 text-sm font-normal">
              <Badge variant="outline" className="bg-primary/10">
                {machines.length} maskiner
              </Badge>
              <Badge variant="outline" className="bg-primary/10">
                {allLocations.length} lokationer
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
        <MapContainer
          center={[71.7069, -42.6043]} // Center of Greenland
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          className="rounded-md"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
                {Object.entries(machinesByLocation).map(([location, locationMachines]) => {
                  if (selectedLocation !== 'all' && selectedLocation !== location) {
                    return null;
                  }
                  
            const coordinates = getLocationCoordinates(location);
            if (!coordinates) return null;
                  
                  const count = locationMachines.length;
                  const statuses = locationMachines.map(m => m.status);
                  const activeCount = statuses.filter(s => s === 'active').length;
                  const maintenanceCount = statuses.filter(s => s === 'maintenance').length;
                  const inactiveCount = statuses.filter(s => s === 'inactive').length;
                  
            let statusColor = 'green';
                  if (inactiveCount > activeCount && inactiveCount > maintenanceCount) {
              statusColor = 'red';
                  } else if (maintenanceCount > activeCount) {
              statusColor = 'yellow';
                  }
                  
                  return (
              <Marker
                key={location}
                position={[coordinates.lat, coordinates.lng]}
                eventHandlers={{
                  click: () => onSelectMachine && onSelectMachine(locationMachines[0])
                }}
              >
                <Popup>
                        <div className="p-2">
                          <p className="font-medium text-sm">{location}</p>
                          <p className="text-xs text-muted-foreground">{count} maskine{count > 1 ? 'r' : ''}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {activeCount > 0 && <Badge className="bg-green-500 text-[10px]">Aktiv: {activeCount}</Badge>}
                            {maintenanceCount > 0 && <Badge className="bg-yellow-500 text-[10px]">Vedligeholdelse: {maintenanceCount}</Badge>}
                            {inactiveCount > 0 && <Badge className="bg-red-500 text-[10px]">Inaktiv: {inactiveCount}</Badge>}
                          </div>
                        </div>
                </Popup>
              </Marker>
                  );
                })}
        </MapContainer>
      </CardContent>
    </Card>
  );
};

// Helper function to get coordinates for locations
function getLocationCoordinates(location: string): { lat: number; lng: number } | null {
  const coordinates: Record<string, { lat: number; lng: number }> = {
    "Nuuk": { lat: 64.1748, lng: -51.7381 },
    "Sisimiut": { lat: 66.9389, lng: -53.6735 },
    "Ilulissat": { lat: 69.2198, lng: -51.0986 },
    "Qaqortoq": { lat: 60.7184, lng: -46.0356 },
    "Aasiaat": { lat: 68.7102, lng: -52.8699 },
    "Maniitsoq": { lat: 65.4146, lng: -52.9004 },
    "Tasiilaq": { lat: 65.6135, lng: -37.6336 },
    "Paamiut": { lat: 62.0046, lng: -49.6772 },
    "Narsaq": { lat: 60.9120, lng: -46.0498 },
    "Nanortalik": { lat: 60.1425, lng: -45.2397 },
    "Uummannaq": { lat: 70.6740, lng: -52.1124 },
    "Qasigiannguit": { lat: 68.8193, lng: -51.1972 },
    "Upernavik": { lat: 72.7079, lng: -56.1425 },
    "Qeqertarsuaq": { lat: 69.2432, lng: -53.5513 },
    "Kangaatsiaq": { lat: 68.3059, lng: -53.4624 },
    "Ittoqqortoormiit": { lat: 70.4837, lng: -21.9622 },
    "Kangerlussuaq": { lat: 67.0105, lng: -50.7217 },
    "Kullorsuaq": { lat: 74.5802, lng: -57.2208 },
    "Kuummiut": { lat: 65.8578, lng: -37.0164 },
    "Arsuk": { lat: 61.1756, lng: -48.4539 },
    "Narsarsuaq": { lat: 61.1504, lng: -45.4254 },
    "Qaanaaq": { lat: 77.4669, lng: -69.2284 },
    "Savissivik": { lat: 76.0195, lng: -65.0832 },
    "Niaqornat": { lat: 70.7820, lng: -53.6749 },
    "Atammik": { lat: 64.8122, lng: -52.1831 },
    "Kapisillit": { lat: 64.4414, lng: -50.2735 },
    "Qeqertarsuatsiaat": { lat: 63.0832, lng: -50.6871 },
    "Qassimiut": { lat: 60.7795, lng: -47.1566 },
    "Alluitsup Paa": { lat: 60.4642, lng: -45.5672 }
  };

  return coordinates[location] || null;
}

export default MachineMap;
