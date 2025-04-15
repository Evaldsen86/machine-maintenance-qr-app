import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Box, View } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Model3D } from '@/types';
import { isValidModel3D, isARSupported } from '@/utils/model3DUtils';
import Model3DViewer from './Model3DViewer';
import ThumbnailStrip from './ThumbnailStrip';

interface ImageViewerContentProps {
  images: string[];
  alt: string;
  models3D?: Model3D[];
  onClose: () => void;
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
}

const ImageViewerContent: React.FC<ImageViewerContentProps> = ({
  images,
  alt,
  models3D,
  onClose,
  activeIndex,
  setActiveIndex
}) => {
  const [viewMode, setViewMode] = useState<'image' | '3d'>('image');
  
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((activeIndex + 1) % images.length);
    setViewMode('image');
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((activeIndex - 1 + images.length) % images.length);
    setViewMode('image');
  };
  
  const toggleViewMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMode = viewMode === 'image' ? '3d' : 'image';
    console.log("Switching to mode:", newMode);
    setViewMode(newMode);
  };

  const get3DModelForCurrentImage = () => {
    if (!models3D || models3D.length === 0) {
      console.log("No 3D models available");
      return null;
    }
    
    const currentImage = images[activeIndex];
    console.log("Looking for 3D model matching image:", currentImage);
    
    const matchingModel = models3D.find(model => model.thumbnail === currentImage);
    
    if (matchingModel) {
      console.log("Found matching 3D model:", matchingModel);
      return matchingModel;
    } 
    
    console.log("No exact matching model found, checking for models with valid thumbnail");
    
    const modelWithValidThumbnail = models3D.find(model => 
      model.thumbnail && images.includes(model.thumbnail)
    );
    
    if (modelWithValidThumbnail) {
      console.log("Found model with valid thumbnail:", modelWithValidThumbnail);
      return modelWithValidThumbnail;
    }
    
    console.log("No model with valid thumbnail, using first available model");
    
    if (models3D.length > 0) {
      const firstModel = models3D[0];
      return firstModel;
    }
    
    return null;
  };

  const current3DModel = get3DModelForCurrentImage();
  const has3DModel = isValidModel3D(current3DModel);

  return (
    <div className="relative flex-1 flex items-center justify-center bg-black/95">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 z-20 text-white hover:bg-white/20" 
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </Button>
      
      <div className="relative w-full h-full flex items-center justify-center">
        {viewMode === 'image' ? (
          <img 
            src={images[activeIndex]} 
            alt={`${alt} - billede ${activeIndex + 1}`} 
            className="max-h-full max-w-full object-contain p-4"
          />
        ) : null}
        
        {has3DModel && (
          <Model3DViewer 
            model={current3DModel}
            currentImage={images[activeIndex]}
            alt={alt}
            onToggleViewMode={toggleViewMode}
            viewMode={viewMode}
          />
        )}

        {/* Prominent 3D Viewer Button when in image mode and 3D model is available */}
        {has3DModel && viewMode === 'image' && (
          <Button 
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white hover:bg-blue-600 shadow-lg px-5 py-3 rounded-full animate-pulse"
            onClick={(e) => toggleViewMode(e)}
          >
            <Box className="h-5 w-5 mr-2" />
            Vis i 3D/AR
          </Button>
        )}
      </div>
      
      {images.length > 1 && (
        <>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20" 
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20" 
            onClick={handleNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}
      
      <ThumbnailStrip 
        images={images} 
        alt={alt} 
        activeIndex={activeIndex} 
        onSelect={setActiveIndex}
        models3D={models3D} 
      />
    </div>
  );
};

export default ImageViewerContent;
