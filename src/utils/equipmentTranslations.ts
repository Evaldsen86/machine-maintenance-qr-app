
import { EquipmentType } from "@/types";

// Function to convert equipment types to Danish
export const translateType = (type: EquipmentType): string => {
  return equipmentTranslations[type] || type;
};

// Export the equipment translations directly
export const equipmentTranslations: Record<string, string> = {
  'truck': 'Lastbil',
  'crane': 'Kran',
  'winch': 'Spil',
  'hooklift': 'Kroghejs',
  'excavator': 'Gravemaskine',
  'bulldozer': 'Bulldozer',
  'forklift': 'Gaffeltruck',
  'tractor': 'Traktor',
  'loader': 'Læssemaskine',
  'paver': 'Asfaltudlægger',
  'roller': 'Vejtromle',
  'grader': 'Vejhøvl',
  'backhoe': 'Rendegraver',
  'dumper': 'Dumper',
  'concrete_mixer': 'Betonblander',
  'boat': 'Båd',
  'car': 'Bil',
  'mobile_crane': 'Mobilkran',
  'heavy_mobile_crane': 'Tung mobilkran',
  'other': 'Andet'
};

// Status translation and colors
export const getStatusDetails = (status: string): { 
  label: string; 
  variant: 'default' | 'outline' | 'secondary' | 'destructive' 
} => {
  switch (status) {
    case 'pending':
      return { label: 'Afventer', variant: 'outline' };
    case 'in-progress':
      return { label: 'I gang', variant: 'secondary' };
    case 'completed':
      return { label: 'Afsluttet', variant: 'default' };
    default:
      return { label: status, variant: 'outline' };
  }
};
