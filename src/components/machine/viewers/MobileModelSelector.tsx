
import React from 'react';
import { Button } from "@/components/ui/button";
import { Boxes } from 'lucide-react';
import { Model3D } from '@/types';

interface MobileModelSelectorProps {
  models: Model3D[];
  activeModel: Model3D | null;
  onModelChange: (model: Model3D) => void;
}

const MobileModelSelector: React.FC<MobileModelSelectorProps> = ({ 
  models, 
  activeModel, 
  onModelChange 
}) => {
  if (models.length <= 0) return null;
  
  return (
    <div className="flex gap-1 overflow-x-auto">
      {models.map((model, index) => (
        <Button
          key={index}
          variant={activeModel === model ? "default" : "outline"}
          size="sm"
          onClick={() => onModelChange(model)}
          className="flex-shrink-0"
        >
          <Boxes className="h-3 w-3 mr-1" />
          {model.fileName || `Model ${index + 1}`}
        </Button>
      ))}
    </div>
  );
};

export default MobileModelSelector;
