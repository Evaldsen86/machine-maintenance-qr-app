
import React from 'react';
import { LubricationRecord } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, FileText, User } from 'lucide-react';
import { translateType } from '@/utils/equipmentTranslations';

interface LubricationRecordsListProps {
  lubricationRecords: LubricationRecord[];
}

const LubricationRecordsList: React.FC<LubricationRecordsListProps> = ({ lubricationRecords }) => {
  if (lubricationRecords.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">Ingen smøringshistorik fundet</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {lubricationRecords.map((record) => (
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
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          
          {record.notes && (
            <p className="text-sm mb-2">{record.notes}</p>
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

export default LubricationRecordsList;
