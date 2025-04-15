
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Model3D } from '@/types';
import ImageGalleryTrigger from './gallery/ImageGalleryTrigger';
import ImageViewerContent from './gallery/ImageViewerContent';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  models3D?: Model3D[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, alt, models3D }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>
          <ImageGalleryTrigger images={images} alt={alt} models3D={models3D} />
        </div>
      </DialogTrigger>
      
      <DialogContent className="p-0 max-w-4xl w-screen h-[80vh] flex flex-col">
        <ImageViewerContent 
          images={images}
          alt={alt}
          models3D={models3D}
          onClose={() => setOpen(false)}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ImageGallery;
