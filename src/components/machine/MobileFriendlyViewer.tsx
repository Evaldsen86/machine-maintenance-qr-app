
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Box, ImageIcon } from 'lucide-react';
import { Machine, Model3D } from '@/types';
import { toast } from '@/hooks/use-toast';

import MobileImageViewer from './viewers/MobileImageViewer';
import MobileModelViewer from './viewers/MobileModelViewer';
import MobileModelSelector from './viewers/MobileModelSelector';

interface MobileFriendlyViewerProps {
  machine: Machine;
}

const MobileFriendlyViewer: React.FC<MobileFriendlyViewerProps> = ({ machine }) => {
  const [activeModel, setActiveModel] = useState<Model3D | null>(null);
  const [viewMode, setViewMode] = useState<'image' | '3d'>('image');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get machine images from both direct machine.images and from machine.equipment
  const machineImages = React.useMemo(() => {
    const images: string[] = [];
    
    try {
      // Add images directly on the machine
      if (machine && machine.images && machine.images.length > 0) {
        images.push(...machine.images);
      }
      
      // Add images from equipment
      if (machine && machine.equipment) {
        machine.equipment.forEach(equipment => {
          if (equipment.images && equipment.images.length > 0) {
            images.push(...equipment.images);
          }
        });
      }
      
      // Add thumbnail from 3D models as fallback images
      if (images.length === 0) {
        if (machine && machine.models3D && machine.models3D.length > 0) {
          machine.models3D.forEach(model => {
            if (model && model.thumbnail) {
              images.push(model.thumbnail);
            }
          });
        }
        
        if (machine && machine.equipment) {
          machine.equipment.forEach(equipment => {
            if (equipment.models3D && equipment.models3D.length > 0) {
              equipment.models3D.forEach(model => {
                if (model && model.thumbnail) {
                  images.push(model.thumbnail);
                }
              });
            }
          });
        }
      }
      
      console.log("Mobile viewer found images:", images.length, images);
      return images;
    } catch (error) {
      console.error("Error processing machine images:", error);
      return [];
    }
  }, [machine]);
  
  const hasImages = machineImages.length > 0;
  
  // Find all 3D models across machine and its equipment
  const allModels = React.useMemo(() => {
    const models: Model3D[] = [];
    
    try {
      // Add models directly on machine
      if (machine && machine.models3D && machine.models3D.length > 0) {
        models.push(...machine.models3D);
      }
      
      // Add models from equipment
      if (machine && machine.equipment) {
        machine.equipment.forEach(equipment => {
          if (equipment.models3D && equipment.models3D.length > 0) {
            models.push(...equipment.models3D);
          }
        });
      }
      
      console.log("Mobile viewer found 3D models:", models.length, models);
      return models;
    } catch (error) {
      console.error("Error processing 3D models:", error);
      return [];
    }
  }, [machine]);

  // Set first valid model when switching to 3D mode
  useEffect(() => {
    if (viewMode === '3d' && !activeModel && allModels.length > 0) {
      setActiveModel(allModels[0]);
      console.log("Mobile: Setting active model:", allModels[0]);
    }
  }, [viewMode, activeModel, allModels]);
  
  // Force image refresh when component mounts
  useEffect(() => {
    // Trigger a reload of the images
    const reloadTimer = setTimeout(() => {
      // This state change will force the MobileImageViewer to rerender
      setViewMode('image');
    }, 300);
    
    return () => clearTimeout(reloadTimer);
  }, []);
  
  const toggleViewMode = useCallback(() => {
    if (viewMode === 'image') {
      if (allModels.length === 0) {
        toast({
          title: "Ingen 3D-modeller",
          description: "Der er ingen 3D-modeller tilknyttet denne maskine.",
        });
        return;
      }
      setViewMode('3d');
      setIsLoading(true);
    } else {
      setViewMode('image');
    }
  }, [viewMode, allModels.length]);
  
  const changeModel = useCallback((model: Model3D) => {
    setActiveModel(model);
    setIsLoading(true);
  }, []);

  return (
    <div className="w-full mb-4 p-2">
      <div className="rounded-lg overflow-hidden border bg-background relative">
        {/* Image/Model Viewer */}
        <div className="relative w-full h-64 md:h-80">
          {viewMode === 'image' ? (
            <MobileImageViewer 
              images={machineImages}
              alt={machine.name}
            />
          ) : (
            <MobileModelViewer
              model={activeModel}
              thumbnailImage={machineImages.length > 0 ? machineImages[0] : null}
              alt={machine.name}
            />
          )}
        </div>
        
        {/* Control buttons */}
        <div className="p-2 flex flex-wrap justify-between gap-2 border-t">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className={`${viewMode === 'image' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              onClick={() => setViewMode('image')}
            >
              <ImageIcon className="h-4 w-4 mr-1" /> Billeder
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className={`${viewMode === '3d' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              onClick={toggleViewMode}
              disabled={allModels.length === 0}
            >
              <Box className="h-4 w-4 mr-1" /> 3D Model
            </Button>
          </div>
          
          {viewMode === '3d' && (
            <MobileModelSelector 
              models={allModels} 
              activeModel={activeModel}
              onModelChange={changeModel}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileFriendlyViewer;
