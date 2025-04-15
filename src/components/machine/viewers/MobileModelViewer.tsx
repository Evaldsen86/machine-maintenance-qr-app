
import React, { useEffect, useState } from 'react';
import { Model3D } from '@/types';
import { Box } from 'lucide-react';
import { 
  isARSupported,
  loadModelViewerScript
} from '@/utils/model3DUtils';
import { toast } from '@/hooks/use-toast';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        poster?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        'shadow-intensity'?: string;
        'environment-image'?: string;
        exposure?: string;
        style?: React.CSSProperties;
        className?: string;
      }, HTMLElement>;
    }
  }
}

interface MobileModelViewerProps {
  model: Model3D | null;
  thumbnailImage: string | null;
  alt: string;
}

const MobileModelViewer: React.FC<MobileModelViewerProps> = ({ model, thumbnailImage, alt }) => {
  const [modelViewerLoaded, setModelViewerLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load model-viewer script when needed
  useEffect(() => {
    if (model) {
      setIsLoading(true);
      loadModelViewerScript().then(success => {
        setModelViewerLoaded(success);
        console.log("Mobile: Model viewer script loaded:", success);
        setTimeout(() => setIsLoading(false), 1000);
      });
    }
  }, [model]);
  
  // Handle model loading events
  useEffect(() => {
    const handleModelLoad = () => {
      console.log("Mobile: 3D model loaded successfully");
      setIsLoading(false);
    };

    const handleModelError = (error: any) => {
      console.error("Mobile: Error loading 3D model:", error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Fejl ved indlæsning af 3D-model",
        description: "Der opstod en fejl under indlæsning af 3D-modellen.",
      });
    };

    if (modelViewerLoaded && model) {
      const modelViewerElement = document.querySelector('model-viewer');
      if (modelViewerElement) {
        modelViewerElement.addEventListener('load', handleModelLoad);
        modelViewerElement.addEventListener('error', handleModelError);
      }
      
      return () => {
        if (modelViewerElement) {
          modelViewerElement.removeEventListener('load', handleModelLoad);
          modelViewerElement.removeEventListener('error', handleModelError);
        }
      };
    }
  }, [modelViewerLoaded, model]);

  if (!model) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">
          Ingen 3D-modeller tilgængelige
        </p>
      </div>
    );
  }

  return (
    <>
      {model && modelViewerLoaded ? (
        <model-viewer
          src={model.fileUrl}
          alt={`3D model af ${alt}`}
          poster={model.thumbnail || thumbnailImage || '/placeholder.svg'}
          ar={isARSupported()}
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          environment-image="neutral"
          exposure="0.8"
          style={{ width: '100%', height: '100%' }}
          className="w-full h-full"
        ></model-viewer>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted/30">
          <p className="text-muted-foreground">
            {isLoading ? "Indlæser 3D-model..." : "Klargør 3D-visning..."}
          </p>
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
            <p className="text-white font-medium">Indlæser 3D-model...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileModelViewer;
