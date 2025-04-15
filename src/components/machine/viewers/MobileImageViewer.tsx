
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ImageIcon } from 'lucide-react';

interface MobileImageViewerProps {
  images: string[];
  alt: string;
}

const MobileImageViewer: React.FC<MobileImageViewerProps> = ({ images, alt }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([]);
  const [retryCount, setRetryCount] = useState<number[]>([]);
  const [fallbackImages, setFallbackImages] = useState<string[]>([]);
  const imageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const hasImages = images.length > 0;
  const currentImage = hasImages ? (fallbackImages[currentImageIndex] || images[currentImageIndex]) : null;
  
  // Initialize image loading status array
  useEffect(() => {
    if (hasImages) {
      setImagesLoaded(Array(images.length).fill(false));
      setRetryCount(Array(images.length).fill(0));
      setFallbackImages(Array(images.length).fill(''));
      
      // Reset image index when images change
      setCurrentImageIndex(0);
    }
    
    return () => {
      // Clear any pending timeouts
      if (imageTimeoutRef.current) {
        clearTimeout(imageTimeoutRef.current);
        imageTimeoutRef.current = null;
      }
    };
  }, [images, hasImages]);
  
  // Reset image error state when current image changes
  useEffect(() => {
    setImageError(false);
    
    // Pre-load next image for smoother transitions
    if (hasImages && images.length > 1) {
      const nextIndex = (currentImageIndex + 1) % images.length;
      const img = new Image();
      img.src = fallbackImages[nextIndex] || images[nextIndex];
    }
  }, [currentImageIndex, images, hasImages, fallbackImages]);
  
  // Convert blob URLs to more reliable data URLs
  useEffect(() => {
    if (!hasImages) return;
    
    const convertBlobToDataURL = async (index: number, blobUrl: string) => {
      // Skip if not a blob URL or already converted
      if (!blobUrl.startsWith('blob:') || fallbackImages[index]) {
        return '';
      }
      
      try {
        console.log(`Converting blob URL to data URL for image ${index}:`, blobUrl);
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target && typeof e.target.result === 'string') {
              resolve(e.target.result);
            } else {
              resolve('');
            }
          };
          reader.onerror = () => {
            console.error(`Failed to convert blob to data URL for image ${index}`);
            resolve('');
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error(`Error converting blob URL for image ${index}:`, error);
        return '';
      }
    };
    
    // Process all images to convert blob URLs to data URLs
    const processImages = async () => {
      const newFallbackImages = [...fallbackImages];
      let updated = false;
      
      for (let i = 0; i < images.length; i++) {
        if (!newFallbackImages[i]) {
          const dataUrl = await convertBlobToDataURL(i, images[i]);
          if (dataUrl) {
            newFallbackImages[i] = dataUrl;
            updated = true;
          }
        }
      }
      
      if (updated) {
        setFallbackImages(newFallbackImages);
      }
    };
    
    processImages();
  }, [images, hasImages, fallbackImages]);
  
  // Preload images for smoother experience
  useEffect(() => {
    if (!hasImages) return;
    
    images.forEach((src, index) => {
      // Skip already loaded images
      if (imagesLoaded[index]) return;
      
      // Use fallback data URL if available
      const imageToLoad = fallbackImages[index] || src;
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        console.log(`Image ${index} loaded successfully:`, imageToLoad);
        setImagesLoaded(prev => {
          const updated = [...prev];
          updated[index] = true;
          return updated;
        });
      };
      img.onerror = () => {
        console.error(`Failed to load image ${index}:`, imageToLoad);
        
        // Try to reload the image up to 3 times with increasing delays
        if (retryCount[index] < 3) {
          const retryDelay = 800 * (retryCount[index] + 1);
          
          imageTimeoutRef.current = setTimeout(() => {
            console.log(`Retrying image load (${retryCount[index] + 1}/3) for image ${index}`);
            setRetryCount(prev => {
              const updated = [...prev];
              updated[index] = updated[index] + 1;
              return updated;
            });
            
            // Force reload by creating a new image
            const retryImg = new Image();
            retryImg.crossOrigin = "anonymous";
            retryImg.src = imageToLoad + "?retry=" + Date.now();
            retryImg.onload = img.onload;
            retryImg.onerror = img.onerror;
          }, retryDelay);
        }
      };
      
      // Add cache-busting parameter
      img.src = imageToLoad + `?cb=${Date.now()}`;
    });
  }, [images, hasImages, retryCount, fallbackImages, imagesLoaded]);
  
  const nextImage = () => {
    if (!hasImages) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };
  
  const prevImage = () => {
    if (!hasImages) return;
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleImageError = () => {
    console.error("Image loading error for current image index:", currentImageIndex);
    console.error("Attempted URL:", currentImage);
    setImageError(true);
    
    // Try to use the fallback data URL if we have one
    if (fallbackImages[currentImageIndex] && fallbackImages[currentImageIndex] !== currentImage) {
      console.log("Using fallback data URL for image");
      setImageError(false);
      return;
    }
    
    // If no fallback or it already failed, try to reload with a delay
    if (retryCount[currentImageIndex] < 3) {
      imageTimeoutRef.current = setTimeout(() => {
        console.log(`Attempting to recover image (${retryCount[currentImageIndex] + 1}/3)`);
        setImageError(false);
        setRetryCount(prev => {
          const updated = [...prev];
          updated[currentImageIndex] = updated[currentImageIndex] + 1;
          return updated;
        });
      }, 1000 * (retryCount[currentImageIndex] + 1));
    }
  };

  const handleRetry = () => {
    if (!currentImage) return;
    
    setImageError(false);
    console.log("Manual retry for image:", currentImage);
    
    // Force reload by updating retry count
    setRetryCount(prev => {
      const updated = [...prev];
      updated[currentImageIndex] = 0;
      return updated;
    });
  };

  // Component rendering
  return (
    <div className="relative w-full h-full">
      {hasImages ? (
        <>
          {imageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground mb-4">Billedet kunne ikke indlæses</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRetry}
              >
                Prøv igen
              </Button>
            </div>
          ) : (
            <>
              <img
                key={`img-${currentImageIndex}-retry-${retryCount[currentImageIndex]}`}
                src={currentImage! + `?cb=${Date.now()}-${retryCount[currentImageIndex]}`}
                alt={`${alt} - billede ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
                onError={handleImageError}
                loading="eager"
                crossOrigin="anonymous"
              />
              {!imagesLoaded[currentImageIndex] && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50">
                  <div className="w-10 h-10 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                </div>
              )}
            </>
          )}
          
          {/* Image navigation dots */}
          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 p-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentImageIndex 
                      ? 'bg-primary scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                  aria-label={`Gå til billede ${index + 1}`}
                />
              ))}
            </div>
          )}
          
          {/* Previous/Next buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black/30 text-white border-0 hover:bg-black/50 rounded-full w-8 h-8"
                onClick={prevImage}
                aria-label="Forrige billede"
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black/30 text-white border-0 hover:bg-black/50 rounded-full w-8 h-8"
                onClick={nextImage}
                aria-label="Næste billede"
              >
                →
              </Button>
            </>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted/30">
          <p className="text-muted-foreground">Ingen billeder tilgængelige</p>
        </div>
      )}
    </div>
  );
};

export default MobileImageViewer;
