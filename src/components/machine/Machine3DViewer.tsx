import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Box, Boxes, View, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Machine, Model3D } from '@/types';
import { 
  isGLBSupported, 
  isARSupported, 
  get3DSupportMessage, 
  getARSupportMessage,
  loadModelViewerScript,
  debug3DModel,
  retrieveModelFromIndexedDB
} from '@/utils/model3DUtils';
import { useToast } from "@/components/ui/use-toast";

interface Machine3DViewerProps {
  machine: Machine;
  isOpen: boolean;
  onClose: () => void;
}

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

export const Machine3DViewer: React.FC<Machine3DViewerProps> = ({ machine, isOpen, onClose }) => {
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(null);
  const [modelViewerLoaded, setModelViewerLoaded] = useState(false);
  const [availableModels, setAvailableModels] = useState<Model3D[]>([]);
  const [showARInstructions, setShowARInstructions] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [arQrCode, setArQrCode] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  // Load all 3D models from the machine
  useEffect(() => {
    if (!machine || !isOpen) return;

    const loadModels = async () => {
      // First check directly on the machine for models3D array
      const models: Model3D[] = [];
      
      if (machine.models3D && machine.models3D.length > 0) {
        console.log("Found models directly on machine:", machine.models3D);
        // Filter and normalize models to ensure they have required properties
        const validModelsPromises = machine.models3D
          .filter(model => model && (model.fileUrl || (model as any).url || model.id))
          .map(async (model) => {
            let fileUrl = model.fileUrl || (model as any).url || '';
            
            // If fileUrl is a blob URL that might be expired, try to restore from IndexedDB
            if (fileUrl.startsWith('blob:') && model.id) {
              try {
                const restoredUrl = await retrieveModelFromIndexedDB(model.id);
                if (restoredUrl) {
                  fileUrl = restoredUrl;
                  console.log(`Restored blob URL for model ${model.id} from IndexedDB`);
                }
              } catch (error) {
                console.warn(`Could not restore model ${model.id} from IndexedDB:`, error);
              }
            }
            
            // Normalize model structure - handle both old and new formats
            const normalized: Model3D = {
              id: model.id || `model-${Date.now()}-${Math.random()}`,
              fileUrl: fileUrl,
              fileName: model.fileName || (model as any).name || 'Unknown',
              fileType: model.fileType || (model.type === 'glb' ? '3d-glb' : '3d-usdz') || '3d-glb',
              thumbnail: model.thumbnail || model.thumbnailUrl || '',
              thumbnailUrl: model.thumbnailUrl || model.thumbnail || '',
            };
            return normalized;
          });
        
        const validModels = await Promise.all(validModelsPromises);
        models.push(...validModels);
      }
      
      // Then check in equipment
      if (machine.equipment) {
        for (const equipment of machine.equipment) {
          if (equipment.models3D && equipment.models3D.length > 0) {
            console.log("Found models in equipment:", equipment.models3D);
            const validModelsPromises = equipment.models3D
              .filter(model => model && (model.fileUrl || (model as any).url || model.id))
              .map(async (model) => {
                let fileUrl = model.fileUrl || (model as any).url || '';
                
                // If fileUrl is a blob URL that might be expired, try to restore from IndexedDB
                if (fileUrl.startsWith('blob:') && model.id) {
                  try {
                    const restoredUrl = await retrieveModelFromIndexedDB(model.id);
                    if (restoredUrl) {
                      fileUrl = restoredUrl;
                      console.log(`Restored blob URL for model ${model.id} from IndexedDB`);
                    }
                  } catch (error) {
                    console.warn(`Could not restore model ${model.id} from IndexedDB:`, error);
                  }
                }
                
                const normalized: Model3D = {
                  id: model.id || `model-${Date.now()}-${Math.random()}`,
                  fileUrl: fileUrl,
                  fileName: model.fileName || (model as any).name || 'Unknown',
                  fileType: model.fileType || (model.type === 'glb' ? '3d-glb' : '3d-usdz') || '3d-glb',
                  thumbnail: model.thumbnail || model.thumbnailUrl || '',
                  thumbnailUrl: model.thumbnailUrl || model.thumbnail || '',
                };
                return normalized;
              });
            
            const validModels = await Promise.all(validModelsPromises);
            models.push(...validModels);
          }
        }
      }

      console.log("Total models found:", models.length, models);
      setAvailableModels(models);
      if (models.length > 0 && models[0].fileUrl) {
        setSelectedModel(models[0]);
        debug3DModel(models[0]);
      }
    };

    loadModels();
    
    // Check if user is on mobile
    setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, [machine, isOpen]);

  // Load the model-viewer script when dialog opens
  useEffect(() => {
    if (isOpen && availableModels.length > 0) {
      setIsLoadingModel(true);
      loadModelViewerScript().then(success => {
        setModelViewerLoaded(success);
        console.log("Model viewer script loaded:", success);
        if (success && availableModels.length > 0 && availableModels[0].fileUrl) {
          setSelectedModel(availableModels[0]);
        }
      });
    }
  }, [isOpen, availableModels]);

  // Generate AR QR code when selected model changes
  useEffect(() => {
    if (selectedModel && selectedModel.fileUrl) {
      try {
        // Create a URL that leads directly to the AR experience
        const baseUrl = window.location.origin;
        const machineId = machine.id.startsWith('machine-') ? machine.id : `machine-${machine.id}`;
        const modelUrl = selectedModel.fileUrl;
        const arUrl = `${baseUrl}/machine/${machineId}?ar=true&model=${encodeURIComponent(modelUrl)}`;
        
        // Generate QR code using the QR Server API with high quality settings
        const size = 300;
        const margin = 4;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=${margin}&data=${encodeURIComponent(arUrl)}&format=png&_cb=${Date.now()}`;
        setArQrCode(qrUrl);
      } catch (error) {
        console.error("Error generating AR QR code:", error);
      }
    }
  }, [selectedModel, machine.id]);

  // Handle model loading events
  useEffect(() => {
    const handleModelLoad = () => {
      console.log("3D model loaded successfully");
      setIsLoadingModel(false);
      setRetryCount(0);
    };

    const handleModelError = (error: any) => {
      console.error("Error loading 3D model:", error);
      
      if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000); // Exponential backoff with max 8s
        setRetryCount(prev => prev + 1);
        
        toast({
          title: "Forsøger igen",
          description: `Indlæser 3D-model igen (forsøg ${retryCount + 1}/3)...`,
        });
        
        setTimeout(() => {
          setIsLoadingModel(true);
          if (selectedModel) {
            debug3DModel(selectedModel);
          }
        }, delay);
      } else {
        toast({
          variant: "destructive",
          title: "Fejl ved indlæsning af 3D-model",
          description: "Kunne ikke indlæse 3D-modellen efter flere forsøg. Kontroller venligst din internetforbindelse og prøv igen senere.",
        });
        setIsLoadingModel(false);
      }
    };

    if (modelViewerLoaded && selectedModel) {
      const modelViewerElement = document.querySelector('model-viewer');
      if (modelViewerElement) {
        modelViewerElement.addEventListener('load', handleModelLoad);
        modelViewerElement.addEventListener('error', handleModelError);
        
        // Add timeout for initial load
        const loadTimeout = setTimeout(() => {
          if (isLoadingModel) {
            handleModelError(new Error('Model load timeout'));
          }
        }, 30000); // 30 second timeout
        
        return () => {
          if (modelViewerElement) {
            modelViewerElement.removeEventListener('load', handleModelLoad);
            modelViewerElement.removeEventListener('error', handleModelError);
          }
          clearTimeout(loadTimeout);
        };
      }
    }
  }, [modelViewerLoaded, selectedModel, retryCount, toast, isLoadingModel]);

  const handleARView = () => {
    if (!selectedModel) {
      toast({
        variant: "destructive",
        title: "3D model mangler",
        description: "Der er ingen 3D-model valgt.",
      });
      return;
    }

    if (!isARSupported()) {
      toast({
        variant: "destructive",
        title: "AR ikke understøttet",
        description: getARSupportMessage(),
      });
      return;
    }

    setShowARInstructions(true);
    
    toast({
      title: "AR visning",
      description: isMobile ? 
        "Tryk på AR-ikonet i nederste højre hjørne for at starte AR-oplevelsen." : 
        "Scan QR-koden med din mobil for at se modellen i AR.",
    });
  };

  const switchModel = (model: Model3D) => {
    setSelectedModel(model);
    setIsLoadingModel(true);
    setRetryCount(0);
    debug3DModel(model);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 bg-background">
          <DialogTitle>3D Visning - {machine.name}</DialogTitle>
          <DialogDescription>
            Se 3D-modeller for {machine.name} og prøv AR-visning hvis din enhed understøtter det
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-[60vh]">
          {selectedModel && modelViewerLoaded && selectedModel.fileUrl ? (
            <>
              <model-viewer
                src={selectedModel.fileUrl}
                alt={`3D model af ${machine.name}`}
                poster={selectedModel.thumbnail || selectedModel.thumbnailUrl || ''}
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
              
              {isLoadingModel && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                    <p className="text-white font-medium">Indlæser 3D model...</p>
                  </div>
                </div>
              )}
            </>
          ) : availableModels.length === 0 ? (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center p-8">
                <View className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-bold">Ingen 3D-modeller tilgængelige</h3>
                <p className="mt-2 text-muted-foreground">
                  Der er ikke tilføjet nogen 3D-modeller til denne maskine. Tilføj 3D-modeller i redigeringsmenuen.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center p-8">
                <Box className="h-16 w-16 mx-auto mb-4 text-blue-400 animate-pulse" />
                <h3 className="text-lg font-bold">Indlæser 3D-viewer...</h3>
              </div>
            </div>
          )}

          {!isGLBSupported() && (
            <Alert 
              variant="destructive" 
              className="absolute bottom-4 left-4 right-4 bg-black/70 border-amber-500 text-white"
            >
              <AlertDescription>
                {get3DSupportMessage()}
              </AlertDescription>
            </Alert>
          )}
          
          {showARInstructions && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
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
                      {arQrCode ? (
                        <>
                          <p className="text-sm mb-2">Åbn kameraappen og scan denne QR-kode:</p>
                          <img 
                            src={arQrCode}
                            alt="QR-kode til AR-visning"
                            className="mx-auto h-32 w-32"
                            crossOrigin="anonymous"
                          />
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32">
                          <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-2"></div>
                          <p className="text-sm">Genererer QR-kode...</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={() => setShowARInstructions(false)}
                  className="w-full"
                >
                  Forstået
                </Button>
              </div>
            </div>
          )}
        </div>

        {availableModels.length > 0 && (
          <div className="p-4 bg-muted/20 border-t flex gap-2 overflow-x-auto">
            {availableModels.map((model, index) => (
              <Button 
                key={index}
                variant={selectedModel === model ? "default" : "outline"}
                className="flex-shrink-0"
                onClick={() => switchModel(model)}
              >
                <Box className="h-4 w-4 mr-2" />
                {model.fileName || `Model ${index + 1}`}
              </Button>
            ))}
          </div>
        )}

        <DialogFooter className="p-4 border-t">
          {isARSupported() && selectedModel && (
            <Button
              variant="outline"
              className="bg-green-600 hover:bg-green-700 text-white border-none"
              onClick={handleARView}
            >
              <Boxes className="h-4 w-4 mr-2" />
              Start AR Visning
            </Button>
          )}
          <Button onClick={onClose}>Luk</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Machine3DViewer;
