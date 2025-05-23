import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { MapPin, Globe, Building2, Mail } from 'lucide-react';
import { Machine, type Location as MachineLocation } from '@/types';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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
].sort();

// List of countries
const countries = [
  { code: "GL", name: "Grønland" },
  { code: "DK", name: "Danmark" },
  { code: "NO", name: "Norge" },
  { code: "SE", name: "Sverige" },
  { code: "FI", name: "Finland" },
  { code: "IS", name: "Island" },
  { code: "FO", name: "Færøerne" }
].sort((a, b) => a.name.localeCompare(b.name));

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
  onChange: (location: string | MachineLocation | undefined, coordinates: { lat: number; lng: number } | undefined) => void;
}

// Geokodning med Nominatim
async function geocodeAddress(address: string, postalCode: string, city: string, country: string): Promise<{ lat: number; lng: number } | undefined> {
  const query = encodeURIComponent(`${address}, ${postalCode} ${city}, ${country}`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
  try {
    const res = await fetch(url, { headers: { 'Accept-Language': 'da' } });
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    // ignore
  }
  return undefined;
}

const LocationEditSection: React.FC<LocationEditSectionProps> = ({ machine, onChange }) => {
  const [location, setLocation] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [country, setCountry] = useState<string>('GL');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [useCustomAddress, setUseCustomAddress] = useState<boolean>(false);
  const isMobile = useIsMobile();

  // Initialize location from machine prop when component mounts or machine changes
  useEffect(() => {
    if (machine && machine.location) {
      if (typeof machine.location === 'string') {
        setLocation(machine.location);
        setUseCustomAddress(false);
      } else {
        setLocation(machine.location.name);
        setAddress(machine.location.address || '');
        setPostalCode(machine.location.postalCode || '');
        setCountry(machine.location.country || 'GL');
        setUseCustomAddress(true);
      }
    }
  }, [machine]);

  const handleSaveLocation = async () => {
    let finalLocation: string | MachineLocation | undefined;
    let coordinates: { lat: number; lng: number } | undefined;

    if (useCustomAddress) {
      // Gem alle felter korrekt
      finalLocation = {
        address,
        postalCode,
        name: location, // By
        country,
      } as MachineLocation;
      // Geokodning
      coordinates = await geocodeAddress(address, postalCode, location, countries.find(c => c.code === country)?.name || '');
      if (!coordinates) {
        toast({
          variant: 'destructive',
          title: 'Kunne ikke finde adresse',
          description: 'Adressen kunne ikke geokodes. Pin placeres i Nuuk som fallback.'
        });
        coordinates = locationCoordinates['Nuuk'];
      }
    } else {
      // For predefined locations, brug bynavn og koordinater
      finalLocation = location;
      coordinates = location ? locationCoordinates[location] : undefined;
    }

    onChange(finalLocation, coordinates);
    setIsEditing(false);

    toast({
      title: "Placering opdateret",
      description: finalLocation
        ? `Maskinen er nu placeret i ${typeof finalLocation === 'string' ? finalLocation : [finalLocation.address, finalLocation.postalCode, finalLocation.name, countries.find(c => c.code === finalLocation.country)?.name].filter(Boolean).join(', ')}`
        : "Placeringen er blevet fjernet",
    });
  };

  const getLocationDisplayName = (): string => {
    if (!machine.location) return 'Ingen placering angivet';

    if (typeof machine.location === 'string') {
      return machine.location;
    } else if (typeof machine.location === 'object' && machine.location !== null) {
      const loc = machine.location as MachineLocation;
      const address = typeof loc.address === 'string' ? loc.address : '';
      const postalCode = typeof loc.postalCode === 'string' ? loc.postalCode : '';
      const name = typeof loc.name === 'string' ? loc.name : '';
      const countryCode = loc.country;
      const countryName = countryCode ? (countries.find(c => c.code === countryCode)?.name || '') : '';
      return [address, postalCode, name, countryName].filter(Boolean).join(', ');
    }
    return '';
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
        <div className="border p-4 rounded-lg space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="customAddress" 
              checked={useCustomAddress}
              onCheckedChange={(checked) => setUseCustomAddress(checked as boolean)}
            />
            <Label htmlFor="customAddress">Brug specifik adresse</Label>
          </div>

          {useCustomAddress ? (
            <>
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input
                  placeholder="Indtast gade og husnummer"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Postnummer</Label>
                  <Input
                    placeholder="Indtast postnummer"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>By</Label>
                  <Input
                    placeholder="Indtast by"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Land</Label>
                <Select
                  value={country}
                  onValueChange={setCountry}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg land" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-60">
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>Vælg by eller bygd</Label>
              <Select
                value={location}
                onValueChange={setLocation}
              >
                <SelectTrigger>
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
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (typeof machine.location === 'string') {
                  setLocation(machine.location);
                  setUseCustomAddress(false);
                } else if (machine.location) {
                  setLocation(machine.location.name);
                  setAddress(machine.location.address || '');
                  setPostalCode(machine.location.postalCode || '');
                  setCountry(machine.location.country || 'GL');
                  setUseCustomAddress(true);
                } else {
                  setLocation('');
                  setAddress('');
                  setPostalCode('');
                  setCountry('GL');
                  setUseCustomAddress(false);
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
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">{getLocationDisplayName()}</p>
                  {machine.coordinates && (
                    <p className="text-xs text-muted-foreground">
                      Koordinater: {machine.coordinates.lat.toFixed(4)}, {machine.coordinates.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
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
