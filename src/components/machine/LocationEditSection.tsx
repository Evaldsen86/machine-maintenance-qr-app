
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { MapPin } from 'lucide-react';
import { Machine } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from "@/hooks/use-toast";

// List of Greenlandic cities and villages
const greenlandLocations = [
  "Nuuk",
  "Sisimiut",
  "Ilulissat",
  "Qaqortoq",
  "Aasiaat",
  "Maniitsoq",
  "Tasiilaq",
  "Paamiut",
  "Narsaq",
  "Nanortalik",
  "Uummannaq",
  "Qasigiannguit",
  "Upernavik",
  "Qeqertarsuaq",
  "Kangaatsiaq",
  "Ittoqqortoormiit",
  "Kangerlussuaq",
  "Kullorsuaq",
  "Kuummiut",
  "Arsuk",
  "Narsarsuaq",
  "Qaanaaq",
  "Savissivik",
  "Niaqornat",
  "Atammik",
  "Kapisillit",
  "Qeqertarsuatsiaat",
  "Qassimiut",
  "Alluitsup Paa"
].sort(); // Sort alphabetically

// Approximate coordinates for Greenlandic cities/villages
const locationCoordinates: Record<string, { lat: number; lng: number }> = {
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

interface LocationEditSectionProps {
  machine: Machine;
  onChange: (location: string | undefined, coordinates: { lat: number; lng: number } | undefined) => void;
}

const LocationEditSection: React.FC<LocationEditSectionProps> = ({ machine, onChange }) => {
  const [location, setLocation] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const isMobile = useIsMobile();

  // Initialize location from machine prop when component mounts or machine changes
  useEffect(() => {
    if (machine && machine.location) {
      // Handle both string and Location object types for initializing
      if (typeof machine.location === 'string') {
        setLocation(machine.location);
      } else {
        setLocation(machine.location.name);
      }
    }
  }, [machine]);

  const handleSaveLocation = () => {
    // Get coordinates for the selected location
    const coordinates = location ? locationCoordinates[location] : undefined;
    
    // Call onChange with both location name and coordinates
    onChange(location || undefined, coordinates);
    setIsEditing(false);
    
    toast({
      title: "Placering opdateret",
      description: location ? `Maskinen er nu placeret i ${location}` : "Placeringen er blevet fjernet",
    });
  };

  const getLocationDisplayName = (): string => {
    if (!machine.location) return 'Ingen placering angivet';
    
    if (typeof machine.location === 'string') {
      return machine.location;
    } else {
      return machine.location.name;
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium">Placering</h3>
        {!isEditing && (
          <Button 
            type="button" 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            onClick={() => setIsEditing(true)}
            className="flex items-center"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Rediger placering
          </Button>
        )}
      </div>
      
      {isEditing ? (
        <div className="border p-4 rounded-lg space-y-3">
          <div>
            <FormLabel>Vælg by eller bygd</FormLabel>
            <Select
              value={location}
              onValueChange={(value) => setLocation(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Vælg placering" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-60">
                  {greenlandLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => {
                // Reset to the original location value
                if (typeof machine.location === 'string') {
                  setLocation(machine.location);
                } else if (machine.location) {
                  setLocation(machine.location.name);
                } else {
                  setLocation('');
                }
                setIsEditing(false);
              }}
            >
              Annuller
            </Button>
            <Button 
              type="button" 
              size="sm" 
              onClick={handleSaveLocation}
            >
              Gem placering
            </Button>
          </div>
        </div>
      ) : (
        <div className="border p-4 rounded-lg">
          {machine.location ? (
            <div>
              <p className="mb-1"><span className="font-medium">Placering:</span> {getLocationDisplayName()}</p>
              {machine.coordinates && (
                <p className="text-xs text-muted-foreground">
                  Koordinater: {machine.coordinates.lat.toFixed(4)}, {machine.coordinates.lng.toFixed(4)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Ingen placering angivet</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationEditSection;
