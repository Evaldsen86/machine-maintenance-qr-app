
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { EquipmentType } from '@/types';
import { formatDate } from '@/utils/dateUtils';

interface LubricationFormProps {
  machineId: string;
  onSubmit: (data: { 
    equipmentType: EquipmentType; 
    notes: string;
    date: string;
    performedBy: string;
  }) => void;
}

const LubricationForm: React.FC<LubricationFormProps> = ({ machineId, onSubmit }) => {
  const { user, hasPermission } = useAuth();
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('crane');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!equipmentType) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Vælg venligst udstyr (kran eller spil).",
      });
      return;
    }
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Du skal være logget ind for at registrere smøring.",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Submit with current timestamp and user info
    onSubmit({
      equipmentType,
      notes,
      date: new Date().toISOString(),
      performedBy: user.name,
    });
      
    // Reset the form
    setNotes('');
    
    toast({
      title: "Smøring registreret",
      description: "Smøringen er blevet registreret i systemet.",
    });
      
    setIsSubmitting(false);
  };

  // Only allow mechanic, technician, blacksmith, driver, and admin roles to use this form
  const isAllowedToLubricate = user && (
    hasPermission('driver') || 
    hasPermission('mechanic') || 
    hasPermission('technician') || 
    hasPermission('blacksmith')
  );

  if (!user || !isAllowedToLubricate) {
    return null;
  }

  // Determine if user is driver (has limited options)
  const isDriver = user.role === 'driver';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrer Smøring</CardTitle>
        <CardDescription>
          {isDriver 
            ? "Som chauffør kan du registrere udført smøring på kran eller spil" 
            : "Registrer udført smøring på kran eller spil"}
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Udstyr</label>
            <Select 
              value={equipmentType} 
              onValueChange={(value) => setEquipmentType(value as EquipmentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vælg udstyr" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crane">Kran</SelectItem>
                <SelectItem value="winch">Spil</SelectItem>
                {!isDriver && <SelectItem value="hooklift">Kroghejs</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              {isDriver ? "Noter/fejl" : "Noter (valgfrit)"}
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isDriver 
                ? "Beskriv eventuelle problemer eller bemærkninger..." 
                : "Tilføj eventuelle bemærkninger om smøringen..."}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Behandler..." : "Registrer Smøring"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LubricationForm;
