
import React from 'react';
import { ServiceRecord, EquipmentType } from '@/types';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, User } from 'lucide-react';
import { translateType } from '@/utils/equipmentTranslations';

interface ServiceRecordsListProps {
  serviceRecords: ServiceRecord[];
}

const ServiceRecordsList: React.FC<ServiceRecordsListProps> = ({ serviceRecords }) => {
  if (serviceRecords.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">Ingen servicehistorik fundet</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {serviceRecords.map((record) => (
        <div 
          key={record.id} 
          className="flex flex-col p-4 border rounded-lg bg-card"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center">
              <Badge variant="outline" className="mr-2">
                {translateType(record.equipmentType)}
              </Badge>
              <time className="text-sm text-muted-foreground flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(record.date).toLocaleDateString('da-DK')}
              </time>
            </div>
          </div>
          
          <p className="text-sm mb-2">{record.description}</p>
          
          {record.issues && (
            <div className="mt-2 p-2 bg-destructive/10 text-destructive rounded-md text-sm flex items-start">
              <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
              <span>{record.issues}</span>
            </div>
          )}
          
          <div className="flex items-center mt-2 text-muted-foreground text-xs">
            <User className="h-3 w-3 mr-1" />
            <span>Udført af: {record.performedBy}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceRecordsList;
