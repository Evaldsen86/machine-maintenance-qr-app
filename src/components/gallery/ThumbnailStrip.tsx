
import React from 'react';
import { Box } from 'lucide-react';
import { Model3D } from '@/types';

interface ThumbnailStripProps {
  images: string[];
  alt: string;
  activeIndex: number;
  onSelect: (index: number) => void;
  models3D?: Model3D[];
}

const ThumbnailStrip: React.FC<ThumbnailStripProps> = ({
  images,
  alt,
  activeIndex,
  onSelect,
  models3D
}) => {
  if (images.length <= 1) return null;
  
  return (
    <div className="bg-background p-2 overflow-x-auto flex gap-2">
      {images.map((image, index) => {
        const has3DModel = models3D && models3D.some(model => model.thumbnail === image);
        
        return (
          <button 
            key={index} 
            className={`flex-shrink-0 h-16 w-16 rounded overflow-hidden border-2 transition-all ${
              index === activeIndex ? 'border-primary' : 'border-transparent'
            } relative`}
            onClick={() => onSelect(index)}
          >
            <img 
              src={image} 
              alt={`${alt} - miniature ${index + 1}`} 
              className="h-full w-full object-cover"
            />
            {has3DModel && (
              <div className="absolute bottom-0 right-0 bg-blue-500 p-0.5 rounded-tl">
                <Box className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ThumbnailStrip;
