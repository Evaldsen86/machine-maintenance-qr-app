import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Image, Upload, Trash2, Box, File, Info, View, Boxes } from 'lucide-react';
import { Model3D, createModel3DFromFile } from '@/types';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  isGLBSupported, 
  isUSDZSupported, 
  get3DSupportMessage, 
  isValid3DFile,
  hasValidImageSource,
} from '@/utils/model3DUtils';

interface ImageUploadBoxProps {
  onUpload: (imageUrl: string) => void;
  onUpload3D?: (model: Model3D) => void;
  onDeleteExistingImage?: (index: number) => void;
  existingImages?: string[];
}

const ImageUploadBox: React.FC<ImageUploadBoxProps> = ({ 
  onUpload, 
  onUpload3D,
  onDeleteExistingImage,
  existingImages = []
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [model3DFile, setModel3DFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const model3DInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    handleFile(file);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    handleFile(file);
  };
  
  const handle3DFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.glb') || fileName.endsWith('.usdz')) {
      handle3DFile(file);
    } else {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "3D-filen skal være i GLB eller USDZ-format",
      });
    }
  };
  
  const handleFile = async (file: File) => {
    try {
      setIsLoading(true);
      
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.glb') || fileName.endsWith('.usdz')) {
        // For 3D files, check if we have existing images or a preview image
        if (hasValidImageSource(previewUrl, existingImages) && onUpload3D) {
          await handle3DFile(file);
          return;
        } else {
          toast({
            variant: "destructive",
            title: "Fejl",
            description: "Upload venligst et billede først, før du tilføjer en 3D-model",
          });
          return;
        }
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Fejl",
          description: "Filen skal være et billede (JPG, PNG, etc.)",
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Fejl",
          description: "Billedet må ikke være større end 5MB",
        });
        return;
      }
      
      const imageUrl = URL.createObjectURL(file);
      setPreviewUrl(imageUrl);
      
      onUpload(imageUrl);
      
      toast({
        title: "Billede uploadet",
        description: "Billedet er blevet tilføjet til maskinen",
      });
    } catch (error) {
      console.error("Error handling file:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Der opstod en fejl under upload af filen",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handle3DFile = async (file: File) => {
    try {
      setIsLoading(true);
      
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.glb') && !fileName.endsWith('.usdz')) {
        toast({
          variant: "destructive",
          title: "Fejl",
          description: "3D-filen skal være i GLB eller USDZ-format",
        });
        return;
      }
      
      if (file.size > 25 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Fejl",
          description: "3D-filen må ikke være større end 25MB",
        });
        return;
      }
      
      setModel3DFile(file);
      
      // Check if there's either a preview image or existing images
      if (onUpload3D && (previewUrl || existingImages.length > 0)) {
        // Use preview URL if available, otherwise use the first existing image as thumbnail
        const thumbnailUrl = previewUrl || (existingImages.length > 0 ? existingImages[0] : undefined);
        const model = createModel3DFromFile(file, thumbnailUrl);
        
        onUpload3D(model);
        
        toast({
          title: "3D-model uploadet",
          description: `${fileName.endsWith('.glb') ? 'GLB' : 'USDZ'} 3D-model er blevet tilføjet til billedet`,
        });

        toast({
          title: "Sådan vises 3D-modellen",
          description: "Efter billedet er gemt, kan 3D-modellen vises ved at klikke på billedet i galleriet og derefter vælge '3D' knappen.",
          duration: 6000
        });
      } else if (!hasValidImageSource(previewUrl, existingImages)) {
        toast({
          variant: "destructive",
          title: "Fejl",
          description: "Upload venligst et billede først, før du tilføjer en 3D-model",
        });
      }
    } catch (error) {
      console.error("Error creating 3D model:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Der opstod en fejl ved håndtering af 3D-filen",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    
    if (model3DFile) {
      setModel3DFile(null);
      if (model3DInputRef.current) {
        model3DInputRef.current.value = '';
      }
    }
  };
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDeleteExistingImage = (index: number) => {
    if (onDeleteExistingImage) {
      onDeleteExistingImage(index);
      toast({
        title: "Billede slettet",
        description: "Billedet er blevet fjernet fra maskinen",
      });
    }
  };

  // Check if we have a valid image source (either preview or existing images)
  const hasImage = hasValidImageSource(previewUrl, existingImages);
  
  return (
    <div className="w-full space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <input
        ref={model3DInputRef}
        type="file"
        accept=".glb,.usdz"
        className="hidden"
        onChange={handle3DFileChange}
      />
      
      {previewUrl ? (
        <div className="relative border rounded-md overflow-hidden">
          <img 
            src={previewUrl} 
            alt="Uploaded preview" 
            className="w-full h-64 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button 
              variant="destructive" 
              size="icon" 
              className="bg-black/60 hover:bg-black/80"
              onClick={handleClearImage}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          {!model3DFile && onUpload3D && (
            <div className="absolute bottom-2 right-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-500/80 hover:bg-blue-600 text-white border-none"
                      onClick={() => model3DInputRef.current?.click()}
                    >
                      <Boxes className="h-4 w-4 mr-2" />
                      Tilføj 3D-model (GLB/USDZ)
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload en GLB eller USDZ-fil (op til 25MB).<br />GLB anbefales for kompatibilitet på tværs af enheder.<br />Efter upload og gem, kan modellen ses i billedegalleriet.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          
          {model3DFile && (
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              <div className="bg-blue-500/80 rounded px-2 py-1 text-xs text-white flex items-center">
                <Boxes className="h-3 w-3 mr-1" />
                {model3DFile.name}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 bg-white/80">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Efter billedet er gemt, kan 3D-modellen vises<br />ved at klikke på billedet i galleriet.</p>
                    <p className="mt-1">{model3DFile.name.endsWith('.glb') 
                      ? 'GLB-filer understøttes på alle moderne enheder.' 
                      : 'USDZ-filer understøttes kun på Apple-enheder.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      ) : (
        <div 
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-primary bg-primary/10' : 'border-border'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Klik her eller træk et billede hertil</p>
            <p className="text-sm text-muted-foreground">
              Understøtter JPG, PNG, GIF op til 5MB
            </p>
            {onUpload3D && (
              <div className="mt-2 text-xs text-blue-500 flex items-center gap-1">
                <Boxes className="h-3 w-3 inline" />
                <span>Efter upload kan du tilføje en 3D-model (GLB/USDZ-format, op til 25MB)</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 inline ml-1" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>GLB-filer understøttes på alle enheder med moderne browsere.</p>
                      <p>USDZ-filer understøttes kun på iOS enheder (iPhone, iPad).</p>
                      <p className="mt-1">Efter upload og gem, kan 3D-modellen vises ved at klikke på billedet i galleriet.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Display existing images and add 3D button if we have existing images but no uploaded preview */}
      {existingImages.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Eksisterende billeder</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {existingImages.map((img, index) => (
              <div key={index} className="relative border rounded-md overflow-hidden">
                <img 
                  src={img} 
                  alt={`Existing image ${index + 1}`} 
                  className="w-full h-24 object-cover"
                />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-1 right-1 h-6 w-6 bg-black/60 hover:bg-black/80"
                  onClick={() => handleDeleteExistingImage(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          
          {/* Add 3D model button when we have existing images but no preview image */}
          {!previewUrl && !model3DFile && onUpload3D && existingImages.length > 0 && (
            <div className="mt-3 flex justify-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-500/80 hover:bg-blue-600 text-white border-none"
                      onClick={() => model3DInputRef.current?.click()}
                    >
                      <Boxes className="h-4 w-4 mr-2" />
                      Tilføj 3D-model (GLB/USDZ)
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload en GLB eller USDZ-fil (op til 25MB).<br />GLB anbefales for kompatibilitet på tværs af enheder.<br />Efter upload og gem, kan modellen ses i billedegalleriet.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          
          {model3DFile && !previewUrl && (
            <div className="mt-3 flex items-center gap-2 justify-end">
              <div className="bg-blue-500/80 rounded px-2 py-1 text-xs text-white flex items-center">
                <Boxes className="h-3 w-3 mr-1" />
                {model3DFile.name}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 bg-gray-100">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Efter maskinen er gemt, kan 3D-modellen vises<br />ved at klikke på billedet i galleriet.</p>
                    <p className="mt-1">{model3DFile.name.endsWith('.glb') 
                      ? 'GLB-filer understøttes på alle moderne enheder.' 
                      : 'USDZ-filer understøttes kun på Apple-enheder.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploadBox;
