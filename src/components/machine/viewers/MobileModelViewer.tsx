import React, { useState, useEffect } from 'react';
import { Model3D } from '@/types';
import { useToast } from "@/components/ui/use-toast";
import { 
  isGLBSupported, 
  isARSupported, 
  get3DSupportMessage,
  loadModelViewerScript,
  debug3DModel
} from '@/utils/model3DUtils';

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
  model: Model3D;
  thumbnailImage?: string;
  alt: string;
}

const MobileModelViewer: React.FC<MobileModelViewerProps> = ({ model, thumbnailImage, alt }) => {
  const [modelViewerLoaded, setModelViewerLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  
  // Load model-viewer script when needed
  useEffect(() => {
    if (model) {
      setIsLoading(true);
      loadModelViewerScript().then(success => {
        setModelViewerLoaded(success);
        console.log("Mobile: Model viewer script loaded:", success);
        if (success) {
          debug3DModel(model);
        }
      });
    }
  }, [model]);
  
  // Handle model loading events
  useEffect(() => {
    const handleModelLoad = () => {
      console.log("Mobile: 3D model loaded successfully");
      setIsLoading(false);
      setRetryCount(0);
    };

    const handleModelError = (error: any) => {
      console.error("Mobile: Error loading 3D model:", error);
      
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          setIsLoading(true);
          debug3DModel(model);
        }, 1000 * (retryCount + 1));
      } else {
        toast({
          variant: "destructive",
          title: "Fejl ved indlæsning af 3D-model",
          description: "Der opstod en fejl under indlæsning af 3D-modellen.",
        });
        setIsLoading(false);
      }
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
  }, [modelViewerLoaded, model, retryCount, toast]);

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
    <div className="relative w-full h-full">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center bg-muted/30">
          <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
        </div>
      ) : (
        <model-viewer
          src={model.fileUrl}
          alt={alt}
          camera-controls
          auto-rotate
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="fixed"
          ar-placement="floor"
          shadow-intensity="1"
          exposure="1"
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};

export default MobileModelViewer;
