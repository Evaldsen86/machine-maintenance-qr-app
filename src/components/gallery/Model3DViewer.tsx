
import React, { useEffect, useState } from 'react';
import { Model3D } from '@/types';
import { Box, Boxes, Image as ImageIcon, View, Smartphone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  isGLBSupported, 
  isUSDZSupported, 
  get3DSupportMessage, 
  isARSupported, 
  getARSupportMessage,
  loadModelViewerScript,
} from '@/utils/model3DUtils';
import { toast } from "@/hooks/use-toast";

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

interface Model3DViewerProps {
  model: Model3D | null;
  currentImage: string;
  alt: string;
  onToggleViewMode: (e: React.MouseEvent) => void;
  viewMode: 'image' | '3d';
}

const Model3DViewer: React.FC<Model3DViewerProps> = ({
  model,
  currentImage,
  alt,
  onToggleViewMode,
  viewMode
}) => {
  const [showARPrompt, setShowARPrompt] = useState(false);
  const [show3DWarning, setShow3DWarning] = useState(false);
  const [modelViewerLoaded, setModelViewerLoaded] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  // Generate a shareable direct link for AR experience
  useEffect(() => {
    if (model) {
      // Create a full URL with model info encoded
      const baseUrl = window.location.origin;
      const modelIdParam = model.id ? `&modelId=${encodeURIComponent(model.id)}` : '';
      const fullUrl = `${baseUrl}${window.location.pathname}?ar=true${modelIdParam}`;
      
      // Generate QR code URL for this direct link
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fullUrl)}`;
      setQrCodeUrl(qrUrl);
    }
  }, [model]);
  
  useEffect(() => {
    if (model) {
      setIsLoadingModel(true);
      loadModelViewerScript().then(success => {
        setModelViewerLoaded(success);
        console.log("Model viewer script loaded:", success);
      });
    }
    
    // Check if user is on mobile
    setIsMobile(/Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, [model]);
  
  // Handle model loading events
  useEffect(() => {
    const handleModelLoad = () => {
      console.log("3D model loaded successfully in gallery view");
      setIsLoadingModel(false);
    };

    const handleModelError = (error: any) => {
      console.error("Error loading 3D model in gallery view:", error);
      toast({
        variant: "destructive",
        title: "Fejl ved indlæsning af 3D-model",
        description: "Der opstod en fejl under indlæsning af 3D-modellen. Prøv venligst igen.",
      });
      setIsLoadingModel(false);
    };

    if (modelViewerLoaded && viewMode === '3d') {
      const modelViewerElement = document.querySelector('model-viewer');
      if (modelViewerElement) {
        modelViewerElement.addEventListener('load', handleModelLoad);
        modelViewerElement.addEventListener('error', handleModelError);

        // Set a timeout in case the event doesn't fire
        const timeout = setTimeout(() => {
          setIsLoadingModel(false);
        }, 5000);

        return () => {
          clearTimeout(timeout);
          modelViewerElement.removeEventListener('load', handleModelLoad);
          modelViewerElement.removeEventListener('error', handleModelError);
        };
      }
    }
  }, [modelViewerLoaded, viewMode, model]);

  const handle3DView = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("3D view requested for model:", model);
    
    if (!model) {
      console.log("No 3D model available");
      toast({
        variant: "destructive",
        title: "3D-model ikke tilgængelig",
        description: "Der er ingen 3D-model tilknyttet dette billede.",
      });
      return;
    }
    
    if (model.fileType === '3d-usdz' && isUSDZSupported()) {
      console.log("Opening USDZ model in QuickLook:", model.fileUrl);
      window.location.href = model.fileUrl;
      return;
    }
    
    if (model.fileType === '3d-glb' && isGLBSupported()) {
      console.log("Setting view mode to 3D for GLB model");
      onToggleViewMode(e);
      setIsLoadingModel(true);
      return;
    }
    
    console.log("3D model format not supported on this device");
    setShow3DWarning(true);
    setTimeout(() => setShow3DWarning(false), 5000);
    
    toast({
      title: "3D visning begrænset",
      description: get3DSupportMessage(),
      variant: "destructive"
    });
  };

  const showARView = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("AR view requested, AR supported:", isARSupported());
    
    if (!model) {
      console.log("Can't show AR view: no 3D model available");
      toast({
        variant: "destructive",
        title: "AR visning ikke tilgængelig",
        description: "Ingen 3D-model tilgængelig for dette billede.",
      });
      return;
    }
    
    if (viewMode !== '3d') {
      console.log("Switching to 3D mode first");
      onToggleViewMode(e);
      setIsLoadingModel(true);
    }
    
    setShowARPrompt(true);
    
    toast({
      title: "AR visning",
      description: isMobile ? 
        "Tryk på AR-ikonet i nederste højre hjørne for at starte AR-oplevelsen." : 
        "Scan QR-koden med din mobil for at se modellen i AR.",
      duration: 8000
    });
  };

  const renderModelViewer = () => {
    if (!model) return null;
    
    if (viewMode === '3d' && model.fileType === '3d-glb' && modelViewerLoaded) {
      return (
        <>
          <model-viewer
            src={model.fileUrl}
            alt={`3D model af ${alt}`}
            poster={model.thumbnail || currentImage}
            ar={true} // Always enable AR button
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            environment-image="neutral"
            exposure="0.8"
            style={{ width: '100%', height: '100%' }}
            className="w-full h-full"
          ></model-viewer>
          
          {isLoadingModel && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                <p className="text-white font-medium">Indlæser 3D model...</p>
              </div>
            </div>
          )}
        </>
      );
    }
    
    return null;
  };

  if (!model) return null;

  return (
    <>
      {renderModelViewer()}
      
      {showARPrompt && viewMode === '3d' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded-lg max-w-xs md:max-w-md text-center">
            <Boxes className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-bold mb-2">AR-visning</h3>
            
            {isMobile ? (
              <div>
                <p className="mb-4">
                  Tryk på AR-ikonet i nederste højre hjørne af 3D-visningen for at starte AR-oplevelsen.
                </p>
                <div className="border border-dashed border-gray-300 p-4 mb-4 rounded">
                  <Smartphone className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Peg med kameraet på en flad overflade for at placere 3D-modellen i rummet.</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-4">
                  AR-visning er bedst på en mobilenhed. Scan QR-koden med din mobil for at se modellen i AR.
                </p>
                <div className="border border-dashed border-gray-300 p-4 mb-4 rounded">
                  <p className="text-sm mb-2">Åbn kameraappen og scan denne QR-kode:</p>
                  {qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl}
                      alt="QR-kode til AR-visning"
                      className="mx-auto h-32 w-32"
                      onError={() => {
                        console.error("Failed to load QR code image");
                        toast({
                          variant: "destructive",
                          title: "Fejl ved indlæsning af QR-kode",
                          description: "Kunne ikke generere QR-kode til AR-visning."
                        });
                      }}
                    />
                  ) : (
                    <div className="mx-auto h-32 w-32 bg-gray-200 flex items-center justify-center">
                      <p className="text-sm text-gray-500">Genererer QR-kode...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Button 
              onClick={() => setShowARPrompt(false)}
              className="w-full"
            >
              Forstået
            </Button>
          </div>
        </div>
      )}
      
      {show3DWarning && (
        <Alert 
          variant="destructive" 
          className="absolute bottom-14 left-4 right-4 bg-black/70 border-amber-500 text-white"
        >
          <AlertDescription>
            {get3DSupportMessage()}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        <Button
          variant="outline"
          className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg hover:shadow-xl transition-all"
          onClick={handle3DView}
        >
          <Box className="h-4 w-4 mr-2" />
          Vis i 3D
        </Button>
        
        <Button
          variant="outline"
          className="bg-gray-800 hover:bg-gray-900 text-white border-none shadow-lg hover:shadow-xl transition-all"
          onClick={onToggleViewMode}
        >
          {viewMode === 'image' ? (
            <>
              <Box className="h-4 w-4 mr-2" />
              3D
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4 mr-2" />
              Billede
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          className="bg-green-600 hover:bg-green-700 text-white border-none shadow-lg hover:shadow-xl transition-all animate-pulse"
          onClick={showARView}
        >
          <Boxes className="h-4 w-4 mr-2" />
          AR Visning
        </Button>
      </div>
    </>
  );
};

export default Model3DViewer;
