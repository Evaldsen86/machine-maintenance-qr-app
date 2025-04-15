
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Box, Boxes } from 'lucide-react';
import { isARSupported } from '@/utils/model3DUtils';
import { Model3D } from '@/types';

interface ImageGalleryTriggerProps {
  images: string[];
  alt: string;
  models3D?: Model3D[];
}

const ImageGalleryTrigger: React.FC<ImageGalleryTriggerProps> = ({
  images,
  alt,
  models3D
}) => {
  const has3DModels = Array.isArray(models3D) && models3D.length > 0;

  if (!images.length) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="h-64 bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">Ingen billeder tilgængelige</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-0 relative">
        <AspectRatio ratio={16/9} className="bg-muted">
          <img 
            src={images[0]} 
            alt={alt} 
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            {images.length > 1 && (
              <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                {images.length} billeder
              </div>
            )}
            {has3DModels && (
              <div className="bg-blue-500/70 text-white px-2 py-1 rounded text-xs flex items-center">
                <Box className="h-3 w-3 mr-1" />
                3D
              </div>
            )}
          </div>
          
          {has3DModels && isARSupported() && (
            <div className="absolute top-2 right-2">
              <div className="bg-green-500/80 text-white px-2 py-1 rounded text-xs flex items-center animate-pulse">
                <Boxes className="h-3 w-3 mr-1" />
                AR tilgængelig
              </div>
            </div>
          )}
        </AspectRatio>
      </CardContent>
    </Card>
  );
};

export default ImageGalleryTrigger;
