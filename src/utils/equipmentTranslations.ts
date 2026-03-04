
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
    case 'awaiting-parts':
      return { label: 'Afventer reservedele', variant: 'outline' };
    case 'ready-for-repair':
      return { label: 'Klar til reparation', variant: 'secondary' };
    case 'pending':
      return { label: 'Afventer', variant: 'outline' };
    case 'in-progress':
      return { label: 'I gang', variant: 'secondary' };
    case 'completed':
      return { label: 'Færdig', variant: 'default' };
    case 'canceled':
      return { label: 'Annulleret', variant: 'destructive' };
    case 'approved':
      return { label: 'Godkendt', variant: 'default' };
    case 'invoiced':
      return { label: 'Faktureret', variant: 'default' };
    default:
      return { label: status, variant: 'outline' };
  }
};

/** Statusser der gør opgaven synlig for teknikere (kan tages i arbejde) */
export const TECHNICIAN_VISIBLE_STATUSES = ['ready-for-repair', 'pending', 'in-progress'] as const;

/** Tjek om opgaven er synlig i prioriteringslisten for teknikere */
export const isTaskVisibleForTechnicians = (status: string): boolean =>
  TECHNICIAN_VISIBLE_STATUSES.includes(status as any);
