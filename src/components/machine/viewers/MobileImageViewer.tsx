import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ImageIcon } from 'lucide-react';

interface MobileImageViewerProps {
  images: string[];
  alt: string;
}

const MobileImageViewer: React.FC<MobileImageViewerProps> = ({ images, alt }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState<number[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([]);
  const imageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasImages = images.length > 0;

  useEffect(() => {
    // Initialize arrays for tracking retry counts and loaded states
    setRetryCount(new Array(images.length).fill(0));
    setImagesLoaded(new Array(images.length).fill(false));
    
    return () => {
      if (imageTimeoutRef.current) {
        clearTimeout(imageTimeoutRef.current);
      }
    };
  }, [images.length]);

  const currentImage = hasImages ? images[currentImageIndex] : null;

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
    
    // Try to reload with a delay
    if (retryCount[currentImageIndex] < 3) {
      if (imageTimeoutRef.current) {
        clearTimeout(imageTimeoutRef.current);
      }
      
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

  const handleImageLoad = () => {
    setImageError(false);
    setImagesLoaded(prev => {
      const updated = [...prev];
      updated[currentImageIndex] = true;
      return updated;
    });
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
                onLoad={handleImageLoad}
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
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentImageIndex(index)}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg"
                onClick={prevImage}
                aria-label="Previous image"
              >
                ←
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg"
                onClick={nextImage}
                aria-label="Next image"
              >
                →
              </button>
            </>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted/30">
          <p className="text-muted-foreground">
            Ingen billeder tilgængelige
          </p>
        </div>
      )}
    </div>
  );
};

export default MobileImageViewer;
