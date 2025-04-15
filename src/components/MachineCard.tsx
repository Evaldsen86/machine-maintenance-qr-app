
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent,
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileEdit, MapPin, Calendar, AlertTriangle, Boxes } from 'lucide-react';
import { Machine } from '@/types';

interface MachineCardProps {
  machine: Machine;
  onEdit?: () => void;
}

const MachineCard: React.FC<MachineCardProps> = ({ machine, onEdit }) => {
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    navigate(`/machine/${machine.id}`);
  };

  // Helper function to display location correctly
  const getLocationDisplay = () => {
    if (!machine.location) return 'Ingen position';
    
    if (typeof machine.location === 'string') {
      return machine.location;
    } else {
      return machine.location.name;
    }
  };

  // Check if machine has 3D models
  const has3DModels = React.useMemo(() => {
    // Check direct models
    if (machine.models3D && machine.models3D.length > 0) {
      return true;
    }
    
    // Check equipment models
    if (machine.equipment) {
      for (const equip of machine.equipment) {
        if (equip.models3D && equip.models3D.length > 0) {
          return true;
        }
      }
    }
    
    return false;
  }, [machine]);

  return (
    <Card 
      className="h-full transition-all duration-300 hover:shadow-lg cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden h-40">
        <img 
          src={machine.equipment[0]?.images?.[0] || '/placeholder.svg'} 
          alt={machine.name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        {machine.status === 'maintenance' && (
          <div className="absolute top-2 left-2">
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Service</span>
            </Badge>
          </div>
        )}
        
        {has3DModels && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="bg-blue-500 flex items-center gap-1">
              <Boxes className="h-3 w-3" />
              <span>3D</span>
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span className="truncate">{machine.name}</span>
        </CardTitle>
        <CardDescription>{machine.model}</CardDescription>
      </CardHeader>
      
      <CardContent className="text-sm space-y-2 pb-0">
        <div className="flex items-center text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2" /> 
          <span className="truncate">{getLocationDisplay()}</span>
        </div>
        
        <div className="flex items-center text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" /> 
          <span>Årgang: {machine.year}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-auto"
          onClick={(e) => {
            e.stopPropagation();
            if (onEdit) onEdit();
          }}
        >
          <FileEdit className="mr-2 h-4 w-4" />
          Vis detaljer
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MachineCard;
